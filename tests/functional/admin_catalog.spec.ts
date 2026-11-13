import { ActivityFactory } from '#database/factories/catalog_factories'
import Activity from '#models/activity'
import Center from '#models/center'
import Tenant from '#models/tenant'
import User from '#models/user'
import { createCatalog, createSchedule } from '#tests/support/scenario'
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

  test('Ajustes links to Actividades and Centros with how many there are', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    await ActivityFactory.merge({ tenantId: catalog.tenant.id }).create()
    const activities = await Activity.query().where('tenantId', catalog.tenant.id)
    const centers = await Center.query().where('tenantId', catalog.tenant.id)

    const response = await client
      .get('/admin/ajustes')
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(200)
    assert.equal(response.inertiaProps.activities, activities.length)
    assert.equal(response.inertiaProps.centers, centers.length)
  })

  test('lists the activities with their color and active classes', async ({ client, assert }) => {
    const { catalog, admin } = await kinafWorld()
    await createSchedule(catalog, { activity: catalog.yoga })
    await createSchedule(catalog, { activity: catalog.yoga, center: catalog.ovidio })
    await createSchedule(catalog, { activity: catalog.yoga, active: false })
    await catalog.pilates.merge({ name: 'Zumba' }).save()

    const response = await client
      .get('/admin/ajustes/actividades')
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/activities/index')
    const listed = response.inertiaProps.activities as Array<{ id: number; hint: string }>
    assert.deepEqual(
      listed.find((item) => item.id === catalog.yoga.id),
      {
        id: catalog.yoga.id,
        name: 'Yoga',
        wash: 'green',
        hint: 'Tarjeta verde · 2 clases por semana',
      }
    )
    assert.deepEqual(listed.at(-1), {
      id: catalog.pilates.id,
      name: 'Zumba',
      wash: 'celeste',
      hint: 'Tarjeta celeste · Sin clases',
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

  test('the activities of another tenant are not found', async ({ client, assert }) => {
    const { admin } = await kinafWorld()
    const other = await createCatalog()
    const request = (method: 'GET' | 'PUT', path: string) =>
      client.request(path, method).header('host', host).loginAs(admin).withCsrfToken().redirects(0)

    const attempts = [
      request('GET', `/admin/ajustes/actividades/${other.yoga.id}`),
      request('PUT', `/admin/ajustes/actividades/${other.yoga.id}`).json({
        name: 'Robada',
        wash: 'blue',
      }),
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
    assert.equal(other.yoga.name, 'Yoga')
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
      .post('/admin/ajustes/centros')
      .header('host', host)
      .loginAs(admin)
      .json({ name: 'Fisherton' })
      .withCsrfToken()
      .redirects(0)
    created.assertStatus(302)
    created.assertHeader('location', '/admin/ajustes/centros')
    created.assertFlashMessage('success', 'Creamos el centro.')
    const center = await Center.query()
      .where('tenantId', catalog.tenant.id)
      .where('slug', 'fisherton')
      .firstOrFail()

    const renamed = await client
      .put(`/admin/ajustes/centros/${center.id}`)
      .header('host', host)
      .loginAs(admin)
      .json({ name: 'Fisherton Norte' })
      .withCsrfToken()
      .redirects(0)
    renamed.assertStatus(302)
    await center.refresh()
    assert.include(center.serialize(), { name: 'Fisherton Norte', slug: 'fisherton' })

    const repeated = await client
      .put(`/admin/ajustes/centros/${center.id}`)
      .header('host', host)
      .header('referer', `http://${host}/admin/ajustes/centros/${center.id}`)
      .loginAs(admin)
      .json({ name: 'mendoza' })
      .withCsrfToken()
      .redirects(0)
    repeated.assertStatus(302)
    repeated.assertFlashMessage('errors', { name: 'Ya hay un centro con ese nombre.' })
    await center.refresh()
    assert.equal(center.name, 'Fisherton Norte')

    const listed = await client
      .get('/admin/ajustes/centros')
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    listed.assertInertiaComponent('admin/centers/index')
    assert.deepInclude(listed.inertiaProps.centers, {
      id: center.id,
      name: 'Fisherton Norte',
      hint: 'Sin clases',
    })
  })

  test('the centers of another tenant are not found', async ({ client, assert }) => {
    const { admin } = await kinafWorld()
    const other = await createCatalog()
    const request = (method: 'GET' | 'PUT', path: string) =>
      client.request(path, method).header('host', host).loginAs(admin).withCsrfToken().redirects(0)

    const attempts = [
      request('GET', `/admin/ajustes/centros/${other.mendoza.id}`),
      request('PUT', `/admin/ajustes/centros/${other.mendoza.id}`).json({ name: 'Robada' }),
    ]
    for (const attempt of attempts) {
      const response = await attempt
      response.assertStatus(404)
    }
    await other.mendoza.refresh()
    assert.equal(other.mendoza.name, 'Mendoza')
  })

  test('activities and centers can no longer be turned off or on', async ({ client }) => {
    const { catalog, admin } = await kinafWorld()

    for (const path of [
      `/admin/ajustes/actividades/${catalog.yoga.id}/desactivar`,
      `/admin/ajustes/actividades/${catalog.yoga.id}/activar`,
      `/admin/ajustes/centros/${catalog.mendoza.id}/desactivar`,
      `/admin/ajustes/centros/${catalog.mendoza.id}/activar`,
    ]) {
      const response = await client
        .post(path)
        .header('host', host)
        .loginAs(admin)
        .withCsrfToken()
        .redirects(0)
      response.assertStatus(404)
    }
  })
})
