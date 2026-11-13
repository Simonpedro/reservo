import ClassSession from '#models/class_session'
import PendingClass from '#models/pending_class'
import { BUSINESS_ZONE } from '#services/business_calendar'
import { longDateLabel } from '#services/admin_classes'
import Attendance, { AttendanceError } from '#services/attendance'
import SessionSuspension, { SessionSuspensionError } from '#services/session_suspension'
import {
  createBooking,
  createCatalog,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Wednesday 11 November 2026: its pending classes last until Sunday 22.
 */
const wednesday = DateTime.fromISO('2026-11-11', { zone: BUSINESS_ZONE })

async function yogaClass(capacity = 10) {
  const catalog = await createCatalog()
  const schedule = await createSchedule(catalog, { weekday: 3, startTime: '19:00', capacity })
  const signUp = async (fullName: string) => {
    const student = await createStudent(catalog, { schedules: [schedule], fullName })
    const booking = await createBooking(catalog, student, schedule, wednesday)
    return { ...student, booking }
  }
  return { catalog, schedule, signUp }
}

test.group('Attendance', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the pending class of an absence lasts until the Sunday of the next week', async ({
    assert,
  }) => {
    const { signUp } = await yogaClass()
    const juan = await signUp('Juan Ponce')

    const pending = await new Attendance().markAbsent(juan.booking)

    assert.equal(pending.missedOn.toISODate(), '2026-11-11')
    assert.equal(pending.expiresOn.toISODate(), '2026-11-22')
  })

  test('only an active booking can be marked absent', async ({ assert }) => {
    const { signUp } = await yogaClass()
    const juan = await signUp('Juan Ponce')
    await juan.booking.merge({ status: 'cancelled' }).save()

    await assert.rejects(() => new Attendance().markAbsent(juan.booking), AttendanceError)
    assert.lengthOf(await PendingClass.query().where('userId', juan.user.id), 0)
  })

  test('nobody is marked absent in a suspended class', async ({ assert }) => {
    const { signUp } = await yogaClass()
    const juan = await signUp('Juan Ponce')
    await ClassSession.query()
      .where('id', juan.booking.classSessionId)
      .update({ status: 'suspended' })

    const error = await new Attendance().markAbsent(juan.booking).catch((caught) => caught)
    assert.instanceOf(error, AttendanceError)
    assert.equal(error.reason, 'suspended')
  })

  test('undo fails when the freed place was taken meanwhile', async ({ assert }) => {
    const { signUp } = await yogaClass(1)
    const juan = await signUp('Juan Ponce')
    await new Attendance().markAbsent(juan.booking)
    await signUp('Ana Gómez')

    const error = await new Attendance().undoAbsent(juan.booking).catch((caught) => caught)
    assert.instanceOf(error, AttendanceError)
    assert.equal(error.reason, 'full')
    await juan.booking.refresh()
    assert.equal(juan.booking.status, 'absent')
    const pending = await PendingClass.query().where('userId', juan.user.id).firstOrFail()
    assert.equal(pending.status, 'available')
  })
})

test.group('Session suspension', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('absent bookings keep their pending class and are not suspended', async ({ assert }) => {
    const { signUp } = await yogaClass()
    const juan = await signUp('Juan Ponce')
    const ana = await signUp('Ana Gómez')
    await new Attendance().markAbsent(juan.booking)
    const session = await ClassSession.findOrFail(ana.booking.classSessionId)

    const suspended = await new SessionSuspension().suspend(session)

    assert.equal(suspended, 1)
    await juan.booking.refresh()
    assert.equal(juan.booking.status, 'absent')
    const juans = await PendingClass.query().where('userId', juan.user.id)
    assert.deepEqual(
      juans.map((pending) => pending.reason),
      ['absent']
    )
  })

  test('an empty class can be suspended, but only once', async ({ assert }) => {
    const { catalog, schedule } = await yogaClass()
    const session = await ClassSession.create({
      tenantId: catalog.tenant.id,
      classScheduleId: schedule.id,
      date: wednesday,
      status: 'scheduled',
    })

    assert.equal(await new SessionSuspension().suspend(session), 0)
    await assert.rejects(() => new SessionSuspension().suspend(session), SessionSuspensionError)
  })
})

test.group('Admin dates', () => {
  test('Hoy reads the date in full, in Spanish', ({ assert }) => {
    assert.equal(longDateLabel('2026-11-11'), 'Miércoles 11 de noviembre')
  })
})
