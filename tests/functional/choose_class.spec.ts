import Booking from '#models/booking'
import Tenant from '#models/tenant'
import { addDays, businessDate, businessNow, isoWeekday } from '#services/business_calendar'
import { findOrCreateSession } from '#services/class_sessions'
import {
  createCatalog,
  createPendingClass,
  createQuota,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const kinafHost = 'kinaf.localhost:3333'

/**
 * Sofi missed a Yoga class three days ago; her pending class lasts until
 * the Sunday of next week. There is Pilates and Yoga in two days.
 */
async function world({ quota = 'any' as 'any' | 'yoga' } = {}) {
  const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
  const inTwoDays = addDays(businessDate(businessNow()), 2)
  const weekday = isoWeekday(inTwoDays)
  const pilates = await createSchedule(catalog, { weekday, startTime: '18:00', capacity: 2 })
  const yoga = await createSchedule(catalog, {
    weekday,
    startTime: '19:00',
    activity: catalog.yoga,
    center: catalog.ovidio,
  })
  const sofi = await createStudent(catalog, { schedules: [yoga], fullName: 'Sofi Ortiz' })
  const missedOn = businessNow().minus({ days: 3 }).startOf('day')
  const pending = await createPendingClass(catalog, sofi, {
    schedule: yoga,
    missedOn,
    expiresOn: businessNow().plus({ days: 9 }).startOf('day'),
    quota: quota === 'yoga' ? await createQuota(catalog, sofi, [catalog.yoga]) : undefined,
  })
  const [pilatesSession, yogaSession] = await Promise.all([
    findOrCreateSession(pilates, inTwoDays),
    findOrCreateSession(yoga, inTwoDays),
  ])
  return { catalog, pilates, yoga, sofi, pending, pilatesSession, yogaSession, inTwoDays }
}

test.group('Elegir clase', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists the classes the pending class fits, with their places', async ({
    client,
    assert,
  }) => {
    const w = await world()

    const response = await client
      .get(`/elegir-clase?dia=${w.inTwoDays}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('client/choose_class')
    const view = response.inertiaProps.view as any
    assert.equal(view.state, 'ready')
    assert.equal(view.selected, w.inTwoDays)
    assert.equal(view.pending.id, w.pending.id)
    assert.equal(view.pending.count, 1)
    assert.isNull(view.pending.activities)
    // Kinaf's seeded classes are there too: look only at this world's.
    const ours = [w.pilatesSession.id, w.yogaSession.id]
    const day = view.classes.filter((card: any) => ours.includes(card.sessionId))
    assert.deepEqual(
      day.map((card: any) => [card.activity.name, card.date, card.startTime, card.freeSpots]),
      [
        ['Pilates', w.inTwoDays, '18:00', 2],
        ['Yoga', w.inTwoDays, '19:00', 10],
      ]
    )
  })

  test('without pending classes there is nothing to choose', async ({ client }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const sofi = await createStudent(catalog)

    const response = await client
      .get('/elegir-clase')
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertInertiaPropsContains({ view: { state: 'none' } })
  })

  test('the detail offers "Usar clase pendiente" with the pending to use', async ({ client }) => {
    const w = await world()

    const response = await client
      .get(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('client/session_detail')
    response.assertInertiaPropsContains({
      detail: { pendingId: w.pending.id, card: { sessionId: w.pilatesSession.id, freeSpots: 2 } },
    })
  })

  test('the detail of a class outside the quota is not found', async ({ client }) => {
    const w = await world({ quota: 'yoga' })

    const response = await client
      .get(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withInertia()

    response.assertStatus(404)
  })
})

test.group('Usar clase pendiente', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('books the class and opens it as just booked', async ({ client, assert }) => {
    const w = await world()

    const response = await client
      .post(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withCsrfToken()
      .json({ pendingId: w.pending.id })
      .redirects(0)

    const booking = await Booking.query()
      .where('userId', w.sofi.user.id)
      .where('classSessionId', w.pilatesSession.id)
      .firstOrFail()
    response.assertStatus(302)
    response.assertHeader('location', `/clases/${booking.id}`)
    response.assertFlashMessage('booked', booking.id)
    assert.equal(booking.source, 'pending')
    await w.pending.refresh()
    assert.equal(w.pending.status, 'used')
    assert.equal(w.pending.usedBookingId, booking.id)
  })

  test('the booked class shows "Listo, ya tenés tu lugar"', async ({ client }) => {
    const w = await world()

    const response = await client
      .post(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withCsrfToken()
      .json({ pendingId: w.pending.id })
      .withInertia()

    response.assertInertiaComponent('client/class_detail')
    response.assertInertiaPropsContains({
      justBooked: true,
      detail: { state: 'cancellable', card: { source: 'pending' } },
    })
  })

  test('an activity outside the quota is refused', async ({ client, assert }) => {
    const w = await world({ quota: 'yoga' })

    const response = await client
      .post(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withCsrfToken()
      .json({ pendingId: w.pending.id })
      .redirects(0)

    response.assertHeader('location', '/elegir-clase')
    response.assertFlashMessage('error', 'Tu clase pendiente no vale para esta actividad.')
    assert.lengthOf(await Booking.query().where('classSessionId', w.pilatesSession.id), 0)
    await w.pending.refresh()
    assert.equal(w.pending.status, 'available')
  })

  test('a full class is refused and shown as full', async ({ client, assert }) => {
    const w = await world()
    for (const name of ['Juan Ponce', 'Ana Gómez']) {
      const other = await createStudent(w.catalog, { fullName: name })
      await Booking.create({
        tenantId: w.catalog.tenant.id,
        userId: other.user.id,
        classSessionId: w.pilatesSession.id,
        planQuotaId: other.quota.id,
        source: 'fixed',
        status: 'active',
      })
    }

    const response = await client
      .post(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withCsrfToken()
      .json({ pendingId: w.pending.id })
      .withInertia()

    response.assertInertiaComponent('client/session_detail')
    response.assertInertiaPropsContains({ detail: { card: { freeSpots: 0 } } })
    const active = await Booking.query()
      .where('classSessionId', w.pilatesSession.id)
      .where('status', 'active')
    assert.lengthOf(active, 2)
    await w.pending.refresh()
    assert.equal(w.pending.status, 'available')
  })

  test('the same class cannot be booked twice', async ({ client, assert }) => {
    const w = await world()
    const second = await createPendingClass(w.catalog, w.sofi, {
      schedule: w.yoga,
      missedOn: businessNow().minus({ days: 2 }).startOf('day'),
      expiresOn: businessNow().plus({ days: 9 }).startOf('day'),
    })
    const use = (pendingId: number) =>
      client
        .post(`/elegir-clase/${w.pilatesSession.id}`)
        .header('host', kinafHost)
        .loginAs(w.sofi.user)
        .withCsrfToken()
        .json({ pendingId })
        .redirects(0)

    await use(w.pending.id)
    const response = await use(second.id)

    response.assertFlashMessage('error', 'Ya tenés lugar en esta clase.')
    const mine = await Booking.query()
      .where('userId', w.sofi.user.id)
      .where('classSessionId', w.pilatesSession.id)
    assert.lengthOf(mine, 1)
    await second.refresh()
    assert.equal(second.status, 'available')
  })

  test('an expired pending class is refused', async ({ client, assert }) => {
    const w = await world()
    await w.pending.merge({ expiresOn: businessNow().minus({ days: 1 }).startOf('day') }).save()

    const response = await client
      .post(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withCsrfToken()
      .json({ pendingId: w.pending.id })
      .redirects(0)

    response.assertFlashMessage('error', 'Esa clase pendiente ya no está disponible.')
    assert.lengthOf(await Booking.query().where('classSessionId', w.pilatesSession.id), 0)
  })

  test("another student's pending class cannot be used", async ({ client, assert }) => {
    const w = await world()
    const juan = await createStudent(w.catalog, { fullName: 'Juan Ponce' })

    const response = await client
      .post(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(juan.user)
      .withCsrfToken()
      .json({ pendingId: w.pending.id })
      .redirects(0)

    response.assertFlashMessage('error', 'Esa clase pendiente ya no está disponible.')
    assert.lengthOf(await Booking.query().where('classSessionId', w.pilatesSession.id), 0)
    await w.pending.refresh()
    assert.equal(w.pending.status, 'available')
  })

  test('"Deshacer" right after booking gives the pending class back', async ({
    client,
    assert,
  }) => {
    const w = await world()
    await client
      .post(`/elegir-clase/${w.pilatesSession.id}`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withCsrfToken()
      .json({ pendingId: w.pending.id })
      .redirects(0)
    await w.pending.refresh()

    const response = await client
      .post(`/clases/${w.pending.usedBookingId}/cancelar`)
      .header('host', kinafHost)
      .loginAs(w.sofi.user)
      .withCsrfToken()
      .json({ volver: 'elegir' })
      .redirects(0)

    response.assertHeader('location', '/elegir-clase')
    await w.pending.refresh()
    assert.equal(w.pending.status, 'available')
    assert.isNull(w.pending.usedBookingId)
  })
})
