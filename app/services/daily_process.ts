import BookingGenerator, { type GenerationSummary } from '#services/booking_generator'
import { businessNow } from '#services/business_calendar'
import { ensureCurrentFees } from '#services/fees'
import type { DateTime } from 'luxon'

export type DailySummary = {
  bookings: GenerationSummary
  fees: { created: number; existing: number }
}

/**
 * What runs once a day for a tenant: the fixed-schedule bookings of the next
 * weeks and this month's fee of every current subscription. Idempotent.
 */
export default class DailyProcess {
  async run({
    tenantId,
    now = businessNow(),
  }: {
    tenantId: number
    now?: DateTime
  }): Promise<DailySummary> {
    const bookings = await new BookingGenerator().generate({ tenantId, now })
    const fees = await ensureCurrentFees({ tenantId, now })
    return { bookings, fees }
  }
}
