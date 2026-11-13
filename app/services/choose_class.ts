import type { ActivityWash } from '#models/activity'
import Closure from '#models/closure'
import type PendingClass from '#models/pending_class'
import {
  businessDate,
  businessNow,
  dayLabel,
  dayName,
  dayPill,
  type IsoDate,
} from '#services/business_calendar'
import PendingEligibility, { window, type SessionOption } from '#services/pending_eligibility'
import PendingClasses from '#services/pending_classes'
import type { DateTime } from 'luxon'

type StudentRef = { id: number; tenantId: number }

/**
 * A class the student can pick for a pending class, as a card.
 */
export type SessionCardData = {
  sessionId: number
  activity: { name: string; wash: ActivityWash; image: string | null }
  date: IsoDate
  dayLabel: string
  startTime: string
  instructorName: string
  centerName: string
  freeSpots: number
}

/**
 * A day of the strip. `closed` = every center is closed that day.
 */
export type ChooseDay = {
  date: IsoDate
  weekday: string
  day: number
  label: string
  closed: boolean
}

/**
 * The pending class being used (the one that expires first) and how many
 * the student has. `activities` null = any activity of the plan.
 */
export type ChoosingPending = {
  id: number
  count: number
  activities: string[] | null
  expiresLabel: string
}

export type ChooseClassView =
  | { state: 'none' }
  | {
      state: 'ready'
      pending: ChoosingPending
      days: ChooseDay[]
      selected: IsoDate
      classes: SessionCardData[]
    }

export type SessionDetailView = {
  pendingId: number
  card: SessionCardData
  /**
   * "jueves 12".
   */
  dayName: string
}

function toSessionCard(option: SessionOption, today: IsoDate): SessionCardData {
  const date = option.session.date.toISODate()!
  return {
    sessionId: option.session.id,
    activity: {
      name: option.schedule.activity.name,
      wash: option.schedule.activity.wash,
      image: option.schedule.activity.image,
    },
    date,
    dayLabel: dayLabel(date, today),
    startTime: option.schedule.startTime,
    instructorName: option.schedule.instructorName,
    centerName: option.schedule.center.name,
    freeSpots: option.freeSpots,
  }
}

async function choosingPending(
  pending: PendingClass,
  student: StudentRef,
  today: IsoDate
): Promise<ChoosingPending> {
  const all = await new PendingClasses().available(student, today)
  const quota = pending.planQuota
  return {
    id: pending.id,
    count: all.length,
    activities: quota.anyActivity
      ? null
      : quota.activities.map((activity) => activity.name).sort((a, b) => a.localeCompare(b, 'es')),
    expiresLabel: dayName(pending.expiresOn.toISODate()!),
  }
}

/**
 * Elegir clase: the days until the first pending class expires and the
 * classes it fits. Opens on `day` if given and in range, otherwise on the
 * first day with classes.
 */
export async function chooseClassView(
  student: StudentRef,
  day: string | undefined,
  now: DateTime = businessNow()
): Promise<ChooseClassView> {
  const today = businessDate(now)
  const eligibility = new PendingEligibility()
  const pending = await eligibility.next(student, today)
  if (!pending) return { state: 'none' }

  const options = await eligibility.options(pending, now)
  const expiresOn = pending.expiresOn.toISODate()!
  const dates = window({ today, expiresOn })
  const closures = await Closure.query()
    .where('tenantId', student.tenantId)
    .whereNull('centerId')
    .whereBetween('date', [today, expiresOn])
  const closed = new Set(closures.map((closure) => closure.date.toISODate()))
  const classes = options.map((option) => toSessionCard(option, today))
  const selected =
    day && dates.includes(day) ? day : (classes.find((card) => card.freeSpots > 0)?.date ?? today)

  return {
    state: 'ready',
    pending: await choosingPending(pending, student, today),
    days: dates.map((date) => ({
      date,
      ...dayPill(date),
      label: dayName(date),
      closed: closed.has(date),
    })),
    selected,
    classes,
  }
}

/**
 * A class opened from Elegir clase, or null when the student has no pending
 * class or the pending class does not fit it.
 */
export async function sessionDetail(
  student: StudentRef,
  sessionId: number,
  now: DateTime = businessNow()
): Promise<SessionDetailView | null> {
  const today = businessDate(now)
  const eligibility = new PendingEligibility()
  const pending = await eligibility.next(student, today)
  if (!pending) return null

  const option = await eligibility.option(pending, sessionId, now)
  if (!option) return null
  return {
    pendingId: pending.id,
    card: toSessionCard(option, today),
    dayName: dayName(option.session.date.toISODate()!),
  }
}
