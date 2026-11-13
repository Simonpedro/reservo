import type ClassSchedule from '#models/class_schedule'
import PendingClass from '#models/pending_class'
import { agendaDate, nextDateOn } from '#services/admin_agenda'
import {
  deactivateSchedule,
  saveSchedule,
  ScheduleError,
  scheduleEditor,
  type ScheduleFailure,
  type ScheduleInput,
} from '#services/admin_schedules'
import { BUSINESS_ZONE } from '#services/business_calendar'
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

/**
 * Wednesday 11 November 2026, 9:41 in Buenos Aires.
 */
const now = DateTime.fromISO('2026-11-11T09:41', { zone: BUSINESS_ZONE })
const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

function inputOf(schedule: ClassSchedule, change: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    activityId: schedule.activityId,
    centerId: schedule.centerId,
    weekday: schedule.weekday,
    startTime: schedule.startTime,
    capacity: schedule.capacity,
    instructorName: schedule.instructorName,
    ...change,
  }
}

async function failure(promise: Promise<unknown>): Promise<ScheduleError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ScheduleError) return error
    throw error
  }
  throw new Error('Expected a ScheduleError')
}

/**
 * A Wednesday Pilates class for 10 with three people on fixed schedule and
 * one whose fixed schedule already ended.
 */
async function world() {
  const catalog = await createCatalog()
  const schedule = await createSchedule(catalog, { weekday: 3, startTime: '18:00', capacity: 10 })
  for (const fullName of ['Sofi Ortiz', 'Ana Ruiz', 'Juan Ponce']) {
    await createStudent(catalog, { schedules: [schedule], fullName })
  }
  await createStudent(catalog, {
    schedules: [schedule],
    fullName: 'Lu Martínez',
    slot: { startsOn: day('2026-09-01'), endsOn: day('2026-11-10') },
  })
  return { catalog, schedule }
}

test.group('Admin schedules · capacity and changes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('the capacity cannot go below the people with this fixed schedule', async ({ assert }) => {
    const { catalog, schedule } = await world()

    const error = await failure(
      saveSchedule(catalog.tenant.id, schedule.id, inputOf(schedule, { capacity: 2 }), now)
    )

    assert.equal(error.reason, 'capacity')
    assert.deepEqual(error.detail, { fixed: 3, requested: 2 })
    await schedule.refresh()
    assert.equal(schedule.capacity, 10)
  })

  test('the capacity can go down to exactly the people with this fixed schedule', async ({
    assert,
  }) => {
    const { catalog, schedule } = await world()

    await saveSchedule(
      catalog.tenant.id,
      schedule.id,
      inputOf(schedule, { capacity: 3, instructorName: 'Agus' }),
      now
    )

    await schedule.refresh()
    assert.equal(schedule.capacity, 3)
    assert.equal(schedule.instructorName, 'Agus')
  })

  test('day, center and activity are locked while someone has the class', async ({ assert }) => {
    const { catalog, schedule } = await world()
    const changes: Partial<ScheduleInput>[] = [
      { weekday: 4 },
      { centerId: catalog.ovidio.id },
      { activityId: catalog.yoga.id },
    ]

    for (const change of changes) {
      const error = await failure(
        saveSchedule(catalog.tenant.id, schedule.id, inputOf(schedule, change), now)
      )
      assert.equal(error.reason, 'locked')
    }

    await saveSchedule(
      catalog.tenant.id,
      schedule.id,
      inputOf(schedule, { startTime: '18:30' }),
      now
    )
    await schedule.refresh()
    assert.equal(schedule.weekday, 3)
    assert.equal(schedule.startTime, '18:30')
  })

  test('a booking ahead from a pending class also locks the day', async ({ assert }) => {
    const catalog = await createCatalog()
    const schedule = await createSchedule(catalog, { weekday: 3 })
    const student = await createStudent(catalog)
    await createBooking(catalog, student, schedule, day('2026-11-18'), { source: 'pending' })

    const error = await failure(
      saveSchedule(catalog.tenant.id, schedule.id, inputOf(schedule, { weekday: 5 }), now)
    )
    assert.equal(error.reason, 'locked')
  })

  test('a class nobody uses can move to another day', async ({ assert }) => {
    const catalog = await createCatalog()
    const schedule = await createSchedule(catalog, { weekday: 3 })
    const student = await createStudent(catalog)
    await createBooking(catalog, student, schedule, day('2026-11-04'))

    await saveSchedule(
      catalog.tenant.id,
      schedule.id,
      inputOf(schedule, { weekday: 5, centerId: catalog.ovidio.id }),
      now
    )

    await schedule.refresh()
    assert.equal(schedule.weekday, 5)
    assert.equal(schedule.centerId, catalog.ovidio.id)
  })

  test('creates a class only with an activity and center of the tenant', async ({ assert }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const input: ScheduleInput = {
      activityId: catalog.yoga.id,
      centerId: catalog.ovidio.id,
      weekday: 2,
      startTime: '08:00',
      capacity: 12,
      instructorName: 'Mica',
    }

    const created = await saveSchedule(catalog.tenant.id, null, input, now)
    assert.containsSubset(created!.serialize(), { ...input, active: true })

    const foreign: [Partial<ScheduleInput>, ScheduleFailure][] = [
      [{ activityId: other.yoga.id }, 'unknown'],
      [{ centerId: other.ovidio.id }, 'unknown'],
    ]
    for (const [change, reason] of foreign) {
      const error = await failure(
        saveSchedule(catalog.tenant.id, null, { ...input, ...change }, now)
      )
      assert.equal(error.reason, reason)
    }
    assert.isNull(
      await saveSchedule(
        other.tenant.id,
        created!.id,
        { ...input, activityId: other.yoga.id, centerId: other.ovidio.id },
        now
      )
    )
  })

  test('the editor lists who has the class as fixed schedule, of this tenant only', async ({
    assert,
  }) => {
    const { catalog, schedule } = await world()
    const other = await createCatalog()

    const editor = await scheduleEditor(catalog.tenant.id, schedule.id, now)

    assert.deepEqual(
      editor!.fixedStudents.map((student) => student.fullName),
      ['Ana Ruiz', 'Juan Ponce', 'Sofi Ortiz']
    )
    assert.isTrue(editor!.locked)
    assert.isNull(await scheduleEditor(other.tenant.id, schedule.id, now))
  })
})

test.group('Admin schedules · deactivate', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('cannot deactivate a class someone has as fixed schedule', async ({ assert }) => {
    const { catalog, schedule } = await world()

    const error = await failure(deactivateSchedule(catalog.tenant.id, schedule.id, now))

    assert.equal(error.reason, 'has_fixed')
    await schedule.refresh()
    assert.isTrue(schedule.active)
  })

  test('deactivating gives back the pending classes booked ahead', async ({ assert }) => {
    const catalog = await createCatalog()
    const schedule = await createSchedule(catalog, { weekday: 3, startTime: '18:00' })
    const monday = await createSchedule(catalog, { weekday: 1 })
    const sofi = await createStudent(catalog, { schedules: [monday] })
    const pending = await createPendingClass(catalog, sofi, {
      schedule: monday,
      missedOn: day('2026-11-09'),
      expiresOn: day('2026-11-22'),
    })
    const booking = await createBooking(catalog, sofi, schedule, day('2026-11-18'), {
      source: 'pending',
      pendingClassId: pending.id,
    })
    await pending.merge({ status: 'used', usedBookingId: booking.id }).save()
    const past = await createBooking(catalog, sofi, schedule, day('2026-11-04'))

    assert.isTrue(await deactivateSchedule(catalog.tenant.id, schedule.id, now))

    await schedule.refresh()
    await booking.refresh()
    await pending.refresh()
    assert.isFalse(schedule.active)
    assert.equal(booking.status, 'suspended')
    assert.equal(pending.status, 'available')
    await past.refresh()
    assert.equal(past.status, 'active')
    assert.lengthOf(await PendingClass.query().where('userId', sofi.user.id), 1)
  })
})

test.group('Admin agenda · dates', () => {
  test('a requested date counts only within the two weeks from today', ({ assert }) => {
    const today = '2026-11-11'
    assert.equal(agendaDate('2026-11-18', today), '2026-11-18')
    assert.equal(agendaDate('2026-11-24', today), '2026-11-24')
    assert.equal(agendaDate('2026-11-25', today), today)
    assert.equal(agendaDate('2026-11-10', today), today)
    assert.equal(agendaDate('mañana', today), today)
    assert.equal(agendaDate(undefined, today), today)
  })

  test('the next date of a weekday starts today', ({ assert }) => {
    assert.equal(nextDateOn('2026-11-11', 3), '2026-11-11')
    assert.equal(nextDateOn('2026-11-11', 4), '2026-11-12')
    assert.equal(nextDateOn('2026-11-11', 1), '2026-11-16')
    assert.equal(nextDateOn('2026-11-15', 7), '2026-11-15')
  })
})
