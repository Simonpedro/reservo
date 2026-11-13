import KinafDemoSeeder from '#database/seeders/kinaf_demo_seeder'
import KinafSeeder from '#database/seeders/kinaf_seeder'
import FixedSlot from '#models/fixed_slot'
import MonthlyFee from '#models/monthly_fee'
import Plan from '#models/plan'
import Tenant from '#models/tenant'
import User from '#models/user'
import { businessDate, businessNow } from '#services/business_calendar'
import { statusOf } from '#services/fees'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

/**
 * Kinaf's fee list of November 2026, copied from the price list: name,
 * price and quotas as "count:activities" ("G" Gimnasio, "P" Pilates,
 * "Y" Yoga; "GP" is a Gym/Pilates quota).
 */
const NOVEMBER_2026: Array<[string, number, string[]]> = [
  ['Gimnasio 1x semana', 47000, ['1:G']],
  ['Gimnasio 2x semana', 58000, ['2:G']],
  ['Gimnasio 3x semana', 66000, ['3:G']],
  ['Gimnasio 4x semana', 75000, ['4:G']],
  ['Gimnasio 5x semana', 90000, ['5:G']],
  ['Pilates 1x semana', 47000, ['1:P']],
  ['Pilates 2x semana', 58000, ['2:P']],
  ['Pilates 3x semana', 66000, ['3:P']],
  ['Pilates 4x semana', 75000, ['4:P']],
  ['Pilates 5x semana', 90000, ['5:P']],
  ['Yoga 1x semana', 50000, ['1:Y']],
  ['Yoga 2x semana', 55000, ['2:Y']],
  ['1 Gym + 1 Pilates', 61000, ['1:G', '1:P']],
  ['1 Gym/Pilates + 1 Yoga', 65000, ['1:GP', '1:Y']],
  ['1 Gym + 1 Pilates + 1 Yoga', 70000, ['1:G', '1:P', '1:Y']],
  ['1 Gym/Pilates + 2 Yoga', 72000, ['1:GP', '2:Y']],
  ['2 Gym/Pilates + 1 Yoga', 70000, ['2:GP', '1:Y']],
  ['2 Gym/Pilates + 1 Gym/Pilates', 70000, ['2:GP', '1:GP']],
  ['2 Gym/Pilates + 2 Gym/Pilates', 77000, ['2:GP', '2:GP']],
  ['2 Gym/Pilates + 1 Gym/Pilates + 1 Yoga', 80000, ['2:GP', '1:GP', '1:Y']],
  ['3 Gym/Pilates + 2 Gym/Pilates', 90000, ['3:GP', '2:GP']],
]

const LETTER: Record<string, string> = { gimnasio: 'G', pilates: 'P', yoga: 'Y' }

async function kinaf() {
  return Tenant.findByOrFail('slug', 'kinaf')
}

/**
 * The tenant's plans as [name, price, quotas] in display order.
 */
async function seededPlans(tenantId: number) {
  const plans = await Plan.query()
    .where('tenantId', tenantId)
    .orderBy('position')
    .preload('quotas', (quotas) => quotas.orderBy('position').preload('activities'))
  return plans.map((plan) => [
    plan.name,
    plan.price,
    plan.quotas.map((quota) => {
      const letters = quota.activities.map((activity) => LETTER[activity.slug]).sort()
      return `${quota.weeklyCount}:${letters.join('')}`
    }),
  ])
}

/**
 * Row counts of every table the seeders write, for the Kinaf tenant.
 */
async function kinafRowCounts(tenantId: number) {
  const tables = [
    'centers',
    'activities',
    'class_schedules',
    'class_sessions',
    'closures',
    'plans',
    'plan_quotas',
    'plan_quota_activities',
    'users',
    'subscriptions',
    'fixed_slots',
    'bookings',
    'pending_classes',
    'monthly_fees',
    'receipts',
    'access_links',
  ]
  const counts: Record<string, number> = {}
  for (const table of tables) {
    const [row] = await db.from(table).where('tenant_id', tenantId).count('* as total')
    counts[table] = Number(row.total)
  }
  return counts
}

test.group('Kinaf seed | plans', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('has exactly the plans, prices and quotas of the November 2026 fee list', async ({
    assert,
  }) => {
    const tenant = await kinaf()
    assert.deepEqual(await seededPlans(tenant.id), NOVEMBER_2026)
  })

  test('restores quotas edited by hand when no student uses the plan', async ({ assert }) => {
    const tenant = await kinaf()
    const plan = await Plan.query()
      .where('tenantId', tenant.id)
      .where('name', '1 Gym + 1 Pilates')
      .preload('quotas')
      .firstOrFail()
    await plan.quotas[1].delete()
    await plan.quotas[0].merge({ weeklyCount: 4 }).save()
    await plan.merge({ price: 1 }).save()

    await new KinafSeeder(db.connection()).run()

    const plans = await seededPlans(tenant.id)
    const restored = plans.find(([name]) => name === '1 Gym + 1 Pilates')
    assert.deepEqual(restored, ['1 Gym + 1 Pilates', 61000, ['1:G', '1:P']])
  })

  test('leaves quotas in use by fixed slots untouched, but still updates the price', async ({
    assert,
  }) => {
    const tenant = await kinaf()
    const sofi = await User.findByOrFail({ tenantId: tenant.id, email: 'sofi@kinaf.test' })
    const slot = await FixedSlot.query()
      .where('tenantId', tenant.id)
      .where('userId', sofi.id)
      .whereNull('endsOn')
      .preload('planQuota')
      .firstOrFail()
    await slot.planQuota.merge({ weeklyCount: 9 }).save()
    await Plan.query()
      .where('tenantId', tenant.id)
      .where('id', slot.planQuota.planId)
      .update({ price: 1 })

    await new KinafSeeder(db.connection()).run()

    await slot.planQuota.refresh()
    assert.equal(slot.planQuota.weeklyCount, 9)
    const plan = await Plan.query()
      .where('tenantId', tenant.id)
      .where('id', slot.planQuota.planId)
      .firstOrFail()
    assert.equal(plan.price, 70000)
  })
})

test.group('Kinaf seed | demo', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('running the seeders again duplicates nothing', async ({ assert }) => {
    const tenant = await kinaf()
    const before = await kinafRowCounts(tenant.id)

    await new KinafDemoSeeder(db.connection()).run()
    await new KinafDemoSeeder(db.connection()).run()

    assert.deepEqual(await kinafRowCounts(tenant.id), before)
  }).timeout(30000)

  test('this month has fees in every status the student can see', async ({ assert }) => {
    const tenant = await kinaf()
    const today = businessDate(businessNow())
    const fees = await MonthlyFee.query().where('tenantId', tenant.id)
    const statuses = new Set(fees.map((fee) => statusOf(fee, today)))

    assert.includeMembers([...statuses], ['in_review', 'paid', 'overdue'])
  })

  test('Sofi has the demo plan, fixed slots and a pending class from a cancellation', async ({
    assert,
  }) => {
    const tenant = await kinaf()
    const sofi = await User.findByOrFail({ tenantId: tenant.id, email: 'sofi@kinaf.test' })
    const slots = await FixedSlot.query()
      .where('tenantId', tenant.id)
      .where('userId', sofi.id)
      .whereNull('endsOn')
      .preload('subscription', (subscription) => subscription.preload('plan'))
    const pendings = await db
      .from('pending_classes')
      .where('tenant_id', tenant.id)
      .where('user_id', sofi.id)
      .where('status', 'available')

    assert.lengthOf(slots, 3)
    assert.equal(slots[0].subscription.plan.name, '2 Gym/Pilates + 1 Yoga')
    assert.deepEqual(
      pendings.map((pending) => pending.reason),
      ['cancelled']
    )
  })
})
