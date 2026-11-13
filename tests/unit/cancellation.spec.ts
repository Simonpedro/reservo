import { PendingClassFactory } from '#database/factories/booking_factories'
import Booking from '#models/booking'
import PendingClass from '#models/pending_class'
import { BUSINESS_ZONE } from '#services/business_calendar'
import Cancellation, { canCancel, CancellationError } from '#services/cancellation'
import {
  createBooking,
  createCatalog,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const at = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

/**
 * Monday 16 November 2026, 18:00 in Buenos Aires.
 */
const mondayClass = {
  classSession: { date: at('2026-11-16'), classSchedule: { startTime: '18:00' } },
}

test.group('24 h rule', () => {
  test('exactly 24 h before the class still allows cancelling', ({ assert }) => {
    assert.isTrue(canCancel(mondayClass, at('2026-11-15T18:00')))
  })

  test('one minute later it no longer does', ({ assert }) => {
    assert.isFalse(canCancel(mondayClass, at('2026-11-15T18:01')))
    assert.isFalse(canCancel(mondayClass, at('2026-11-15T18:00:00.001')))
  })

  test('days ahead is fine; once started it is not', ({ assert }) => {
    assert.isTrue(canCancel(mondayClass, at('2026-11-11T09:41')))
    assert.isFalse(canCancel(mondayClass, at('2026-11-16T18:00')))
    assert.isFalse(canCancel(mondayClass, at('2026-11-17T10:00')))
  })

  test('counts in Buenos Aires time whatever zone "now" comes in', ({ assert }) => {
    // 21:00 UTC is 18:00 in Buenos Aires (UTC-3).
    assert.isTrue(canCancel(mondayClass, DateTime.fromISO('2026-11-15T21:00Z')))
    assert.isFalse(canCancel(mondayClass, DateTime.fromISO('2026-11-15T21:01Z')))
  })
})

async function world() {
  const catalog = await createCatalog()
  const schedule = await createSchedule(catalog, { weekday: 1, startTime: '18:00' })
  await schedule.merge({ capacity: 2 }).save()
  const student = await createStudent(catalog, { schedules: [schedule] })
  const booking = await createBooking(catalog, student, schedule, at('2026-11-16'))
  return { catalog, schedule, student, booking }
}

async function activeIn(classSessionId: number) {
  const bookings = await Booking.query()
    .where('classSessionId', classSessionId)
    .where('status', 'active')
  return bookings.length
}

test.group('Cancellation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const cancellation = new Cancellation()
  const onTime = at('2026-11-13T10:00')

  test('cancelling frees the place and gives a pending class', async ({ assert }) => {
    const { booking, student } = await world()

    const pending = await cancellation.cancel(booking, onTime)

    await booking.refresh()
    assert.equal(booking.status, 'cancelled')
    assert.equal(booking.cancelledAt?.toMillis(), onTime.toMillis())
    assert.equal(await activeIn(booking.classSessionId), 0)
    assert.equal(pending.originBookingId, booking.id)
    assert.equal(pending.planQuotaId, student.quota.id)
    assert.equal(pending.reason, 'cancelled')
    assert.equal(pending.expiresOn.toISODate(), '2026-11-29')
  })

  test('less than 24 h before is refused and changes nothing', async ({ assert }) => {
    const { booking } = await world()

    await assert.rejects(
      () => cancellation.cancel(booking, at('2026-11-15T18:01')),
      CancellationError
    )

    await booking.refresh()
    assert.equal(booking.status, 'active')
    assert.lengthOf(await PendingClass.query().where('originBookingId', booking.id), 0)
  })

  test('a booking cannot be cancelled twice', async ({ assert }) => {
    const { booking } = await world()
    await cancellation.cancel(booking, onTime)

    const error = await cancellation.cancel(booking, onTime).catch((reason) => reason)

    assert.instanceOf(error, CancellationError)
    assert.equal(error.reason, 'not_active')
    assert.lengthOf(await PendingClass.query().where('originBookingId', booking.id), 1)
  })

  test('a suspended class cannot be cancelled', async ({ assert }) => {
    const { booking } = await world()
    await booking.load('classSession')
    await booking.classSession.merge({ status: 'suspended' }).save()

    const error = await cancellation.cancel(booking, onTime).catch((reason) => reason)

    assert.equal(error.reason, 'suspended')
  })

  test('cancelling a booking made with a pending class gives that pending back', async ({
    assert,
  }) => {
    const { catalog, schedule, student, booking: origin } = await world()
    const used = await PendingClassFactory.merge({
      tenantId: catalog.tenant.id,
      userId: student.user.id,
      planQuotaId: student.quota.id,
      originBookingId: origin.id,
      expiresOn: at('2026-11-22'),
      status: 'used',
    }).create()
    const extra = await createBooking(catalog, student, schedule, at('2026-11-23'), {
      source: 'pending',
      pendingClassId: used.id,
    })

    const pending = await cancellation.cancel(extra, onTime)

    assert.equal(pending.id, used.id)
    await used.refresh()
    assert.equal(used.status, 'available')
    assert.equal(used.expiresOn.toISODate(), '2026-11-22')
    assert.lengthOf(await PendingClass.query().where('originBookingId', extra.id), 0)
  })

  test('undo brings the booking back and takes the pending class away', async ({ assert }) => {
    const { booking } = await world()
    const pending = await cancellation.cancel(booking, onTime)

    await cancellation.undo(booking, onTime.plus({ minutes: 1 }))

    await booking.refresh()
    await pending.refresh()
    assert.equal(booking.status, 'active')
    assert.isNull(booking.cancelledAt)
    assert.equal(pending.status, 'revoked')
    assert.equal(await activeIn(booking.classSessionId), 1)
  })

  test('undo is refused once the pending class was used', async ({ assert }) => {
    const { booking } = await world()
    const pending = await cancellation.cancel(booking, onTime)
    await pending.merge({ status: 'used' }).save()

    const error = await cancellation.undo(booking, onTime).catch((reason) => reason)

    assert.equal(error.reason, 'pending_used')
    await booking.refresh()
    assert.equal(booking.status, 'cancelled')
  })

  test('undo is refused when the class filled up meanwhile', async ({ assert }) => {
    const { catalog, schedule, booking } = await world()
    await cancellation.cancel(booking, onTime)
    for (const name of ['Juan Ponce', 'Ana Gómez']) {
      const other = await createStudent(catalog, { schedules: [schedule], fullName: name })
      await createBooking(catalog, other, schedule, at('2026-11-16'))
    }

    const error = await cancellation.undo(booking, onTime).catch((reason) => reason)

    assert.equal(error.reason, 'full')
    await booking.refresh()
    assert.equal(booking.status, 'cancelled')
  })

  test('undo is refused with less than 24 h left', async ({ assert }) => {
    const { booking } = await world()
    await cancellation.cancel(booking, onTime)

    const error = await cancellation.undo(booking, at('2026-11-15T18:01')).catch((reason) => reason)

    assert.equal(error.reason, 'too_late')
  })
})
