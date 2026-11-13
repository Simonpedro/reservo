import { FixedSlotFactory, SubscriptionFactory } from '#database/factories/plan_factories'
import { UserFactory } from '#database/factories/user_factory'
import Booking from '#models/booking'
import FixedSlot from '#models/fixed_slot'
import PendingClass from '#models/pending_class'
import Subscription from '#models/subscription'
import BookingGenerator from '#services/booking_generator'
import { BUSINESS_ZONE } from '#services/business_calendar'
import ScheduleAssignment, {
  AssignmentError,
  nextMonday,
  selectionError,
  type QuotaRule,
  type ScheduleSeat,
} from '#services/schedule_assignment'
import {
  createBooking,
  createCatalog,
  createPendingClass,
  createPlan,
  createSchedule,
  createStudent,
  type Catalog,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const MON = 1
const WED = 3
const THU = 4
const FRI = 5

/**
 * Wednesday 11 November 2026, 9:41 in Buenos Aires. Next Monday is the 16th.
 */
const now = DateTime.fromISO('2026-11-11T09:41', { zone: BUSINESS_ZONE })
const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

const yogaOnly: QuotaRule = {
  id: 1,
  weeklyCount: 1,
  anyActivity: false,
  activityIds: [20],
  label: '1 clase de Yoga',
}
const twoFree: QuotaRule = {
  id: 2,
  weeklyCount: 2,
  anyActivity: true,
  activityIds: [],
  label: '2 clases libres',
}

function seat(id: number, activityId: number, free = 3, active = true): [number, ScheduleSeat] {
  return [id, { id, activityId, active, free, label: `Clase ${id}` }]
}

const seats = new Map([seat(100, 20), seat(101, 10), seat(102, 30), seat(103, 10, 0)])

test.group('Assignment selection rules', () => {
  test('accepts exactly the weekly count of each quota', ({ assert }) => {
    assert.isNull(
      selectionError(
        [yogaOnly, twoFree],
        [
          { quotaId: 1, scheduleIds: [100] },
          { quotaId: 2, scheduleIds: [101, 102] },
        ],
        seats
      )
    )
  })

  test('rejects fewer or more schedules than the quota', ({ assert }) => {
    assert.equal(
      selectionError([twoFree], [{ quotaId: 2, scheduleIds: [101] }], seats),
      'Elegí 2 horarios para 2 clases libres.'
    )
    assert.equal(
      selectionError([twoFree], [{ quotaId: 2, scheduleIds: [100, 101, 102] }], seats),
      'Elegí 2 horarios para 2 clases libres.'
    )
    assert.equal(selectionError([yogaOnly], [], seats), 'Elegí 1 horario para 1 clase de Yoga.')
  })

  test('rejects a class of an activity the quota does not include', ({ assert }) => {
    assert.equal(
      selectionError([yogaOnly], [{ quotaId: 1, scheduleIds: [101] }], seats),
      'Clase 101 no es de una actividad de 1 clase de Yoga.'
    )
  })

  test('rejects a class with no free fixed place', ({ assert }) => {
    assert.equal(
      selectionError([twoFree], [{ quotaId: 2, scheduleIds: [101, 103] }], seats),
      'Clase 103 está completo.'
    )
  })

  test('rejects the same class twice, even across quotas', ({ assert }) => {
    assert.equal(
      selectionError(
        [yogaOnly, twoFree],
        [
          { quotaId: 1, scheduleIds: [100] },
          { quotaId: 2, scheduleIds: [100, 101] },
        ],
        seats
      ),
      'Elegiste dos veces Clase 100.'
    )
  })

  test('rejects inactive or unknown classes and quotas of another plan', ({ assert }) => {
    const withInactive = new Map([...seats, seat(104, 10, 3, false)])
    assert.equal(
      selectionError([twoFree], [{ quotaId: 2, scheduleIds: [101, 104] }], withInactive),
      'Uno de los horarios ya no existe.'
    )
    assert.equal(
      selectionError([twoFree], [{ quotaId: 2, scheduleIds: [101, 999] }], seats),
      'Uno de los horarios ya no existe.'
    )
    assert.equal(
      selectionError(
        [twoFree],
        [
          { quotaId: 2, scheduleIds: [101, 102] },
          { quotaId: 7, scheduleIds: [100] },
        ],
        seats
      ),
      'Ese cupo no es del plan elegido.'
    )
  })

  test('next Monday is always in the coming week', ({ assert }) => {
    assert.equal(nextMonday('2026-11-11'), '2026-11-16')
    assert.equal(nextMonday('2026-11-15'), '2026-11-16')
    assert.equal(nextMonday('2026-11-16'), '2026-11-23')
  })
})

async function bookingsOf(userId: number) {
  const bookings = await Booking.query()
    .where('userId', userId)
    .preload('classSession')
    .orderBy('id')
  return bookings
    .map((booking) => ({
      date: booking.classSession.date.toISODate()!,
      scheduleId: booking.classSession.classScheduleId,
      status: booking.status,
      source: booking.source,
      fixedSlotId: booking.fixedSlotId,
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function datesWhere(
  rows: Awaited<ReturnType<typeof bookingsOf>>,
  scheduleId: number,
  status: Booking['status']
) {
  return rows
    .filter((row) => row.scheduleId === scheduleId && row.status === status)
    .map((row) => row.date)
}

async function otherStudentIn(catalog: Catalog, scheduleId: number, endsOn: DateTime | null) {
  const other = await createStudent(catalog)
  await FixedSlotFactory.merge({
    tenantId: catalog.tenant.id,
    subscriptionId: other.subscription.id,
    userId: other.user.id,
    planQuotaId: other.quota.id,
    classScheduleId: scheduleId,
    endsOn,
  }).create()
}

test.group('ScheduleAssignment', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  const service = new ScheduleAssignment()

  test('a student with no plan gets the plan, the slots and the bookings from the date', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const yogaMon = await createSchedule(catalog, { weekday: MON, activity: catalog.yoga })
    const pilatesThu = await createSchedule(catalog, { weekday: THU, activity: catalog.pilates })
    const { plan, quotas } = await createPlan(catalog, [
      { count: 1, activities: [catalog.yoga] },
      { count: 1, activities: [catalog.pilates] },
    ])
    const user = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()

    const result = await service.assign(
      catalog.tenant.id,
      user.id,
      {
        planId: plan.id,
        startsOn: '2026-11-16',
        quotas: [
          { quotaId: quotas[0].id, scheduleIds: [yogaMon.id] },
          { quotaId: quotas[1].id, scheduleIds: [pilatesThu.id] },
        ],
      },
      now
    )

    assert.equal(result.subscription.planId, plan.id)
    assert.equal(result.subscription.startsOn.toISODate(), '2026-11-16')
    assert.isNull(result.subscription.endsOn)
    assert.lengthOf(result.slots, 2)
    assert.equal(result.generated, 7)

    const rows = await bookingsOf(user.id)
    assert.deepEqual(datesWhere(rows, yogaMon.id, 'active'), [
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
      '2026-12-07',
    ])
    assert.deepEqual(datesWhere(rows, pilatesThu.id, 'active'), [
      '2026-11-19',
      '2026-11-26',
      '2026-12-03',
    ])
  })

  test('changing the plan keeps bookings before the date and regenerates after it', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const pilatesMon = await createSchedule(catalog, { weekday: MON, activity: catalog.pilates })
    const yogaWed = await createSchedule(catalog, { weekday: WED, activity: catalog.yoga })
    const gymFri = await createSchedule(catalog, { weekday: FRI, activity: catalog.gym })
    const yogaThu = await createSchedule(catalog, { weekday: THU, activity: catalog.yoga })
    const student = await createStudent(catalog, { schedules: [pilatesMon, yogaWed] })
    await new BookingGenerator().generate({ tenantId: catalog.tenant.id, now })

    const pending = await createPendingClass(catalog, student, {
      schedule: yogaWed,
      missedOn: day('2026-11-04'),
      expiresOn: day('2026-11-15'),
    })
    await createBooking(catalog, student, yogaThu, day('2026-11-19'), { source: 'pending' })

    const { plan, quotas } = await createPlan(catalog, [{ count: 2 }])
    const result = await service.assign(
      catalog.tenant.id,
      student.user.id,
      {
        planId: plan.id,
        startsOn: '2026-11-16',
        quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilatesMon.id, gymFri.id] }],
      },
      now
    )

    const rows = await bookingsOf(student.user.id)
    assert.deepEqual(datesWhere(rows, yogaWed.id, 'active'), ['2026-11-11'])
    assert.deepEqual(datesWhere(rows, yogaWed.id, 'cancelled'), [
      '2026-11-04',
      '2026-11-18',
      '2026-11-25',
      '2026-12-02',
    ])
    assert.equal(result.cancelled, 3)

    const pilatesSlot = result.slots.find((slot) => slot.classScheduleId === pilatesMon.id)!
    const pilatesRows = rows.filter((row) => row.scheduleId === pilatesMon.id)
    assert.deepEqual(
      pilatesRows.map((row) => [row.date, row.status, row.fixedSlotId]),
      [
        ['2026-11-16', 'active', pilatesSlot.id],
        ['2026-11-23', 'active', pilatesSlot.id],
        ['2026-11-30', 'active', pilatesSlot.id],
        ['2026-12-07', 'active', pilatesSlot.id],
      ]
    )
    assert.deepEqual(datesWhere(rows, gymFri.id, 'active'), [
      '2026-11-20',
      '2026-11-27',
      '2026-12-04',
    ])
    assert.deepEqual(datesWhere(rows, yogaThu.id, 'active'), ['2026-11-19'])

    await pending.refresh()
    assert.equal(pending.status, 'available')
    assert.lengthOf(await PendingClass.query().where('userId', student.user.id), 1)

    await student.subscription.refresh()
    assert.equal(student.subscription.endsOn?.toISODate(), '2026-11-15')
    const oldSlots = await FixedSlot.query().whereIn(
      'id',
      student.slots.map((slot) => slot.id)
    )
    assert.deepEqual(
      oldSlots.map((slot) => slot.endsOn?.toISODate()),
      ['2026-11-15', '2026-11-15']
    )
  })

  test('a class the student cancelled is not booked again when it stays in the schedule', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const pilatesMon = await createSchedule(catalog, { weekday: MON, activity: catalog.pilates })
    const student = await createStudent(catalog, { schedules: [pilatesMon] })
    await new BookingGenerator().generate({ tenantId: catalog.tenant.id, now })
    const cancelled = await Booking.query()
      .where('userId', student.user.id)
      .whereHas('classSession', (session) => session.where('date', '2026-11-23'))
      .firstOrFail()
    await cancelled.merge({ status: 'cancelled', cancelledAt: now }).save()

    const { plan, quotas } = await createPlan(catalog, [{ count: 1 }])
    await service.assign(
      catalog.tenant.id,
      student.user.id,
      {
        planId: plan.id,
        startsOn: '2026-11-16',
        quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilatesMon.id] }],
      },
      now
    )

    const rows = await bookingsOf(student.user.id)
    assert.deepEqual(datesWhere(rows, pilatesMon.id, 'cancelled'), ['2026-11-23'])
    assert.deepEqual(datesWhere(rows, pilatesMon.id, 'active'), [
      '2026-11-16',
      '2026-11-30',
      '2026-12-07',
    ])
  })

  test('a full class cannot be picked, unless the places free up before the date', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const pilatesMon = await createSchedule(catalog, {
      weekday: MON,
      activity: catalog.pilates,
      capacity: 1,
    })
    const { plan, quotas } = await createPlan(catalog, [{ count: 1 }])
    const input = {
      planId: plan.id,
      startsOn: '2026-11-16',
      quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilatesMon.id] }],
    }

    await otherStudentIn(catalog, pilatesMon.id, null)
    const user = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()
    await assert.rejects(
      () => service.assign(catalog.tenant.id, user.id, input, now),
      'Lunes 18:00 · Pilates está completo.'
    )
    assert.lengthOf(await Subscription.query().where('userId', user.id), 0)

    const leaving = await createCatalog()
    const monday = await createSchedule(leaving, {
      weekday: MON,
      activity: leaving.pilates,
      capacity: 1,
    })
    await otherStudentIn(leaving, monday.id, day('2026-11-15'))
    const newcomer = await UserFactory.merge({ tenantId: leaving.tenant.id }).create()
    const leavingPlan = await createPlan(leaving, [{ count: 1 }])
    const result = await service.assign(
      leaving.tenant.id,
      newcomer.id,
      {
        planId: leavingPlan.plan.id,
        startsOn: '2026-11-16',
        quotas: [{ quotaId: leavingPlan.quotas[0].id, scheduleIds: [monday.id] }],
      },
      now
    )
    assert.lengthOf(result.slots, 1)
  })

  test('the student keeps their own place in a full class', async ({ assert }) => {
    const catalog = await createCatalog()
    const pilatesMon = await createSchedule(catalog, {
      weekday: MON,
      activity: catalog.pilates,
      capacity: 1,
    })
    const student = await createStudent(catalog, { schedules: [pilatesMon] })
    const { plan, quotas } = await createPlan(catalog, [{ count: 1 }])

    const result = await service.assign(
      catalog.tenant.id,
      student.user.id,
      {
        planId: plan.id,
        startsOn: '2026-11-23',
        quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilatesMon.id] }],
      },
      now
    )
    assert.equal(result.slots[0].classScheduleId, pilatesMon.id)
  })

  test('rejects a class outside the quota activities and leaves everything untouched', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const pilatesMon = await createSchedule(catalog, { weekday: MON, activity: catalog.pilates })
    const student = await createStudent(catalog, { schedules: [pilatesMon] })
    const { plan, quotas } = await createPlan(catalog, [{ count: 1, activities: [catalog.yoga] }])

    await assert.rejects(
      () =>
        service.assign(
          catalog.tenant.id,
          student.user.id,
          {
            planId: plan.id,
            startsOn: '2026-11-16',
            quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilatesMon.id] }],
          },
          now
        ),
      'Lunes 18:00 · Pilates no es de una actividad de 1 clase de Yoga.'
    )

    await student.subscription.refresh()
    assert.isNull(student.subscription.endsOn)
    assert.lengthOf(await Subscription.query().where('userId', student.user.id), 1)
  })

  test('rejects a start date that is not after today', async ({ assert }) => {
    const catalog = await createCatalog()
    const pilatesMon = await createSchedule(catalog, { weekday: MON, activity: catalog.pilates })
    const user = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()
    const { plan, quotas } = await createPlan(catalog, [{ count: 1 }])

    for (const startsOn of ['2026-11-11', '2026-11-02', 'mañana']) {
      await assert.rejects(
        () =>
          service.assign(
            catalog.tenant.id,
            user.id,
            {
              planId: plan.id,
              startsOn,
              quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilatesMon.id] }],
            },
            now
          ),
        'Elegí una fecha a partir de mañana.'
      )
    }
  })

  test('never uses a plan, a class or a student of another tenant', async ({ assert }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const pilatesMon = await createSchedule(catalog, { weekday: MON, activity: catalog.pilates })
    const foreignClass = await createSchedule(other, { weekday: MON, activity: other.pilates })
    const user = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()
    const ownPlan = await createPlan(catalog, [{ count: 1 }])
    const foreignPlan = await createPlan(other, [{ count: 1 }])

    await assert.rejects(
      () =>
        service.assign(
          catalog.tenant.id,
          user.id,
          {
            planId: foreignPlan.plan.id,
            startsOn: '2026-11-16',
            quotas: [{ quotaId: foreignPlan.quotas[0].id, scheduleIds: [pilatesMon.id] }],
          },
          now
        ),
      AssignmentError
    )
    await assert.rejects(
      () =>
        service.assign(
          catalog.tenant.id,
          user.id,
          {
            planId: ownPlan.plan.id,
            startsOn: '2026-11-16',
            quotas: [{ quotaId: ownPlan.quotas[0].id, scheduleIds: [foreignClass.id] }],
          },
          now
        ),
      'Uno de los horarios ya no existe.'
    )
    await assert.rejects(
      () =>
        service.assign(
          other.tenant.id,
          user.id,
          {
            planId: foreignPlan.plan.id,
            startsOn: '2026-11-16',
            quotas: [{ quotaId: foreignPlan.quotas[0].id, scheduleIds: [foreignClass.id] }],
          },
          now
        ),
      'No encontramos ese alumno.'
    )
  })
})

test.group('ScheduleAssignment › subscriptions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a plan that was going to start later is replaced by the new one', async ({ assert }) => {
    const catalog = await createCatalog()
    const pilatesMon = await createSchedule(catalog, { weekday: MON, activity: catalog.pilates })
    const user = await UserFactory.merge({ tenantId: catalog.tenant.id }).create()
    const { plan, quotas } = await createPlan(catalog, [{ count: 1 }])
    const future = await SubscriptionFactory.merge({
      tenantId: catalog.tenant.id,
      userId: user.id,
      planId: plan.id,
      startsOn: day('2026-11-30'),
    }).create()

    await new ScheduleAssignment().assign(
      catalog.tenant.id,
      user.id,
      {
        planId: plan.id,
        startsOn: '2026-11-16',
        quotas: [{ quotaId: quotas[0].id, scheduleIds: [pilatesMon.id] }],
      },
      now
    )

    const subscriptions = await Subscription.query().where('userId', user.id)
    assert.deepEqual(
      subscriptions.map((subscription) => [subscription.startsOn.toISODate(), subscription.endsOn]),
      [['2026-11-16', null]]
    )
    assert.notEqual(subscriptions[0].id, future.id)
  })
})
