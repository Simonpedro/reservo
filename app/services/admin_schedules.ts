import Activity from '#models/activity'
import Booking from '#models/booking'
import Center from '#models/center'
import ClassSchedule from '#models/class_schedule'
import ClassSession from '#models/class_session'
import FixedSlot from '#models/fixed_slot'
import { businessDate, businessNow, classStart, type IsoDate } from '#services/business_calendar'
import SessionSuspension from '#services/session_suspension'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { DateTime } from 'luxon'

export type ScheduleInput = {
  activityId: number
  centerId: number
  weekday: number
  startTime: string
  capacity: number
  instructorName: string
}

/**
 * - `capacity`: the new capacity leaves people with this fixed schedule out.
 * - `locked`: day, center or activity change while people still use it.
 * - `has_fixed`: deactivating a class someone still has as fixed schedule.
 * - `unknown`: the activity or center is not of this tenant, or is inactive.
 */
export type ScheduleFailure = 'capacity' | 'locked' | 'has_fixed' | 'unknown'

export class ScheduleError extends Error {
  constructor(
    public reason: ScheduleFailure,
    public detail: { fixed?: number; requested?: number } = {}
  ) {
    super(`Cannot save the class schedule: ${reason}`)
  }
}

export type FixedStudent = { userId: number; fullName: string }

export type ScheduleEditor = {
  schedule: (ScheduleInput & { id: number; active: boolean }) | null
  activities: { id: number; name: string }[]
  centers: { id: number; name: string }[]
  /**
   * Instructor names already in use, to pick from.
   */
  instructors: string[]
  /**
   * People with this class as current fixed schedule: the capacity can't go
   * below how many they are.
   */
  fixedStudents: FixedStudent[]
  /**
   * Day, center and activity can't change while someone still has the class
   * as fixed schedule or a booking ahead.
   */
  locked: boolean
}

/**
 * Fixed slots that hold a place in the schedule today or later (open ended,
 * or ending on/after today), with their student.
 */
async function currentFixedSlots(
  tenantId: number,
  scheduleId: number,
  today: IsoDate,
  client?: TransactionClientContract
) {
  return FixedSlot.query({ client })
    .where('tenantId', tenantId)
    .where('classScheduleId', scheduleId)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .preload('user')
}

function bookingsAhead(
  tenantId: number,
  scheduleId: number,
  today: IsoDate,
  client?: TransactionClientContract
) {
  return Booking.query({ client })
    .where('tenantId', tenantId)
    .where('status', 'active')
    .whereHas('classSession', (session) =>
      session
        .where('tenantId', tenantId)
        .where('classScheduleId', scheduleId)
        .where('date', '>=', today)
    )
}

function toFixedStudents(slots: FixedSlot[]): FixedStudent[] {
  return slots
    .map((slot) => ({ userId: slot.userId, fullName: slot.user.fullName }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, 'es'))
}

/**
 * Data for the Nuevo / Editar horario form. Null when the schedule is not
 * of this tenant.
 */
export async function scheduleEditor(
  tenantId: number,
  scheduleId: number | null,
  now: DateTime = businessNow()
): Promise<ScheduleEditor | null> {
  const today = businessDate(now)
  let schedule: ClassSchedule | null = null
  if (scheduleId !== null) {
    schedule = await ClassSchedule.query()
      .where('tenantId', tenantId)
      .where('id', scheduleId)
      .first()
    if (!schedule) return null
  }

  const activities = await Activity.query()
    .where('tenantId', tenantId)
    .where((offered) => offered.where('active', true).orWhere('id', schedule?.activityId ?? 0))
    .orderBy('name')
  const centers = await Center.query()
    .where('tenantId', tenantId)
    .where((offered) => offered.where('active', true).orWhere('id', schedule?.centerId ?? 0))
    .orderBy('name')
  const instructorRows = (await db
    .from('class_schedules')
    .where('tenant_id', tenantId)
    .distinct('instructor_name')
    .orderBy('instructor_name')) as { instructor_name: string }[]

  let fixedStudents: FixedStudent[] = []
  let locked = false
  if (schedule) {
    fixedStudents = toFixedStudents(await currentFixedSlots(tenantId, schedule.id, today))
    locked =
      fixedStudents.length > 0 ||
      (await bookingsAhead(tenantId, schedule.id, today).first()) !== null
  }

  return {
    schedule: schedule && {
      id: schedule.id,
      activityId: schedule.activityId,
      centerId: schedule.centerId,
      weekday: schedule.weekday,
      startTime: schedule.startTime,
      capacity: schedule.capacity,
      instructorName: schedule.instructorName,
      active: schedule.active,
    },
    activities: activities.map(({ id, name }) => ({ id, name })),
    centers: centers.map(({ id, name }) => ({ id, name })),
    instructors: instructorRows.map((row) => row.instructor_name),
    fixedStudents,
    locked,
  }
}

/**
 * Creates or edits a weekly class. The capacity can't go below the people
 * who have it as fixed schedule, and day, center or activity can't change
 * while someone still uses it. Returns null when the schedule is not of this
 * tenant.
 */
export async function saveSchedule(
  tenantId: number,
  scheduleId: number | null,
  input: ScheduleInput,
  now: DateTime = businessNow()
): Promise<ClassSchedule | null> {
  const today = businessDate(now)

  return db.transaction(async (trx) => {
    let schedule: ClassSchedule | null = null
    if (scheduleId !== null) {
      schedule = await ClassSchedule.query({ client: trx })
        .where('tenantId', tenantId)
        .where('id', scheduleId)
        .forUpdate()
        .first()
      if (!schedule) return null
    }

    // Inactive ones are only allowed where the schedule already has them.
    const activity = await Activity.query({ client: trx })
      .where('tenantId', tenantId)
      .where('id', input.activityId)
      .first()
    const center = await Center.query({ client: trx })
      .where('tenantId', tenantId)
      .where('id', input.centerId)
      .first()
    if (
      !activity ||
      !center ||
      (!activity.active && activity.id !== schedule?.activityId) ||
      (!center.active && center.id !== schedule?.centerId)
    ) {
      throw new ScheduleError('unknown')
    }

    if (!schedule) {
      return ClassSchedule.create({ ...input, tenantId, active: true }, { client: trx })
    }

    const fixed = await currentFixedSlots(tenantId, schedule.id, today, trx)
    if (input.capacity < fixed.length) {
      throw new ScheduleError('capacity', { fixed: fixed.length, requested: input.capacity })
    }

    const moves =
      input.weekday !== schedule.weekday ||
      input.centerId !== schedule.centerId ||
      input.activityId !== schedule.activityId
    if (
      moves &&
      (fixed.length > 0 || (await bookingsAhead(tenantId, schedule.id, today, trx).first()))
    ) {
      throw new ScheduleError('locked')
    }

    return schedule.useTransaction(trx).merge(input).save()
  })
}

/**
 * Deactivates a weekly class (it disappears from the agenda and nobody can
 * book it). Not allowed while someone has it as fixed schedule. Classes
 * ahead that still have bookings (from pending classes) are suspended, so
 * each person gets their pending class back. Returns false when the
 * schedule is not of this tenant.
 */
export async function deactivateSchedule(
  tenantId: number,
  scheduleId: number,
  now: DateTime = businessNow()
): Promise<boolean> {
  const today = businessDate(now)

  return db.transaction(async (trx) => {
    const schedule = await ClassSchedule.query({ client: trx })
      .where('tenantId', tenantId)
      .where('id', scheduleId)
      .forUpdate()
      .first()
    if (!schedule) return false

    const fixed = await currentFixedSlots(tenantId, schedule.id, today, trx)
    if (fixed.length > 0) throw new ScheduleError('has_fixed', { fixed: fixed.length })

    schedule.active = false
    await schedule.useTransaction(trx).save()

    const booked = await bookingsAhead(tenantId, schedule.id, today, trx).select('classSessionId')
    const sessions = booked.length
      ? await ClassSession.query({ client: trx })
          .where('tenantId', tenantId)
          .whereIn('id', [...new Set(booked.map((booking) => booking.classSessionId))])
          .where('status', 'scheduled')
      : []
    const suspension = new SessionSuspension()
    for (const session of sessions) {
      if (classStart(session.date.toISODate()!, schedule.startTime) <= now) continue
      await suspension.suspendWithin(trx, session, 'Horario dado de baja')
    }
    return true
  })
}

/**
 * Turns a deactivated class back on. Returns false when the schedule is not
 * of this tenant.
 */
export async function activateSchedule(tenantId: number, scheduleId: number) {
  const schedule = await ClassSchedule.query()
    .where('tenantId', tenantId)
    .where('id', scheduleId)
    .first()
  if (!schedule) return false
  schedule.active = true
  await schedule.save()
  return true
}
