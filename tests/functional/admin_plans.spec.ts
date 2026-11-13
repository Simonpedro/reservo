import { TenantFactory } from '#database/factories/tenant_factory'
import { UserFactory } from '#database/factories/user_factory'
import FixedSlot from '#models/fixed_slot'
import Plan from '#models/plan'
import PlanQuota from '#models/plan_quota'
import Tenant from '#models/tenant'
import User from '#models/user'
import { LOCKED_QUOTAS_MESSAGE } from '#services/admin_plans'
import {
  createBooking,
  createCatalog,
  createPlan,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const host = `kinaf.localhost:${env.get('PORT')}`

async function kinafWorld() {
  const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
  const admin = await User.findByOrFail({ tenantId: kinaf.id, email: 'admin@kinaf.test' })
  return { catalog: await createCatalog(kinaf), admin }
}

async function quotaRows(planId: number) {
  const quotas = await PlanQuota.query()
    .where('planId', planId)
    .orderBy('position')
    .preload('activities', (activity) => activity.orderBy('id'))
  return quotas.map((quota) => ({
    id: quota.id,
    weeklyCount: quota.weeklyCount,
    anyActivity: quota.anyActivity,
    activityIds: quota.activities.map((activity) => activity.id),
  }))
}

test.group('Admin › settings and plans', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('Ajustes shows the active plans and the center data read-only', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    await catalog.tenant
      .merge({ whatsappPhone: '5493415550000', transferAliases: ['kinaf.rosario'] })
      .save()
    const active = await Plan.query()
      .where('tenantId', catalog.tenant.id)
      .where('active', true)
      .count('* as total')
    await createPlan(catalog, [{ count: 1 }], 'Viejo').then(({ plan }) =>
      plan.merge({ active: false }).save()
    )

    const response = await client
      .get('/admin/ajustes')
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/settings')
    assert.deepEqual(response.inertiaProps, {
      ...response.inertiaProps,
      activePlans: Number(active[0].$extras.total),
      whatsappPhone: '5493415550000',
      transferAliases: ['kinaf.rosario'],
    })
  })

  test('Planes lists each plan with its weekly total, quotas and price', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { plan } = await createPlan(
      catalog,
      [{ count: 1, activities: [catalog.yoga] }, { count: 2 }],
      'Combinado de prueba'
    )
    await plan.merge({ price: 38000 }).save()

    const response = await client
      .get('/admin/ajustes/planes')
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(200)
    const listed = response.inertiaProps.plans.find((item: { id: number }) => item.id === plan.id)
    assert.deepEqual(listed, {
      id: plan.id,
      name: 'Combinado de prueba',
      active: true,
      weeklyTotal: 3,
      summary: '1 clase de Yoga + 2 clases libres',
      price: '$38.000',
    })
  })

  test('creates a plan with its quotas in order', async ({ client, assert }) => {
    const { catalog, admin } = await kinafWorld()

    const response = await client
      .post('/admin/ajustes/planes')
      .header('host', host)
      .loginAs(admin)
      .json({
        name: 'Yoga y libres',
        price: 41000,
        quotas: [
          {
            weeklyCount: 1,
            anyActivity: false,
            activityIds: [catalog.yoga.id, catalog.pilates.id],
          },
          { weeklyCount: 2, anyActivity: true, activityIds: [] },
        ],
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/ajustes/planes')
    const plan = await Plan.query()
      .where('tenantId', catalog.tenant.id)
      .where('name', 'Yoga y libres')
      .firstOrFail()
    assert.equal(plan.price, 41000)
    assert.isTrue(plan.active)
    const rows = await quotaRows(plan.id)
    assert.deepEqual(
      rows.map(({ id: _id, ...quota }) => quota),
      [
        {
          weeklyCount: 1,
          anyActivity: false,
          activityIds: [catalog.pilates.id, catalog.yoga.id].sort((a, b) => a - b),
        },
        { weeklyCount: 2, anyActivity: true, activityIds: [] },
      ]
    )
  })

  test('rejects a plan without quotas, with a zero count or without activities', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const attempts = [
      { quotas: [], field: 'quotas', message: 'El plan necesita al menos un cupo.' },
      {
        quotas: [{ weeklyCount: 0, anyActivity: true, activityIds: [] }],
        field: 'quotas.0.weeklyCount',
        message: 'Cada cupo necesita al menos 1 clase por semana.',
      },
      {
        quotas: [{ weeklyCount: 8, anyActivity: true, activityIds: [] }],
        field: 'quotas.0.weeklyCount',
        message: 'Cada cupo puede tener hasta 7 clases por semana.',
      },
    ]

    for (const attempt of attempts) {
      const response = await client
        .post('/admin/ajustes/planes')
        .header('host', host)
        .header('referer', `http://${host}/admin/ajustes/planes/nuevo`)
        .loginAs(admin)
        .withInertia()
        .json({ name: 'Inválido', price: 1000, quotas: attempt.quotas })
        .withCsrfToken()
        .redirects(0)

      response.assertStatus(302)
      assert.deepEqual(response.flashMessage('inputErrorsBag'), {
        [attempt.field]: [attempt.message],
      })
    }

    const noActivity = await client
      .post('/admin/ajustes/planes')
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/planes/nuevo`)
      .loginAs(admin)
      .json({
        name: 'Inválido',
        price: 1000,
        quotas: [{ weeklyCount: 2, anyActivity: false, activityIds: [] }],
      })
      .withCsrfToken()
      .redirects(0)
    noActivity.assertStatus(302)
    noActivity.assertFlashMessage('errors', {
      'quotas.0.activityIds': 'Elegí al menos una actividad para el cupo 1.',
    })

    const created = await Plan.query()
      .where('tenantId', catalog.tenant.id)
      .where('name', 'Inválido')
    assert.lengthOf(created, 0)
  })

  test('rejects activities of another tenant', async ({ client, assert }) => {
    const { catalog, admin } = await kinafWorld()
    const foreign = await createCatalog(await TenantFactory.create())

    const response = await client
      .post('/admin/ajustes/planes')
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/planes/nuevo`)
      .loginAs(admin)
      .json({
        name: 'Con actividad ajena',
        price: 1000,
        quotas: [{ weeklyCount: 1, anyActivity: false, activityIds: [foreign.yoga.id] }],
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('errors', {
      'quotas.0.activityIds': 'Una de las actividades no existe.',
    })
    const created = await Plan.query()
      .where('tenantId', catalog.tenant.id)
      .where('name', 'Con actividad ajena')
    assert.lengthOf(created, 0)
  })

  test('changing the price of a plan with fixed schedules keeps the schedules', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const schedule = await createSchedule(catalog)
    const student = await createStudent(catalog, { schedules: [schedule] })
    const before = await quotaRows(student.plan.id)

    const editor = await client
      .get(`/admin/ajustes/planes/${student.plan.id}`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    editor.assertInertiaComponent('admin/plans/form')
    assert.equal(editor.inertiaProps.lockedStudents, 1)

    const response = await client
      .put(`/admin/ajustes/planes/${student.plan.id}`)
      .header('host', host)
      .loginAs(admin)
      .json({ name: 'Libre 1 nuevo', price: 45000, quotas: before })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/ajustes/planes')
    await student.plan.refresh()
    assert.equal(student.plan.name, 'Libre 1 nuevo')
    assert.equal(student.plan.price, 45000)
    assert.deepEqual(await quotaRows(student.plan.id), before)

    const slot = await FixedSlot.findOrFail(student.slots[0].id)
    assert.equal(slot.planQuotaId, student.quota.id)
    assert.equal(slot.classScheduleId, schedule.id)
    assert.isNull(slot.endsOn)
  })

  test('blocks changing the quotas while a fixed schedule uses the plan', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const schedule = await createSchedule(catalog)
    const student = await createStudent(catalog, { schedules: [schedule] })
    const before = await quotaRows(student.plan.id)

    const response = await client
      .put(`/admin/ajustes/planes/${student.plan.id}`)
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/planes/${student.plan.id}`)
      .loginAs(admin)
      .json({
        name: 'Otro nombre',
        price: 50000,
        quotas: [{ ...before[0], weeklyCount: 2 }],
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('errors', { quotas: LOCKED_QUOTAS_MESSAGE })
    await student.plan.refresh()
    assert.notEqual(student.plan.name, 'Otro nombre')
    assert.deepEqual(await quotaRows(student.plan.id), before)
  })

  test('allows changing the quotas once the fixed schedules ended', async ({ client, assert }) => {
    const { catalog, admin } = await kinafWorld()
    const schedule = await createSchedule(catalog)
    const student = await createStudent(catalog, {
      schedules: [schedule],
      slot: { endsOn: DateTime.now().minus({ weeks: 2 }) },
    })
    const [quota] = await quotaRows(student.plan.id)

    const response = await client
      .put(`/admin/ajustes/planes/${student.plan.id}`)
      .header('host', host)
      .loginAs(admin)
      .json({
        name: student.plan.name,
        price: student.plan.price,
        quotas: [
          { id: quota.id, weeklyCount: 2, anyActivity: false, activityIds: [catalog.yoga.id] },
          { weeklyCount: 1, anyActivity: true, activityIds: [] },
        ],
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/ajustes/planes')
    const after = await quotaRows(student.plan.id)
    assert.lengthOf(after, 2)
    assert.deepEqual(after[0], {
      id: quota.id,
      weeklyCount: 2,
      anyActivity: false,
      activityIds: [catalog.yoga.id],
    })
    assert.include(after[1], { weeklyCount: 1, anyActivity: true })
  })

  test('keeps a quota that classes already used instead of deleting it', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const schedule = await createSchedule(catalog)
    const student = await createStudent(catalog, {
      schedules: [schedule],
      slot: { endsOn: DateTime.now().minus({ weeks: 2 }) },
    })
    await createBooking(catalog, student, schedule, DateTime.now().minus({ weeks: 3 }))

    const response = await client
      .put(`/admin/ajustes/planes/${student.plan.id}`)
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/planes/${student.plan.id}`)
      .loginAs(admin)
      .json({
        name: student.plan.name,
        price: student.plan.price,
        quotas: [{ weeklyCount: 3, anyActivity: true, activityIds: [] }],
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('errors', {
      quotas:
        'Uno de los cupos que quitaste ya se usó en clases. Dejalo como está o creá un plan nuevo.',
    })
    const after = await quotaRows(student.plan.id)
    assert.deepEqual(
      after.map((row) => row.id),
      [student.quota.id]
    )
  })

  test('a deactivated plan leaves the assignment wizard and can be turned back on', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { plan } = await createPlan(catalog, [{ count: 1 }], 'Para desactivar')
    const student = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()

    const off = await client
      .post(`/admin/ajustes/planes/${plan.id}/desactivar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    off.assertStatus(302)
    await plan.refresh()
    assert.isFalse(plan.active)

    const wizard = await client
      .get(`/admin/clientes/${student.id}/asignar`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    assert.notInclude(
      wizard.inertiaProps.plans.map((item: { id: number }) => item.id),
      plan.id
    )

    await client
      .post(`/admin/ajustes/planes/${plan.id}/activar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    await plan.refresh()
    assert.isTrue(plan.active)
  })

  test('plans of another tenant are not found nor changed', async ({ client, assert }) => {
    const { admin } = await kinafWorld()
    const foreign = await createCatalog(await TenantFactory.create())
    const { plan, quotas } = await createPlan(foreign, [{ count: 1 }], 'Ajeno')

    const show = await client
      .get(`/admin/ajustes/planes/${plan.id}`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    show.assertStatus(404)

    const update = await client
      .put(`/admin/ajustes/planes/${plan.id}`)
      .header('host', host)
      .loginAs(admin)
      .json({
        name: 'Robado',
        price: 1,
        quotas: [{ id: quotas[0].id, weeklyCount: 1, anyActivity: true, activityIds: [] }],
      })
      .withCsrfToken()
      .redirects(0)
    update.assertStatus(404)

    const off = await client
      .post(`/admin/ajustes/planes/${plan.id}/desactivar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    off.assertStatus(404)

    await plan.refresh()
    assert.equal(plan.name, 'Ajeno')
    assert.isTrue(plan.active)

    const list = await client
      .get('/admin/ajustes/planes')
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    assert.notInclude(
      list.inertiaProps.plans.map((item: { id: number }) => item.id),
      plan.id
    )
  })

  test('students cannot open the plans', async ({ client }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const student = await UserFactory.merge({ tenantId: kinaf.id, role: 'client' }).create()

    const response = await client
      .get('/admin/ajustes/planes')
      .header('host', host)
      .loginAs(student)
      .redirects(0)

    response.assertStatus(403)
  })
})
