import Tenant from '#models/tenant'
import type User from '#models/user'
import {
  addDays,
  businessDate,
  businessNow,
  dayName,
  isoWeekday,
} from '#services/business_calendar'
import env from '#start/env'
import {
  createBooking,
  createCatalog,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import type { BrowserContext } from 'playwright'
import { test } from '@japa/runner'

const origin = () => `http://kinaf.localhost:${env.get('PORT')}`

async function signIn(browserContext: BrowserContext, user: User) {
  await browserContext.initiateSession({ domain: 'kinaf.localhost' })
  await browserContext.loginAs(user)
}

test.group('Usar clase pendiente', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('cancel a class, choose another one and use the pending class there', async ({
    browserContext,
    visit,
  }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const today = businessDate(businessNow())
    const pilatesDay = addDays(today, 3)
    const yogaDay = addDays(today, 4)
    const pilates = await createSchedule(catalog, {
      weekday: isoWeekday(pilatesDay),
      startTime: '18:00',
      instructorName: 'Agus',
    })
    await createSchedule(catalog, {
      weekday: isoWeekday(yogaDay),
      startTime: '19:00',
      instructorName: 'Mica Prueba',
      activity: catalog.yoga,
      center: catalog.ovidio,
    })
    const sofi = await createStudent(catalog, { schedules: [pilates], fullName: 'Sofi Ortiz' })
    const booking = await createBooking(
      catalog,
      sofi,
      pilates,
      businessNow().plus({ days: 3 }).startOf('day')
    )
    await signIn(browserContext, sofi.user)

    const page = await visit(`${origin()}/clases/${booking.id}`)
    await page.getByRole('button', { name: 'No voy a ir' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, no voy' }).click()
    await page.assertVisible(page.getByText(/^Listo, no vas el /))

    await page.getByRole('link', { name: 'Elegir clase' }).click()
    await page.waitForURL(/\/elegir-clase/)
    await page.assertVisible(page.getByRole('heading', { name: 'Elegir clase' }))
    await page.assertVisible(page.getByText(/^Tenés 1 clase pendiente\./))

    await page.getByRole('button', { name: dayName(yogaDay) }).click()
    await page.assertVisible(page.getByRole('heading', { name: `Clases del ${dayName(yogaDay)}` }))
    await page.getByRole('link', { name: /Mica Prueba/ }).click()

    await page.waitForURL(/\/elegir-clase\/\d+$/)
    await page.assertVisible(page.getByRole('heading', { name: 'Yoga' }))
    await page.getByRole('button', { name: 'Usar clase pendiente' }).click()

    await page.waitForURL(/\/clases\/\d+$/)
    await page.assertVisible(page.getByText('Listo, ya tenés tu lugar.'))
    await page.assertVisible(page.getByText('Con tu clase pendiente'))

    await page.getByRole('link', { name: 'Volver' }).click()
    await page.waitForURL(/\/clases$/)
    await page.assertVisible(page.getByRole('link', { name: /Mica Prueba/ }))
    await page.assertNotExists('text=Tenés 1 clase pendiente')
  })
})
