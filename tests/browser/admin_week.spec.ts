import Activity from '#models/activity'
import Center from '#models/center'
import Tenant from '#models/tenant'
import env from '#start/env'
import { createSchedule, createStudent, type Catalog } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const baseUrl = `http://kinaf.localhost:${env.get('PORT')}`

/**
 * Kinaf as seeded: its two centers and three activities.
 */
async function kinaf(): Promise<Catalog> {
  const tenant = await Tenant.findByOrFail('slug', 'kinaf')
  const center = (slug: string) =>
    Center.query().where('tenantId', tenant.id).where('slug', slug).firstOrFail()
  const activity = (slug: string) =>
    Activity.query().where('tenantId', tenant.id).where('slug', slug).firstOrFail()
  return {
    tenant,
    mendoza: await center('mendoza'),
    ovidio: await center('ovidio-lagos'),
    pilates: await activity('pilates'),
    yoga: await activity('yoga'),
    gym: await activity('gimnasio'),
  }
}

test.group('Admin · Agenda › Semana', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin switches the agenda to the week, sees the names and opens a class', async ({
    visit,
  }) => {
    const catalog = await kinaf()
    const schedule = await createSchedule(catalog, {
      activity: catalog.yoga,
      center: catalog.ovidio,
      weekday: 3,
      startTime: '06:30',
      instructorName: 'Mica',
      capacity: 6,
    })
    await createStudent(catalog, { schedules: [schedule], fullName: 'Rita Pérez' })
    await createStudent(catalog, { schedules: [schedule], fullName: 'Tomás Gil' })

    const page = await visit(`${baseUrl}/login`)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByLabel('Email').fill('admin@kinaf.test')
    await page.getByLabel('Contraseña').fill('KinafDev2026!')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await page.waitForURL(`${baseUrl}/admin/hoy`)

    await page.getByRole('link', { name: 'Agenda' }).click()
    await page.waitForURL(`${baseUrl}/admin/agenda`)
    await page.getByRole('link', { name: 'Semana' }).click()
    await page.waitForURL(`${baseUrl}/admin/agenda/semana`)
    await page.assertVisible(page.getByRole('link', { name: 'Semana', exact: true }))

    await page.getByRole('link', { name: /^Miércoles/ }).click()
    const card = page.getByRole('link', { name: /06:30.*Yoga.*Rita Pérez.*Tomás Gil/ })
    await page.assertVisible(card)
    await page.assertTextContains(card, 'Ovidio Lagos · Mica')
    await page.assertTextContains(card, '2 anotados · 4 lugares libres')

    await page.getByRole('link', { name: 'Ovidio Lagos', exact: true }).click()
    await page.waitForURL(/centro=ovidio-lagos/)
    await page.assertVisible(card)

    await card.click()
    await page.waitForURL(`${baseUrl}/admin/horarios/${schedule.id}?desde=semana`)
    await page.assertTextContains('main', 'Editar horario')
    await page.getByRole('link', { name: 'Volver' }).click()
    await page.waitForURL(`${baseUrl}/admin/agenda/semana`)
  })
})
