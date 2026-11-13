import { adminWeek } from '#services/admin_week'
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

  test('groups the active classes by day and orders them by time', async ({ assert }) => {
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

    const week = await adminWeek(catalog.tenant.id, null, now)

    assert.deepEqual(
      week.days.map((weekDay) => [weekDay.name, weekDay.classes.map((item) => item.scheduleId)]),
      [
        ['Lunes', [early.id, late.id]],
        ['Martes', []],
        ['Miércoles', []],
        ['Jueves', []],
        ['Viernes', [friday.id]],
        ['Sábado', []],
      ]
    )
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
    const before = await adminWeek(catalog.tenant.id, null, now)
    assert.lengthOf(before.days, 6)

    const sunday = await createSchedule(catalog, { weekday: 7, startTime: '10:00' })
    const after = await adminWeek(catalog.tenant.id, null, now)
    assert.deepEqual(
      after.days.map((weekDay) => weekDay.short),
      ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    )
    assert.deepEqual(
      after.days[6].classes.map((item) => item.scheduleId),
      [sunday.id]
    )
  })

  test('counts and names the people with a current fixed schedule, by name', async ({ assert }) => {
    const catalog = await createCatalog()
    const schedule = await createSchedule(catalog, { weekday: 3, capacity: 8 })
    await createStudent(catalog, { schedules: [schedule], fullName: 'Sofi Ortiz' })
    await createStudent(catalog, { schedules: [schedule], fullName: 'Ana Ruiz' })
    await createStudent(catalog, {
      schedules: [schedule],
      fullName: 'Juan Ponce',
      slot: { startsOn: day('2026-11-16'), endsOn: null },
    })
    await createStudent(catalog, {
      schedules: [schedule],
      fullName: 'Bruno Díaz',
      slot: { startsOn: day('2026-09-01'), endsOn: day('2026-11-15') },
    })
    await createStudent(catalog, {
      schedules: [schedule],
      fullName: 'Lu Martínez',
      slot: { startsOn: day('2026-09-01'), endsOn: day('2026-11-10') },
    })

    const week = await adminWeek(catalog.tenant.id, null, now)
    const [item] = week.days[2].classes

    assert.equal(item.taken, 4)
    assert.equal(item.capacity, 8)
    assert.deepEqual(
      item.people.map(({ fullName, note }) => [fullName, note]),
      [
        ['Ana Ruiz', null],
        ['Bruno Díaz', 'hasta el domingo 15'],
        ['Juan Ponce', 'desde el lunes 16'],
        ['Sofi Ortiz', null],
      ]
    )
  })

  test('filters by center when there is more than one', async ({ assert }) => {
    const catalog = await createCatalog()
    const mendoza = await createSchedule(catalog, { weekday: 1, center: catalog.mendoza })
    const ovidio = await createSchedule(catalog, { weekday: 1, center: catalog.ovidio })
    const ids = (week: Awaited<ReturnType<typeof adminWeek>>) =>
      week.days.flatMap((weekDay) => weekDay.classes.map((item) => item.scheduleId))

    const all = await adminWeek(catalog.tenant.id, 'nope', now)
    assert.isNull(all.center)
    assert.deepEqual(
      all.centers.map((center) => center.name),
      ['Mendoza', 'Ovidio Lagos']
    )
    assert.sameMembers(ids(all), [mendoza.id, ovidio.id])

    const filtered = await adminWeek(catalog.tenant.id, catalog.ovidio.slug, now)
    assert.deepEqual(filtered.center, { slug: catalog.ovidio.slug, name: 'Ovidio Lagos' })
    assert.deepEqual(ids(filtered), [ovidio.id])
    assert.equal(filtered.total, 1)
  })

  test('with a single center there is nothing to filter', async ({ assert }) => {
    const catalog = await createCatalog()
    await catalog.ovidio.delete()
    const schedule = await createSchedule(catalog, { weekday: 4 })

    const week = await adminWeek(catalog.tenant.id, catalog.ovidio.slug, now)
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

    const week = await adminWeek(catalog.tenant.id, other.mendoza.slug, now)
    assert.equal(week.total, 0)
    assert.isTrue(week.days.every((weekDay) => weekDay.classes.length === 0))
  })
})
