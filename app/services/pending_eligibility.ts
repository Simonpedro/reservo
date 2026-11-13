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
 * The dates a pending class can still be used: today until its expiry.
 */
export function window(rules: Pick<PendingRules, 'today' | 'expiresOn'>): IsoDate[] {
  const days = []
  for (let date = rules.today; date <= rules.expiresOn; date = addDays(date, 1)) days.push(date)
  return days
}

/**
 * Where a pending class can be used, and using it: booking a class by hand
 * inside the activities of the quota it came from, until it expires.
 */
export default class PendingEligibility {
  /**
   * The pending class to use first: the available one that expires first.
   */
  next(student: StudentRef, today: IsoDate) {
    return PendingClass.query()
      .where('tenantId', student.tenantId)
      .where('userId', student.id)
      .where('status', 'available')
      .where('expiresOn', '>=', today)
      .preload('planQuota', (quota) => quota.preload('activities'))
      .orderBy('expiresOn', 'asc')
      .orderBy('id', 'asc')
      .first()
  }

  /**
   * Every class the pending class fits from now until it expires, full ones
   * included (the list shows them as "Cupo completo"), minus those the
   * student already has. Sessions are created as needed.
   */
  async options(pending: PendingClass, now: DateTime = businessNow()): Promise<SessionOption[]> {
    const rules = await this.rules(pending, now)
    if (!rules) return []

    const schedules = await ClassSchedule.query()
      .where('tenantId', pending.tenantId)
      .where('active', true)
      .if(rules.activities, (query) => query.whereIn('activityId', [...rules.activities!]))
      .preload('activity')
      .preload('center')

    const candidates = window(rules).flatMap((date) =>
      schedules
        .filter((schedule) => schedule.weekday === isoWeekday(date))
        .filter((schedule) =>
          fits(rules, {
            date,
            startTime: schedule.startTime,
            activityId: schedule.activityId,
            centerId: schedule.centerId,
          })
        )
        .map((schedule) => ({ schedule, date }))
    )

    const sessions = await findOrCreateSessions(
      pending.tenantId,
      candidates.map(({ schedule, date }) => ({ scheduleId: schedule.id, date }))
    )
    const options = candidates
      .map(({ schedule, date }) => ({
        session: sessions.get(sessionKey(schedule.id, date))!,
        schedule,
        freeSpots: 0,
      }))
      .filter((option) => option.session.status === 'scheduled')

    return this.withPlaces(pending, options)
  }

  /**
   * The classes where the pending class can be used right now: with room.
   */
  async eligible(pending: PendingClass, now: DateTime = businessNow()) {
    const options = await this.options(pending, now)
    return options.filter((option) => option.freeSpots > 0)
  }

  /**
   * One session as an option for the pending class, or null when it does
   * not fit (other activity, out of the window, past, suspended, closed or
   * already booked by the student).
   */
  async option(
    pending: PendingClass,
    sessionId: number,
    now: DateTime = businessNow()
  ): Promise<SessionOption | null> {
    const rules = await this.rules(pending, now)
    if (!rules) return null

    const session = await ClassSession.query()
      .where('tenantId', pending.tenantId)
      .where('id', sessionId)
      .preload('classSchedule', (schedule) => schedule.preload('activity').preload('center'))
      .first()
    if (!session || !this.open(rules, session)) return null

    const [option] = await this.withPlaces(pending, [
      { session, schedule: session.classSchedule, freeSpots: 0 },
    ])
    return option ?? null
  }

  /**
   * Books the session with the student's pending class: a `pending` booking
   * and the pending class marked as used. The session row is locked so two
   * students cannot take its last place at the same time.
   */
  async use(
    student: StudentRef,
    pendingId: number,
    sessionId: number,
    now: DateTime = businessNow()
  ): Promise<Booking> {
    return db.transaction(async (trx) => {
      const pending = await PendingClass.query({ client: trx })
        .where('tenantId', student.tenantId)
        .where('userId', student.id)
        .where('id', pendingId)
        .forUpdate()
        .first()
      if (!pending) throw new PendingUseError('pending_unavailable')
      await pending.load('planQuota', (quota) => quota.preload('activities'))

      const rules = await this.rules(pending, now, trx)
      if (!rules) throw new PendingUseError('pending_unavailable')

      const session = await ClassSession.query({ client: trx })
        .where('tenantId', student.tenantId)
        .where('id', sessionId)
        .forUpdate()
        .first()
      if (!session) throw new PendingUseError('unavailable')
      await session.load('classSchedule')
      const schedule = session.classSchedule

      if (rules.activities && !rules.activities.has(schedule.activityId)) {
        throw new PendingUseError('not_allowed')
      }
      if (!this.open(rules, session)) throw new PendingUseError('unavailable')

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
      pending.status = 'used'
      pending.usedBookingId = booking.id
      await pending.save()
      return booking
    })
  }

  /**
   * The rules of an available, unexpired pending class (null otherwise).
   * Expects `planQuota.activities` loaded.
   */
  private async rules(
    pending: PendingClass,
    now: DateTime,
    client?: TransactionClientContract
  ): Promise<PendingRules | null> {
    const today = businessDate(now)
    const expiresOn = pending.expiresOn.toISODate()!
    if (pending.status !== 'available' || expiresOn < today) return null

    if (!pending.planQuota) await pending.load('planQuota', (q) => q.preload('activities'))
    const quota = pending.planQuota
    const closures = await Closure.query({ client })
      .where('tenantId', pending.tenantId)
      .whereBetween('date', [today, expiresOn])

    return {
      activities: quota.anyActivity
        ? null
        : new Set(quota.activities.map((activity) => activity.id)),
      today,
      expiresOn,
      now,
      closed: new Set(
        closures.map((closure) => `${closure.date.toISODate()}:${closure.centerId ?? '*'}`)
      ),
    }
  }

  private open(rules: PendingRules, session: ClassSession & { classSchedule: ClassSchedule }) {
    const schedule = session.classSchedule
    return (
      session.status === 'scheduled' &&
      schedule.active &&
      fits(rules, {
        date: session.date.toISODate()!,
        startTime: schedule.startTime,
        activityId: schedule.activityId,
        centerId: schedule.centerId,
      })
    )
  }

  /**
   * Fills the free places and drops the sessions the student already has.
   */
  private async withPlaces(pending: PendingClass, options: SessionOption[]) {
    if (options.length === 0) return []
    const bookings = await Booking.query()
      .where('tenantId', pending.tenantId)
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
      if (booking.userId === pending.userId) mine.add(booking.classSessionId)
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
