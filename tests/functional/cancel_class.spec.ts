import { PendingClassFactory } from '#database/factories/booking_factories'
import Booking from '#models/booking'
import PendingClass from '#models/pending_class'
import Tenant from '#models/tenant'
import { businessNow, dayName, isoWeekday } from '#services/business_calendar'
import { expiryFor } from '#services/pending_classes'
import {
  createBooking,
  createCatalog,
  createSchedule,
  createStudent,
  type Catalog,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import type { DateTime } from 'luxon'

const kinafHost = 'kinaf.localhost:3333'

async function kinafCatalog() {
  return createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
}

/**
 * A student with a fixed class at `start` (business time) and its booking.
 */
async function studentWithClassAt(catalog: Catalog, start: DateTime, fullName = 'Sofi Ortiz') {
  const date = start.startOf('day')
  const schedule = await createSchedule(catalog, {
    weekday: isoWeekday(date.toISODate()!),
    startTime: start.toFormat('HH:mm'),
    instructorName: 'Agus',
  })
  const student = await createStudent(catalog, { schedules: [schedule], fullName })
  const booking = await createBooking(catalog, student, schedule, date)
  return { ...student, schedule, booking }
}

/**
 * Three days ahead: always cancellable, always within Mis clases.
 */
const inThreeDays = () => businessNow().plus({ days: 3 }).set({ hour: 18, minute: 0 })

async function activeIn(classSessionId: number) {
  const rows = await Booking.query()
    .where('classSessionId', classSessionId)
    .where('status', 'active')
  return rows.length
}

test.group('Class detail states', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('with 24 h or more it offers "No voy a ir"', async ({ client }) => {
    const catalog = await kinafCatalog()
    const start = inThreeDays()
    const sofi = await studentWithClassAt(catalog, start)
    const date = start.toISODate()!

    const response = await client
      .get(`/clases/${sofi.booking.id}`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({
      detail: {
        state: 'cancellable',
        dayName: dayName(date),
        expiresLabel: dayName(expiryFor(date)),
      },
      justCancelled: false,
    })
  })

  test('with less than 24 h it only offers WhatsApp', async ({ client }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassAt(catalog, businessNow().plus({ hours: 3 }))

    const response = await client
      .get(`/clases/${sofi.booking.id}`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertInertiaPropsContains({ detail: { state: 'too_late' } })
  })
})

test.group('No voy a ir', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('cancels the date, frees the place and gives a pending class', async ({
    client,
    assert,
  }) => {
    const catalog = await kinafCatalog()
    const start = inThreeDays()
    const sofi = await studentWithClassAt(catalog, start)

    const response = await client
      .post(`/clases/${sofi.booking.id}/cancelar`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/clases/${sofi.booking.id}`)
    await sofi.booking.refresh()
    assert.equal(sofi.booking.status, 'cancelled')
    assert.equal(await activeIn(sofi.booking.classSessionId), 0)
    const pending = await PendingClass.query()
      .where('originBookingId', sofi.booking.id)
      .firstOrFail()
    assert.equal(pending.status, 'available')
    assert.equal(pending.planQuotaId, sofi.quota.id)
    assert.equal(pending.expiresOn.toISODate(), expiryFor(start.toISODate()!))
  })

  test('then the detail shows it was just cancelled, with Deshacer', async ({ client }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassAt(catalog, inThreeDays())

    const response = await client
      .post(`/clases/${sofi.booking.id}/cancelar`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('client/class_detail')
    response.assertInertiaPropsContains({
      detail: { state: 'cancelled', gavePending: true, pending: { count: 1 } },
      justCancelled: true,
    })
  })

  test('Mis clases hides the class and shows the pending notice', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const start = inThreeDays()
    const sofi = await studentWithClassAt(catalog, start)
    await client
      .post(`/clases/${sofi.booking.id}/cancelar`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .redirects(0)

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    const { view } = response.inertiaProps
    assert.deepEqual(view.pending, {
      count: 1,
      expiresOn: expiryFor(start.toISODate()!),
      expiresLabel: dayName(expiryFor(start.toISODate()!)),
      activities: null,
    })
    assert.lengthOf(
      view.weeks.flatMap((week: { classes: unknown[] }) => week.classes),
      0
    )
  })

  test('with less than 24 h the server refuses it even if forced', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassAt(catalog, businessNow().plus({ hours: 23, minutes: 59 }))

    const response = await client
      .post(`/clases/${sofi.booking.id}/cancelar`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ detail: { state: 'too_late' } })
    assert.match(response.body().flash.error, /menos de 24 h/)
    await sofi.booking.refresh()
    assert.equal(sofi.booking.status, 'active')
    assert.equal(await activeIn(sofi.booking.classSessionId), 1)
    assert.lengthOf(await PendingClass.query().where('originBookingId', sofi.booking.id), 0)
  })

  test("another student's booking is not found", async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassAt(catalog, inThreeDays())
    const juan = await studentWithClassAt(catalog, inThreeDays(), 'Juan Ponce')

    const cancel = await client
      .post(`/clases/${juan.booking.id}/cancelar`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .withInertia()
    const undo = await client
      .post(`/clases/${juan.booking.id}/deshacer`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .withInertia()

    cancel.assertStatus(404)
    undo.assertStatus(404)
    await juan.booking.refresh()
    assert.equal(juan.booking.status, 'active')
  })

  test('a booking of another tenant is not found', async ({ client, assert }) => {
    const kinaf = await kinafCatalog()
    const other = await createCatalog()
    const sofi = await studentWithClassAt(kinaf, inThreeDays())
    const outsider = await studentWithClassAt(other, inThreeDays(), 'Ana Gómez')

    const response = await client
      .post(`/clases/${outsider.booking.id}/cancelar`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(404)
    await outsider.booking.refresh()
    assert.equal(outsider.booking.status, 'active')
  })
})

test.group('Deshacer', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('undoing brings the class back and removes the pending class', async ({
    client,
    assert,
  }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassAt(catalog, inThreeDays())
    await client
      .post(`/clases/${sofi.booking.id}/cancelar`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .redirects(0)

    const response = await client
      .post(`/clases/${sofi.booking.id}/deshacer`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .withInertia()

    response.assertInertiaPropsContains({ detail: { state: 'cancellable', pending: null } })
    await sofi.booking.refresh()
    assert.equal(sofi.booking.status, 'active')
    const pending = await PendingClass.query()
      .where('originBookingId', sofi.booking.id)
      .firstOrFail()
    assert.equal(pending.status, 'revoked')
  })

  test('cannot undo once the pending class was used', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassAt(catalog, inThreeDays())
    await client
      .post(`/clases/${sofi.booking.id}/cancelar`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .redirects(0)
    await PendingClass.query().where('originBookingId', sofi.booking.id).update({ status: 'used' })

    await client
      .post(`/clases/${sofi.booking.id}/deshacer`)
      .header('host', kinafHost)
      .withCsrfToken()
      .loginAs(sofi.user)
      .redirects(0)

    await sofi.booking.refresh()
    assert.equal(sofi.booking.status, 'cancelled')
  })
})

test.group('Suspended class detail', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows it as suspended, without "No voy a ir"', async ({ client }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassAt(catalog, inThreeDays())
    await sofi.booking.merge({ status: 'suspended' }).save()
    await PendingClassFactory.merge({
      tenantId: catalog.tenant.id,
      userId: sofi.user.id,
      planQuotaId: sofi.quota.id,
      originBookingId: sofi.booking.id,
      reason: 'suspended',
      expiresOn: businessNow().plus({ days: 10 }),
    }).create()

    const response = await client
      .get(`/clases/${sofi.booking.id}`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertInertiaPropsContains({
      detail: { state: 'suspended', gavePending: true, card: { suspended: true } },
    })
  })
})
