import Booking from '#models/booking'
import Closure from '#models/closure'
import PendingClass from '#models/pending_class'
import { BUSINESS_ZONE } from '#services/business_calendar'
import Cancellation from '#services/cancellation'
import { findOrCreateSession } from '#services/class_sessions'
import PendingEligibility, {
  fits,
  PendingUseError,
  type PendingRules,
  type SessionOption,
} from '#services/pending_eligibility'
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
import { DateTime } from 'luxon'

const at = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

/**
 * Thursday 12 November 2026, 10:00 in Buenos Aires.
 */
const now = at('2026-11-12T10:00')

test.group('A pending class fits a class', () => {
  const rules: PendingRules = {
    activities: new Set([1]),
    today: '2026-11-12',
    expiresOn: '2026-11-29',
    now,
    closed: new Set(['2026-11-20:*', '2026-11-23:7']),
  }
  const pilates = { date: '2026-11-17', startTime: '18:00', activityId: 1, centerId: 7 }

  test('of the quota activity, inside the window', ({ assert }) => {
    assert.isTrue(fits(rules, pilates))
    assert.isFalse(fits(rules, { ...pilates, activityId: 2 }))
    assert.isTrue(fits({ ...rules, activities: null }, { ...pilates, activityId: 2 }))
  })

  test('until the expiry day inclusive, never after', ({ assert }) => {
    assert.isTrue(fits(rules, { ...pilates, date: '2026-11-29', startTime: '21:00' }))
    assert.isFalse(fits(rules, { ...pilates, date: '2026-11-30', startTime: '07:00' }))
  })

  test('only if it has not started yet', ({ assert }) => {
    assert.isTrue(fits(rules, { ...pilates, date: '2026-11-12', startTime: '10:01' }))
    assert.isFalse(fits(rules, { ...pilates, date: '2026-11-12', startTime: '10:00' }))
    assert.isFalse(fits(rules, { ...pilates, date: '2026-11-11', startTime: '18:00' }))
  })

  test('not on a closed day, for every center or for its own', ({ assert }) => {
    assert.isFalse(fits(rules, { ...pilates, date: '2026-11-20' }))
    assert.isFalse(fits(rules, { ...pilates, date: '2026-11-23' }))
    assert.isTrue(fits(rules, { ...pilates, date: '2026-11-23', centerId: 8 }))
  })
})

/**
 * Kinaf's week: Pilates Thursday 18:00 (Mendoza), Gimnasio Thursday 19:00
 * and Yoga Monday 19:00 (Ovidio Lagos). The student missed a Yoga class on
 * Monday 16, so the pending class lasts until Sunday 29.
 */
async function world() {
  const catalog = await createCatalog()
  const pilates = await createSchedule(catalog, { weekday: 4, startTime: '18:00' })
  const gym = await createSchedule(catalog, {
    weekday: 4,
    startTime: '19:00',
    activity: catalog.gym,
    center: catalog.ovidio,
  })
  const yoga = await createSchedule(catalog, {
    weekday: 1,
    startTime: '19:00',
    activity: catalog.yoga,
    center: catalog.ovidio,
  })
  const student = await createStudent(catalog, { schedules: [yoga] })
  return { catalog, pilates, gym, yoga, student }
}

type World = Awaited<ReturnType<typeof world>>

function pendingFor(
  { catalog, student, yoga }: World,
  quota?: Awaited<ReturnType<typeof createQuota>>
) {
  return createPendingClass(catalog, student, {
    schedule: yoga,
    missedOn: at('2026-11-16'),
    expiresOn: at('2026-11-29'),
    quota,
  })
}

/**
 * Options as "Pilates Thu 12 18:00".
 */
function names(options: SessionOption[]) {
  return options.map(
    (option) =>
      `${option.schedule.activity.name} ${option.session.date.toISODate()} ${option.schedule.startTime}`
  )
}

async function fill(catalog: Catalog, schedule: World['pilates'], date: string, people: number) {
  for (let index = 0; index < people; index++) {
    const other = await createStudent(catalog)
    await createBooking(catalog, other, schedule, at(date), { source: 'pending' })
  }
}

test.group('Where a pending class can be used', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const eligibility = new PendingEligibility()

  test('"1 Yoga + 1 Pilates" that loses Yoga recovers only Yoga', async ({ assert }) => {
    const w = await world()
    const yogaQuota = await createQuota(w.catalog, w.student, [w.catalog.yoga])
    await createQuota(w.catalog, w.student, [w.catalog.pilates])
    const pending = await pendingFor(w, yogaQuota)

    const options = await eligibility.eligible(pending, now)

    // Monday 16 is the missed class itself: the student no longer has it.
    assert.deepEqual(names(options), ['Yoga 2026-11-16 19:00', 'Yoga 2026-11-23 19:00'])
  })

  test('"2 de Yoga o Pilates" recovers either', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(
      w,
      await createQuota(w.catalog, w.student, [w.catalog.yoga, w.catalog.pilates])
    )

    const options = await eligibility.eligible(pending, now)

    assert.deepEqual(names(options), [
      'Pilates 2026-11-12 18:00',
      'Yoga 2026-11-16 19:00',
      'Pilates 2026-11-19 18:00',
      'Yoga 2026-11-23 19:00',
      'Pilates 2026-11-26 18:00',
    ])
  })

  test('a free quota recovers any activity', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)

    const options = await eligibility.eligible(pending, now)

    assert.includeMembers(names(options), [
      'Pilates 2026-11-12 18:00',
      'Gimnasio 2026-11-12 19:00',
      'Yoga 2026-11-23 19:00',
    ])
    assert.lengthOf(options, 8)
  })

  test('can be used before the missed date, never after the expiry', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)

    const options = await eligibility.eligible(pending, now)
    const dates = options.map((option) => option.session.date.toISODate()!)

    assert.include(dates, '2026-11-12')
    assert.isTrue(dates.every((date) => date <= '2026-11-29'))
    // The day after the expiry nothing is offered.
    assert.deepEqual(await eligibility.eligible(pending, at('2026-11-30T08:00')), [])
  })

  test('a class that already started is not offered', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)

    const options = await eligibility.eligible(pending, at('2026-11-12T18:30'))

    assert.notInclude(names(options), 'Pilates 2026-11-12 18:00')
    assert.include(names(options), 'Gimnasio 2026-11-12 19:00')
  })

  test('a full class is listed as full but is not eligible', async ({ assert }) => {
    const w = await world()
    await w.pilates.merge({ capacity: 2 }).save()
    await fill(w.catalog, w.pilates, '2026-11-19', 2)
    await fill(w.catalog, w.pilates, '2026-11-26', 1)
    const pending = await pendingFor(w)

    const listed = await eligibility.options(pending, now)
    const eligible = await eligibility.eligible(pending, now)

    const thursday19 = listed.find(
      (option) =>
        option.session.date.toISODate() === '2026-11-19' && option.schedule.id === w.pilates.id
    )
    assert.equal(thursday19?.freeSpots, 0)
    assert.notInclude(names(eligible), 'Pilates 2026-11-19 18:00')
    const thursday26 = eligible.find(
      (option) =>
        option.session.date.toISODate() === '2026-11-26' && option.schedule.id === w.pilates.id
    )
    assert.equal(thursday26?.freeSpots, 1)
  })

  test('suspended classes, closed days and the student own classes are left out', async ({
    assert,
  }) => {
    const w = await world()
    const pending = await pendingFor(w)
    const suspended = await findOrCreateSession(w.gym, '2026-11-19')
    await suspended.merge({ status: 'suspended', suspensionReason: 'Feriado' }).save()
    await Closure.create({
      tenantId: w.catalog.tenant.id,
      date: at('2026-11-26'),
      centerId: null,
      reason: 'Feriado',
    })
    await createBooking(w.catalog, w.student, w.yoga, at('2026-11-23'))

    const options = names(await eligibility.eligible(pending, now))

    assert.notInclude(options, 'Gimnasio 2026-11-19 19:00')
    assert.include(options, 'Pilates 2026-11-19 18:00')
    assert.notInclude(options, 'Pilates 2026-11-26 18:00')
    assert.notInclude(options, 'Yoga 2026-11-23 19:00')
  })

  test('a used pending class fits nothing', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)

    await pending.merge({ status: 'used' }).save()
    assert.deepEqual(await eligibility.options(pending, now), [])
  })

  test('the next pending class is the one that expires first', async ({ assert }) => {
    const w = await world()
    const later = await pendingFor(w)
    const sooner = await createPendingClass(w.catalog, w.student, {
      schedule: w.pilates,
      missedOn: at('2026-11-05'),
      expiresOn: at('2026-11-15'),
    })

    const first = await eligibility.next(w.student.user, '2026-11-12')
    const afterItExpires = await eligibility.next(w.student.user, '2026-11-16')

    assert.equal(first?.id, sooner.id)
    assert.equal(afterItExpires?.id, later.id)
  })
})

test.group('Using a pending class', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const eligibility = new PendingEligibility()

  async function sessionOf(schedule: World['pilates'], date: string) {
    return findOrCreateSession(schedule, date)
  }

  test('books the class by hand and marks the pending class as used', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)
    const session = await sessionOf(w.pilates, '2026-11-19')

    const booking = await eligibility.use(w.student.user, pending.id, session.id, now)

    assert.equal(booking.source, 'pending')
    assert.equal(booking.status, 'active')
    assert.equal(booking.pendingClassId, pending.id)
    assert.equal(booking.planQuotaId, pending.planQuotaId)
    assert.isNull(booking.fixedSlotId)
    await pending.refresh()
    assert.equal(pending.status, 'used')
    assert.equal(pending.usedBookingId, booking.id)
  })

  test('cancelling it on time gives the same pending class back', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)
    const session = await sessionOf(w.pilates, '2026-11-19')
    const booking = await eligibility.use(w.student.user, pending.id, session.id, now)

    await new Cancellation().cancel(booking, now.plus({ hours: 1 }))

    await pending.refresh()
    assert.equal(pending.status, 'available')
    assert.isNull(pending.usedBookingId)
    assert.equal(pending.expiresOn.toISODate(), '2026-11-29')
    assert.lengthOf(await PendingClass.query().where('userId', w.student.user.id), 1)
  })

  test('refuses an activity outside the quota', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w, await createQuota(w.catalog, w.student, [w.catalog.yoga]))
    const session = await sessionOf(w.pilates, '2026-11-19')

    const error = await eligibility.use(w.student.user, pending.id, session.id, now).catch((e) => e)

    assert.instanceOf(error, PendingUseError)
    assert.equal(error.reason, 'not_allowed')
    await pending.refresh()
    assert.equal(pending.status, 'available')
  })

  test('refuses a full class', async ({ assert }) => {
    const w = await world()
    await w.pilates.merge({ capacity: 1 }).save()
    await fill(w.catalog, w.pilates, '2026-11-19', 1)
    const pending = await pendingFor(w)
    const session = await sessionOf(w.pilates, '2026-11-19')

    const error = await eligibility.use(w.student.user, pending.id, session.id, now).catch((e) => e)

    assert.equal(error.reason, 'full')
    const active = await Booking.query()
      .where('classSessionId', session.id)
      .where('status', 'active')
    assert.lengthOf(active, 1)
  })

  test('refuses a class the student already has', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)
    const session = await sessionOf(w.yoga, '2026-11-23')
    await createBooking(w.catalog, w.student, w.yoga, at('2026-11-23'))

    const error = await eligibility.use(w.student.user, pending.id, session.id, now).catch((e) => e)

    assert.equal(error.reason, 'already_booked')
  })

  test('refuses past classes and classes after the expiry', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)
    const past = await sessionOf(w.pilates, '2026-11-05')
    const late = await sessionOf(w.pilates, '2026-12-03')

    for (const session of [past, late]) {
      const error = await eligibility
        .use(w.student.user, pending.id, session.id, now)
        .catch((e) => e)
      assert.equal(error.reason, 'unavailable')
    }
  })

  test('refuses an expired pending class or one of another student', async ({ assert }) => {
    const w = await world()
    const pending = await pendingFor(w)
    const session = await sessionOf(w.pilates, '2026-11-19')
    const other = await createStudent(w.catalog)

    const foreign = await eligibility.use(other.user, pending.id, session.id, now).catch((e) => e)
    const expired = await eligibility
      .use(w.student.user, pending.id, session.id, at('2026-11-30T08:00'))
      .catch((e) => e)

    assert.equal(foreign.reason, 'pending_unavailable')
    assert.equal(expired.reason, 'pending_unavailable')
  })
})
