import Activity from '#models/activity'
import Center from '#models/center'
import Tenant from '#models/tenant'
import { FixedSlotFactory } from '#database/factories/plan_factories'
import {
  addDays,
  BUSINESS_ZONE,
  businessDate,
  businessNow,
  startOfWeek,
} from '#services/business_calendar'
import env from '#start/env'
import { createSchedule, createStudent, type Catalog } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

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

  test('admin opens the week, sees who comes and the change of schedule next week', async ({
    visit,
  }) => {
    const catalog = await kinaf()
    const monday = startOfWeek(businessDate(businessNow()))
    const nextMonday = addDays(monday, 7)
    const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })
    const yoga = await createSchedule(catalog, {
      activity: catalog.yoga,
      center: catalog.ovidio,
      weekday: 3,
      startTime: '06:30',
      instructorName: 'Mica',
      capacity: 6,
    })
    const pilates = await createSchedule(catalog, {
      activity: catalog.pilates,
      center: catalog.ovidio,
      weekday: 5,
      startTime: '06:45',
      instructorName: 'Mica',
      capacity: 6,
    })
    await createStudent(catalog, {
      schedules: [yoga],
      fullName: 'Rita Pérez',
      slot: { startsOn: day(addDays(monday, -30)), endsOn: null },
    })
    // Tomás leaves Wednesday Yoga this Sunday and starts Friday Pilates next Monday.
    const tomas = await createStudent(catalog, {
      schedules: [yoga],
      fullName: 'Tomás Gil',
      slot: { startsOn: day(addDays(monday, -30)), endsOn: day(addDays(monday, 6)) },
    })
    await FixedSlotFactory.merge({
      tenantId: catalog.tenant.id,
      subscriptionId: tomas.subscription.id,
      userId: tomas.user.id,
      planQuotaId: tomas.quota.id,
      classScheduleId: pilates.id,
      startsOn: day(nextMonday),
      endsOn: null,
    }).create()

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
    await page.assertVisible(page.getByRole('heading', { name: /^Semana del/ }))

    const yogaCard = page.getByRole('link', { name: /06:30.*Yoga/ })
    const pilatesCard = page.getByRole('link', { name: /06:45.*Pilates/ })
    await page.getByRole('link', { name: /^Miércoles/ }).click()
    await page.assertVisible(yogaCard)
    await page.assertTextContains(yogaCard, 'Ovidio Lagos · Mica')
    await page.assertTextContains(yogaCard, 'Rita Pérez')
    await page.assertTextContains(yogaCard, 'Tomás Gil')
    await page.assertTextContains(yogaCard, '2 anotados · 4 lugares libres')
    await page.assertTextContains(pilatesCard, 'Nadie con horario fijo esta semana.')

    await page.getByRole('link', { name: 'Ovidio Lagos', exact: true }).click()
    await page.waitForURL(/centro=ovidio-lagos/)
    await page.getByRole('link', { name: 'Semana siguiente' }).click()
    await page.waitForURL(new RegExp(`semana=${nextMonday}&centro=ovidio-lagos`))
    await page.assertVisible(
      page
        .getByRole('link', { name: 'Ovidio Lagos', exact: true })
        .and(page.locator('[aria-current="page"]'))
    )
    await page.assertTextContains(yogaCard, '1 anotado · 5 lugares libres')
    await page.assertTextContains(pilatesCard, 'Tomás Gil')
    await page.assertTextContains(pilatesCard, '1 anotado · 5 lugares libres')
    await page.assertNotExists(yogaCard.getByText('Tomás Gil'))

    await yogaCard.click()
    await page.waitForURL(new RegExp(`/admin/horarios/${yoga.id}\\?desde=semana`))
    await page.assertTextContains('main', 'Editar horario')
    await page.getByRole('link', { name: 'Volver' }).click()
    await page.waitForURL(`${baseUrl}/admin/agenda/semana?semana=${nextMonday}&centro=ovidio-lagos`)
    await page.assertTextContains(pilatesCard, 'Tomás Gil')
  })
})
