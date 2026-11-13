import Activity from '#models/activity'
import Center from '#models/center'
import Closure from '#models/closure'
import PendingClass from '#models/pending_class'
import Tenant from '#models/tenant'
import {
  addDays,
  businessNow,
  dayName,
  isoWeekday,
  longDayLabel,
} from '#services/business_calendar'
import env from '#start/env'
import { createBooking, createSchedule, createStudent, type Catalog } from '#tests/support/scenario'
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

/**
 * A day of the agenda's second week that is not closed yet.
 */
async function openDay(tenantId: number) {
  const today = businessNow().toISODate()!
  for (let offset = 7; offset < 14; offset++) {
    const date = addDays(today, offset)
    const closed = await Closure.query().where('tenantId', tenantId).where('date', date).first()
    if (!closed) return date
  }
  throw new Error('No open day in the agenda')
}

test.group('Admin · Agenda', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin closes a holiday from the agenda', async ({ visit, assert }) => {
    const catalog = await kinaf()
    const date = await openDay(catalog.tenant.id)
    const schedule = await createSchedule(catalog, {
      weekday: isoWeekday(date),
      startTime: '23:15',
      instructorName: 'Agus Browser',
      capacity: 10,
    })
    const ana = await createStudent(catalog, { schedules: [schedule], fullName: 'Ana Browser' })
    const booking = await createBooking(catalog, ana, schedule, DateTime.fromISO(date))

    const page = await visit(`${baseUrl}/login`)
    await page.getByLabel('Email').fill('admin@kinaf.test')
    await page.getByLabel('Contraseña').fill('KinafDev2026!')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await page.waitForURL(`${baseUrl}/admin/hoy`)

    await page.getByRole('link', { name: 'Agenda' }).click()
    await page.waitForURL(`${baseUrl}/admin/agenda`)
    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Agenda' }))
    await page.getByRole('navigation', { name: 'Días' }).getByLabel(longDayLabel(date)).click()
    await page.waitForURL(`${baseUrl}/admin/agenda?fecha=${date}`)
    await page.assertVisible(page.getByRole('heading', { level: 2, name: longDayLabel(date) }))
    const card = page.getByRole('link', { name: /Agus Browser/ })
    await page.assertVisible(card.getByText('1 anotado · 9 lugares libres'))

    await page.getByRole('link', { name: `Cerrar el ${dayName(date)} (feriado o cierre)` }).click()
    await page.waitForURL(`${baseUrl}/admin/agenda/cerrar?fecha=${date}`)
    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Cerrar un día' }))
    await page.assertVisible(page.getByLabel('Motivo'))
    assert.equal(await page.getByLabel('Motivo').inputValue(), 'Feriado')
    await page.assertChecked(page.getByRole('radio', { name: 'Los dos centros' }))
    await page.assertVisible(page.getByText(/^Se suspende/))
    await page.getByRole('button', { name: `Cerrar el ${dayName(date)}` }).click()

    await page.waitForURL(`${baseUrl}/admin/agenda?fecha=${date}`)
    await page.assertVisible(page.getByText('Cerrado por feriado.'))
    await page.assertVisible(
      page.getByRole('link', { name: /Agus Browser/ }).getByText('Suspendida · Feriado')
    )
    await page.assertNotExists(
      page.getByRole('link', { name: `Cerrar el ${dayName(date)} (feriado o cierre)` })
    )

    const closure = await Closure.query()
      .where('tenantId', catalog.tenant.id)
      .where('date', date)
      .firstOrFail()
    assert.isNull(closure.centerId)
    assert.equal(closure.reason, 'Feriado')
    await booking.refresh()
    assert.equal(booking.status, 'suspended')
    const pending = await PendingClass.query().where('originBookingId', booking.id).firstOrFail()
    assert.equal(pending.reason, 'suspended')
  })
})
