import Center from '#models/center'
import {
  closuresOn,
  longDateLabel,
  sessionCardsOn,
  type AdminSessionCard,
} from '#services/admin_classes'
import {
  addDays,
  businessDate,
  businessNow,
  dateRange,
  dayName,
  dayPill,
  isoWeekday,
  longDayLabel,
  type IsoDate,
} from '#services/business_calendar'
import { closureImpact, type ClosureImpact } from '#services/day_closures'
import type { DateTime } from 'luxon'

/**
 * The agenda shows two weeks from today.
 */
export const AGENDA_DAYS = 14

export type AgendaDay = { date: IsoDate; weekday: string; day: number; label: string }

/**
 * A closure of the selected day: every center (`centerName` null) or one.
 */
export type AgendaClosure = { centerName: string | null; reason: string }

export type AgendaView = {
  days: AgendaDay[]
  selected: IsoDate
  /**
   * "Miércoles 18".
   */
  title: string
  /**
   * "miércoles 18", for the close-the-day action.
   */
  dayName: string
  weekday: number
  closures: AgendaClosure[]
  /**
   * Every center is closed: the day can't be closed again.
   */
  closedEverywhere: boolean
  classes: AdminSessionCard[]
}

function isIsoDate(value: unknown): value is IsoDate {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/**
 * The selected date if it is within the agenda, today otherwise.
 */
export function agendaDate(requested: unknown, today: IsoDate): IsoDate {
  if (!isIsoDate(requested)) return today
  const last = addDays(today, AGENDA_DAYS - 1)
  return requested >= today && requested <= last ? requested : today
}

/**
 * The first date on or after `today` that falls on the ISO weekday.
 */
export function nextDateOn(today: IsoDate, weekday: number): IsoDate {
  return addDays(today, (weekday - isoWeekday(today) + 7) % 7)
}

/**
 * Agenda: a day strip of two weeks and the classes of the selected day with
 * their occupation, or why the day (or a center) is closed.
 */
export async function adminAgenda(
  tenantId: number,
  requested: unknown,
  now: DateTime = businessNow()
): Promise<AgendaView> {
  const today = businessDate(now)
  const selected = agendaDate(requested, today)
  const closures = await closuresOn(tenantId, selected)
  const centers = await Center.query().where('tenantId', tenantId)
  const centerNames = new Map(centers.map((center) => [center.id, center.name]))

  return {
    days: dateRange(today, AGENDA_DAYS).map((date) => ({
      date,
      ...dayPill(date),
      label: longDayLabel(date),
    })),
    selected,
    title: longDayLabel(selected),
    dayName: dayName(selected),
    weekday: isoWeekday(selected),
    closures: closures.list
      .map((closure) => ({
        centerName: closure.centerId === null ? null : (centerNames.get(closure.centerId) ?? null),
        reason: closure.reason,
      }))
      .sort((left, right) => (left.centerName ?? '').localeCompare(right.centerName ?? '', 'es')),
    closedEverywhere: closures.all !== null,
    classes: await sessionCardsOn(tenantId, selected, today, closures),
  }
}

export type CloseDayOption = {
  /**
   * Null closes every center.
   */
  centerId: number | null
  label: string
  impact: ClosureImpact
}

export type CloseDayView = {
  date: IsoDate
  /**
   * "Viernes 20 de noviembre".
   */
  dateLabel: string
  /**
   * "viernes 20".
   */
  dayName: string
  options: CloseDayOption[]
}

/**
 * Cerrar un día: where it can be closed (every center or one that is still
 * open) and what each choice suspends. Null when the date is not in the
 * agenda or every center is already closed.
 */
export async function closeDayForm(
  tenantId: number,
  requested: unknown,
  now: DateTime = businessNow()
): Promise<CloseDayView | null> {
  const today = businessDate(now)
  if (agendaDate(requested, today) !== requested) return null
  const date = requested as IsoDate

  const closures = await closuresOn(tenantId, date)
  if (closures.all) return null
  const closed = new Set(closures.list.map((closure) => closure.centerId))
  const centers = await Center.query().where('tenantId', tenantId).orderBy('name')
  const open = centers.filter((center) => !closed.has(center.id))

  const choices: { centerId: number | null; label: string }[] = []
  if (centers.length <= 1) {
    choices.push({ centerId: null, label: centers[0]?.name ?? 'Todo el centro' })
  } else {
    if (open.length === centers.length) {
      choices.push({
        centerId: null,
        label: centers.length === 2 ? 'Los dos centros' : 'Todos los centros',
      })
    }
    choices.push(...open.map((center) => ({ centerId: center.id, label: center.name })))
  }

  const options: CloseDayOption[] = []
  for (const choice of choices) {
    options.push({ ...choice, impact: await closureImpact(tenantId, date, choice.centerId) })
  }

  return { date, dateLabel: longDateLabel(date), dayName: dayName(date), options }
}
