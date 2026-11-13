import Booking from '#models/booking'
import FixedSlot from '#models/fixed_slot'
import Subscription from '#models/subscription'
import type { ActivityWash } from '#models/activity'
import type { BookingSource } from '#models/booking'
import {
  addDays,
  businessDate,
  businessNow,
  classStart,
  dayLabel,
  endOfWeek,
  type IsoDate,
} from '#services/business_calendar'
import type { DateTime } from 'luxon'

/**
 * What a class card shows. Same shape for students and admins.
 */
export type ClassCardData = {
  bookingId: number
  activity: { name: string; wash: ActivityWash; image: string | null }
  date: IsoDate
  dayLabel: string
  startTime: string
  instructorName: string
  centerName: string
  source: BookingSource
  suspended: boolean
  suspensionReason: string | null
}

export type WeekGroup = { title: string; classes: ClassCardData[] }

export type MyClassesView =
  { state: 'no_plan' } | { state: 'no_schedule' } | { state: 'classes'; weeks: WeekGroup[] }

type StudentRef = { id: number; tenantId: number }

/**
 * Splits upcoming classes into "this week" (until Sunday) and "next week",
 * dropping empty weeks and anything after next Sunday.
 */
export function groupByWeek(classes: ClassCardData[], today: IsoDate): WeekGroup[] {
  const thisSunday = endOfWeek(today)
  const nextSunday = addDays(thisSunday, 7)
  const weeks: WeekGroup[] = [
    { title: 'Esta semana', classes: classes.filter((card) => card.date <= thisSunday) },
    {
      title: 'Semana que viene',
      classes: classes.filter((card) => card.date > thisSunday && card.date <= nextSunday),
    },
  ]
  return weeks.filter((week) => week.classes.length > 0)
}

export function toClassCard(booking: Booking, today: IsoDate): ClassCardData {
  const session = booking.classSession
  const schedule = session.classSchedule
  const date = session.date.toISODate()!
  return {
    bookingId: booking.id,
    activity: {
      name: schedule.activity.name,
      wash: schedule.activity.wash,
      image: schedule.activity.image,
    },
    date,
    dayLabel: dayLabel(date, today),
    startTime: schedule.startTime,
    instructorName: schedule.instructorName,
    centerName: schedule.center.name,
    source: booking.source,
    suspended: booking.status === 'suspended' || session.status === 'suspended',
    suspensionReason: session.suspensionReason,
  }
}

/**
 * A student's booking with everything a class card needs, scoped by tenant.
 */
export function studentBookings(student: StudentRef) {
  return Booking.query()
    .where('tenantId', student.tenantId)
    .where('userId', student.id)
    .preload('classSession', (session) =>
      session.preload('classSchedule', (schedule) => schedule.preload('activity').preload('center'))
    )
}

/**
 * The student's home: upcoming booked classes for this week and the next,
 * or why there are none (no plan, or a plan without fixed schedule yet).
 */
export async function myUpcomingClasses(
  student: StudentRef,
  now: DateTime = businessNow()
): Promise<MyClassesView> {
  const today = businessDate(now)

  const subscription = await Subscription.query()
    .where('tenantId', student.tenantId)
    .where('userId', student.id)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .first()
  if (!subscription) return { state: 'no_plan' }

  const fixedSlot = await FixedSlot.query()
    .where('tenantId', student.tenantId)
    .where('userId', student.id)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .first()
  if (!fixedSlot) return { state: 'no_schedule' }

  const lastDay = addDays(endOfWeek(today), 7)
  const bookings = await studentBookings(student)
    .whereIn('status', ['active', 'suspended'])
    .whereHas('classSession', (session) =>
      session.where('tenantId', student.tenantId).whereBetween('date', [today, lastDay])
    )

  const upcoming = bookings
    .filter((booking) => {
      const schedule = booking.classSession.classSchedule
      const end = classStart(booking.classSession.date.toISODate()!, schedule.startTime).plus({
        minutes: schedule.durationMinutes,
      })
      return end > now
    })
    .map((booking) => toClassCard(booking, today))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  return { state: 'classes', weeks: groupByWeek(upcoming, today) }
}
