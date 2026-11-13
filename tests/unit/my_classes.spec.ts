import { BookingFactory, ClassSessionFactory } from '#database/factories/booking_factories'
import { BUSINESS_ZONE, dayLabel, endOfWeek } from '#services/business_calendar'
import { groupByWeek, myUpcomingClasses, type ClassCardData } from '#services/my_classes'
import { createCatalog, createSchedule, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const card = (bookingId: number, date: string): ClassCardData => ({
  bookingId,
  sessionId: bookingId,
  activity: { name: 'Pilates', wash: 'celeste', image: null },
  date,
  dayLabel: '',
  startTime: '18:00',
  instructorName: 'Agus',
  centerName: 'Mendoza',
  source: 'fixed',
  suspended: false,
  suspensionReason: null,
})

test.group('Class card days', () => {
  test('labels today, tomorrow and later days like the prototype', ({ assert }) => {
    assert.equal(dayLabel('2026-11-11', '2026-11-11'), 'Hoy')
    assert.equal(dayLabel('2026-11-12', '2026-11-11'), 'Mañana')
    assert.equal(dayLabel('2026-11-13', '2026-11-11'), 'Vie 13')
    assert.equal(dayLabel('2026-11-18', '2026-11-11'), 'Mié 18')
    assert.equal(dayLabel('2026-12-01', '2026-11-30'), 'Mañana')
  })

  test('weeks end on Sunday', ({ assert }) => {
    assert.equal(endOfWeek('2026-11-11'), '2026-11-15')
    assert.equal(endOfWeek('2026-11-15'), '2026-11-15')
    assert.equal(endOfWeek('2026-11-16'), '2026-11-22')
  })

  test('groups classes into this week and next week, dropping the rest', ({ assert }) => {
    const weeks = groupByWeek(
      [
        card(1, '2026-11-11'),
        card(2, '2026-11-15'),
        card(3, '2026-11-16'),
        card(4, '2026-11-22'),
        card(5, '2026-11-23'),
      ],
      '2026-11-11'
    )

    assert.deepEqual(
      weeks.map((week) => [week.title, week.classes.map((item) => item.bookingId)]),
      [
        ['Esta semana', [1, 2]],
        ['Semana que viene', [3, 4]],
      ]
    )
  })

  test('omits a week without classes', ({ assert }) => {
    const weeks = groupByWeek([card(3, '2026-11-17')], '2026-11-11')

    assert.deepEqual(
      weeks.map((week) => week.title),
      ['Semana que viene']
    )
  })
})

test.group('Upcoming classes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test("drops today's classes once they are over", async ({ assert }) => {
    const catalog = await createCatalog()
    const morning = await createSchedule(catalog, { weekday: 3, startTime: '08:00' })
    const evening = await createSchedule(catalog, { weekday: 3, startTime: '19:00' })
    const student = await createStudent(catalog, { schedules: [morning, evening] })
    const today = DateTime.fromISO('2026-11-11', { zone: BUSINESS_ZONE })
    for (const schedule of [morning, evening]) {
      const session = await ClassSessionFactory.merge({
        tenantId: catalog.tenant.id,
        classScheduleId: schedule.id,
        date: today,
      }).create()
      await BookingFactory.merge({
        tenantId: catalog.tenant.id,
        userId: student.user.id,
        classSessionId: session.id,
        planQuotaId: student.quota.id,
      }).create()
    }

    // Wednesday 11 November at 10:30 in Buenos Aires (13:30 UTC).
    const now = DateTime.fromISO('2026-11-11T13:30', { zone: 'utc' })
    const view = await myUpcomingClasses(student.user, now)

    assert.equal(view.state, 'classes')
    if (view.state !== 'classes') return
    assert.deepEqual(
      view.weeks.flatMap((week) => week.classes.map((item) => [item.dayLabel, item.startTime])),
      [['Hoy', '19:00']]
    )
  })
})
