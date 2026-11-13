import {
  ActivityFactory,
  CenterFactory,
  ClassScheduleFactory,
} from '#database/factories/catalog_factories'
import {
  FixedSlotFactory,
  PlanFactory,
  PlanQuotaFactory,
  SubscriptionFactory,
} from '#database/factories/plan_factories'
import { TenantFactory } from '#database/factories/tenant_factory'
import { UserFactory } from '#database/factories/user_factory'
import type Activity from '#models/activity'
import type Center from '#models/center'
import type ClassSchedule from '#models/class_schedule'
import type Tenant from '#models/tenant'
import { type DateTime } from 'luxon'

/**
 * Builders on top of the Lucid factories for the usual test world: a tenant
 * with centers, activities and weekly classes, and students with a plan and
 * fixed slots.
 */
export type Catalog = {
  tenant: Tenant
  mendoza: Center
  ovidio: Center
  pilates: Activity
  yoga: Activity
  gym: Activity
}

export async function createCatalog(tenant?: Tenant): Promise<Catalog> {
  tenant ??= await TenantFactory.create()
  const tenantId = tenant.id
  const [mendoza, ovidio] = await Promise.all([
    CenterFactory.merge({ tenantId, name: 'Mendoza' }).create(),
    CenterFactory.merge({ tenantId, name: 'Ovidio Lagos' }).create(),
  ])
  const [pilates, yoga, gym] = await Promise.all([
    ActivityFactory.merge({ tenantId, name: 'Pilates', wash: 'celeste' }).create(),
    ActivityFactory.merge({ tenantId, name: 'Yoga', wash: 'green' }).create(),
    ActivityFactory.merge({ tenantId, name: 'Gimnasio', wash: 'blue' }).create(),
  ])
  return { tenant, mendoza, ovidio, pilates, yoga, gym }
}

export function createSchedule(
  catalog: Catalog,
  attributes: Partial<
    Pick<ClassSchedule, 'weekday' | 'startTime' | 'instructorName' | 'active'>
  > & {
    activity?: Activity
    center?: Center
  } = {}
) {
  const { activity = catalog.pilates, center = catalog.mendoza, ...rest } = attributes
  return ClassScheduleFactory.merge({
    tenantId: catalog.tenant.id,
    activityId: activity.id,
    centerId: center.id,
    ...rest,
  }).create()
}

type Range = { startsOn?: DateTime; endsOn?: DateTime | null }

/**
 * A student with a one-quota "any activity" plan and one fixed slot per
 * schedule. Ranges default to "since last month, open ended".
 */
export async function createStudent(
  catalog: Catalog,
  options: {
    schedules?: ClassSchedule[]
    subscription?: Range
    slot?: Range
    fullName?: string
  } = {}
) {
  const tenantId = catalog.tenant.id
  const user = await UserFactory.merge({
    tenantId,
    ...(options.fullName ? { fullName: options.fullName } : {}),
  }).create()
  const plan = await PlanFactory.merge({ tenantId }).create()
  const quota = await PlanQuotaFactory.merge({
    tenantId,
    planId: plan.id,
    weeklyCount: Math.max(1, options.schedules?.length ?? 1),
  }).create()
  const subscription = await SubscriptionFactory.merge({
    tenantId,
    userId: user.id,
    planId: plan.id,
    ...options.subscription,
  }).create()
  const slots = []
  for (const schedule of options.schedules ?? []) {
    slots.push(
      await FixedSlotFactory.merge({
        tenantId,
        subscriptionId: subscription.id,
        userId: user.id,
        planQuotaId: quota.id,
        classScheduleId: schedule.id,
        ...options.slot,
      }).create()
    )
  }
  return { user, plan, quota, subscription, slots }
}
