import { UserFactory } from '#database/factories/user_factory'
import Booking from '#models/booking'
import ClassSchedule from '#models/class_schedule'
import Closure from '#models/closure'
import PendingClass from '#models/pending_class'
import BookingGenerator from '#services/booking_generator'
import { addDays, businessNow, dayName, isoWeekday } from '#services/business_calendar'
import { createCatalog, createSchedule, createStudent, type Catalog } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const hostOf = (catalog: Catalog) => `${catalog.tenant.slug}.localhost`

/**
 * A fresh tenant with its admin and, a week from today, a Pilates class in
 * Mendoza (Ana and Juan on fixed schedule) and a Yoga class in Ovidio Lagos
 * (Sofi), already booked by the generator.
 */
async function world() {
  const catalog = await createCatalog()
  const admin = await UserFactory.apply('admin').merge({ tenantId: catalog.tenant.id }).create()
  const today = businessNow().toISODate()!
  const date = addDays(today, 7)
  const weekday = isoWeekday(date)
  const pilates = await createSchedule(catalog, {
    weekday,
    startTime: '18:00',
    instructorName: 'Agus',
    capacity: 10,
  })
  const yoga = await createSchedule(catalog, {
    activity: catalog.yoga,
    center: catalog.ovidio,
    weekday,
    startTime: '19:00',
    instructorName: 'Mica',
    capacity: 8,
  })
  const ana = await createStudent(catalog, { schedules: [pilates], fullName: 'Ana Ruiz' })
  const juan = await createStudent(catalog, { schedules: [pilates], fullName: 'Juan Ponce' })
  const sofi = await createStudent(catalog, { schedules: [yoga], fullName: 'Sofi Ortiz' })
  await new BookingGenerator().generate({ tenantId: catalog.tenant.id })
  return { catalog, admin, today, date, weekday, pilates, yoga, ana, juan, sofi }
}

async function bookingsOn(scheduleId: number, date: string) {
  return Booking.query().whereHas('classSession', (session) =>
    session.where('classScheduleId', scheduleId).where('date', date)
  )
}

test.group('Admin · Agenda', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('shows the classes of the chosen day with their occupation', async ({ client, assert }) => {
    const w = await world()
    const other = await createCatalog()
    await createSchedule(other, { weekday: w.weekday })

    const response = await client
      .get(`/admin/agenda?fecha=${w.date}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/agenda')
    const { view } = response.inertiaProps as { view: any }
    assert.equal(view.selected, w.date)
    assert.lengthOf(view.days, 14)
    assert.equal(view.days[0].date, w.today)
    assert.isFalse(view.closedEverywhere)
    assert.deepEqual(view.closures, [])
    assert.deepEqual(
      view.classes.map((card: any) => [card.activity.name, card.centerName, card.taken]),
      [
        ['Pilates', 'Mendoza', 2],
        ['Yoga', 'Ovidio Lagos', 1],
      ]
    )
    assert.containsSubset(view.classes[0], {
      startTime: '18:00',
      instructorName: 'Agus',
      capacity: 10,
      scheduleId: w.pilates.id,
      suspended: false,
    })
  })

  test('a date outside the two weeks shows today', async ({ client, assert }) => {
    const w = await world()

    const response = await client
      .get(`/admin/agenda?fecha=${addDays(w.today, 30)}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    assert.equal((response.inertiaProps as any).view.selected, w.today)
  })

  test('a closed center shows its classes suspended with the reason', async ({
    client,
    assert,
  }) => {
    const w = await world()
    await Closure.create({
      tenantId: w.catalog.tenant.id,
      date: DateTime.fromISO(w.date),
      centerId: w.catalog.mendoza.id,
      reason: 'Pintura',
    })

    const response = await client
      .get(`/admin/agenda?fecha=${w.date}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    const { view } = response.inertiaProps as { view: any }
    assert.deepEqual(view.closures, [{ centerName: 'Mendoza', reason: 'Pintura' }])
    assert.isFalse(view.closedEverywhere)
    assert.deepEqual(
      view.classes.map((card: any) => [card.centerName, card.suspended, card.suspensionReason]),
      [
        ['Mendoza', true, 'Pintura'],
        ['Ovidio Lagos', false, null],
      ]
    )
  })

  test('only admins see the agenda', async ({ client }) => {
    const w = await world()

    const response = await client
      .get('/admin/agenda')
      .header('host', hostOf(w.catalog))
      .loginAs(w.ana.user)
      .redirects(0)

    response.assertStatus(403)
  })
})

test.group('Admin · Cerrar un día', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('shows what each choice suspends before confirming', async ({ client, assert }) => {
    const w = await world()

    const response = await client
      .get(`/admin/agenda/cerrar?fecha=${w.date}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    response.assertInertiaComponent('admin/close_day')
    const { view } = response.inertiaProps as { view: any }
    assert.equal(view.date, w.date)
    assert.deepEqual(
      view.options.map((option: any) => [option.label, option.impact]),
      [
        ['Los dos centros', { classes: 2, bookings: 3 }],
        ['Mendoza', { classes: 1, bookings: 2 }],
        ['Ovidio Lagos', { classes: 1, bookings: 1 }],
      ]
    )
    assert.lengthOf(await Closure.query().where('tenantId', w.catalog.tenant.id), 0)
  })

  test('closing a day suspends its bookings with a pending class and the generator skips it', async ({
    client,
    assert,
  }) => {
    const w = await world()

    const response = await client
      .post('/admin/agenda/cerrar')
      .header('host', hostOf(w.catalog))
      .header('referer', `http://${hostOf(w.catalog)}/admin/agenda/cerrar?fecha=${w.date}`)
      .loginAs(w.admin)
      .json({ date: w.date, reason: 'Feriado', centerId: null })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/admin/agenda?fecha=${w.date}`)
    response.assertFlashMessage(
      'success',
      `Cerramos el ${dayName(w.date)}. 3 reservas quedaron suspendidas con su clase pendiente.`
    )

    const bookings = [
      ...(await bookingsOn(w.pilates.id, w.date)),
      ...(await bookingsOn(w.yoga.id, w.date)),
    ]
    assert.lengthOf(bookings, 3)
    for (const booking of bookings) {
      assert.equal(booking.status, 'suspended')
      const pending = await PendingClass.query().where('originBookingId', booking.id).firstOrFail()
      assert.equal(pending.reason, 'suspended')
      assert.equal(pending.status, 'available')
    }

    await new BookingGenerator().generate({ tenantId: w.catalog.tenant.id })
    const after = await bookingsOn(w.pilates.id, w.date)
    assert.deepEqual(
      after.map((booking) => booking.status),
      ['suspended', 'suspended']
    )
  })

  test('closing one center does not touch the other one', async ({ client, assert }) => {
    const w = await world()

    await client
      .post('/admin/agenda/cerrar')
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .json({ date: w.date, reason: 'Corte de luz', centerId: w.catalog.ovidio.id })
      .withCsrfToken()
      .redirects(0)

    const [yoga] = await bookingsOn(w.yoga.id, w.date)
    assert.equal(yoga.status, 'suspended')
    const pilates = await bookingsOn(w.pilates.id, w.date)
    assert.deepEqual(
      pilates.map((booking) => booking.status),
      ['active', 'active']
    )
    const closure = await Closure.query().where('tenantId', w.catalog.tenant.id).firstOrFail()
    assert.equal(closure.centerId, w.catalog.ovidio.id)
    assert.equal(closure.reason, 'Corte de luz')
  })

  test('rejects a past day, a missing reason and a center of another tenant', async ({
    client,
    assert,
  }) => {
    const w = await world()
    const other = await createCatalog()
    const host = hostOf(w.catalog)
    const referer = `http://${host}/admin/agenda/cerrar?fecha=${w.date}`

    const past = await client
      .post('/admin/agenda/cerrar')
      .header('host', host)
      .header('referer', referer)
      .loginAs(w.admin)
      .json({ date: addDays(w.today, -1), reason: 'Feriado', centerId: null })
      .withCsrfToken()
      .redirects(0)
    past.assertFlashMessage('error', 'Ese día ya pasó.')

    const noReason = await client
      .post('/admin/agenda/cerrar')
      .header('host', host)
      .header('referer', referer)
      .loginAs(w.admin)
      .json({ date: w.date, reason: ' ', centerId: null })
      .withCsrfToken()
      .redirects(0)
    assert.deepEqual(noReason.flashMessage('inputErrorsBag'), {
      reason: ['Poné el motivo, por ejemplo "Feriado".'],
    })

    const foreign = await client
      .post('/admin/agenda/cerrar')
      .header('host', host)
      .header('referer', referer)
      .loginAs(w.admin)
      .json({ date: w.date, reason: 'Feriado', centerId: other.mendoza.id })
      .withCsrfToken()
      .redirects(0)
    foreign.assertFlashMessage('error', 'Elegí dónde se cierra.')

    assert.lengthOf(await Closure.query().where('tenantId', w.catalog.tenant.id), 0)
    const bookings = await bookingsOn(w.pilates.id, w.date)
    assert.isTrue(bookings.every((booking) => booking.status === 'active'))
  })
})

test.group('Admin · Horarios', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('lowering the capacity below the fixed schedules is rejected', async ({
    client,
    assert,
  }) => {
    const w = await world()
    const host = hostOf(w.catalog)

    const response = await client
      .put(`/admin/horarios/${w.pilates.id}`)
      .header('host', host)
      .header('referer', `http://${host}/admin/horarios/${w.pilates.id}`)
      .loginAs(w.admin)
      .json({
        activityId: w.pilates.activityId,
        centerId: w.pilates.centerId,
        weekday: w.pilates.weekday,
        startTime: '18:00',
        capacity: 1,
        instructorName: 'Agus',
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `http://${host}/admin/horarios/${w.pilates.id}`)
    response.assertFlashMessage('capacityBlocked', { fixed: 2, requested: 1 })
    response.assertFlashMessage('errors', { capacity: 'El cupo no puede ser menor a 2.' })
    await w.pilates.refresh()
    assert.equal(w.pilates.capacity, 10)

    const editor = await client
      .get(`/admin/horarios/${w.pilates.id}`)
      .header('host', host)
      .loginAs(w.admin)
      .withInertia()
    const props = editor.inertiaProps as any
    assert.deepEqual(
      props.editor.fixedStudents.map((student: any) => student.fullName),
      ['Ana Ruiz', 'Juan Ponce']
    )
  })

  test('creates a class and shows it on its next day in the agenda', async ({ client, assert }) => {
    const w = await world()

    const response = await client
      .post('/admin/horarios')
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .json({
        activityId: w.catalog.gym.id,
        centerId: w.catalog.mendoza.id,
        weekday: w.weekday,
        startTime: '20:00',
        capacity: 12,
        instructorName: 'Nico',
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    // The class is on today's weekday, so its next day is today.
    response.assertHeader('location', `/admin/agenda?fecha=${w.today}`)
    const created = await ClassSchedule.query()
      .where('tenantId', w.catalog.tenant.id)
      .where('instructorName', 'Nico')
      .firstOrFail()
    assert.containsSubset(created.serialize(), {
      activityId: w.catalog.gym.id,
      startTime: '20:00',
      capacity: 12,
      active: true,
    })
  })

  test('deactivating is refused while someone has the class as fixed schedule', async ({
    client,
    assert,
  }) => {
    const w = await world()

    const response = await client
      .post(`/admin/horarios/${w.pilates.id}/desactivar`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withCsrfToken()
      .redirects(0)

    response.assertFlashMessage(
      'error',
      'Hay 2 personas con este horario fijo. Para desactivarlo, primero cambiá su horario desde su ficha.'
    )
    await w.pilates.refresh()
    assert.isTrue(w.pilates.active)
  })

  test('the schedule of another tenant is not found', async ({ client, assert }) => {
    const w = await world()
    const other = await createCatalog()
    const foreign = await createSchedule(other, { capacity: 10 })

    const edit = await client
      .get(`/admin/horarios/${foreign.id}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
    edit.assertStatus(404)

    const update = await client
      .put(`/admin/horarios/${foreign.id}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .json({
        activityId: w.catalog.pilates.id,
        centerId: w.catalog.mendoza.id,
        weekday: 1,
        startTime: '10:00',
        capacity: 1,
        instructorName: 'X',
      })
      .withCsrfToken()
      .redirects(0)
    update.assertStatus(404)
    await foreign.refresh()
    assert.equal(foreign.capacity, 10)
  })
})
