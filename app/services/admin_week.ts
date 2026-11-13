import type { ActivityWash } from '#models/activity'
import Center from '#models/center'
import ClassSchedule from '#models/class_schedule'
import FixedSlot from '#models/fixed_slot'
import {
  addDays,
  BUSINESS_ZONE,
  businessDate,
  businessNow,
  longDayLabel,
  startOfWeek,
  validDate,
  weekdayNames,
  type IsoDate,
} from '#services/business_calendar'
import { DateTime } from 'luxon'

/**
 * A person with this class as fixed schedule on the class date.
 */
export type WeekPerson = { userId: number; fullName: string }

export type WeekClass = {
  scheduleId: number
  startTime: string
  activity: { name: string; wash: ActivityWash }
  centerName: string
  instructorName: string
  /**
   * People with a fixed schedule here on the class date.
   */
  taken: number
  capacity: number
  people: WeekPerson[]
}

export type WeekDay = {
  weekday: number
  date: IsoDate
  /**
   * "Lunes 16" and "Lun".
   */
  name: string
  short: string
  /**
   * Day of the month: 16.
   */
  day: number
  classes: WeekClass[]
}

export type WeekView = {
  /**
   * The Monday of the week shown, and of the weeks before and after it.
   */
  start: IsoDate
  previous: IsoDate
  next: IsoDate
  /**
   * "Semana del 16 al 21 de noviembre".
   */
  title: string
  /**
   * The centers to filter by; empty when there is only one.
   */
  centers: { slug: string; name: string }[]
  /**
   * The filtered center, or null for all of them.
   */
  center: { slug: string; name: string } | null
  /**
   * Monday to Saturday, and Sunday only when some class is on Sunday.
   */
  days: WeekDay[]
  /**
   * How many classes there are in the week.
   */
  total: number
}

/**
 * The Monday of the requested date's week, or of the current week when the
 * request is not a date.
 */
export function weekStart(requested: unknown, today: IsoDate): IsoDate {
  return startOfWeek(validDate(requested) ?? today)
}

function dayAndMonth(date: IsoDate, withYear: boolean) {
  return DateTime.fromISO(date, { zone: BUSINESS_ZONE })
    .setLocale('es-AR')
    .toFormat(withYear ? "d 'de' LLLL 'de' yyyy" : "d 'de' LLLL")
}

/**
 * "Semana del 16 al 21 de noviembre", "Semana del 30 de noviembre al 5 de
 * diciembre" or, across years, with both years.
 */
export function weekTitle(first: IsoDate, last: IsoDate) {
  if (first.slice(0, 7) === last.slice(0, 7)) {
    return `Semana del ${Number(first.slice(8))} al ${dayAndMonth(last, false)}`
  }
  const withYear = first.slice(0, 4) !== last.slice(0, 4)
  return `Semana del ${dayAndMonth(first, withYear)} al ${dayAndMonth(last, withYear)}`
}

/**
 * Whether the fixed slot holds on the date.
 */
function validOn(slot: FixedSlot, date: IsoDate) {
  const endsOn = slot.endsOn?.toISODate() ?? null
  return slot.startsOn.toISODate()! <= date && (endsOn === null || endsOn >= date)
}

/**
 * Agenda › Semana: one dated week, as the Excel the center used to keep.
 * Every active weekly class by day and time, with the people who have it as
 * fixed schedule on that very date and the occupation they make. Someone
 * changing schedule shows up in the old class until the change and in the
 * new one after it, never in both. Read only. `requestedCenter` is a center
 * slug and `requestedWeek` any date of the week.
 */
export async function adminWeek(
  tenantId: number,
  requestedCenter: unknown,
  requestedWeek: unknown,
  now: DateTime = businessNow()
): Promise<WeekView> {
  const start = weekStart(requestedWeek, businessDate(now))
  const centers = await Center.query().where('tenantId', tenantId).orderBy('name')
  const center =
    centers.length > 1 ? (centers.find((row) => row.slug === requestedCenter) ?? null) : null

  const query = ClassSchedule.query()
    .where('tenantId', tenantId)
    .where('active', true)
    .preload('activity', (activity) => activity.where('tenantId', tenantId))
    .preload('center', (place) => place.where('tenantId', tenantId))
    .orderBy('weekday')
    .orderBy('startTime')
    .orderBy('id')
  if (center) query.where('centerId', center.id)
  const schedules = await query

  const weekdays = [1, 2, 3, 4, 5, 6]
  if (schedules.some((schedule) => schedule.weekday === 7)) weekdays.push(7)
  const dateOf = (weekday: number) => addDays(start, weekday - 1)
  const last = dateOf(weekdays.at(-1)!)

  const slots = schedules.length
    ? await FixedSlot.query()
        .where('tenantId', tenantId)
        .whereIn(
          'classScheduleId',
          schedules.map((schedule) => schedule.id)
        )
        .where('startsOn', '<=', addDays(start, 6))
        .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', start))
        .preload('user', (user) => user.where('tenantId', tenantId))
    : []

  return {
    start,
    previous: addDays(start, -7),
    next: addDays(start, 7),
    title: weekTitle(start, last),
    centers: centers.length > 1 ? centers.map(({ slug, name }) => ({ slug, name })) : [],
    center: center && { slug: center.slug, name: center.name },
    days: weekdays.map((weekday) => {
      const date = dateOf(weekday)
      return {
        weekday,
        date,
        name: longDayLabel(date),
        short: weekdayNames(weekday).short,
        day: Number(date.slice(8)),
        classes: schedules
          .filter((schedule) => schedule.weekday === weekday)
          .map((schedule) => {
            const people = slots
              .filter((slot) => slot.classScheduleId === schedule.id && validOn(slot, date))
              .map((slot) => ({ userId: slot.userId, fullName: slot.user.fullName }))
              .sort((left, right) => left.fullName.localeCompare(right.fullName, 'es'))
            return {
              scheduleId: schedule.id,
              startTime: schedule.startTime,
              activity: { name: schedule.activity.name, wash: schedule.activity.wash },
              centerName: schedule.center.name,
              instructorName: schedule.instructorName,
              taken: people.length,
              capacity: schedule.capacity,
              people,
            }
          }),
      }
    }),
    total: schedules.length,
  }
}
