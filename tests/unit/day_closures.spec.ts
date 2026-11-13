import { ClosureFactory } from '#database/factories/catalog_factories'
import Booking from '#models/booking'
import ClassSession from '#models/class_session'
import Closure from '#models/closure'
import PendingClass from '#models/pending_class'
import BookingGenerator from '#services/booking_generator'
import { BUSINESS_ZONE } from '#services/business_calendar'
import DayClosures, { ClosureError, closureImpact } from '#services/day_closures'
import {
  createBooking,
  createCatalog,
  createPendingClass,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const WED = 3

/**
 * Wednesday 11 November 2026, 9:41 in Buenos Aires.
 */
const now = DateTime.fromISO('2026-11-11T09:41', { zone: BUSINESS_ZONE })
const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })
const HOLIDAY = '2026-11-18'

/**
 * Wednesday classes in both centers, each with a student on fixed schedule
 * booked by the generator for the next four weeks.
 */
async function world() {
  const catalog = await createCatalog()
  const mendoza = await createSchedule(catalog, {
    weekday: WED,
    startTime: '18:00',
    center: catalog.mendoza,
  })
  const ovidio = await createSchedule(catalog, {
    activity: catalog.yoga,
    weekday: WED,
    startTime: '19:00',
    center: catalog.ovidio,
  })
  const ana = await createStudent(catalog, { schedules: [mendoza], fullName: 'Ana Ruiz' })
  const juan = await createStudent(catalog, { schedules: [ovidio], fullName: 'Juan Ponce' })
  await new BookingGenerator().generate({ tenantId: catalog.tenant.id, now })
  return { catalog, mendoza, ovidio, ana, juan }
}

async function bookingOn(userId: number, date: string) {
  const bookings = await Booking.query()
    .where('userId', userId)
    .whereHas('classSession', (session) => session.where('date', date))
  return bookings
}

test.group('DayClosures', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  const closures = new DayClosures()

  test('closing every center suspends the day and gives each booking a pending class', async ({
    assert,
  }) => {
    const w = await world()
    const tenantId = w.catalog.tenant.id

    const before = await closureImpact(tenantId, HOLIDAY, null)
    const impact = await closures.close(
      tenantId,
      { date: HOLIDAY, centerId: null, reason: 'Feriado' },
      now
    )

    assert.deepEqual(impact, { classes: 2, bookings: 2 })
    assert.deepEqual(before, impact)

    const closure = await Closure.query().where('tenantId', tenantId).firstOrFail()
    assert.equal(closure.date.toISODate(), HOLIDAY)
    assert.isNull(closure.centerId)

    for (const student of [w.ana, w.juan]) {
      const [booking] = await bookingOn(student.user.id, HOLIDAY)
      assert.equal(booking.status, 'suspended')
      const pending = await PendingClass.query().where('originBookingId', booking.id).firstOrFail()
      assert.equal(pending.reason, 'suspended')
      assert.equal(pending.status, 'available')
      assert.equal(pending.missedOn.toISODate(), HOLIDAY)
    }
    const sessions = await ClassSession.query().where('tenantId', tenantId).where('date', HOLIDAY)
    assert.deepEqual(
      sessions.map((session) => [session.status, session.suspensionReason]),
      [
        ['suspended', 'Feriado'],
        ['suspended', 'Feriado'],
      ]
    )
  })

  test('the generator does not book a closed day again', async ({ assert }) => {
    const w = await world()
    const tenantId = w.catalog.tenant.id
    await closures.close(tenantId, { date: HOLIDAY, centerId: null, reason: 'Feriado' }, now)

    const summary = await new BookingGenerator().generate({ tenantId, now })

    assert.equal(summary.created, 0)
    const bookings = await bookingOn(w.ana.user.id, HOLIDAY)
    assert.deepEqual(
      bookings.map((booking) => booking.status),
      ['suspended']
    )
  })

  test('a day closed before the generator runs never gets bookings', async ({ assert }) => {
    const catalog = await createCatalog()
    const wednesday = await createSchedule(catalog, { weekday: WED, startTime: '18:00' })
    const ana = await createStudent(catalog, { schedules: [wednesday] })
    const tenantId = catalog.tenant.id

    const impact = await closures.close(
      tenantId,
      { date: HOLIDAY, centerId: null, reason: 'Feriado' },
      now
    )
    await new BookingGenerator().generate({ tenantId, now })

    assert.deepEqual(impact, { classes: 1, bookings: 0 })
    assert.lengthOf(await bookingOn(ana.user.id, HOLIDAY), 0)
    assert.lengthOf(await bookingOn(ana.user.id, '2026-11-25'), 1)
  })

  test('closing one center leaves the other one as it was', async ({ assert }) => {
    const w = await world()
    const tenantId = w.catalog.tenant.id

    const impact = await closures.close(
      tenantId,
      { date: HOLIDAY, centerId: w.catalog.mendoza.id, reason: 'Pintura del salón' },
      now
    )

    assert.deepEqual(impact, { classes: 1, bookings: 1 })
    const [ana] = await bookingOn(w.ana.user.id, HOLIDAY)
    const [juan] = await bookingOn(w.juan.user.id, HOLIDAY)
    assert.equal(ana.status, 'suspended')
    assert.equal(juan.status, 'active')
    assert.isNull(await PendingClass.query().where('originBookingId', juan.id).first())

    await new BookingGenerator().generate({ tenantId, now })
    assert.deepEqual(await closureImpact(tenantId, HOLIDAY, w.catalog.ovidio.id), {
      classes: 1,
      bookings: 1,
    })
  })

  test('a booking made with a pending class gets that pending class back', async ({ assert }) => {
    const catalog = await createCatalog()
    const wednesday = await createSchedule(catalog, { weekday: WED, startTime: '18:00' })
    const monday = await createSchedule(catalog, { weekday: 1, startTime: '18:00' })
    const sofi = await createStudent(catalog, { schedules: [monday] })
    const pending = await createPendingClass(catalog, sofi, {
      schedule: monday,
      missedOn: day('2026-11-09'),
      expiresOn: day('2026-11-22'),
    })
    await pending.merge({ status: 'used' }).save()
    const booking = await createBooking(catalog, sofi, wednesday, day(HOLIDAY), {
      source: 'pending',
      pendingClassId: pending.id,
    })
    await pending.merge({ usedBookingId: booking.id }).save()

    await closures.close(
      catalog.tenant.id,
      { date: HOLIDAY, centerId: null, reason: 'Feriado' },
      now
    )

    await booking.refresh()
    await pending.refresh()
    assert.equal(booking.status, 'suspended')
    assert.equal(pending.status, 'available')
    assert.isNull(await PendingClass.query().where('originBookingId', booking.id).first())
  })

  test('impact leaves out classes already suspended and centers already closed', async ({
    assert,
  }) => {
    const w = await world()
    const tenantId = w.catalog.tenant.id
    await closures.close(
      tenantId,
      { date: HOLIDAY, centerId: w.catalog.mendoza.id, reason: 'Pintura' },
      now
    )

    assert.deepEqual(await closureImpact(tenantId, HOLIDAY, null), { classes: 1, bookings: 1 })
    assert.deepEqual(await closureImpact(tenantId, HOLIDAY, w.catalog.mendoza.id), {
      classes: 0,
      bookings: 0,
    })
  })

  test('rejects past days, days already closed and centers of another tenant', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const tenantId = catalog.tenant.id
    await ClosureFactory.merge({ tenantId, date: day(HOLIDAY), centerId: null }).create()
    await ClosureFactory.merge({
      tenantId,
      date: day('2026-11-25'),
      centerId: catalog.mendoza.id,
    }).create()

    const attempts: [Parameters<DayClosures['close']>[1], string][] = [
      [{ date: '2026-11-10', centerId: null, reason: 'Feriado' }, 'past'],
      [{ date: HOLIDAY, centerId: catalog.ovidio.id, reason: 'Feriado' }, 'already_closed'],
      [{ date: '2026-11-25', centerId: catalog.mendoza.id, reason: 'Otro' }, 'already_closed'],
      [{ date: '2026-11-26', centerId: other.mendoza.id, reason: 'Feriado' }, 'unknown_center'],
    ]
    for (const [input, reason] of attempts) {
      try {
        await closures.close(tenantId, input, now)
        assert.fail(`closing ${input.date} should fail with ${reason}`)
      } catch (error) {
        assert.instanceOf(error, ClosureError)
        assert.equal((error as ClosureError).reason, reason)
      }
    }
    assert.lengthOf(await Closure.query().where('tenantId', tenantId), 2)

    // The other center is still open that day.
    await closures.close(
      tenantId,
      { date: '2026-11-25', centerId: catalog.ovidio.id, reason: 'Feriado' },
      now
    )
  })
})
