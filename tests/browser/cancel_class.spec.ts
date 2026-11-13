import Tenant from '#models/tenant'
import type User from '#models/user'
import { businessNow, isoWeekday } from '#services/business_calendar'
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

/**
 * The session cookie must belong to the tenant host, not to HOST:PORT.
 */
async function signIn(browserContext: BrowserContext, user: User) {
  await browserContext.initiateSession({ domain: 'kinaf.localhost' })
  await browserContext.loginAs(user)
}

test.group('No voy a ir', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('cancelling a class leaves a pending class notice in Mis clases', async ({
    browserContext,
    visit,
  }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const date = businessNow().plus({ days: 3 }).startOf('day')
    const schedule = await createSchedule(catalog, {
      weekday: isoWeekday(date.toISODate()!),
      startTime: '18:00',
      instructorName: 'Agus',
    })
    const sofi = await createStudent(catalog, { schedules: [schedule], fullName: 'Sofi Ortiz' })
    const booking = await createBooking(catalog, sofi, schedule, date)
    await signIn(browserContext, sofi.user)

    const page = await visit(`${origin()}/clases/${booking.id}`)
    await page.getByRole('button', { name: 'No voy a ir' }).click()
    const sheet = page.getByRole('dialog')
    await page.assertVisible(sheet)
    await sheet.getByRole('button', { name: 'Sí, no voy' }).click()

    await page.assertVisible(page.getByText(/^Listo, no vas el /))
    await page.assertVisible(page.getByText('No vas esta vez'))
    await page.assertVisible(page.getByRole('button', { name: 'Deshacer' }))

    await page.getByRole('link', { name: 'Volver' }).click()
    await page.waitForURL(/\/clases$/)
    await page.assertVisible(page.getByText('Tenés 1 clase pendiente'))
    await page.assertVisible(page.getByRole('link', { name: 'Elegir clase' }))
  })

  test('with less than 24 h there is no button, only WhatsApp', async ({
    browserContext,
    visit,
  }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const start = businessNow().plus({ hours: 2 })
    const date = start.startOf('day')
    const schedule = await createSchedule(catalog, {
      weekday: isoWeekday(date.toISODate()!),
      startTime: start.toFormat('HH:mm'),
    })
    const sofi = await createStudent(catalog, { schedules: [schedule] })
    const booking = await createBooking(catalog, sofi, schedule, date)
    await signIn(browserContext, sofi.user)

    const page = await visit(`${origin()}/clases/${booking.id}`)

    await page.assertVisible(page.getByText('Faltan menos de 24 h.'))
    await page.assertNotExists('text=No voy a ir')
    await page.assertVisible(page.getByRole('link', { name: 'Escribir a Kinaf' }))
  })
})
