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
import { BookingFactory, PendingClassFactory } from '#database/factories/booking_factories'
import { TenantFactory } from '#database/factories/tenant_factory'
import { UserFactory } from '#database/factories/user_factory'
import type Activity from '#models/activity'
import type Booking from '#models/booking'
import type Center from '#models/center'
import type ClassSchedule from '#models/class_schedule'
import type PlanQuota from '#models/plan_quota'
import type Tenant from '#models/tenant'
import { findOrCreateSession } from '#services/class_sessions'
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
    Pick<ClassSchedule, 'weekday' | 'startTime' | 'instructorName' | 'active' | 'capacity'>
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

/**
 * A booking of the student in the schedule's session on `date` (the session
 * is created if needed).
 */
export async function createBooking(
  catalog: Catalog,
  student: Awaited<ReturnType<typeof createStudent>>,
  schedule: ClassSchedule,
  date: DateTime,
  attributes: Partial<Pick<Booking, 'status' | 'source' | 'pendingClassId'>> = {}
) {
  const session = await findOrCreateSession(schedule, date.toISODate()!)
  return BookingFactory.merge({
    tenantId: catalog.tenant.id,
    userId: student.user.id,
    classSessionId: session.id,
    planQuotaId: student.quota.id,
    fixedSlotId: attributes.source === 'pending' ? null : (student.slots[0]?.id ?? null),
    ...attributes,
  }).create()
}

/**
 * A plan quota limited to some activities ("1 Yoga", "2 de Yoga o Pilates")
 * in the student's plan.
 */
export async function createQuota(
  catalog: Catalog,
  student: Awaited<ReturnType<typeof createStudent>>,
  activities: Activity[]
) {
  const tenantId = catalog.tenant.id
  const quota = await PlanQuotaFactory.merge({
    tenantId,
    planId: student.plan.id,
    anyActivity: false,
  }).create()
  await quota
    .related('activities')
    .attach(
      Object.fromEntries(activities.map((activity) => [activity.id, { tenant_id: tenantId }]))
    )
  return quota
}

/**
 * An available pending class of the student for a class missed on `missedOn`
 * (its origin booking is created there, cancelled).
 */
export async function createPendingClass(
  catalog: Catalog,
  student: Awaited<ReturnType<typeof createStudent>>,
  options: {
    schedule: ClassSchedule
    missedOn: DateTime
    expiresOn: DateTime
    quota?: PlanQuota
  }
) {
  const quota = options.quota ?? student.quota
  const origin = await createBooking(catalog, student, options.schedule, options.missedOn, {
    status: 'cancelled',
  })
  await origin.merge({ planQuotaId: quota.id }).save()
  return PendingClassFactory.merge({
    tenantId: catalog.tenant.id,
    userId: student.user.id,
    planQuotaId: quota.id,
    originBookingId: origin.id,
    missedOn: options.missedOn,
    expiresOn: options.expiresOn,
  }).create()
}

/**
 * A plan with its quotas in order: `{ count: 2 }` is "2 clases libres",
 * `{ count: 1, activities: [yoga] }` is "1 clase de Yoga".
 */
export async function createPlan(
  catalog: Catalog,
  quotas: Array<{ count: number; activities?: Activity[] }>,
  name = 'Plan de prueba'
) {
  const tenantId = catalog.tenant.id
  const plan = await PlanFactory.merge({ tenantId, name }).create()
  const created: PlanQuota[] = []
  for (const [position, spec] of quotas.entries()) {
    const quota = await PlanQuotaFactory.merge({
      tenantId,
      planId: plan.id,
      weeklyCount: spec.count,
      anyActivity: !spec.activities,
      position,
    }).create()
    if (spec.activities) {
      await quota
        .related('activities')
        .attach(
          Object.fromEntries(
            spec.activities.map((activity) => [activity.id, { tenant_id: tenantId }])
          )
        )
    }
    created.push(quota)
  }
  return { plan, quotas: created }
}
