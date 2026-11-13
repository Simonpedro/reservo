import type { ActivityWash } from '#models/activity'
import Booking from '#models/booking'
import type { BookingSource, BookingStatus } from '#models/booking'
import ClassSchedule from '#models/class_schedule'
import ClassSession from '#models/class_session'
import Closure from '#models/closure'
import FixedSlot from '#models/fixed_slot'
import Subscription from '#models/subscription'
import {
  businessDate,
  businessNow,
  dayLabel,
  dayName,
  isoWeekday,
  longDayLabel,
  type IsoDate,
} from '#services/business_calendar'
import { findOrCreateSessions, sessionKey } from '#services/class_sessions'
import { pendingGivenBy } from '#services/attendance'
import { expiryFor } from '#services/pending_classes'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * A class session as the admin sees it on a card: same face as the
 * student's card, with occupation instead of the booking source.
 */
export type AdminSessionCard = {
  sessionId: number
  scheduleId: number
  activity: { name: string; wash: ActivityWash; image: string | null }
  date: IsoDate
  dayLabel: string
  startTime: string
  instructorName: string
  centerName: string
  taken: number
  capacity: number
  suspended: boolean
  suspensionReason: string | null
}

/**
 * Something on Hoy that needs the admin: receipts to review, or a student
 * with a plan and no fixed schedule yet.
 */
export type AdminAlert =
  | { kind: 'receipts'; count: number; periodLabel: string; href: string }
  | { kind: 'no_schedule'; userId: number; fullName: string; href: string }

export type AdminTodayView = {
  /**
   * "Miércoles 11 de noviembre".
   */
  dateLabel: string
  /**
   * Every center is closed today (holiday or closure).
   */
  closed: boolean
  closedReason: string | null
  alerts: AdminAlert[]
  classes: AdminSessionCard[]
}

export type Attendee = {
  bookingId: number
  fullName: string
  initials: string
  status: BookingStatus
  source: BookingSource
}

export type AdminSessionView = {
  card: AdminSessionCard
  /**
   * "Miércoles 11", for the detail line.
   */
  longDay: string
  /**
   * "miércoles 11", for sentences.
   */
  dayName: string
  /**
   * Until when a pending class given for this class can be used: "domingo 22".
   */
  expiresLabel: string
  attendees: Attendee[]
  /**
   * The absence just marked, while it can still be undone.
   */
  justAbsent: { bookingId: number; fullName: string; expiresLabel: string } | null
}

type ScheduleWithRelations = ClassSchedule & {
  activity: { name: string; wash: ActivityWash; image: string | null }
  center: { name: string }
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function initialsOf(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

/**
 * "Miércoles 11 de noviembre".
 */
export function longDateLabel(date: IsoDate) {
  return capitalize(DateTime.fromISO(date).setLocale('es-AR').toFormat("cccc d 'de' LLLL"))
}

function monthName(period: IsoDate) {
  return DateTime.fromISO(period).setLocale('es-AR').toFormat('LLLL')
}

/**
 * Closures of a date: `*` closes every center, otherwise by center id.
 */
export async function closuresOn(tenantId: number, date: IsoDate) {
  const closures = await Closure.query().where('tenantId', tenantId).where('date', date)
  const all = closures.find((closure) => closure.centerId === null) ?? null
  const byCenter = new Map(closures.map((closure) => [closure.centerId, closure.reason]))
  return {
    all,
    list: closures,
    reasonFor: (centerId: number) => all?.reason ?? byCenter.get(centerId) ?? null,
  }
}

async function activeCounts(tenantId: number, sessionIds: number[]) {
  const counts = new Map<number, number>()
  if (sessionIds.length === 0) return counts
  const rows = (await db
    .from('bookings')
    .where('tenant_id', tenantId)
    .whereIn('class_session_id', sessionIds)
    .where('status', 'active')
    .groupBy('class_session_id')
    .select('class_session_id')
    .count('* as total')) as { class_session_id: number; total: string | number }[]
  for (const row of rows) counts.set(row.class_session_id, Number(row.total))
  return counts
}

function toSessionCard(
  session: ClassSession,
  schedule: ScheduleWithRelations,
  taken: number,
  today: IsoDate,
  closureReason: string | null
): AdminSessionCard {
  const date = session.date.toISODate()!
  const suspended = session.status === 'suspended' || closureReason !== null
  return {
    sessionId: session.id,
    scheduleId: schedule.id,
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
    taken,
    capacity: schedule.capacity,
    suspended,
    suspensionReason: session.suspensionReason ?? closureReason,
  }
}

/**
 * Receipts waiting for the admin, summarized as one alert: "Pagos de
 * noviembre" when they are all from one month.
 */
async function receiptsAlert(tenantId: number): Promise<AdminAlert | null> {
  const rows = (await db
    .from('receipts')
    .join('monthly_fees', 'monthly_fees.id', 'receipts.monthly_fee_id')
    .where('receipts.tenant_id', tenantId)
    .where('monthly_fees.tenant_id', tenantId)
    .where('receipts.status', 'in_review')
    .select('monthly_fees.period')) as { period: Date | string }[]
  if (rows.length === 0) return null

  const periods = new Set(
    rows.map((row) =>
      row.period instanceof Date
        ? DateTime.fromJSDate(row.period).toISODate()!
        : String(row.period).slice(0, 10)
    )
  )
  const periodLabel =
    periods.size === 1 ? `Pagos de ${monthName([...periods][0])}` : 'Pagos de varios meses'
  return { kind: 'receipts', count: rows.length, periodLabel, href: '/admin/pagos' }
}

/**
 * Students with a current plan and no current fixed slot.
 */
async function withoutScheduleAlerts(tenantId: number, today: IsoDate): Promise<AdminAlert[]> {
  const subscriptions = await Subscription.query()
    .where('tenantId', tenantId)
    .where('startsOn', '<=', today)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .whereHas('user', (user) => user.where('tenantId', tenantId).where('role', 'client'))
    .preload('user')
  if (subscriptions.length === 0) return []

  const slots = await FixedSlot.query()
    .where('tenantId', tenantId)
    .whereIn(
      'userId',
      subscriptions.map((subscription) => subscription.userId)
    )
    .where('startsOn', '<=', today)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .select('userId')
  const scheduled = new Set(slots.map((slot) => slot.userId))

  const users = new Map(
    subscriptions
      .filter((subscription) => !scheduled.has(subscription.userId))
      .map((subscription) => [subscription.userId, subscription.user])
  )
  return [...users.values()]
    .sort((left, right) => left.fullName.localeCompare(right.fullName, 'es'))
    .map((user) => ({
      kind: 'no_schedule' as const,
      userId: user.id,
      fullName: user.fullName,
      href: `/admin/clientes/${user.id}`,
    }))
}

/**
 * The cards of every active class on a date, creating the missing sessions.
 * Classes in a closed center show as suspended with the closure reason.
 */
export async function sessionCardsOn(
  tenantId: number,
  date: IsoDate,
  today: IsoDate,
  closures?: Awaited<ReturnType<typeof closuresOn>>
): Promise<AdminSessionCard[]> {
  closures ??= await closuresOn(tenantId, date)
  const schedules = (await ClassSchedule.query()
    .where('tenantId', tenantId)
    .where('active', true)
    .where('weekday', isoWeekday(date))
    .orderBy('startTime')
    .orderBy('id')
    .preload('activity')
    .preload('center')) as ScheduleWithRelations[]

  const sessions = await findOrCreateSessions(
    tenantId,
    schedules.map((schedule) => ({ scheduleId: schedule.id, date }))
  )
  const counts = await activeCounts(
    tenantId,
    [...sessions.values()].map((session) => session.id)
  )

  return schedules.map((schedule) => {
    const session = sessions.get(sessionKey(schedule.id, date))!
    return toSessionCard(
      session,
      schedule,
      counts.get(session.id) ?? 0,
      today,
      closures.reasonFor(schedule.centerId)
    )
  })
}

/**
 * Hoy: what needs the admin and today's classes with how many places are
 * taken (active bookings over capacity).
 */
export async function adminToday(
  tenantId: number,
  now: DateTime = businessNow()
): Promise<AdminTodayView> {
  const today = businessDate(now)
  const closures = await closuresOn(tenantId, today)
  const receipts = await receiptsAlert(tenantId)
  const alerts = [
    ...(receipts ? [receipts] : []),
    ...(await withoutScheduleAlerts(tenantId, today)),
  ]

  const base = {
    dateLabel: longDateLabel(today),
    closedReason: closures.all?.reason ?? null,
    alerts,
  }
  if (closures.all) return { ...base, closed: true, classes: [] }

  const classes = await sessionCardsOn(tenantId, today, today, closures)
  return { ...base, closed: false, classes }
}

/**
 * Clase del día: the session with who is signed up (active and absent; in a
 * suspended class, the suspended bookings too), scoped by tenant.
 */
export async function adminSession(
  tenantId: number,
  sessionId: number,
  { justAbsentId, now = businessNow() }: { justAbsentId?: number; now?: DateTime } = {}
): Promise<AdminSessionView | null> {
  const session = await ClassSession.query()
    .where('tenantId', tenantId)
    .where('id', sessionId)
    .preload('classSchedule', (schedule) => schedule.preload('activity').preload('center'))
    .first()
  if (!session) return null

  const today = businessDate(now)
  const date = session.date.toISODate()!
  const schedule = session.classSchedule as ScheduleWithRelations
  const closures = await closuresOn(tenantId, date)
  const counts = await activeCounts(tenantId, [session.id])
  const card = toSessionCard(
    session,
    schedule,
    counts.get(session.id) ?? 0,
    today,
    closures.reasonFor(schedule.centerId)
  )

  const statuses: BookingStatus[] = card.suspended
    ? ['active', 'absent', 'suspended']
    : ['active', 'absent']
  const bookings = await Booking.query()
    .where('tenantId', tenantId)
    .where('classSessionId', session.id)
    .whereIn('status', statuses)
    .preload('user')
  const attendees = bookings
    .map((booking) => ({
      bookingId: booking.id,
      fullName: booking.user.fullName,
      initials: initialsOf(booking.user.fullName),
      status: booking.status,
      source: booking.source,
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, 'es'))

  let justAbsent: AdminSessionView['justAbsent'] = null
  const absent = bookings.find(
    (booking) => booking.id === justAbsentId && booking.status === 'absent'
  )
  if (absent) {
    const pending = await pendingGivenBy(absent)
    if (pending) {
      justAbsent = {
        bookingId: absent.id,
        fullName: absent.user.fullName,
        expiresLabel: dayName(pending.expiresOn.toISODate()!),
      }
    }
  }

  return {
    card,
    longDay: longDayLabel(date),
    dayName: dayName(date),
    expiresLabel: dayName(expiryFor(date)),
    attendees,
    justAbsent,
  }
}
