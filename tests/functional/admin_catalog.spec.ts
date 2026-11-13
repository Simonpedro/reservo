import { ActivityFactory } from '#database/factories/catalog_factories'
import Activity from '#models/activity'
import Center from '#models/center'
import ClassSchedule from '#models/class_schedule'
import Tenant from '#models/tenant'
import User from '#models/user'
import { createCatalog, createPlan, createSchedule } from '#tests/support/scenario'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const host = `kinaf.localhost:${env.get('PORT')}`

async function kinafWorld() {
  const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
  const admin = await User.findByOrFail({ tenantId: kinaf.id, email: 'admin@kinaf.test' })
  return { catalog: await createCatalog(kinaf), admin }
}

test.group('Admin › activities', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('Ajustes links to Actividades and Sedes with how many are active', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const activities = await Activity.query()
      .where('tenantId', catalog.tenant.id)
      .where('active', true)
    const centers = await Center.query().where('tenantId', catalog.tenant.id)
    await catalog.gym.merge({ active: false }).save()

    const response = await client
      .get('/admin/ajustes')
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(200)
    assert.equal(response.inertiaProps.activeActivities, activities.length - 1)
    assert.equal(response.inertiaProps.activeCenters, centers.length)
  })

  test('lists the activities with their color and active classes, inactive last', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    await createSchedule(catalog, { activity: catalog.yoga })
    await createSchedule(catalog, { activity: catalog.yoga, center: catalog.ovidio })
    await createSchedule(catalog, { activity: catalog.yoga, active: false })
    await catalog.pilates.merge({ name: 'Zumba', active: false }).save()

    const response = await client
      .get('/admin/ajustes/actividades')
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/activities/index')
    const listed = response.inertiaProps.activities as Array<{ id: number; hint: string }>
    assert.include(
      listed.find((item) => item.id === catalog.yoga.id),
      { name: 'Yoga', wash: 'green', active: true, hint: 'Tarjeta verde · 2 horarios activos' }
    )
    assert.deepEqual(listed.at(-1), {
      id: catalog.pilates.id,
      name: 'Zumba',
      wash: 'celeste',
      active: false,
      hint: 'Tarjeta celeste · Sin horarios activos · Desactivada',
    })
  })

  test('creates an activity with a slug from its name', async ({ client, assert }) => {
    const { catalog, admin } = await kinafWorld()

    const response = await client
      .post('/admin/ajustes/actividades')
      .header('host', host)
      .loginAs(admin)
      .json({ name: '  Kinesiología ', wash: 'blue' })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/ajustes/actividades')
    response.assertFlashMessage('success', 'Creamos la actividad.')
    const activity = await Activity.query()
      .where('tenantId', catalog.tenant.id)
      .where('slug', 'kinesiologia')
      .firstOrFail()
    assert.include(activity.serialize(), {
      name: 'Kinesiología',
      wash: 'blue',
      active: true,
      image: null,
    })
  })

  test('rejects a repeated name, ignoring case and accents, and a missing color', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const before = await Activity.query().where('tenantId', catalog.tenant.id)

    const repeated = await client
      .post('/admin/ajustes/actividades')
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/actividades/nuevo`)
      .loginAs(admin)
      .json({ name: 'YOGÁ', wash: 'green' })
      .withCsrfToken()
      .redirects(0)
    repeated.assertStatus(302)
    repeated.assertHeader('location', `http://${host}/admin/ajustes/actividades/nuevo`)
    repeated.assertFlashMessage('errors', { name: 'Ya hay una actividad con ese nombre.' })

    const invalid = await client
      .post('/admin/ajustes/actividades')
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/actividades/nuevo`)
      .loginAs(admin)
      .withInertia()
      .json({ name: '', wash: 'red' })
      .withCsrfToken()
      .redirects(0)
    invalid.assertStatus(302)
    assert.deepEqual(invalid.flashMessage('inputErrorsBag'), {
      name: ['Poné un nombre para la actividad.'],
      wash: ['Elegí el color de la tarjeta.'],
    })

    const after = await Activity.query().where('tenantId', catalog.tenant.id)
    assert.lengthOf(after, before.length)
  })

  test('renaming keeps the record, so its classes still point at it', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const aerobics = await ActivityFactory.merge({
      tenantId: catalog.tenant.id,
      name: 'Aeróbica',
      slug: 'aerobica',
      wash: 'green',
    }).create()
    const schedule = await createSchedule(catalog, { activity: aerobics })

    const response = await client
      .put(`/admin/ajustes/actividades/${aerobics.id}`)
      .header('host', host)
      .loginAs(admin)
      .json({ name: 'Aeróbica Plus', wash: 'celeste' })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('success', 'Guardamos los cambios de la actividad.')
    await aerobics.refresh()
    assert.include(aerobics.serialize(), {
      name: 'Aeróbica Plus',
      wash: 'celeste',
      slug: 'aerobica',
    })
    await schedule.refresh()
    assert.equal(schedule.activityId, aerobics.id)

    // The old name is free again even though the renamed one keeps its slug.
    const again = await client
      .post('/admin/ajustes/actividades')
      .header('host', host)
      .loginAs(admin)
      .json({ name: 'Aerobica', wash: 'green' })
      .withCsrfToken()
      .redirects(0)
    again.assertStatus(302)
    again.assertHeader('location', '/admin/ajustes/actividades')
    const created = await Activity.query()
      .where('tenantId', catalog.tenant.id)
      .where('name', 'Aerobica')
      .firstOrFail()
    assert.equal(created.slug, 'aerobica-2')
  })

  test('deactivating is refused while classes use it, saying what uses it', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    await createSchedule(catalog, { activity: catalog.yoga })
    await createPlan(catalog, [{ count: 1, activities: [catalog.yoga] }])

    const editor = await client
      .get(`/admin/ajustes/actividades/${catalog.yoga.id}`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    editor.assertInertiaComponent('admin/activities/form')
    assert.equal(
      editor.inertiaProps.inUse,
      'La usan 1 horario activo y 1 plan activo. Desactivalos primero.'
    )

    const response = await client
      .post(`/admin/ajustes/actividades/${catalog.yoga.id}/desactivar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/admin/ajustes/actividades/${catalog.yoga.id}`)
    response.assertFlashMessage(
      'error',
      'La usan 1 horario activo y 1 plan activo. Desactivalos primero.'
    )
    await catalog.yoga.refresh()
    assert.isTrue(catalog.yoga.active)
  })

  test('an unused activity is deactivated and activated again', async ({ client, assert }) => {
    const { catalog, admin } = await kinafWorld()

    const off = await client
      .post(`/admin/ajustes/actividades/${catalog.gym.id}/desactivar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    off.assertStatus(302)
    off.assertHeader('location', '/admin/ajustes/actividades')
    await catalog.gym.refresh()
    assert.isFalse(catalog.gym.active)

    const on = await client
      .post(`/admin/ajustes/actividades/${catalog.gym.id}/activar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    on.assertStatus(302)
    on.assertHeader('location', `/admin/ajustes/actividades/${catalog.gym.id}`)
    on.assertFlashMessage('success', 'Activamos la actividad.')
    await catalog.gym.refresh()
    assert.isTrue(catalog.gym.active)
  })

  test('an inactive activity is not offered for new classes or plans', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    await catalog.gym.merge({ active: false }).save()

    const scheduleForm = await client
      .get('/admin/horarios/nuevo')
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    const offered = scheduleForm.inertiaProps.editor.activities.map((a: { id: number }) => a.id)
    assert.include(offered, catalog.yoga.id)
    assert.notInclude(offered, catalog.gym.id)

    const planForm = await client
      .get('/admin/ajustes/planes/nuevo')
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    const inPlan = planForm.inertiaProps.activities.map((a: { id: number }) => a.id)
    assert.include(inPlan, catalog.yoga.id)
    assert.notInclude(inPlan, catalog.gym.id)

    const created = await client
      .post('/admin/horarios')
      .header('host', host)
      .header('referer', `http://${host}/admin/horarios/nuevo`)
      .loginAs(admin)
      .json({
        activityId: catalog.gym.id,
        centerId: catalog.mendoza.id,
        weekday: 2,
        startTime: '07:00',
        capacity: 8,
        instructorName: 'Caro',
      })
      .withCsrfToken()
      .redirects(0)
    created.assertStatus(302)
    created.assertFlashMessage('error', 'Elegí una actividad y un centro de la lista.')
    const rows = await ClassSchedule.query()
      .where('tenantId', catalog.tenant.id)
      .where('activityId', catalog.gym.id)
    assert.lengthOf(rows, 0)

    const plan = await client
      .post('/admin/ajustes/planes')
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/planes/nuevo`)
      .loginAs(admin)
      .json({
        name: 'Con gimnasio',
        price: 1000,
        quotas: [{ weeklyCount: 1, anyActivity: false, activityIds: [catalog.gym.id] }],
      })
      .withCsrfToken()
      .redirects(0)
    plan.assertStatus(302)
    plan.assertFlashMessage('errors', {
      'quotas.0.activityIds': 'Una de las actividades no existe.',
    })
  })

  test('a class or plan that already has an inactive activity still shows it and saves', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const schedule = await createSchedule(catalog, {
      activity: catalog.gym,
      center: catalog.ovidio,
      active: false,
    })
    const { plan } = await createPlan(catalog, [{ count: 1, activities: [catalog.gym] }])
    await plan.merge({ active: false }).save()
    await catalog.gym.merge({ active: false }).save()
    await catalog.ovidio.merge({ active: false }).save()

    const editor = await client
      .get(`/admin/horarios/${schedule.id}`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    editor.assertStatus(200)
    const ids = (items: Array<{ id: number }>) => items.map((item) => item.id)
    assert.include(ids(editor.inertiaProps.editor.activities), catalog.gym.id)
    assert.include(ids(editor.inertiaProps.editor.centers), catalog.ovidio.id)

    const saved = await client
      .put(`/admin/horarios/${schedule.id}`)
      .header('host', host)
      .loginAs(admin)
      .json({
        activityId: catalog.gym.id,
        centerId: catalog.ovidio.id,
        weekday: schedule.weekday,
        startTime: '19:30',
        capacity: 12,
        instructorName: schedule.instructorName,
      })
      .withCsrfToken()
      .redirects(0)
    saved.assertStatus(302)
    saved.assertFlashMessage('success', 'Guardamos los cambios del horario.')
    await schedule.refresh()
    assert.equal(schedule.startTime, '19:30')

    const planEditor = await client
      .get(`/admin/ajustes/planes/${plan.id}`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    assert.include(ids(planEditor.inertiaProps.activities), catalog.gym.id)

    const planSaved = await client
      .put(`/admin/ajustes/planes/${plan.id}`)
      .header('host', host)
      .loginAs(admin)
      .json({
        name: 'Renombrado',
        price: 2000,
        quotas: [{ weeklyCount: 1, anyActivity: false, activityIds: [catalog.gym.id] }],
      })
      .withCsrfToken()
      .redirects(0)
    planSaved.assertStatus(302)
    planSaved.assertHeader('location', '/admin/ajustes/planes')
  })

  test('the activities of another tenant are not found', async ({ client, assert }) => {
    const { admin } = await kinafWorld()
    const other = await createCatalog()
    const request = (method: 'GET' | 'PUT' | 'POST', path: string) =>
      client.request(path, method).header('host', host).loginAs(admin).withCsrfToken().redirects(0)

    const attempts = [
      request('GET', `/admin/ajustes/actividades/${other.yoga.id}`),
      request('PUT', `/admin/ajustes/actividades/${other.yoga.id}`).json({
        name: 'Robada',
        wash: 'blue',
      }),
      request('POST', `/admin/ajustes/actividades/${other.yoga.id}/desactivar`),
      request('POST', `/admin/ajustes/actividades/${other.yoga.id}/activar`),
    ]
    for (const attempt of attempts) {
      const response = await attempt
      response.assertStatus(404)
    }

    const listed = await client
      .get('/admin/ajustes/actividades')
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    assert.notInclude(
      listed.inertiaProps.activities.map((a: { id: number }) => a.id),
      other.yoga.id
    )
    await other.yoga.refresh()
    assert.include(other.yoga.serialize(), { name: 'Yoga', active: true })
  })

  test('only admins manage activities', async ({ client }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const student = await User.findByOrFail({ tenantId: kinaf.id, email: 'sofi@kinaf.test' })

    const response = await client
      .get('/admin/ajustes/actividades')
      .header('host', host)
      .loginAs(student)
      .redirects(0)
    response.assertStatus(403)
  })
})

test.group('Admin › centers', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('creates, renames and rejects a repeated center name', async ({ client, assert }) => {
    const { catalog, admin } = await kinafWorld()

    const created = await client
      .post('/admin/ajustes/sedes')
      .header('host', host)
      .loginAs(admin)
      .json({ name: 'Fisherton' })
      .withCsrfToken()
      .redirects(0)
    created.assertStatus(302)
    created.assertHeader('location', '/admin/ajustes/sedes')
    created.assertFlashMessage('success', 'Creamos la sede.')
    const center = await Center.query()
      .where('tenantId', catalog.tenant.id)
      .where('slug', 'fisherton')
      .firstOrFail()
    assert.isTrue(center.active)

    const renamed = await client
      .put(`/admin/ajustes/sedes/${center.id}`)
      .header('host', host)
      .loginAs(admin)
      .json({ name: 'Fisherton Norte' })
      .withCsrfToken()
      .redirects(0)
    renamed.assertStatus(302)
    await center.refresh()
    assert.include(center.serialize(), { name: 'Fisherton Norte', slug: 'fisherton' })

    const repeated = await client
      .put(`/admin/ajustes/sedes/${center.id}`)
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/sedes/${center.id}`)
      .loginAs(admin)
      .json({ name: 'mendoza' })
      .withCsrfToken()
      .redirects(0)
    repeated.assertStatus(302)
    repeated.assertFlashMessage('errors', { name: 'Ya hay una sede con ese nombre.' })
    await center.refresh()
    assert.equal(center.name, 'Fisherton Norte')

    const listed = await client
      .get('/admin/ajustes/sedes')
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    listed.assertInertiaComponent('admin/centers/index')
    assert.deepInclude(listed.inertiaProps.centers, {
      id: center.id,
      name: 'Fisherton Norte',
      active: true,
      hint: 'Sin horarios activos',
    })
  })

  test('a center with active classes stays on; an unused one goes off and back', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    await createSchedule(catalog, { center: catalog.mendoza })
    await createSchedule(catalog, { center: catalog.mendoza, weekday: 4 })

    const editor = await client
      .get(`/admin/ajustes/sedes/${catalog.mendoza.id}`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    editor.assertInertiaComponent('admin/centers/form')
    assert.equal(editor.inertiaProps.inUse, 'La usan 2 horarios activos. Desactivalos primero.')

    const refused = await client
      .post(`/admin/ajustes/sedes/${catalog.mendoza.id}/desactivar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    refused.assertFlashMessage('error', 'La usan 2 horarios activos. Desactivalos primero.')
    await catalog.mendoza.refresh()
    assert.isTrue(catalog.mendoza.active)

    const off = await client
      .post(`/admin/ajustes/sedes/${catalog.ovidio.id}/desactivar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    off.assertHeader('location', '/admin/ajustes/sedes')
    await catalog.ovidio.refresh()
    assert.isFalse(catalog.ovidio.active)

    const scheduleForm = await client
      .get('/admin/horarios/nuevo')
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    const offered = scheduleForm.inertiaProps.editor.centers.map((c: { id: number }) => c.id)
    assert.include(offered, catalog.mendoza.id)
    assert.notInclude(offered, catalog.ovidio.id)

    const on = await client
      .post(`/admin/ajustes/sedes/${catalog.ovidio.id}/activar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    on.assertFlashMessage('success', 'Activamos la sede.')
    await catalog.ovidio.refresh()
    assert.isTrue(catalog.ovidio.active)
  })

  test('the centers of another tenant are not found', async ({ client, assert }) => {
    const { admin } = await kinafWorld()
    const other = await createCatalog()
    const request = (method: 'GET' | 'PUT' | 'POST', path: string) =>
      client.request(path, method).header('host', host).loginAs(admin).withCsrfToken().redirects(0)

    const attempts = [
      request('GET', `/admin/ajustes/sedes/${other.mendoza.id}`),
      request('PUT', `/admin/ajustes/sedes/${other.mendoza.id}`).json({ name: 'Robada' }),
      request('POST', `/admin/ajustes/sedes/${other.mendoza.id}/desactivar`),
    ]
    for (const attempt of attempts) {
      const response = await attempt
      response.assertStatus(404)
    }
    await other.mendoza.refresh()
    assert.include(other.mendoza.serialize(), { name: 'Mendoza', active: true })
  })
})
