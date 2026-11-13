import PendingClass from '#models/pending_class'
import Tenant from '#models/tenant'
import { businessNow, isoWeekday } from '#services/business_calendar'
import env from '#start/env'
import {
  createBooking,
  createCatalog,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const baseUrl = `http://kinaf.localhost:${env.get('PORT')}`

test.group('Admin · Hoy y Clase del día', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin signs in, opens a class of today and marks someone absent', async ({
    visit,
    assert,
  }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const today = businessNow().startOf('day')
    const schedule = await createSchedule(catalog, {
      activity: catalog.yoga,
      center: catalog.ovidio,
      weekday: isoWeekday(today.toISODate()!),
      startTime: '23:45',
      instructorName: 'Mica Browser',
      capacity: 10,
    })
    const juan = await createStudent(catalog, { schedules: [schedule], fullName: 'Juan Ponce' })
    const booking = await createBooking(catalog, juan, schedule, today)
    const sofi = await createStudent(catalog, { schedules: [schedule], fullName: 'Sofi Ortiz' })
    await createBooking(catalog, sofi, schedule, today)

    const page = await visit(`${baseUrl}/login`)
    await page.getByLabel('Email').fill('admin@kinaf.test')
    await page.getByLabel('Contraseña').fill('KinafDev2026!')
    await page.getByRole('button', { name: 'Ingresar' }).click()

    await page.waitForURL(`${baseUrl}/admin/hoy`)
    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Hoy' }))
    const card = page.getByRole('link', { name: /Mica Browser/ })
    await page.assertVisible(card.getByText('2 anotados · 8 lugares libres'))
    await card.click()

    await page.waitForURL(/\/admin\/clases\/\d+$/)
    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Yoga' }))
    await page.getByRole('button', { name: 'Juan Ponce, marcar ausente' }).click()
    const sheet = page.getByRole('dialog')
    await page.assertVisible(sheet.getByText('¿Marcamos ausente a Juan Ponce?'))
    await sheet.getByRole('button', { name: 'Marcar ausente' }).click()

    await page.assertVisible(page.getByText('Marcamos ausente a Juan Ponce.'))
    await page.assertVisible(page.getByText('Ausente · tiene clase pendiente'))
    await page.assertVisible(page.getByText('1 anotado · 9 lugares libres'))
    await page.assertVisible(page.getByRole('button', { name: 'Deshacer' }))

    await booking.refresh()
    assert.equal(booking.status, 'absent')
    const pending = await PendingClass.query().where('originBookingId', booking.id).firstOrFail()
    assert.equal(pending.reason, 'absent')
  })
})
