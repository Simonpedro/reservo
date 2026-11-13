import { FixedSlotFactory } from '#database/factories/plan_factories'
import FixedSlot from '#models/fixed_slot'
import { adminWeek, weekStart, weekTitle } from '#services/admin_week'
import { BUSINESS_ZONE } from '#services/business_calendar'
import { createCatalog, createSchedule, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Wednesday 11 November 2026, 9:41 in Buenos Aires.
 */
const now = DateTime.fromISO('2026-11-11T09:41', { zone: BUSINESS_ZONE })
const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

test.group('Admin week', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('groups the active classes by dated day and orders them by time', async ({ assert }) => {
    const catalog = await createCatalog()
    const late = await createSchedule(catalog, { weekday: 1, startTime: '19:00' })
    const early = await createSchedule(catalog, {
      weekday: 1,
      startTime: '08:00',
      activity: catalog.gym,
      center: catalog.ovidio,
    })
    const friday = await createSchedule(catalog, { weekday: 5, startTime: '18:00' })
    await createSchedule(catalog, { weekday: 2, active: false })

    const week = await adminWeek(catalog.tenant.id, null, null, now)

    assert.deepEqual(
      week.days.map((weekDay) => [
        weekDay.date,
        weekDay.name,
        weekDay.classes.map((item) => item.scheduleId),
      ]),
      [
        ['2026-11-09', 'Lunes 9', [early.id, late.id]],
        ['2026-11-10', 'Martes 10', []],
        ['2026-11-11', 'Miércoles 11', []],
        ['2026-11-12', 'Jueves 12', []],
        ['2026-11-13', 'Viernes 13', [friday.id]],
        ['2026-11-14', 'Sábado 14', []],
      ]
    )
    assert.equal(week.title, 'Semana del 9 al 14 de noviembre')
    assert.equal(week.total, 3)
    assert.deepInclude(week.days[0].classes[0], {
      startTime: '08:00',
      activity: { name: 'Gimnasio', wash: 'blue' },
      centerName: 'Ovidio Lagos',
      capacity: early.capacity,
    })
  })

  test('Sunday only shows up when a class is on Sunday', async ({ assert }) => {
    const catalog = await createCatalog()
    await createSchedule(catalog, { weekday: 7, active: false })
    const before = await adminWeek(catalog.tenant.id, null, null, now)
    assert.lengthOf(before.days, 6)

    const sunday = await createSchedule(catalog, { weekday: 7, startTime: '10:00' })
    const after = await adminWeek(catalog.tenant.id, null, null, now)
    assert.deepEqual(
      after.days.map((weekDay) => weekDay.short),
      ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    )
    assert.deepEqual(
      after.days[6].classes.map((item) => item.scheduleId),
      [sunday.id]
    )
    assert.equal(after.days[6].date, '2026-11-15')
    assert.equal(after.title, 'Semana del 9 al 15 de noviembre')
  })

  test('shows the people whose fixed schedule holds on the class date', async ({ assert }) => {
    const catalog = await createCatalog()
    // Wednesday 11 November in the week shown.
    const schedule = await createSchedule(catalog, { weekday: 3, capacity: 8 })
    const student = (fullName: string, startsOn: string, endsOn: string | null) =>
      createStudent(catalog, {
        schedules: [schedule],
        fullName,
        slot: { startsOn: day(startsOn), endsOn: endsOn ? day(endsOn) : null },
      })
    await student('Sofi Ortiz', '2026-09-01', null)
    await student('Ana Ruiz', '2026-11-11', null)
    await student('Bruno Díaz', '2026-09-01', '2026-11-11')
    await student('Ceci Paz', '2026-09-01', '2026-11-15')
    await student('Juan Ponce', '2026-11-12', null)
    await student('Lu Martínez', '2026-09-01', '2026-11-10')

    const week = await adminWeek(catalog.tenant.id, null, null, now)
    const [item] = week.days[2].classes

    assert.deepEqual(
      item.people.map(({ fullName }) => fullName),
      ['Ana Ruiz', 'Bruno Díaz', 'Ceci Paz', 'Sofi Ortiz']
    )
    assert.equal(item.taken, 4)
    assert.equal(item.capacity, 8)
  })

  test('a person with two overlapping fixed slots in a class counts once', async ({ assert }) => {
    const catalog = await createCatalog()
    const schedule = await createSchedule(catalog, { weekday: 3, capacity: 8 })
    const sofi = await createStudent(catalog, {
      schedules: [schedule],
      fullName: 'Sofi Ortiz',
      slot: { startsOn: day('2026-08-01'), endsOn: day('2026-11-12') },
    })
    const first = await FixedSlot.query().where('userId', sofi.user.id).firstOrFail()
    await FixedSlot.create({
      tenantId: first.tenantId,
      userId: first.userId,
      subscriptionId: first.subscriptionId,
      planQuotaId: first.planQuotaId,
      classScheduleId: first.classScheduleId,
      startsOn: day('2026-08-01'),
      endsOn: null,
    })

    const week = await adminWeek(catalog.tenant.id, null, null, now)
    const [item] = week.days[2].classes

    assert.deepEqual(
      item.people.map(({ fullName }) => fullName),
      ['Sofi Ortiz']
    )
    assert.equal(item.taken, 1)
  })

  test('someone changing schedule is in the old class this week and the new one next week', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const friday = await createSchedule(catalog, { weekday: 5, startTime: '18:00', capacity: 6 })
    const monday = await createSchedule(catalog, {
      weekday: 1,
      startTime: '09:00',
      activity: catalog.yoga,
      capacity: 6,
    })
    await createStudent(catalog, {
      schedules: [friday, monday],
      fullName: 'Rita Pérez',
      slot: { startsOn: day('2026-09-01'), endsOn: null },
    })
    const changing = await createStudent(catalog, {
      schedules: [friday],
      fullName: 'Tomás Gil',
      slot: { startsOn: day('2026-09-01'), endsOn: day('2026-11-15') },
    })
    await FixedSlotFactory.merge({
      tenantId: catalog.tenant.id,
      subscriptionId: changing.subscription.id,
      userId: changing.user.id,
      planQuotaId: changing.quota.id,
      classScheduleId: monday.id,
      startsOn: day('2026-11-16'),
      endsOn: null,
    }).create()
    const classes = (week: Awaited<ReturnType<typeof adminWeek>>) =>
      week.days
        .flatMap((weekDay) => weekDay.classes)
        .map((item) => [
          item.activity.name,
          item.people.map(({ fullName }) => fullName),
          item.taken,
        ])

    const thisWeek = await adminWeek(catalog.tenant.id, null, null, now)
    assert.deepEqual(classes(thisWeek), [
      ['Yoga', ['Rita Pérez'], 1],
      ['Pilates', ['Rita Pérez', 'Tomás Gil'], 2],
    ])

    const nextWeek = await adminWeek(catalog.tenant.id, null, thisWeek.next, now)
    assert.equal(nextWeek.start, '2026-11-16')
    assert.deepEqual(classes(nextWeek), [
      ['Yoga', ['Rita Pérez', 'Tomás Gil'], 2],
      ['Pilates', ['Rita Pérez'], 1],
    ])
  })

  test('shows the requested week, past ones included', async ({ assert }) => {
    const catalog = await createCatalog()
    const schedule = await createSchedule(catalog, { weekday: 2 })
    await createStudent(catalog, {
      schedules: [schedule],
      fullName: 'Bruno Díaz',
      slot: { startsOn: day('2026-09-01'), endsOn: day('2026-10-31') },
    })

    const past = await adminWeek(catalog.tenant.id, null, '2026-10-29', now)
    assert.include(past, {
      start: '2026-10-26',
      previous: '2026-10-19',
      next: '2026-11-02',
      title: 'Semana del 26 al 31 de octubre',
    })
    assert.deepEqual(
      past.days[1].classes[0].people.map(({ fullName }) => fullName),
      ['Bruno Díaz']
    )

    const current = await adminWeek(catalog.tenant.id, null, 'nope', now)
    assert.equal(current.start, '2026-11-09')
    assert.deepEqual(current.days[1].classes[0].people, [])
  })

  test('any date goes to the Monday of its week; anything else, to the current week', ({
    assert,
  }) => {
    const today = '2026-11-11'
    assert.equal(weekStart('2026-11-16', today), '2026-11-16')
    assert.equal(weekStart('2026-11-19', today), '2026-11-16')
    assert.equal(weekStart('2026-11-22', today), '2026-11-16')
    assert.equal(weekStart('2027-01-01', today), '2026-12-28')
    for (const invalid of [
      undefined,
      null,
      '',
      'nope',
      '2026-02-30',
      '16/11/2026',
      ['2026-11-16'],
    ]) {
      assert.equal(weekStart(invalid, today), '2026-11-09')
    }
  })

  test('the current week is the one of Buenos Aires', async ({ assert }) => {
    const catalog = await createCatalog()
    // Sunday 22:30 in Buenos Aires is already Monday in UTC.
    const sundayNight = DateTime.fromISO('2026-11-16T01:30', { zone: 'utc' })
    const week = await adminWeek(catalog.tenant.id, null, null, sundayNight)
    assert.equal(week.start, '2026-11-09')
  })

  test('the title names the days and the month, and the years across them', ({ assert }) => {
    assert.equal(weekTitle('2026-11-16', '2026-11-21'), 'Semana del 16 al 21 de noviembre')
    assert.equal(
      weekTitle('2026-11-30', '2026-12-05'),
      'Semana del 30 de noviembre al 5 de diciembre'
    )
    assert.equal(
      weekTitle('2026-12-28', '2027-01-02'),
      'Semana del 28 de diciembre de 2026 al 2 de enero de 2027'
    )
  })

  test('filters by center when there is more than one', async ({ assert }) => {
    const catalog = await createCatalog()
    const mendoza = await createSchedule(catalog, { weekday: 1, center: catalog.mendoza })
    const ovidio = await createSchedule(catalog, { weekday: 1, center: catalog.ovidio })
    const ids = (week: Awaited<ReturnType<typeof adminWeek>>) =>
      week.days.flatMap((weekDay) => weekDay.classes.map((item) => item.scheduleId))

    const all = await adminWeek(catalog.tenant.id, 'nope', null, now)
    assert.isNull(all.center)
    assert.deepEqual(
      all.centers.map((center) => center.name),
      ['Mendoza', 'Ovidio Lagos']
    )
    assert.sameMembers(ids(all), [mendoza.id, ovidio.id])

    const filtered = await adminWeek(catalog.tenant.id, catalog.ovidio.slug, null, now)
    assert.deepEqual(filtered.center, { slug: catalog.ovidio.slug, name: 'Ovidio Lagos' })
    assert.deepEqual(ids(filtered), [ovidio.id])
    assert.equal(filtered.total, 1)
  })

  test('with a single center there is nothing to filter', async ({ assert }) => {
    const catalog = await createCatalog()
    await catalog.ovidio.delete()
    const schedule = await createSchedule(catalog, { weekday: 4 })

    const week = await adminWeek(catalog.tenant.id, catalog.ovidio.slug, null, now)
    assert.deepEqual(week.centers, [])
    assert.isNull(week.center)
    assert.deepEqual(
      week.days[3].classes.map((item) => item.scheduleId),
      [schedule.id]
    )
  })

  test('never shows the classes or people of another tenant', async ({ assert }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const foreign = await createSchedule(other, { weekday: 1 })
    await createStudent(other, { schedules: [foreign], fullName: 'Ajena Total' })

    const week = await adminWeek(catalog.tenant.id, other.mendoza.slug, null, now)
    assert.equal(week.total, 0)
    assert.isTrue(week.days.every((weekDay) => weekDay.classes.length === 0))
  })
})
