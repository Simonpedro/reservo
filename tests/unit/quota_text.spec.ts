import { quotaLine, quotaText } from '#services/quota_text'
import { test } from '@japa/runner'

test.group('quotaText', () => {
  test('describes a single free weekly class', ({ assert }) => {
    assert.equal(
      quotaText({ weeklyCount: 1, anyActivity: true, activityNames: [] }),
      '1 clase libre'
    )
  })

  test('describes multiple free weekly classes', ({ assert }) => {
    assert.equal(
      quotaText({ weeklyCount: 2, anyActivity: true, activityNames: [] }),
      '2 clases libres'
    )
  })

  test('describes one activity-specific class', ({ assert }) => {
    assert.equal(
      quotaText({ weeklyCount: 1, anyActivity: false, activityNames: ['Yoga'] }),
      '1 clase de Yoga'
    )
  })

  test('joins several activities with “o”', ({ assert }) => {
    assert.equal(
      quotaText({ weeklyCount: 2, anyActivity: false, activityNames: ['Pilates', 'Yoga'] }),
      '2 clases de Pilates o Yoga'
    )
  })

  test('capitalizes the quota line', ({ assert }) => {
    assert.equal(
      quotaLine({ weeklyCount: 1, anyActivity: false, activityNames: ['Gimnasio', 'Pilates'] }),
      '1 clase de Gimnasio o Pilates'
    )
  })
})
