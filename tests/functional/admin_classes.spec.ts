import { MonthlyFeeFactory, ReceiptFactory } from '#database/factories/fee_factories'
import { UserFactory } from '#database/factories/user_factory'
import Booking from '#models/booking'
import ClassSession from '#models/class_session'
import Closure from '#models/closure'
import PendingClass from '#models/pending_class'
import { businessNow, dayName, isoWeekday } from '#services/business_calendar'
import { expiryFor } from '#services/pending_classes'
import {
  createBooking,
  createCatalog,
  createPendingClass,
  createQuota,
  createSchedule,
  createStudent,
  type Catalog,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const hostOf = (catalog: Catalog) => `${catalog.tenant.slug}.localhost`

/**
 * A fresh tenant (no demo data) with its admin and a Yoga class today at
 * 19:00 with room for 10.
 */
async function world() {
  const catalog = await createCatalog()
  const admin = await UserFactory.apply('admin').merge({ tenantId: catalog.tenant.id }).create()
  const today = businessNow().startOf('day')
  const schedule = await createSchedule(catalog, {
    activity: catalog.yoga,
    center: catalog.ovidio,
    weekday: isoWeekday(today.toISODate()!),
    startTime: '19:00',
    instructorName: 'Mica',
    capacity: 10,
  })
  return { catalog, admin, today, schedule }
}

async function signedUp(w: Awaited<ReturnType<typeof world>>, fullName: string) {
  const student = await createStudent(w.catalog, { schedules: [w.schedule], fullName })
  const booking = await createBooking(w.catalog, student, w.schedule, w.today)
  return { ...student, booking }
}

test.group('Admin · Hoy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test("lists today's classes with taken places and what needs the admin", async ({
    client,
    assert,
  }) => {
    const w = await world()
    const juan = await signedUp(w, 'Juan Ponce')
    await signedUp(w, 'Sofi Ortiz')
    const lu = await signedUp(w, 'Lu Martínez')
    await lu.booking.merge({ status: 'cancelled' }).save()
    const carla = await createStudent(w.catalog, { fullName: 'Carla Vico' })
    const fee = await MonthlyFeeFactory.merge({
      tenantId: w.catalog.tenant.id,
      userId: juan.user.id,
      subscriptionId: juan.subscription.id,
      status: 'in_review',
    }).create()
    await ReceiptFactory.merge({
      tenantId: w.catalog.tenant.id,
      userId: juan.user.id,
      monthlyFeeId: fee.id,
    }).createMany(2)
    // Another tenant's class today and receipt must not show up.
    const other = await createCatalog()
    await createSchedule(other, { weekday: isoWeekday(w.today.toISODate()!) })

    const response = await client
      .get('/admin/hoy')
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/today')
    const { view } = response.inertiaProps as { view: any }
    assert.isFalse(view.closed)
    assert.lengthOf(view.classes, 1)
    assert.containsSubset(view.classes[0], {
      activity: { name: 'Yoga' },
      startTime: '19:00',
      instructorName: 'Mica',
      centerName: 'Ovidio Lagos',
      taken: 2,
      capacity: 10,
      suspended: false,
    })
    assert.deepEqual(
      view.alerts.map((alert: any) => alert.kind),
      ['receipts', 'no_schedule']
    )
    assert.equal(view.alerts[0].count, 2)
    assert.containsSubset(view.alerts[1], {
      fullName: 'Carla Vico',
      href: `/admin/clientes/${carla.user.id}`,
    })
  })

  test('on a day closed for every center it shows no classes', async ({ client }) => {
    const w = await world()
    await signedUp(w, 'Juan Ponce')
    await Closure.create({
      tenantId: w.catalog.tenant.id,
      date: w.today,
      centerId: null,
      reason: 'Feriado',
    })

    const response = await client
      .get('/admin/hoy')
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    response.assertInertiaPropsContains({
      view: { closed: true, closedReason: 'Feriado', classes: [] },
    })
  })
})

test.group('Admin · Clase del día', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows who is signed up and how they booked', async ({ client, assert }) => {
    const w = await world()
    const juan = await signedUp(w, 'Juan Ponce')
    await signedUp(w, 'Ana Gómez')
    const sessionId = juan.booking.classSessionId

    const response = await client
      .get(`/admin/clases/${sessionId}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    response.assertStatus(200)
    const { view } = response.inertiaProps as { view: any }
    assert.deepEqual(
      view.attendees.map((attendee: any) => [attendee.fullName, attendee.status]),
      [
        ['Ana Gómez', 'active'],
        ['Juan Ponce', 'active'],
      ]
    )
    assert.equal(view.card.taken, 2)
    assert.equal(view.expiresLabel, dayName(expiryFor(w.today.toISODate()!)))
  })

  test('marking absent frees the place and gives a pending class of the same quota', async ({
    client,
    assert,
  }) => {
    const w = await world()
    const juan = await signedUp(w, 'Juan Ponce')
    const yogaQuota = await createQuota(w.catalog, juan, [w.catalog.yoga])
    await juan.booking.merge({ planQuotaId: yogaQuota.id }).save()
    const sessionId = juan.booking.classSessionId

    const response = await client
      .post(`/admin/clases/${sessionId}/reservas/${juan.booking.id}/ausente`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/admin/clases/${sessionId}`)
    await juan.booking.refresh()
    assert.equal(juan.booking.status, 'absent')
    const pending = await PendingClass.query()
      .where('originBookingId', juan.booking.id)
      .firstOrFail()
    assert.equal(pending.reason, 'absent')
    assert.equal(pending.status, 'available')
    assert.equal(pending.planQuotaId, yogaQuota.id)
    assert.equal(pending.userId, juan.user.id)
    assert.equal(pending.expiresOn.toISODate(), expiryFor(w.today.toISODate()!))

    const detail = await client
      .get(`/admin/clases/${sessionId}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withSession({ __flash__: { absent: juan.booking.id } })
      .withInertia()
    detail.assertInertiaPropsContains({
      view: {
        card: { taken: 0 },
        justAbsent: {
          bookingId: juan.booking.id,
          fullName: 'Juan Ponce',
          expiresLabel: dayName(expiryFor(w.today.toISODate()!)),
        },
      },
    })
  })

  test('undoing an absence gives the place back and revokes the pending class', async ({
    client,
    assert,
  }) => {
    const w = await world()
    const juan = await signedUp(w, 'Juan Ponce')
    const sessionId = juan.booking.classSessionId
    const url = `/admin/clases/${sessionId}/reservas/${juan.booking.id}`

    await client
      .post(`${url}/ausente`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)
    const undo = await client
      .post(`${url}/deshacer`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)

    undo.assertStatus(302)
    await juan.booking.refresh()
    assert.equal(juan.booking.status, 'active')
    const pendings = await PendingClass.query().where('userId', juan.user.id)
    assert.deepEqual(
      pendings.map((pending) => pending.status),
      ['revoked']
    )
  })

  test('an absence cannot be undone once its pending class was used', async ({
    client,
    assert,
  }) => {
    const w = await world()
    const juan = await signedUp(w, 'Juan Ponce')
    const url = `/admin/clases/${juan.booking.classSessionId}/reservas/${juan.booking.id}`
    await client
      .post(`${url}/ausente`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)
    await PendingClass.query().where('originBookingId', juan.booking.id).update({ status: 'used' })

    const undo = await client
      .post(`${url}/deshacer`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)

    undo.assertFlashMessage('error', 'Ya usó la clase pendiente, así que no se puede deshacer.')
    await juan.booking.refresh()
    assert.equal(juan.booking.status, 'absent')
  })

  test('a booking made with a pending class gets that same pending class back', async ({
    client,
    assert,
  }) => {
    const w = await world()
    const juan = await createStudent(w.catalog, { fullName: 'Juan Ponce' })
    const pending = await createPendingClass(w.catalog, juan, {
      schedule: w.schedule,
      missedOn: w.today.minus({ days: 7 }),
      expiresOn: w.today.plus({ days: 3 }),
    })
    const booking = await createBooking(w.catalog, juan, w.schedule, w.today, {
      source: 'pending',
      pendingClassId: pending.id,
    })
    await pending.merge({ status: 'used', usedBookingId: booking.id }).save()

    await client
      .post(`/admin/clases/${booking.classSessionId}/reservas/${booking.id}/ausente`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)

    await pending.refresh()
    assert.equal(pending.status, 'available')
    assert.isNull(pending.usedBookingId)
    const all = await PendingClass.query().where('userId', juan.user.id)
    assert.lengthOf(all, 1)
  })

  test('suspending the class gives one pending class per active booking', async ({
    client,
    assert,
  }) => {
    const w = await world()
    const people = await Promise.all(
      ['Sofi Ortiz', 'Tomi Sosa', 'Flor Ibáñez'].map((name) => signedUp(w, name))
    )
    const lu = await signedUp(w, 'Lu Martínez')
    await lu.booking.merge({ status: 'cancelled' }).save()
    const sessionId = lu.booking.classSessionId

    const response = await client
      .post(`/admin/clases/${sessionId}/suspender`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    const session = await ClassSession.findOrFail(sessionId)
    assert.equal(session.status, 'suspended')
    const bookings = await Booking.query().where('classSessionId', sessionId).orderBy('id')
    assert.deepEqual(
      bookings.map((booking) => booking.status),
      ['suspended', 'suspended', 'suspended', 'cancelled']
    )
    const pendings = await PendingClass.query()
      .whereIn(
        'userId',
        people.map((person) => person.user.id)
      )
      .where('reason', 'suspended')
      .where('status', 'available')
    assert.lengthOf(pendings, 3)
    assert.sameMembers(
      pendings.map((pending) => pending.planQuotaId),
      people.map((person) => person.quota.id)
    )
    assert.lengthOf(await PendingClass.query().where('userId', lu.user.id), 0)

    const again = await client
      .post(`/admin/clases/${sessionId}/suspender`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)
    again.assertFlashMessage('error', 'Esta clase ya está suspendida.')
    assert.lengthOf(
      await PendingClass.query()
        .where('reason', 'suspended')
        .whereIn(
          'userId',
          people.map((p) => p.user.id)
        ),
      3
    )
  })

  test("another tenant's class is not found", async ({ client, assert }) => {
    const w = await world()
    const juan = await signedUp(w, 'Juan Ponce')
    const other = await world()

    const show = await client
      .get(`/admin/clases/${juan.booking.classSessionId}`)
      .header('host', hostOf(other.catalog))
      .loginAs(other.admin)
    show.assertStatus(404)

    const absent = await client
      .post(`/admin/clases/${juan.booking.classSessionId}/reservas/${juan.booking.id}/ausente`)
      .header('host', hostOf(other.catalog))
      .loginAs(other.admin)
      .withCsrfToken()
      .redirects(0)
    absent.assertStatus(404)
    await juan.booking.refresh()
    assert.equal(juan.booking.status, 'active')
  })

  test('a student cannot reach admin pages or actions', async ({ client, assert }) => {
    const w = await world()
    const juan = await signedUp(w, 'Juan Ponce')
    const sessionId = juan.booking.classSessionId

    for (const url of ['/admin', '/admin/hoy', `/admin/clases/${sessionId}`]) {
      const response = await client
        .get(url)
        .header('host', hostOf(w.catalog))
        .loginAs(juan.user)
        .redirects(0)
      response.assertStatus(403)
    }

    for (const url of [
      `/admin/clases/${sessionId}/reservas/${juan.booking.id}/ausente`,
      `/admin/clases/${sessionId}/suspender`,
    ]) {
      const response = await client
        .post(url)
        .header('host', hostOf(w.catalog))
        .loginAs(juan.user)
        .withCsrfToken()
        .redirects(0)
      response.assertStatus(403)
    }

    await juan.booking.refresh()
    assert.equal(juan.booking.status, 'active')
    const session = await ClassSession.findOrFail(sessionId)
    assert.equal(session.status, 'scheduled')
  })
})
