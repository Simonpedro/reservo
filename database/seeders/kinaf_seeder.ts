import Activity from '#models/activity'
import Booking from '#models/booking'
import Center from '#models/center'
import FixedSlot from '#models/fixed_slot'
import PendingClass from '#models/pending_class'
import Plan from '#models/plan'
import PlanQuota from '#models/plan_quota'
import Tenant from '#models/tenant'
import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

type ActivitySlug = 'gimnasio' | 'pilates' | 'yoga'

/**
 * A plan quota: classes per week and the activities they can be used for.
 */
type QuotaSpec = { count: number; activities: ActivitySlug[] }

const GYM = ['gimnasio'] as ActivitySlug[]
const PILATES = ['pilates'] as ActivitySlug[]
const YOGA = ['yoga'] as ActivitySlug[]
/**
 * "Gym/Pilates": one quota usable for Gimnasio or Pilates (PRD.md).
 */
const GYM_PILATES = ['gimnasio', 'pilates'] as ActivitySlug[]

const single = (label: string, activities: ActivitySlug[], prices: number[]) =>
  prices.map((price, index) => ({
    name: `${label} ${index + 1}x semana`,
    price,
    quotas: [{ count: index + 1, activities }],
  }))

/**
 * Kinaf's fee list of November 2026, in display order. Prices in pesos.
 */
export const KINAF_PLANS: Array<{ name: string; price: number; quotas: QuotaSpec[] }> = [
  ...single('Gimnasio', GYM, [47000, 58000, 66000, 75000, 90000]),
  ...single('Pilates', PILATES, [47000, 58000, 66000, 75000, 90000]),
  ...single('Yoga', YOGA, [50000, 55000]),
  {
    name: '1 Gym + 1 Pilates',
    price: 61000,
    quotas: [
      { count: 1, activities: GYM },
      { count: 1, activities: PILATES },
    ],
  },
  {
    name: '1 Gym/Pilates + 1 Yoga',
    price: 65000,
    quotas: [
      { count: 1, activities: GYM_PILATES },
      { count: 1, activities: YOGA },
    ],
  },
  {
    name: '1 Gym + 1 Pilates + 1 Yoga',
    price: 70000,
    quotas: [
      { count: 1, activities: GYM },
      { count: 1, activities: PILATES },
      { count: 1, activities: YOGA },
    ],
  },
  {
    name: '1 Gym/Pilates + 2 Yoga',
    price: 72000,
    quotas: [
      { count: 1, activities: GYM_PILATES },
      { count: 2, activities: YOGA },
    ],
  },
  {
    name: '2 Gym/Pilates + 1 Yoga',
    price: 70000,
    quotas: [
      { count: 2, activities: GYM_PILATES },
      { count: 1, activities: YOGA },
    ],
  },
  {
    name: '2 Gym/Pilates + 1 Gym/Pilates',
    price: 70000,
    quotas: [
      { count: 2, activities: GYM_PILATES },
      { count: 1, activities: GYM_PILATES },
    ],
  },
  {
    name: '2 Gym/Pilates + 2 Gym/Pilates',
    price: 77000,
    quotas: [
      { count: 2, activities: GYM_PILATES },
      { count: 2, activities: GYM_PILATES },
    ],
  },
  {
    name: '2 Gym/Pilates + 1 Gym/Pilates + 1 Yoga',
    price: 80000,
    quotas: [
      { count: 2, activities: GYM_PILATES },
      { count: 1, activities: GYM_PILATES },
      { count: 1, activities: YOGA },
    ],
  },
  {
    name: '3 Gym/Pilates + 2 Gym/Pilates',
    price: 90000,
    quotas: [
      { count: 3, activities: GYM_PILATES },
      { count: 2, activities: GYM_PILATES },
    ],
  },
]

/**
 * Plans the product uses that are not on the November 2026 fee list.
 * "2 Gym + 1 Pilates" follows the dedicated-quota shape of "1 Gym + 1 Pilates".
 * Its price is estimated: every 3-class combo on that list costs $70.000.
 */
export const KINAF_EXTRA_PLANS: Array<{ name: string; price: number; quotas: QuotaSpec[] }> = [
  {
    name: '2 Gym + 1 Pilates',
    price: 70000,
    quotas: [
      { count: 2, activities: GYM },
      { count: 1, activities: PILATES },
    ],
  },
]

/**
 * Production-safe Kinaf data: the tenant, its centers, its activities and the
 * plans of the current fee list. Idempotent: plans are matched by name.
 */
export default class extends BaseSeeder {
  async run() {
    const tenant = await Tenant.updateOrCreate(
      { slug: 'kinaf' },
      {
        name: 'Kinaf',
        theme: {
          brandBackground: '#001A4D',
          green: '#8CC463',
          lightBlue: '#5AB8F0',
          blue: '#3E88F0',
          accent: '#6EF04A',
        },
        transferAliases: ['KINAF.KINESIOLOGIA', 'KINAF.KINE.AF'],
      }
    )

    for (const center of [
      { slug: 'mendoza', name: 'Mendoza' },
      { slug: 'ovidio-lagos', name: 'Ovidio Lagos' },
    ]) {
      await Center.firstOrCreate({ tenantId: tenant.id, slug: center.slug }, center)
    }

    const activityIds = new Map<string, number>()
    for (const activity of [
      { slug: 'gimnasio', name: 'Gimnasio', wash: 'blue' as const },
      { slug: 'pilates', name: 'Pilates', wash: 'celeste' as const },
      { slug: 'yoga', name: 'Yoga', wash: 'green' as const },
    ]) {
      const row = await Activity.firstOrCreate(
        { tenantId: tenant.id, slug: activity.slug },
        { ...activity, image: `/images/activities/${activity.slug}.webp` }
      )
      activityIds.set(activity.slug, row.id)
    }

    const allPlans = [...KINAF_PLANS, ...KINAF_EXTRA_PLANS]
    for (const [position, spec] of allPlans.entries()) {
      const plan = await Plan.updateOrCreate(
        { tenantId: tenant.id, name: spec.name },
        { price: spec.price, active: true, position }
      )
      await this.syncQuotas(plan, spec.quotas, activityIds)
    }
  }

  /**
   * Leaves the plan with exactly `specs` as quotas. Quotas already in use
   * (fixed slots, bookings or pending classes point at them) are never
   * replaced: if they differ from the list the plan is left as is.
   */
  private async syncQuotas(plan: Plan, specs: QuotaSpec[], activityIds: Map<string, number>) {
    const tenantId = plan.tenantId
    const quotas = await PlanQuota.query()
      .where('tenantId', tenantId)
      .where('planId', plan.id)
      .preload('activities')
      .orderBy('position')

    const wanted = specs.map((spec) => ({
      count: spec.count,
      activityIds: spec.activities.map((slug) => activityIds.get(slug)!).sort((a, b) => a - b),
    }))
    const current = quotas.map((quota) => ({
      count: quota.weeklyCount,
      activityIds: quota.activities.map((activity) => activity.id).sort((a, b) => a - b),
    }))
    if (JSON.stringify(current) === JSON.stringify(wanted)) return

    const quotaIds = quotas.map((quota) => quota.id)
    if (quotaIds.length > 0 && (await this.inUse(tenantId, quotaIds))) {
      logger.warn(`Plan "${plan.name}" has quotas in use; its quotas were not replaced`)
      return
    }

    await PlanQuota.query().where('tenantId', tenantId).whereIn('id', quotaIds).delete()
    for (const [position, spec] of wanted.entries()) {
      const quota = await PlanQuota.create({
        tenantId,
        planId: plan.id,
        weeklyCount: spec.count,
        anyActivity: false,
        position,
      })
      await quota
        .related('activities')
        .attach(Object.fromEntries(spec.activityIds.map((id) => [id, { tenant_id: tenantId }])))
    }
  }

  private async inUse(tenantId: number, quotaIds: number[]) {
    for (const model of [FixedSlot, Booking, PendingClass]) {
      const row = await model
        .query()
        .where('tenantId', tenantId)
        .whereIn('planQuotaId', quotaIds)
        .first()
      if (row) return true
    }
    return false
  }
}
