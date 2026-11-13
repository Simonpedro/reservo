import Tenant from '#models/tenant'
import BookingGenerator, { type GenerationSummary } from '#services/booking_generator'
import { businessNow } from '#services/business_calendar'
import { ensureCurrentFees } from '#services/fees'
import { expirePendingClasses } from '#services/pending_classes'
import type { DateTime } from 'luxon'

export type DailySummary = {
  bookings: GenerationSummary
  fees: { created: number; existing: number }
  pendings: { expired: number }
}

export type DailyRunReport = {
  tenants: Array<{ slug: string } & DailySummary>
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
    const today = now.toISODate()!
    const bookings = await new BookingGenerator().generate({ tenantId, now })
    const fees = await ensureCurrentFees({ tenantId, now })
    const expired = await expirePendingClasses(tenantId, today)
    return { bookings, fees, pendings: { expired } }
  }

  async runAllTenants({ now = businessNow() }: { now?: DateTime } = {}): Promise<DailyRunReport> {
    const tenants = await Tenant.query().orderBy('id')
    const results: DailyRunReport['tenants'] = []
    for (const tenant of tenants) {
      const summary = await this.run({ tenantId: tenant.id, now })
      results.push({ slug: tenant.slug, ...summary })
    }
    return { tenants: results }
  }
}
