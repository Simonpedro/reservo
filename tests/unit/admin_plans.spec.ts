import { quotasProblem, sameQuotaStructure, weeklyTotal } from '#services/admin_plans'
import { test } from '@japa/runner'

const YOGA = 1
const PILATES = 2
const tenantActivities = [YOGA, PILATES]

test.group('Plan quotas › quotasProblem', () => {
  test('accepts free quotas and quotas with activities of the tenant', ({ assert }) => {
    const problem = quotasProblem(
      [
        { weeklyCount: 1, anyActivity: false, activityIds: [YOGA] },
        { weeklyCount: 2, anyActivity: true, activityIds: [] },
      ],
      tenantActivities
    )
    assert.isNull(problem)
  })

  test('a plan needs at least one quota', ({ assert }) => {
    const problem = quotasProblem([], tenantActivities)
    assert.equal(problem?.field, 'quotas')
    assert.equal(problem?.message, 'El plan necesita al menos un cupo.')
  })

  test('every quota needs at least one class a week', ({ assert }) => {
    const problem = quotasProblem(
      [
        { weeklyCount: 1, anyActivity: true, activityIds: [] },
        { weeklyCount: 0, anyActivity: true, activityIds: [] },
      ],
      tenantActivities
    )
    assert.equal(problem?.field, 'quotas.1.weeklyCount')
  })

  test('a quota that is not "any activity" needs an activity', ({ assert }) => {
    const problem = quotasProblem(
      [{ weeklyCount: 2, anyActivity: false, activityIds: [] }],
      tenantActivities
    )
    assert.equal(problem?.field, 'quotas.0.activityIds')
    assert.equal(problem?.message, 'Elegí al menos una actividad para el cupo 1.')
  })

  test('rejects activities that are not of the tenant', ({ assert }) => {
    const problem = quotasProblem(
      [{ weeklyCount: 1, anyActivity: false, activityIds: [YOGA, 99] }],
      tenantActivities
    )
    assert.equal(problem?.field, 'quotas.0.activityIds')
  })

  test('ignores the activity list of an "any activity" quota', ({ assert }) => {
    const problem = quotasProblem(
      [{ weeklyCount: 1, anyActivity: true, activityIds: [99] }],
      tenantActivities
    )
    assert.isNull(problem)
  })
})

test.group('Plan quotas › sameQuotaStructure', () => {
  const current = [
    { id: 10, weeklyCount: 1, anyActivity: false, activityIds: [PILATES, YOGA] },
    { id: 11, weeklyCount: 2, anyActivity: true, activityIds: [] },
  ]

  test('ignores ids and the order of activities inside a quota', ({ assert }) => {
    assert.isTrue(
      sameQuotaStructure(current, [
        { weeklyCount: 1, anyActivity: false, activityIds: [YOGA, PILATES] },
        { weeklyCount: 2, anyActivity: true, activityIds: [] },
      ])
    )
  })

  test('detects a different count, activity, order or number of quotas', ({ assert }) => {
    const [first, second] = current
    assert.isFalse(sameQuotaStructure(current, [first, { ...second, weeklyCount: 3 }]))
    assert.isFalse(sameQuotaStructure(current, [{ ...first, activityIds: [YOGA] }, second]))
    assert.isFalse(sameQuotaStructure(current, [second, first]))
    assert.isFalse(sameQuotaStructure(current, [first]))
    assert.isFalse(sameQuotaStructure(current, [first, { ...second, anyActivity: false }]))
  })
})

test.group('Plan quotas › weeklyTotal', () => {
  test('adds the classes of every quota', ({ assert }) => {
    assert.equal(weeklyTotal([{ weeklyCount: 1 }, { weeklyCount: 2 }]), 3)
  })
})
