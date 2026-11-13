import { occupancyText, spotsText } from '#services/places_text'
import { test } from '@japa/runner'

test.group('Places text', () => {
  test('the student sees the free places or that the class is full', ({ assert }) => {
    assert.equal(spotsText(11), '11 lugares libres')
    assert.equal(spotsText(1), '1 lugar libre')
    assert.equal(spotsText(0), 'Cupo completo')
  })

  test('the admin sees who is in and what is free', ({ assert }) => {
    assert.equal(occupancyText(3, 12), '3 anotados · 9 lugares libres')
    assert.equal(occupancyText(0, 12), '0 anotados · 12 lugares libres')
    assert.equal(occupancyText(1, 2), '1 anotado · 1 lugar libre')
    assert.equal(occupancyText(12, 12), '12 anotados · Cupo completo')
  })

  test('more people than places still reads as full', ({ assert }) => {
    assert.equal(occupancyText(13, 12), '13 anotados · Cupo completo')
  })
})
