import {
  PlanFactory,
  PlanQuotaFactory,
  SubscriptionFactory,
} from '#database/factories/plan_factories'
import { UserFactory } from '#database/factories/user_factory'
import Tenant from '#models/tenant'
import { BUSINESS_ZONE, businessNow } from '#services/business_calendar'
import { expiryFor } from '#services/pending_classes'
import {
  createCatalog,
  createPendingClass,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const kinafHost = 'kinaf.localhost:3333'

async function kinafCatalog() {
  return createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
}

/**
 * Combinado 3: 1 Yoga + 2 libres, three fixed slots like the prototype.
 */
async function sofiCombinado(catalog: Awaited<ReturnType<typeof kinafCatalog>>) {
  const pilatesMon = await createSchedule(catalog, {
    weekday: 1,
    startTime: '18:00',
    activity: catalog.pilates,
    center: catalog.mendoza,
    instructorName: 'Agus',
  })
  const yogaWed = await createSchedule(catalog, {
    weekday: 3,
    startTime: '19:00',
    activity: catalog.yoga,
    center: catalog.ovidio,
    instructorName: 'Mica',
  })
  const gymFri = await createSchedule(catalog, {
    weekday: 5,
    startTime: '18:00',
    activity: catalog.gym,
    center: catalog.mendoza,
    instructorName: 'Nico',
  })

  const student = await createStudent(catalog, {
    fullName: 'Sofi Ortiz',
    schedules: [pilatesMon, yogaWed, gymFri],
  })
  await student.plan.merge({ name: 'Combinado 3' }).save()

  const yogaQuota = await PlanQuotaFactory.merge({
    tenantId: catalog.tenant.id,
    planId: student.plan.id,
    weeklyCount: 1,
    anyActivity: false,
    position: 0,
  }).create()
  await yogaQuota
    .related('activities')
    .attach({ [catalog.yoga.id]: { tenant_id: catalog.tenant.id } })

  const freeQuota = await PlanQuotaFactory.merge({
    tenantId: catalog.tenant.id,
    planId: student.plan.id,
    weeklyCount: 2,
    anyActivity: true,
    position: 1,
  }).create()

  for (const slot of student.slots) {
    await slot
      .merge({ planQuotaId: slot.classScheduleId === yogaWed.id ? yogaQuota.id : freeQuota.id })
      .save()
  }
  await student.quota.delete()

  return { ...student, quota: freeQuota, yogaQuota, freeQuota, pilatesMon, yogaWed, gymFri }
}

test.group('Mi plan', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows plan quotas, fixed schedule and pending classes', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const sofi = await sofiCombinado(catalog)
    const missedOn = businessNow().minus({ days: 2 }).startOf('day')
    await createPendingClass(catalog, sofi, {
      schedule: sofi.pilatesMon,
      missedOn,
      expiresOn: DateTime.fromISO(expiryFor(missedOn.toISODate()!), { zone: BUSINESS_ZONE }),
      quota: sofi.freeQuota,
    })

    const response = await client
      .get('/plan')
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('client/plan')
    const { view } = response.inertiaProps
    assert.equal(view.state, 'with_plan')
    assert.equal(view.planName, 'Combinado 3')
    assert.deepEqual(
      view.quotas.map((q: { text: string }) => q.text),
      ['1 clase de Yoga por semana', '2 clases libres por semana']
    )
    assert.deepEqual(
      view.schedule.map((line: { label: string }) => line.label),
      [
        'Lunes 18:00 · Pilates · Mendoza',
        'Miércoles 19:00 · Yoga · Ovidio Lagos',
        'Viernes 18:00 · Gimnasio · Mendoza',
      ]
    )
    assert.isNotNull(view.pending)
    assert.isAtLeast(view.pending.count, 1)
  })

  test('without a plan it shows the empty state', async ({ client }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const fede = await UserFactory.merge({ tenantId: kinaf.id }).create()

    const response = await client.get('/plan').header('host', kinafHost).loginAs(fede).withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ view: { state: 'no_plan' } })
  })

  test('with a plan but no fixed slots it explains Kinaf is still setting schedules', async ({
    client,
    assert,
  }) => {
    const catalog = await kinafCatalog()
    const carla = await UserFactory.merge({
      tenantId: catalog.tenant.id,
      fullName: 'Carla Vico',
    }).create()
    const plan = await PlanFactory.merge({ tenantId: catalog.tenant.id, name: 'Libre 3' }).create()
    await PlanQuotaFactory.merge({
      tenantId: catalog.tenant.id,
      planId: plan.id,
      weeklyCount: 3,
      anyActivity: true,
    }).create()
    await SubscriptionFactory.merge({
      tenantId: catalog.tenant.id,
      userId: carla.id,
      planId: plan.id,
    }).create()

    const response = await client
      .get('/plan')
      .header('host', kinafHost)
      .loginAs(carla)
      .withInertia()

    const { view } = response.inertiaProps
    assert.equal(view.state, 'with_plan')
    assert.isNull(view.schedule)
  })

  test('describes a quota tied to several activities', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const schedule = await createSchedule(catalog, { activity: catalog.yoga })
    const student = await createStudent(catalog, { schedules: [schedule] })
    await student.plan.merge({ name: '2 de Yoga o Pilates' }).save()
    await student.quota.merge({ weeklyCount: 2, anyActivity: false }).save()
    await student.quota.related('activities').attach({
      [catalog.yoga.id]: { tenant_id: catalog.tenant.id },
      [catalog.pilates.id]: { tenant_id: catalog.tenant.id },
    })

    const response = await client
      .get('/plan')
      .header('host', kinafHost)
      .loginAs(student.user)
      .withInertia()

    const lines = response.inertiaProps.view.quotas.map((q: { text: string }) => q.text)
    assert.deepEqual(lines, ['2 clases de Pilates o Yoga por semana'])
  })
})
