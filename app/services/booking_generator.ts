import Booking from '#models/booking'
import ClassSession from '#models/class_session'
import Closure from '#models/closure'
import FixedSlot from '#models/fixed_slot'
import {
  addDays,
  businessDate,
  businessNow,
  classStart,
  dateRange,
  isoWeekday,
  type IsoDate,
} from '#services/business_calendar'
import { findOrCreateSession } from '#services/class_sessions'
import type { DateTime } from 'luxon'

/**
 * Fixed-schedule bookings are generated four weeks ahead.
 */
export const BOOKING_WINDOW_DAYS = 28

const UNIQUE_VIOLATION = '23505'

export type GenerateOptions = {
  tenantId: number
  /**
   * Restrict the run to one student (e.g. right after assigning a schedule).
   */
  userId?: number
  now?: DateTime
}

export type GenerationSummary = {
  /**
   * New `fixed` bookings.
   */
  created: number
  /**
   * Dates with no class: closed days and suspended sessions.
   */
  skipped: number
  /**
   * Dates that already had a booking for the fixed slot, in any status
   * (cancelled or absent bookings are never recreated), or where the student
   * already holds an active booking in that session.
   */
  existing: number
}

function covers(range: { startsOn: DateTime; endsOn: DateTime | null }, date: IsoDate) {
  const startsOn = range.startsOn.toISODate()!
  const endsOn = range.endsOn?.toISODate() ?? null
  return startsOn <= date && (endsOn === null || date <= endsOn)
}

/**
 * Creates the bookings of every current fixed slot for the class dates from
 * today up to `BOOKING_WINDOW_DAYS` ahead, in the business time zone. It is
 * idempotent: running it again only fills what is missing.
 */
export default class BookingGenerator {
  async generate({ tenantId, userId, now = businessNow() }: GenerateOptions) {
    const summary: GenerationSummary = { created: 0, skipped: 0, existing: 0 }
    const today = businessDate(now)
    const lastDay = addDays(today, BOOKING_WINDOW_DAYS - 1)

    const slots = await FixedSlot.query()
      .where('tenantId', tenantId)
      .if(userId, (query) => query.where('userId', userId!))
      .where('startsOn', '<=', lastDay)
      .where((query) => query.whereNull('endsOn').orWhere('endsOn', '>=', today))
      .whereHas('subscription', (query) =>
        query
          .where('tenantId', tenantId)
          .where('startsOn', '<=', lastDay)
          .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
      )
      .whereHas('classSchedule', (query) => query.where('tenantId', tenantId).where('active', true))
      .preload('subscription')
      .preload('classSchedule')

    if (slots.length === 0) return summary

    const closures = await Closure.query()
      .where('tenantId', tenantId)
      .whereBetween('date', [today, lastDay])
    const closed = new Set(
      closures.map((closure) => `${closure.date.toISODate()}:${closure.centerId ?? '*'}`)
    )

    const scheduleIds = [...new Set(slots.map((slot) => slot.classScheduleId))]
    const sessions = await ClassSession.query()
      .where('tenantId', tenantId)
      .whereIn('classScheduleId', scheduleIds)
      .whereBetween('date', [today, lastDay])
    const sessionByKey = new Map(
      sessions.map((session) => [`${session.classScheduleId}:${session.date.toISODate()}`, session])
    )

    const bookings = sessions.length
      ? await Booking.query()
          .where('tenantId', tenantId)
          .whereIn(
            'classSessionId',
            sessions.map((session) => session.id)
          )
      : []
    const bookedFixed = new Set(
      bookings.map((booking) => `${booking.fixedSlotId}:${booking.classSessionId}`)
    )
    const activeSeats = new Set(
      bookings
        .filter((booking) => booking.status === 'active')
        .map((booking) => `${booking.userId}:${booking.classSessionId}`)
    )

    for (const date of dateRange(today, BOOKING_WINDOW_DAYS)) {
      const weekday = isoWeekday(date)

      for (const slot of slots) {
        const schedule = slot.classSchedule
        if (schedule.weekday !== weekday) continue
        if (!covers(slot, date) || !covers(slot.subscription, date)) continue
        if (classStart(date, schedule.startTime) <= now) continue

        if (closed.has(`${date}:*`) || closed.has(`${date}:${schedule.centerId}`)) {
          summary.skipped++
          continue
        }

        let session = sessionByKey.get(`${schedule.id}:${date}`)
        if (session?.status === 'suspended') {
          summary.skipped++
          continue
        }

        if (
          session &&
          (bookedFixed.has(`${slot.id}:${session.id}`) ||
            activeSeats.has(`${slot.userId}:${session.id}`))
        ) {
          summary.existing++
          continue
        }

        session ??= await findOrCreateSession(schedule, date)
        sessionByKey.set(`${schedule.id}:${date}`, session)
        if (session.status === 'suspended') {
          summary.skipped++
          continue
        }

        try {
          await Booking.create({
            tenantId,
            userId: slot.userId,
            classSessionId: session.id,
            planQuotaId: slot.planQuotaId,
            source: 'fixed',
            fixedSlotId: slot.id,
            status: 'active',
          })
        } catch (error) {
          /**
           * A concurrent run (or a booking made meanwhile) won the unique index.
           */
          if ((error as { code?: string }).code !== UNIQUE_VIOLATION) throw error
          summary.existing++
          continue
        }
        bookedFixed.add(`${slot.id}:${session.id}`)
        activeSeats.add(`${slot.userId}:${session.id}`)
        summary.created++
      }
    }

    return summary
  }
}
