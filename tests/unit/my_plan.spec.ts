import { BUSINESS_ZONE } from '#services/business_calendar'
import { myPlan, type MyPlanView } from '#services/my_plan'
import ScheduleAssignment from '#services/schedule_assignment'
import { createCatalog, createPlan, createSchedule, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Wednesday 11 November 2026 in Buenos Aires. Next Monday is the 16th.
 */
const wednesday = DateTime.fromISO('2026-11-11T09:41', { zone: BUSINESS_ZONE })
const nextMonday = DateTime.fromISO('2026-11-16T09:00', { zone: BUSINESS_ZONE })

function scheduleOf(view: MyPlanView) {
  return view.state === 'with_plan' ? view.schedule?.map((line) => line.label) : undefined
}

test.group('Mi plan across a plan change', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function changeFromNextMonday() {
    const catalog = await createCatalog()
    const pilatesMon = await createSchedule(catalog, {
      weekday: 1,
      startTime: '18:00',
      activity: catalog.pilates,
      center: catalog.mendoza,
    })
    const gymFri = await createSchedule(catalog, {
      weekday: 5,
      startTime: '08:00',
      activity: catalog.gym,
      center: catalog.mendoza,
    })
    const student = await createStudent(catalog, {
      schedules: [pilatesMon],
      subscription: { startsOn: DateTime.fromISO('2026-10-01') },
      slot: { startsOn: DateTime.fromISO('2026-10-01') },
    })
    await student.plan.merge({ name: 'Plan actual' }).save()

    const next = await createPlan(catalog, [{ count: 1, activities: [catalog.gym] }], 'Plan nuevo')
    await new ScheduleAssignment().assign(
      catalog.tenant.id,
      student.user.id,
      {
        planId: next.plan.id,
        startsOn: '2026-11-16',
        quotas: [{ quotaId: next.quotas[0].id, scheduleIds: [gymFri.id] }],
      },
      wednesday
    )
    return { id: student.user.id, tenantId: catalog.tenant.id }
  }

  test('keeps showing the current plan and schedule until the change applies', async ({
    assert,
  }) => {
    const student = await changeFromNextMonday()

    const view = await myPlan(student, wednesday)

    assert.containsSubset(view, { state: 'with_plan', planName: 'Plan actual' })
    assert.deepEqual(scheduleOf(view), ['Lunes 18:00 · Pilates · Mendoza'])
  })

  test('shows the new plan and schedule from the day it starts', async ({ assert }) => {
    const student = await changeFromNextMonday()

    const view = await myPlan(student, nextMonday)

    assert.containsSubset(view, { state: 'with_plan', planName: 'Plan nuevo' })
    assert.deepEqual(scheduleOf(view), ['Viernes 08:00 · Gimnasio · Mendoza'])
  })

  test('a new student sees the plan that starts next Monday instead of "sin plan"', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const gymFri = await createSchedule(catalog, {
      weekday: 5,
      startTime: '08:00',
      activity: catalog.gym,
      center: catalog.mendoza,
    })
    const student = await createStudent(catalog, {
      schedules: [gymFri],
      subscription: { startsOn: DateTime.fromISO('2026-11-16') },
      slot: { startsOn: DateTime.fromISO('2026-11-16') },
    })

    const view = await myPlan({ id: student.user.id, tenantId: catalog.tenant.id }, wednesday)

    assert.containsSubset(view, { state: 'with_plan', planName: student.plan.name })
    assert.deepEqual(scheduleOf(view), ['Viernes 08:00 · Gimnasio · Mendoza'])
  })
})
