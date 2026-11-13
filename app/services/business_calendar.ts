import { DateTime } from 'luxon'

/**
 * Every business date (class dates, the 24 h rule, expirations, overdue fees)
 * is computed in this zone, regardless of the server time zone.
 */
export const BUSINESS_ZONE = 'America/Argentina/Buenos_Aires'

/**
 * A calendar date as 'yyyy-MM-dd'.
 */
export type IsoDate = string

const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function businessNow(): DateTime {
  return DateTime.now().setZone(BUSINESS_ZONE)
}

export function toBusinessZone(moment: DateTime): DateTime {
  return moment.setZone(BUSINESS_ZONE)
}

export function businessDate(moment: DateTime): IsoDate {
  return toBusinessZone(moment).toISODate()!
}

function parse(date: IsoDate): DateTime {
  return DateTime.fromISO(date, { zone: BUSINESS_ZONE })
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return parse(date).plus({ days }).toISODate()!
}

/**
 * ISO weekday: 1 = Monday … 7 = Sunday.
 */
export function isoWeekday(date: IsoDate): number {
  return parse(date).weekday
}

/**
 * `days` consecutive dates starting at `from` (inclusive).
 */
export function dateRange(from: IsoDate, days: number): IsoDate[] {
  return Array.from({ length: days }, (_, index) => addDays(from, index))
}

export function endOfWeek(date: IsoDate): IsoDate {
  return addDays(date, 7 - isoWeekday(date))
}

/**
 * The moment a class starts: a business date plus an 'HH:mm' wall time.
 */
export function classStart(date: IsoDate, startTime: string): DateTime {
  const [hour, minute] = startTime.split(':').map(Number)
  return parse(date).set({ hour, minute, second: 0, millisecond: 0 })
}

/**
 * Short day label for class cards: "Hoy", "Mañana" or "Vie 13".
 */
export function dayLabel(date: IsoDate, today: IsoDate): string {
  if (date === today) return 'Hoy'
  if (date === addDays(today, 1)) return 'Mañana'
  return `${WEEKDAYS_SHORT[isoWeekday(date) - 1]} ${parse(date).day}`
}
