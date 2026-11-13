import { BookingFactory, ClassSessionFactory } from '#database/factories/booking_factories'
import { UserFactory } from '#database/factories/user_factory'
import { PlanFactory, SubscriptionFactory } from '#database/factories/plan_factories'
import type ClassSchedule from '#models/class_schedule'
import Tenant from '#models/tenant'
import { BUSINESS_ZONE, businessNow, isoWeekday } from '#services/business_calendar'
import { createCatalog, createSchedule, createStudent, type Catalog } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const kinafHost = 'kinaf.localhost:3333'

/**
 * Tomorrow is always within "this week" or "next week".
 */
const tomorrow = () => businessNow().plus({ days: 1 }).startOf('day')

async function kinafCatalog() {
  return createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
}

/**
 * A student with a fixed slot on tomorrow's weekday and a booking for it.
 */
async function studentWithClassTomorrow(catalog: Catalog, fullName: string) {
  const date = tomorrow()
  const schedule = await createSchedule(catalog, {
    weekday: isoWeekday(date.toISODate()!),
    startTime: '19:00',
    instructorName: 'Mica',
    activity: catalog.yoga,
    center: catalog.ovidio,
  })
  const student = await createStudent(catalog, { schedules: [schedule], fullName })
  const booking = await bookOn(catalog, student, schedule, date)
  return { ...student, schedule, booking }
}

async function bookOn(
  catalog: Catalog,
  student: Awaited<ReturnType<typeof createStudent>>,
  schedule: ClassSchedule,
  date: DateTime,
  status: 'active' | 'cancelled' | 'suspended' = 'active'
) {
  const session = await ClassSessionFactory.merge({
    tenantId: catalog.tenant.id,
    classScheduleId: schedule.id,
    date,
  }).create()
  return BookingFactory.merge({
    tenantId: catalog.tenant.id,
    userId: student.user.id,
    classSessionId: session.id,
    planQuotaId: student.quota.id,
    fixedSlotId: student.slots[0]?.id ?? null,
    status,
  }).create()
}

function bookingIds(view: { weeks: { classes: { bookingId: number }[] }[] }) {
  return view.weeks.flatMap((week) => week.classes.map((card) => card.bookingId))
}

test.group('Mis clases', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows the student upcoming class as a card', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassTomorrow(catalog, 'Sofi Ortiz')

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('client/my_classes')
    const { view } = response.inertiaProps
    assert.equal(view.state, 'classes')
    const [card] = view.weeks.flatMap((week: { classes: unknown[] }) => week.classes)
    assert.containsSubset(card, {
      bookingId: sofi.booking.id,
      activity: { name: 'Yoga', wash: 'green' },
      date: tomorrow().toISODate(),
      dayLabel: 'Mañana',
      startTime: '19:00',
      instructorName: 'Mica',
      centerName: 'Ovidio Lagos',
      suspended: false,
    })
  })

  test('only lists the signed-in student bookings', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassTomorrow(catalog, 'Sofi Ortiz')
    const juan = await studentWithClassTomorrow(catalog, 'Juan Ponce')

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    assert.deepEqual(bookingIds(response.inertiaProps.view), [sofi.booking.id])
    assert.notInclude(bookingIds(response.inertiaProps.view), juan.booking.id)
  })

  test('hides cancelled bookings and keeps suspended ones as such', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassTomorrow(catalog, 'Sofi Ortiz')
    const later = tomorrow().plus({ days: 1 })
    const otherDay = await createSchedule(catalog, {
      weekday: isoWeekday(later.toISODate()!),
    })
    const cancelled = await bookOn(catalog, sofi, otherDay, later, 'cancelled')
    sofi.booking.status = 'suspended'
    await sofi.booking.save()

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    const cards = response.inertiaProps.view.weeks.flatMap(
      (week: { classes: unknown[] }) => week.classes
    )
    assert.notInclude(bookingIds(response.inertiaProps.view), cancelled.id)
    assert.lengthOf(cards, 1)
    assert.isTrue(cards[0].suspended)
  })

  test('without a plan it explains there is no plan yet', async ({ client }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const fede = await UserFactory.merge({ tenantId: kinaf.id }).create()

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(fede)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ view: { state: 'no_plan' } })
  })

  test('a finished plan counts as no plan', async ({ client }) => {
    const catalog = await kinafCatalog()
    const { user } = await createStudent(catalog, {
      subscription: {
        startsOn: DateTime.now().minus({ months: 3 }),
        endsOn: DateTime.now().minus({ months: 1 }),
      },
    })

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ view: { state: 'no_plan' } })
  })

  test('with a plan but no fixed schedule it says Kinaf is setting it up', async ({ client }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const carla = await UserFactory.merge({ tenantId: kinaf.id }).create()
    const plan = await PlanFactory.merge({ tenantId: kinaf.id }).create()
    await SubscriptionFactory.merge({
      tenantId: kinaf.id,
      userId: carla.id,
      planId: plan.id,
    }).create()

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(carla)
      .withInertia()

    response.assertInertiaPropsContains({ view: { state: 'no_schedule' } })
  })

  test('a student of another tenant is signed out on this tenant', async ({ client }) => {
    const other = await createCatalog()
    const outsider = await studentWithClassTomorrow(other, 'Ana Gómez')

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(outsider.user)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })

  test('requires a signed-in student', async ({ client }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const admin = await UserFactory.apply('admin').merge({ tenantId: kinaf.id }).create()

    const anonymous = await client.get('/clases').header('host', kinafHost).redirects(0)
    anonymous.assertStatus(302)
    anonymous.assertHeader('location', '/login')

    const asAdmin = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(admin)
      .withInertia()
    asAdmin.assertStatus(403)
  })

  test('the home page sends a signed-in student to Mis clases', async ({ client }) => {
    const catalog = await kinafCatalog()
    const { user } = await createStudent(catalog)

    const response = await client.get('/').header('host', kinafHost).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/clases')
  })
})

test.group('Class detail', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('opens one of the student bookings', async ({ client }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassTomorrow(catalog, 'Sofi Ortiz')

    const response = await client
      .get(`/clases/${sofi.booking.id}`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('client/class_detail')
    response.assertInertiaPropsContains({
      detail: { card: { bookingId: sofi.booking.id, centerName: 'Ovidio Lagos' } },
    })
  })

  test("is not found for another student's booking", async ({ client }) => {
    const catalog = await kinafCatalog()
    const sofi = await studentWithClassTomorrow(catalog, 'Sofi Ortiz')
    const juan = await studentWithClassTomorrow(catalog, 'Juan Ponce')

    const response = await client
      .get(`/clases/${juan.booking.id}`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(404)
    response.assertInertiaComponent('errors/not_found')
  })
})

test.group('Upcoming classes window', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists this week and next week only, in date order', async ({ client, assert }) => {
    const catalog = await kinafCatalog()
    const today = businessNow().startOf('day')
    const thisSunday = today.plus({ days: 7 - today.weekday })
    // On Sundays tomorrow is next Monday: dedupe by date.
    const dates = new Map(
      [
        thisSunday.plus({ days: 15 }),
        thisSunday.plus({ days: 7 }),
        thisSunday.plus({ days: 1 }),
        tomorrow(),
      ].map((date) => [date.toISODate()!, date])
    )
    const schedule = await createSchedule(catalog, { startTime: '23:59' })
    const student = await createStudent(catalog, { schedules: [schedule] })
    for (const date of dates.values()) await bookOn(catalog, student, schedule, date)

    const response = await client
      .get('/clases')
      .header('host', kinafHost)
      .loginAs(student.user)
      .withInertia()

    const weeks = response.inertiaProps.view.weeks as {
      title: string
      classes: { date: string }[]
    }[]
    const shown = weeks.flatMap((week) => week.classes.map((card) => card.date))
    const expected = new Set(
      [tomorrow(), thisSunday.plus({ days: 1 }), thisSunday.plus({ days: 7 })].map((date) =>
        date.setZone(BUSINESS_ZONE).toISODate()
      )
    )
    assert.deepEqual(shown, [...expected].sort())
    assert.equal(weeks.at(-1)!.title, 'Semana que viene')
  })
})
