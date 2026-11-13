import { pendingCountUntil, pendingLines } from '#services/pending_text'
import { test } from '@japa/runner'

const yoga = { count: 1, activities: ['Yoga'], expiresLabel: 'domingo 29' }
const gymOrPilates = { count: 2, activities: ['Gimnasio', 'Pilates'], expiresLabel: 'domingo 22' }

test.group('Pending classes text', () => {
  test('one kind of pending class is a sentence', ({ assert }) => {
    assert.deepEqual(pendingLines([yoga]), ['Vale para Yoga. Usala hasta el domingo 29.'])
    assert.deepEqual(pendingLines([gymOrPilates]), [
      'Valen para Gimnasio o Pilates. Usalas hasta el domingo 22.',
    ])
    assert.deepEqual(pendingLines([{ ...yoga, activities: null }]), [
      'Vale para cualquier actividad de tu plan. Usala hasta el domingo 29.',
    ])
  })

  test('several kinds get one line each, with their own expiry', ({ assert }) => {
    assert.deepEqual(pendingLines([gymOrPilates, yoga]), [
      '2 de Gimnasio o Pilates · hasta el domingo 22',
      'Yoga · hasta el domingo 29',
    ])
    assert.deepEqual(
      pendingLines([
        { ...yoga, activities: null, expiresLabel: 'domingo 22' },
        { ...gymOrPilates, activities: null, expiresLabel: 'domingo 29' },
      ]),
      [
        'Cualquier actividad · hasta el domingo 22',
        '2 de cualquier actividad · hasta el domingo 29',
      ]
    )
  })

  test('the count only says until when if they all expire the same day', ({ assert }) => {
    assert.equal(pendingCountUntil([yoga]), 'Tenés 1 clase pendiente hasta el domingo 29.')
    assert.equal(
      pendingCountUntil([yoga, { ...gymOrPilates, expiresLabel: 'domingo 29' }]),
      'Tenés 3 clases pendientes hasta el domingo 29.'
    )
    assert.equal(pendingCountUntil([gymOrPilates, yoga]), 'Tenés 3 clases pendientes.')
  })
})
