import Booking from '#models/booking'
import ClassSchedule from '#models/class_schedule'
import ClassSession from '#models/class_session'
import Closure from '#models/closure'
import PendingClass from '#models/pending_class'
import {
  addDays,
  businessDate,
  businessNow,
  classStart,
  isoWeekday,
  type IsoDate,
} from '#services/business_calendar'
import { findOrCreateSessions, sessionKey } from '#services/class_sessions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { DateTime } from 'luxon'

type StudentRef = { id: number; tenantId: number }

/**
 * A class session where a pending class could go, with its schedule
 * (activity and center loaded) and the places still free that date.
 */
export type SessionOption = {
  session: ClassSession
  schedule: ClassSchedule
  freeSpots: number
}

export type PendingUseFailure =
  'pending_unavailable' | 'not_allowed' | 'unavailable' | 'already_booked' | 'full'

export class PendingUseError extends Error {
  constructor(readonly reason: PendingUseFailure) {
    super(`Cannot use pending class: ${reason}`)
  }
}

/**
 * What decides whether a pending class fits a class on a date.
 * `activities` null means any activity (a free quota).
 */
export type PendingRules = {
  activities: Set<number> | null
  today: IsoDate
  expiresOn: IsoDate
  now: DateTime
  /**
   * Closed days as `date:centerId`, or `date:*` for every center.
   */
  closed: Set<string>
}

export type Candidate = {
  date: IsoDate
  startTime: string
  activityId: number
  centerId: number
}

/**
 * A pending class fits a class when its activity is one of the quota's,
 * it is between today and the expiry (also before the missed date), it has
 * not started and its center is not closed that day.
 */
export function fits(rules: PendingRules, candidate: Candidate): boolean {
  if (rules.activities && !rules.activities.has(candidate.activityId)) return false
  if (candidate.date < rules.today || candidate.date > rules.expiresOn) return false
  if (rules.closed.has(`${candidate.date}:*`)) return false
  if (rules.closed.has(`${candidate.date}:${candidate.centerId}`)) return false
  return classStart(candidate.date, candidate.startTime) > rules.now
}

/**
 * The pending class a class uses: among those that fit it, the one that
 * expires first (ties keep the given order).
 */
export function pick<T extends { rules: PendingRules }>(
  pendings: T[],
  candidate: Candidate
): T | null {
  const sorted = [...pendings].sort((a, b) => a.rules.expiresOn.localeCompare(b.rules.expiresOn))
  return sorted.find((pending) => fits(pending.rules, candidate)) ?? null
}

/**
 * The dates a pending class can still be used: today until its expiry.
 */
export function window(rules: Pick<PendingRules, 'today' | 'expiresOn'>): IsoDate[] {
  const days = []
  for (let date = rules.today; date <= rules.expiresOn; date = addDays(date, 1)) days.push(date)
  return days
}

type Ruled = { pending: PendingClass; rules: PendingRules }

function candidateOf(session: ClassSession, schedule: ClassSchedule): Candidate {
  return {
    date: session.date.toISODate()!,
    startTime: schedule.startTime,
    activityId: schedule.activityId,
    centerId: schedule.centerId,
  }
}

/**
 * Where a student's pending classes can be used, and using them: booking a
 * class by hand inside the activities of the quota each came from, until it
 * expires. With several, a class is offered when at least one fits it, and
 * booking it uses the one that fits and expires first.
 */
export default class PendingEligibility {
  /**
   * The student's pending classes that can still be used, the soonest to
   * expire first, with their quota activities.
   */
  available(student: StudentRef, today: IsoDate, client?: TransactionClientContract) {
    return PendingClass.query({ client })
      .where('tenantId', student.tenantId)
      .where('userId', student.id)
      .where('status', 'available')
      .where('expiresOn', '>=', today)
      .preload('planQuota', (quota) => quota.preload('activities'))
      .orderBy('expiresOn', 'asc')
      .orderBy('id', 'asc')
  }

  /**
   * Every class at least one of the pending classes fits, from now until the
   * last one expires, full ones included (the list shows them as "Cupo
   * completo"), minus those the student already has. Sessions are created
   * as needed.
   */
  async options(
    pendings: PendingClass | PendingClass[],
    now: DateTime = businessNow()
  ): Promise<SessionOption[]> {
    const ruled = await this.ruled([pendings].flat(), now)
    if (ruled.length === 0) return []

    const { tenantId, userId } = ruled[0].pending
    const anyActivity = ruled.some(({ rules }) => rules.activities === null)
    const activityIds = new Set(ruled.flatMap(({ rules }) => [...(rules.activities ?? [])]))
    const schedules = await ClassSchedule.query()
      .where('tenantId', tenantId)
      .where('active', true)
      .if(!anyActivity, (query) => query.whereIn('activityId', [...activityIds]))
      .preload('activity')
      .preload('center')

    const today = ruled[0].rules.today
    const expiresOn = ruled
      .map(({ rules }) => rules.expiresOn)
      .sort()
      .at(-1)!
    const candidates = window({ today, expiresOn }).flatMap((date) =>
      schedules
        .filter((schedule) => schedule.weekday === isoWeekday(date))
        .filter((schedule) =>
          pick(ruled, {
            date,
            startTime: schedule.startTime,
            activityId: schedule.activityId,
            centerId: schedule.centerId,
          })
        )
        .map((schedule) => ({ schedule, date }))
    )

    const sessions = await findOrCreateSessions(
      tenantId,
      candidates.map(({ schedule, date }) => ({ scheduleId: schedule.id, date }))
    )
    const options = candidates
      .map(({ schedule, date }) => ({
        session: sessions.get(sessionKey(schedule.id, date))!,
        schedule,
        freeSpots: 0,
      }))
      .filter((option) => option.session.status === 'scheduled')

    return this.withPlaces({ tenantId, id: userId }, options)
  }

  /**
   * The classes where the pending classes can be used right now: with room.
   */
  async eligible(pendings: PendingClass | PendingClass[], now: DateTime = businessNow()) {
    const options = await this.options(pendings, now)
    return options.filter((option) => option.freeSpots > 0)
  }

  /**
   * One session as an option for the pending classes, or null when none fits
   * it (other activity, out of the window, past, suspended, closed or
   * already booked by the student).
   */
  async option(
    pendings: PendingClass | PendingClass[],
    sessionId: number,
    now: DateTime = businessNow()
  ): Promise<SessionOption | null> {
    const ruled = await this.ruled([pendings].flat(), now)
    if (ruled.length === 0) return null

    const { tenantId, userId } = ruled[0].pending
    const session = await ClassSession.query()
      .where('tenantId', tenantId)
      .where('id', sessionId)
      .preload('classSchedule', (schedule) => schedule.preload('activity').preload('center'))
      .first()
    if (!session || !this.openFor(ruled, session)) return null

    const [option] = await this.withPlaces({ tenantId, id: userId }, [
      { session, schedule: session.classSchedule, freeSpots: 0 },
    ])
    return option ?? null
  }

  /**
   * Books the session with one of the student's pending classes: among those
   * that fit it, the one that expires first. Creates a `pending` booking and
   * marks that pending class as used. The pending classes and the session
   * row are locked so neither can be used twice at the same time.
   */
  async use(
    student: StudentRef,
    sessionId: number,
    now: DateTime = businessNow()
  ): Promise<Booking> {
    return db.transaction(async (trx) => {
      const pendings = await this.available(student, businessDate(now), trx).forUpdate()
      const ruled = await this.ruled(pendings, now, trx)
      if (ruled.length === 0) throw new PendingUseError('pending_unavailable')

      const session = await ClassSession.query({ client: trx })
        .where('tenantId', student.tenantId)
        .where('id', sessionId)
        .forUpdate()
        .first()
      if (!session) throw new PendingUseError('unavailable')
      await session.load('classSchedule')
      const schedule = session.classSchedule

      const allowed = ruled.filter(
        ({ rules }) => !rules.activities || rules.activities.has(schedule.activityId)
      )
      if (allowed.length === 0) throw new PendingUseError('not_allowed')
      const chosen = this.openFor(allowed, session)
      if (!chosen) throw new PendingUseError('unavailable')
      const pending = chosen.pending

      const taken = await Booking.query({ client: trx })
        .where('tenantId', student.tenantId)
        .where('classSessionId', session.id)
        .where('status', 'active')
        .select('userId')
      if (taken.some((booking) => booking.userId === student.id)) {
        throw new PendingUseError('already_booked')
      }
      if (taken.length >= schedule.capacity) throw new PendingUseError('full')

      const booking = await Booking.create(
        {
          tenantId: student.tenantId,
          userId: student.id,
          classSessionId: session.id,
          planQuotaId: pending.planQuotaId,
          source: 'pending',
          fixedSlotId: null,
          pendingClassId: pending.id,
          status: 'active',
          cancelledAt: null,
        },
        { client: trx }
      )
      pending.useTransaction(trx)
      pending.status = 'used'
      pending.usedBookingId = booking.id
      await pending.save()
      return booking
    })
  }

  /**
   * The rules of each available, unexpired pending class (the rest are left
   * out). Expects `planQuota.activities` loaded or loads it.
   */
  private async ruled(
    pendings: PendingClass[],
    now: DateTime,
    client?: TransactionClientContract
  ): Promise<Ruled[]> {
    const today = businessDate(now)
    const usable = pendings.filter(
      (pending) => pending.status === 'available' && pending.expiresOn.toISODate()! >= today
    )
    if (usable.length === 0) return []

    for (const pending of usable) {
      if (!pending.planQuota) await pending.load('planQuota', (q) => q.preload('activities'))
    }
    const until = usable
      .map((pending) => pending.expiresOn.toISODate()!)
      .sort()
      .at(-1)!
    const closures = await Closure.query({ client })
      .where('tenantId', usable[0].tenantId)
      .whereBetween('date', [today, until])
    const closed = new Set(
      closures.map((closure) => `${closure.date.toISODate()}:${closure.centerId ?? '*'}`)
    )

    return usable.map((pending) => {
      const quota = pending.planQuota
      return {
        pending,
        rules: {
          activities: quota.anyActivity
            ? null
            : new Set(quota.activities.map((activity) => activity.id)),
          today,
          expiresOn: pending.expiresOn.toISODate()!,
          now,
          closed,
        },
      }
    })
  }

  /**
   * The pending class that would book the session, or null when the session
   * cannot be booked (suspended, inactive schedule) or none fits it.
   */
  private openFor(ruled: Ruled[], session: ClassSession & { classSchedule: ClassSchedule }) {
    const schedule = session.classSchedule
    if (session.status !== 'scheduled' || !schedule.active) return null
    return pick(ruled, candidateOf(session, schedule))
  }

  /**
   * Fills the free places and drops the sessions the student already has.
   */
  private async withPlaces(student: StudentRef, options: SessionOption[]) {
    if (options.length === 0) return []
    const bookings = await Booking.query()
      .where('tenantId', student.tenantId)
      .whereIn(
        'classSessionId',
        options.map((option) => option.session.id)
      )
      .where('status', 'active')
      .select('classSessionId', 'userId')

    const taken = new Map<number, number>()
    const mine = new Set<number>()
    for (const booking of bookings) {
      taken.set(booking.classSessionId, (taken.get(booking.classSessionId) ?? 0) + 1)
      if (booking.userId === student.id) mine.add(booking.classSessionId)
    }

    return options
      .filter((option) => !mine.has(option.session.id))
      .map((option) => ({
        ...option,
        freeSpots: Math.max(0, option.schedule.capacity - (taken.get(option.session.id) ?? 0)),
      }))
      .sort(
        (a, b) =>
          a.session.date.toMillis() - b.session.date.toMillis() ||
          a.schedule.startTime.localeCompare(b.schedule.startTime)
      )
  }
}
