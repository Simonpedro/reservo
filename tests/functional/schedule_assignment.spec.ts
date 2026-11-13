import { FixedSlotFactory } from '#database/factories/plan_factories'
import { UserFactory } from '#database/factories/user_factory'
import Booking from '#models/booking'
import Subscription from '#models/subscription'
import Tenant from '#models/tenant'
import User from '#models/user'
import BookingGenerator from '#services/booking_generator'
import {
  addDays,
  businessDate,
  businessNow,
  isoWeekday,
  type IsoDate,
} from '#services/business_calendar'
import { nextMonday } from '#services/schedule_assignment'
import {
  createCatalog,
  createPlan,
  createSchedule,
  createStudent,
  type Catalog,
} from '#tests/support/scenario'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const host = `kinaf.localhost:${env.get('PORT')}`

async function kinafWorld() {
  const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
  const admin = await User.findByOrFail({ tenantId: kinaf.id, email: 'admin@kinaf.test' })
  return { catalog: await createCatalog(kinaf), admin }
}

async function bookingRows(userId: number) {
  const bookings = await Booking.query().where('userId', userId).preload('classSession')
  return bookings.map((booking) => ({
    date: booking.classSession.date.toISODate()!,
    scheduleId: booking.classSession.classScheduleId,
    status: booking.status,
  }))
}

function datesOf(rows: Awaited<ReturnType<typeof bookingRows>>, scheduleId: number) {
  return rows
    .filter((row) => row.scheduleId === scheduleId)
    .map((row) => `${row.date}:${row.status}`)
    .sort()
}

/**
 * Students with fixed slots so `schedule` has no fixed place left.
 */
async function fill(catalog: Catalog, scheduleId: number, places: number) {
  for (let index = 0; index < places; index++) {
    const other = await createStudent(catalog)
    await FixedSlotFactory.merge({
      tenantId: catalog.tenant.id,
      subscriptionId: other.subscription.id,
      userId: other.user.id,
      planQuotaId: other.quota.id,
      classScheduleId: scheduleId,
    }).create()
  }
}

test.group('Admin › assign plan and schedule', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('the wizard lists active plans, free fixed places and start dates', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const full = await createSchedule(catalog, { weekday: 2, startTime: '07:15', capacity: 2 })
    const roomy = await createSchedule(catalog, { weekday: 2, startTime: '07:45', capacity: 5 })
    await fill(catalog, full.id, 2)
    await fill(catalog, roomy.id, 1)
    const { plan } = await createPlan(
      catalog,
      [{ count: 1, activities: [catalog.yoga] }],
      'Solo yoga'
    )
    const student = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()

    const response = await client
      .get(`/admin/clientes/${student.id}/asignar`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/clients/assign')
    const props = response.inertiaProps
    assert.deepEqual(props.client, { id: student.id, fullName: student.fullName })
    assert.isNull(props.current)

    const listed = props.plans.find((candidate: { id: number }) => candidate.id === plan.id)
    assert.equal(listed.summary, '1 clase de Yoga')
    assert.deepEqual(listed.quotas[0].activityIds, [catalog.yoga.id])

    const free = Object.fromEntries(
      props.schedules.map((schedule: { id: number; free: number }) => [schedule.id, schedule.free])
    )
    assert.equal(free[full.id], 0)
    assert.equal(free[roomy.id], 4)

    const first = nextMonday(businessDate(businessNow()))
    assert.deepEqual(
      props.startOptions.map((option: { date: IsoDate }) => option.date),
      [first, addDays(first, 7)]
    )
  })

  test('confirming books from the chosen date and cancels the old fixed classes from it', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const today = businessDate(businessNow())
    const tomorrow = addDays(today, 1)
    const oldClass = await createSchedule(catalog, {
      weekday: isoWeekday(tomorrow),
      startTime: '21:10',
      activity: catalog.pilates,
    })
    const newClass = await createSchedule(catalog, {
      weekday: isoWeekday(tomorrow),
      startTime: '21:40',
      activity: catalog.yoga,
    })
    const student = await createStudent(catalog, { schedules: [oldClass] })
    await new BookingGenerator().generate({ tenantId: catalog.tenant.id, userId: student.user.id })

    const { plan, quotas } = await createPlan(catalog, [{ count: 1, activities: [catalog.yoga] }])
    const startsOn = addDays(nextMonday(today), 7)

    const response = await client
      .post(`/admin/clientes/${student.user.id}/asignar`)
      .header('host', host)
      .loginAs(admin)
      .json({
        planId: plan.id,
        startsOn,
        quotas: [{ quotaId: quotas[0].id, scheduleIds: [newClass.id] }],
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/admin/clientes/${student.user.id}`)
    response.assertFlashMessage('assigned', { startsOn })

    const rows = await bookingRows(student.user.id)
    const oldDates = datesOf(rows, oldClass.id)
    assert.include(oldDates, `${tomorrow}:active`)
    assert.isTrue(
      oldDates.every((entry) =>
        entry < startsOn ? entry.endsWith(':active') : entry.endsWith(':cancelled')
      )
    )
    assert.isAbove(oldDates.filter((entry) => entry.endsWith(':cancelled')).length, 0)

    const newDates = datesOf(rows, newClass.id)
    assert.isAbove(newDates.length, 0)
    assert.isTrue(newDates.every((entry) => entry >= startsOn && entry.endsWith(':active')))

    const current = await Subscription.query()
      .where('userId', student.user.id)
      .whereNull('endsOn')
      .firstOrFail()
    assert.equal(current.planId, plan.id)
  })

  test('a selection that breaks the plan goes back with the reason and changes nothing', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const pilates = await createSchedule(catalog, { weekday: 3, activity: catalog.pilates })
    const { plan, quotas } = await createPlan(catalog, [{ count: 2 }])
    const student = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()

    const response = await client
      .post(`/admin/clientes/${student.id}/asignar`)
      .header('host', host)
      .header('referer', `http://${host}/admin/clientes/${student.id}/asignar`)
      .loginAs(admin)
      .json({
        planId: plan.id,
        startsOn: nextMonday(businessDate(businessNow())),
        quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilates.id] }],
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.match(
      response.header('location') ?? '',
      new RegExp(`/admin/clientes/${student.id}/asignar$`)
    )
    response.assertFlashMessage('errors', { assignment: 'Elegí 2 horarios para 2 clases libres.' })
    assert.lengthOf(await Subscription.query().where('userId', student.id), 0)
  })

  test('students of another tenant are not found', async ({ client }) => {
    const { admin } = await kinafWorld()
    const otherTenant = await createCatalog()
    const stranger = await UserFactory.merge({ tenantId: otherTenant.tenant.id }).create()

    const response = await client
      .get(`/admin/clientes/${stranger.id}/asignar`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(404)
  })

  test('students cannot assign plans', async ({ client, assert }) => {
    const { catalog } = await kinafWorld()
    const student = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()
    const { plan, quotas } = await createPlan(catalog, [{ count: 1 }])
    const pilates = await createSchedule(catalog, { weekday: 3 })

    const response = await client
      .post(`/admin/clientes/${student.id}/asignar`)
      .header('host', host)
      .loginAs(student)
      .json({
        planId: plan.id,
        startsOn: nextMonday(businessDate(businessNow())),
        quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilates.id] }],
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await Subscription.query().where('userId', student.id), 0)
  })
})
