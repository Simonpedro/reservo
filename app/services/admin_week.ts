import type { ActivityWash } from '#models/activity'
import Center from '#models/center'
import ClassSchedule from '#models/class_schedule'
import FixedSlot from '#models/fixed_slot'
import {
  businessDate,
  businessNow,
  dayName,
  weekdayNames,
  type IsoDate,
} from '#services/business_calendar'
import type { DateTime } from 'luxon'

/**
 * A person with this class as fixed schedule. `note` says when it starts or
 * ends if that is not "always": "desde el lunes 16", "hasta el domingo 15".
 */
export type WeekPerson = { userId: number; fullName: string; note: string | null }

export type WeekClass = {
  scheduleId: number
  startTime: string
  activity: { name: string; wash: ActivityWash }
  centerName: string
  instructorName: string
  /**
   * People with a fixed schedule here (what the capacity can't go below).
   */
  taken: number
  capacity: number
  people: WeekPerson[]
}

export type WeekDay = {
  weekday: number
  /**
   * "Lunes" and "Lun".
   */
  name: string
  short: string
  classes: WeekClass[]
}

export type WeekView = {
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

function noteOf(slot: FixedSlot, today: IsoDate): string | null {
  const startsOn = slot.startsOn.toISODate()!
  if (startsOn > today) return `desde el ${dayName(startsOn)}`
  if (slot.endsOn) return `hasta el ${dayName(slot.endsOn.toISODate()!)}`
  return null
}

/**
 * Agenda › Semana: the typical week, as the Excel the center used to keep.
 * Every active weekly class by day and time, with its occupation and the
 * people who have it as fixed schedule today or later (the same people the
 * capacity can't go below). `requestedCenter` is a center slug.
 */
export async function adminWeek(
  tenantId: number,
  requestedCenter: unknown,
  now: DateTime = businessNow()
): Promise<WeekView> {
  const today = businessDate(now)
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

  const slots = schedules.length
    ? await FixedSlot.query()
        .where('tenantId', tenantId)
        .whereIn(
          'classScheduleId',
          schedules.map((schedule) => schedule.id)
        )
        .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
        .preload('user', (user) => user.where('tenantId', tenantId))
    : []
  const people = new Map<number, WeekPerson[]>()
  for (const slot of slots) {
    const list = people.get(slot.classScheduleId) ?? []
    list.push({ userId: slot.userId, fullName: slot.user.fullName, note: noteOf(slot, today) })
    people.set(slot.classScheduleId, list)
  }

  const weekdays = [1, 2, 3, 4, 5, 6]
  if (schedules.some((schedule) => schedule.weekday === 7)) weekdays.push(7)

  return {
    centers: centers.length > 1 ? centers.map(({ slug, name }) => ({ slug, name })) : [],
    center: center && { slug: center.slug, name: center.name },
    days: weekdays.map((weekday) => ({
      weekday,
      ...weekdayNames(weekday),
      classes: schedules
        .filter((schedule) => schedule.weekday === weekday)
        .map((schedule) => {
          const list = (people.get(schedule.id) ?? []).sort((left, right) =>
            left.fullName.localeCompare(right.fullName, 'es')
          )
          return {
            scheduleId: schedule.id,
            startTime: schedule.startTime,
            activity: { name: schedule.activity.name, wash: schedule.activity.wash },
            centerName: schedule.center.name,
            instructorName: schedule.instructorName,
            taken: list.length,
            capacity: schedule.capacity,
            people: list,
          }
        }),
    })),
    total: schedules.length,
  }
}
