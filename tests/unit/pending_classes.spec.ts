import { PendingClassFactory } from '#database/factories/booking_factories'
import { PlanQuotaFactory } from '#database/factories/plan_factories'
import type PendingClass from '#models/pending_class'
import { BUSINESS_ZONE } from '#services/business_calendar'
import PendingClasses, { expiryFor } from '#services/pending_classes'
import {
  createBooking,
  createCatalog,
  createPendingClass,
  createQuota,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

test.group('Pending class expiry', () => {
  test('a missed Monday expires on the Sunday of the following week', ({ assert }) => {
    assert.equal(expiryFor('2026-11-16'), '2026-11-29')
  })

  test('any day of the same week expires on that same Sunday', ({ assert }) => {
    for (const missedOn of ['2026-11-17', '2026-11-19', '2026-11-21']) {
      assert.equal(expiryFor(missedOn), '2026-11-29', missedOn)
    }
  })

  test('a missed Sunday still belongs to its week: next Sunday', ({ assert }) => {
    assert.equal(expiryFor('2026-11-22'), '2026-11-29')
  })

  test('the Monday after starts a new week: two Sundays later', ({ assert }) => {
    assert.equal(expiryFor('2026-11-23'), '2026-12-06')
  })

  test('crosses months and years', ({ assert }) => {
    assert.equal(expiryFor('2026-11-25'), '2026-12-06')
    assert.equal(expiryFor('2026-12-28'), '2027-01-10')
  })
})

test.group('PendingClasses', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const pendings = new PendingClasses()

  test('grants a pending class tied to the booking quota and date', async ({ assert }) => {
    const catalog = await createCatalog()
    const schedule = await createSchedule(catalog, { weekday: 1 })
    const student = await createStudent(catalog, { schedules: [schedule] })
    const booking = await createBooking(catalog, student, schedule, day('2026-11-16'))

    const pending = await pendings.grantFor(booking, 'cancelled')

    await pending.refresh()
    assert.containsSubset(pending.serialize(), {
      tenantId: catalog.tenant.id,
      userId: student.user.id,
      planQuotaId: student.quota.id,
      originBookingId: booking.id,
      reason: 'cancelled',
      status: 'available',
      usedBookingId: null,
    })
    assert.equal(pending.missedOn.toISODate(), '2026-11-16')
    assert.equal(pending.expiresOn.toISODate(), '2026-11-29')
  })

  test('only available, unexpired pending classes count', async ({ assert }) => {
    const catalog = await createCatalog()
    const student = await createStudent(catalog)
    const base = {
      tenantId: catalog.tenant.id,
      userId: student.user.id,
      planQuotaId: student.quota.id,
    }
    const schedule = await createSchedule(catalog)
    const origin = await createBooking(catalog, student, schedule, day('2026-11-16'))
    const make = (expiresOn: string, status: PendingClass['status'] = 'available') =>
      PendingClassFactory.merge({
        ...base,
        originBookingId: origin.id,
        expiresOn: day(expiresOn),
        status,
      }).create()
    await make('2026-11-29')
    await make('2026-11-22')
    await make('2026-11-21')
    await make('2026-12-06', 'used')
    await make('2026-12-06', 'revoked')

    const summary = await pendings.summaryFor(student.user, '2026-11-22')

    assert.deepEqual(summary, {
      count: 2,
      expiresOn: '2026-11-22',
      groups: [
        { count: 1, activities: null, expiresOn: '2026-11-22' },
        { count: 1, activities: null, expiresOn: '2026-11-29' },
      ],
    })
    assert.isNull(await pendings.summaryFor(student.user, '2026-11-30'))
  })

  test('lists the activities of specific quotas', async ({ assert }) => {
    const catalog = await createCatalog()
    const student = await createStudent(catalog)
    const yogaQuota = await PlanQuotaFactory.merge({
      tenantId: catalog.tenant.id,
      planId: student.plan.id,
      anyActivity: false,
    }).create()
    await yogaQuota.related('activities').attach({
      [catalog.yoga.id]: { tenant_id: catalog.tenant.id },
      [catalog.pilates.id]: { tenant_id: catalog.tenant.id },
    })
    const schedule = await createSchedule(catalog)
    const origin = await createBooking(catalog, student, schedule, day('2026-11-16'))
    await PendingClassFactory.merge({
      tenantId: catalog.tenant.id,
      userId: student.user.id,
      planQuotaId: yogaQuota.id,
      originBookingId: origin.id,
      expiresOn: day('2026-11-29'),
    }).create()

    const summary = await pendings.summaryFor(student.user, '2026-11-20')

    assert.deepEqual(summary?.groups, [
      { count: 1, activities: ['Pilates', 'Yoga'], expiresOn: '2026-11-29' },
    ])
  })

  test('groups them by activities and expiry, the soonest first', async ({ assert }) => {
    const catalog = await createCatalog()
    const student = await createStudent(catalog)
    const schedule = await createSchedule(catalog)
    const yoga = await createQuota(catalog, student, [catalog.yoga])
    const gymOrPilates = await createQuota(catalog, student, [catalog.pilates, catalog.gym])
    const pending = (quota: typeof yoga, missedOn: string, expiresOn: string) =>
      createPendingClass(catalog, student, {
        schedule,
        missedOn: day(missedOn),
        expiresOn: day(expiresOn),
        quota,
      })
    await pending(yoga, '2026-11-16', '2026-11-29')
    await pending(gymOrPilates, '2026-11-12', '2026-11-22')
    await pending(gymOrPilates, '2026-11-13', '2026-11-22')

    const summary = await pendings.summaryFor(student.user, '2026-11-20')

    assert.equal(summary?.count, 3)
    assert.equal(summary?.expiresOn, '2026-11-22')
    assert.deepEqual(summary?.groups, [
      { count: 2, activities: ['Gimnasio', 'Pilates'], expiresOn: '2026-11-22' },
      { count: 1, activities: ['Yoga'], expiresOn: '2026-11-29' },
    ])
  })

  test("never counts another student's pending classes", async ({ assert }) => {
    const catalog = await createCatalog()
    const sofi = await createStudent(catalog)
    const juan = await createStudent(catalog)
    const schedule = await createSchedule(catalog)
    const origin = await createBooking(catalog, juan, schedule, day('2026-11-16'))
    await PendingClassFactory.merge({
      tenantId: catalog.tenant.id,
      userId: juan.user.id,
      planQuotaId: juan.quota.id,
      originBookingId: origin.id,
      expiresOn: day('2026-11-29'),
    }).create()

    assert.isNull(await pendings.summaryFor(sofi.user, '2026-11-20'))
  })
})
