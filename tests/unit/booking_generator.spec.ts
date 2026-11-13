import { ClosureFactory } from '#database/factories/catalog_factories'
import { BookingFactory, ClassSessionFactory } from '#database/factories/booking_factories'
import Booking from '#models/booking'
import BookingGenerator from '#services/booking_generator'
import { BUSINESS_ZONE } from '#services/business_calendar'
import { createCatalog, createSchedule, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const MON = 1
const TUE = 2
const WED = 3
const THU = 4

/**
 * Wednesday 11 November 2026, 9:41 in Buenos Aires. The window runs from
 * Wednesday 11 November to Tuesday 8 December (28 days).
 */
const now = DateTime.fromISO('2026-11-11T09:41', { zone: BUSINESS_ZONE })
const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

async function bookedDates(userId: number, status?: Booking['status']) {
  const bookings = await Booking.query()
    .where('userId', userId)
    .if(status, (query) => query.where('status', status!))
    .preload('classSession')
  return bookings.map((booking) => booking.classSession.date.toISODate()).sort()
}

test.group('BookingGenerator', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  const generator = new BookingGenerator()

  test('books every fixed slot occurrence in the next four weeks', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON, startTime: '18:00' })
    const wednesday = await createSchedule(catalog, { weekday: WED, startTime: '19:00' })
    const { user } = await createStudent(catalog, { schedules: [monday, wednesday] })

    const summary = await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(summary, { created: 8, skipped: 0, existing: 0 })
    assert.deepEqual(await bookedDates(user.id, 'active'), [
      '2026-11-11',
      '2026-11-16',
      '2026-11-18',
      '2026-11-23',
      '2026-11-25',
      '2026-11-30',
      '2026-12-02',
      '2026-12-07',
    ])
  })

  test('the window ends on the 28th day and skips classes that already started', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const tuesday = await createSchedule(catalog, { weekday: TUE, startTime: '08:00' })
    const wednesday = await createSchedule(catalog, { weekday: WED, startTime: '09:00' })
    const { user } = await createStudent(catalog, { schedules: [tuesday, wednesday] })

    await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(await bookedDates(user.id), [
      '2026-11-17',
      '2026-11-18',
      '2026-11-24',
      '2026-11-25',
      '2026-12-01',
      '2026-12-02',
      '2026-12-08',
    ])
  })

  test('uses the Buenos Aires date, not the server one', async ({ assert }) => {
    const catalog = await createCatalog()
    const thursday = await createSchedule(catalog, { weekday: THU, startTime: '18:00' })
    const { user } = await createStudent(catalog, { schedules: [thursday] })

    // 02:30 UTC on Thursday 12 is still Wednesday 11 at 23:30 in Buenos Aires.
    const lateWednesday = DateTime.fromISO('2026-11-12T02:30', { zone: 'utc' })
    await generator.generate({ tenantId: catalog.tenant.id, now: lateWednesday })

    assert.deepEqual(await bookedDates(user.id), [
      '2026-11-12',
      '2026-11-19',
      '2026-11-26',
      '2026-12-03',
    ])
  })

  test('running it twice does not duplicate bookings', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON })
    const { user } = await createStudent(catalog, { schedules: [monday] })

    await generator.generate({ tenantId: catalog.tenant.id, now })
    const second = await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(second, { created: 0, skipped: 0, existing: 4 })
    assert.lengthOf(await bookedDates(user.id), 4)
  })

  test('does not recreate a booking the student cancelled', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON })
    const { user } = await createStudent(catalog, { schedules: [monday] })
    await generator.generate({ tenantId: catalog.tenant.id, now })

    const [first] = await Booking.query().where('userId', user.id).orderBy('id')
    first.merge({ status: 'cancelled', cancelledAt: DateTime.now() })
    await first.save()

    const summary = await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.equal(summary.created, 0)
    assert.lengthOf(await bookedDates(user.id), 4)
    assert.lengthOf(await bookedDates(user.id, 'active'), 3)
  })

  test('does not double book a session the student already holds', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON })
    const { user, quota } = await createStudent(catalog, { schedules: [monday] })
    const session = await ClassSessionFactory.merge({
      tenantId: catalog.tenant.id,
      classScheduleId: monday.id,
      date: day('2026-11-16'),
    }).create()
    await BookingFactory.merge({
      tenantId: catalog.tenant.id,
      userId: user.id,
      classSessionId: session.id,
      planQuotaId: quota.id,
      source: 'pending',
    }).create()

    const summary = await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(summary, { created: 3, skipped: 0, existing: 1 })
    assert.lengthOf(await bookedDates(user.id), 4)
  })

  test('respects the fixed slot start and end dates', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON })
    const { user } = await createStudent(catalog, {
      schedules: [monday],
      slot: { startsOn: day('2026-11-23'), endsOn: day('2026-11-30') },
    })

    await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(await bookedDates(user.id), ['2026-11-23', '2026-11-30'])
  })

  test('stops when the subscription ends', async ({ assert }) => {
    const catalog = await createCatalog()
    const wednesday = await createSchedule(catalog, { weekday: WED, startTime: '19:00' })
    const { user } = await createStudent(catalog, {
      schedules: [wednesday],
      subscription: { startsOn: day('2026-10-01'), endsOn: day('2026-11-20') },
    })

    await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(await bookedDates(user.id), ['2026-11-11', '2026-11-18'])
  })

  test('skips closed days, for all centers or for the class center', async ({ assert }) => {
    const catalog = await createCatalog()
    const wednesday = await createSchedule(catalog, {
      weekday: WED,
      startTime: '19:00',
      center: catalog.mendoza,
    })
    const { user } = await createStudent(catalog, { schedules: [wednesday] })
    const tenantId = catalog.tenant.id
    await ClosureFactory.merge({ tenantId, date: day('2026-11-18'), centerId: null }).create()
    await ClosureFactory.merge({
      tenantId,
      date: day('2026-11-25'),
      centerId: catalog.mendoza.id,
    }).create()
    await ClosureFactory.merge({
      tenantId,
      date: day('2026-12-02'),
      centerId: catalog.ovidio.id,
    }).create()

    const summary = await generator.generate({ tenantId, now })

    assert.deepEqual(summary, { created: 2, skipped: 2, existing: 0 })
    assert.deepEqual(await bookedDates(user.id), ['2026-11-11', '2026-12-02'])
  })

  test('ignores closures of another tenant', async ({ assert }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const wednesday = await createSchedule(catalog, { weekday: WED, startTime: '19:00' })
    const { user } = await createStudent(catalog, { schedules: [wednesday] })
    await ClosureFactory.merge({ tenantId: other.tenant.id, date: day('2026-11-18') }).create()

    await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.include(await bookedDates(user.id), '2026-11-18')
  })

  test('skips suspended sessions', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON })
    const { user } = await createStudent(catalog, { schedules: [monday] })
    await ClassSessionFactory.apply('suspended')
      .merge({ tenantId: catalog.tenant.id, classScheduleId: monday.id, date: day('2026-11-23') })
      .create()

    const summary = await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.equal(summary.skipped, 1)
    assert.notInclude(await bookedDates(user.id), '2026-11-23')
  })

  test('skips inactive class schedules', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON, active: false })
    const { user } = await createStudent(catalog, { schedules: [monday] })

    const summary = await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(summary, { created: 0, skipped: 0, existing: 0 })
    assert.lengthOf(await bookedDates(user.id), 0)
  })

  test('only books the given tenant, and the given student when asked', async ({ assert }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON })
    const otherMonday = await createSchedule(other, { weekday: MON })
    const sofi = await createStudent(catalog, { schedules: [monday] })
    const juan = await createStudent(catalog, { schedules: [monday] })
    const outsider = await createStudent(other, { schedules: [otherMonday] })

    await generator.generate({ tenantId: catalog.tenant.id, userId: sofi.user.id, now })

    assert.lengthOf(await bookedDates(sofi.user.id), 4)
    assert.lengthOf(await bookedDates(juan.user.id), 0)
    assert.lengthOf(await bookedDates(outsider.user.id), 0)

    await generator.generate({ tenantId: catalog.tenant.id, now })

    assert.lengthOf(await bookedDates(juan.user.id), 4)
    assert.lengthOf(await bookedDates(outsider.user.id), 0)
  })

  test('bookings keep the fixed slot and its plan quota', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: MON })
    const { user, quota, slots } = await createStudent(catalog, { schedules: [monday] })

    await generator.generate({ tenantId: catalog.tenant.id, now })

    const bookings = await Booking.query().where('userId', user.id)
    for (const booking of bookings) {
      assert.equal(booking.tenantId, catalog.tenant.id)
      assert.equal(booking.source, 'fixed')
      assert.equal(booking.fixedSlotId, slots[0].id)
      assert.equal(booking.planQuotaId, quota.id)
    }
  })
})
