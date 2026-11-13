import Center from '#models/center'
import ClassSchedule from '#models/class_schedule'
import ClassSession from '#models/class_session'
import Closure from '#models/closure'
import { businessDate, businessNow, isoWeekday, type IsoDate } from '#services/business_calendar'
import { findOrCreateSessions } from '#services/class_sessions'
import SessionSuspension from '#services/session_suspension'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

export type ClosureFailure = 'past' | 'already_closed' | 'unknown_center'

export class ClosureError extends Error {
  constructor(public reason: ClosureFailure) {
    super(`Cannot close the day: ${reason}`)
  }
}

/**
 * What closing a day suspends: classes that still happen and their active
 * bookings (each one becomes a pending class).
 */
export type ClosureImpact = { classes: number; bookings: number }

export type CloseDayInput = {
  date: IsoDate
  /**
   * Null closes every center.
   */
  centerId: number | null
  reason: string
}

/**
 * Active schedules of the date's weekday in the closed place, leaving out
 * centers that are already closed that day.
 */
async function schedulesToClose(
  tenantId: number,
  date: IsoDate,
  centerId: number | null,
  client?: TransactionClientContract
) {
  const closures = await Closure.query({ client }).where('tenantId', tenantId).where('date', date)
  if (closures.some((closure) => closure.centerId === null)) return []
  const closedCenters = closures.map((closure) => closure.centerId!)

  return ClassSchedule.query({ client })
    .where('tenantId', tenantId)
    .where('active', true)
    .where('weekday', isoWeekday(date))
    .if(centerId !== null, (query) => query.where('centerId', centerId!))
    .if(closedCenters.length > 0, (query) => query.whereNotIn('centerId', closedCenters))
    .orderBy('startTime')
    .orderBy('id')
}

/**
 * How many classes and bookings closing the day would suspend, without
 * touching anything (shown before confirming).
 */
export async function closureImpact(
  tenantId: number,
  date: IsoDate,
  centerId: number | null
): Promise<ClosureImpact> {
  const schedules = await schedulesToClose(tenantId, date, centerId)
  if (schedules.length === 0) return { classes: 0, bookings: 0 }

  const sessions = await ClassSession.query()
    .where('tenantId', tenantId)
    .where('date', date)
    .whereIn(
      'classScheduleId',
      schedules.map((schedule) => schedule.id)
    )
  const suspended = sessions.filter((session) => session.status === 'suspended')
  const open = sessions.filter((session) => session.status !== 'suspended')

  let bookings = 0
  if (open.length > 0) {
    const row = await db
      .from('bookings')
      .where('tenant_id', tenantId)
      .whereIn(
        'class_session_id',
        open.map((session) => session.id)
      )
      .where('status', 'active')
      .count('* as total')
      .first()
    bookings = Number(row?.total ?? 0)
  }
  return { classes: schedules.length - suspended.length, bookings }
}

/**
 * Closes a day (holiday or closure) in one center or all of them: records
 * the closure, so the booking generator skips it, and suspends that day's
 * classes, giving a pending class to everyone who was booked.
 */
export default class DayClosures {
  async close(
    tenantId: number,
    { date, centerId, reason }: CloseDayInput,
    now: DateTime = businessNow()
  ): Promise<ClosureImpact> {
    if (date < businessDate(now)) throw new ClosureError('past')

    return db.transaction(async (trx) => {
      if (centerId !== null) {
        const center = await Center.query({ client: trx })
          .where('tenantId', tenantId)
          .where('id', centerId)
          .first()
        if (!center) throw new ClosureError('unknown_center')
      }

      const existing = await Closure.query({ client: trx })
        .where('tenantId', tenantId)
        .where('date', date)
        .where((query) => {
          query.whereNull('centerId')
          if (centerId !== null) query.orWhere('centerId', centerId)
        })
        .first()
      if (existing) throw new ClosureError('already_closed')

      const schedules = await schedulesToClose(tenantId, date, centerId, trx)
      await Closure.create(
        { tenantId, date: DateTime.fromISO(date), centerId, reason },
        { client: trx }
      )

      const sessions = await findOrCreateSessions(
        tenantId,
        schedules.map((schedule) => ({ scheduleId: schedule.id, date })),
        trx
      )
      const suspension = new SessionSuspension()
      const impact: ClosureImpact = { classes: 0, bookings: 0 }
      for (const session of sessions.values()) {
        if (session.status === 'suspended') continue
        impact.classes++
        impact.bookings += await suspension.suspendWithin(trx, session, reason)
      }
      return impact
    })
  }
}
