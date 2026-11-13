import {
  CatalogError,
  checkName,
  setActivityActive,
  setCenterActive,
  slugify,
  uniqueSlug,
} from '#services/admin_catalog'
import { activityUsage, centerUsage, usageMessage } from '#services/catalog_usage'
import { createCatalog, createPlan, createSchedule } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

async function blocked(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    if (error instanceof CatalogError) return error.message
    throw error
  }
  throw new Error('Expected a CatalogError')
}

test.group('Catalog usage · message', () => {
  test('says what uses it, in plain words', ({ assert }) => {
    assert.isNull(usageMessage({ schedules: 0, plans: 0 }))
    assert.equal(
      usageMessage({ schedules: 3, plans: 0 }),
      'La usan 3 horarios activos. Desactivalos primero.'
    )
    assert.equal(
      usageMessage({ schedules: 1, plans: 0 }),
      'La usa 1 horario activo. Desactivalo primero.'
    )
    assert.equal(
      usageMessage({ schedules: 0, plans: 2 }),
      'La usan 2 planes activos. Desactivalos primero.'
    )
    assert.equal(
      usageMessage({ schedules: 2, plans: 1 }),
      'La usan 2 horarios activos y 1 plan activo. Desactivalos primero.'
    )
  })
})

test.group('Catalog usage · deactivating', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('an activity with active classes cannot be deactivated', async ({ assert }) => {
    const catalog = await createCatalog()
    await createSchedule(catalog, { activity: catalog.yoga })
    await createSchedule(catalog, { activity: catalog.yoga, center: catalog.ovidio })
    await createSchedule(catalog, { activity: catalog.yoga, active: false })

    assert.deepEqual(await activityUsage(catalog.tenant.id, catalog.yoga.id), {
      schedules: 2,
      plans: 0,
    })
    assert.equal(
      await blocked(setActivityActive(catalog.tenant.id, catalog.yoga.id, false)),
      'La usan 2 horarios activos. Desactivalos primero.'
    )
    await catalog.yoga.refresh()
    assert.isTrue(catalog.yoga.active)
  })

  test('an activity named by a quota of an active plan cannot be deactivated', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    await createPlan(catalog, [{ count: 1, activities: [catalog.yoga, catalog.pilates] }], 'A')
    const { plan: old } = await createPlan(catalog, [{ count: 1, activities: [catalog.yoga] }], 'B')
    await old.merge({ active: false }).save()
    // "Any activity" quotas don't name it.
    await createPlan(catalog, [{ count: 2 }], 'Libre')

    assert.deepEqual(await activityUsage(catalog.tenant.id, catalog.yoga.id), {
      schedules: 0,
      plans: 1,
    })
    assert.equal(
      await blocked(setActivityActive(catalog.tenant.id, catalog.yoga.id, false)),
      'La usa 1 plan activo. Desactivalo primero.'
    )
  })

  test('an unused activity is deactivated and turned back on', async ({ assert }) => {
    const catalog = await createCatalog()
    await createSchedule(catalog, { activity: catalog.gym, active: false })

    assert.isTrue(await setActivityActive(catalog.tenant.id, catalog.gym.id, false))
    await catalog.gym.refresh()
    assert.isFalse(catalog.gym.active)

    assert.isTrue(await setActivityActive(catalog.tenant.id, catalog.gym.id, true))
    await catalog.gym.refresh()
    assert.isTrue(catalog.gym.active)
  })

  test('a center with active classes cannot be deactivated', async ({ assert }) => {
    const catalog = await createCatalog()
    await createSchedule(catalog, { center: catalog.ovidio })

    assert.deepEqual(await centerUsage(catalog.tenant.id, catalog.ovidio.id), {
      schedules: 1,
      plans: 0,
    })
    assert.equal(
      await blocked(setCenterActive(catalog.tenant.id, catalog.ovidio.id, false)),
      'La usa 1 horario activo. Desactivalo primero.'
    )
    assert.isTrue(await setCenterActive(catalog.tenant.id, catalog.mendoza.id, false))
  })

  test('usage of another tenant does not count, and its records are not found', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    await createSchedule(other, { activity: other.yoga, center: other.mendoza })

    assert.deepEqual(await activityUsage(catalog.tenant.id, other.yoga.id), {
      schedules: 0,
      plans: 0,
    })
    assert.isFalse(await setActivityActive(catalog.tenant.id, other.yoga.id, false))
    assert.isFalse(await setCenterActive(catalog.tenant.id, other.mendoza.id, false))
  })
})

test.group('Catalog names', () => {
  test('slugs ignore case, accents and punctuation', ({ assert }) => {
    assert.equal(slugify('Ovidio Lagos'), 'ovidio-lagos')
    assert.equal(slugify('  Kinesiología  '), 'kinesiologia')
    assert.equal(slugify('Pilates (reformer)!'), 'pilates-reformer')
    assert.equal(slugify('¿?'), '')
  })

  test('a taken slug gets the first free suffix', ({ assert }) => {
    assert.equal(uniqueSlug('yoga', []), 'yoga')
    assert.equal(uniqueSlug('yoga', ['yoga', 'yoga-2']), 'yoga-3')
  })

  test('a name that matches another one but for accents or case is a duplicate', ({ assert }) => {
    const rows = [
      { id: 1, name: 'Kinesiología', slug: 'kinesiologia' },
      // Renamed from "Yoga": it keeps the old slug.
      { id: 2, name: 'Yoga Flow', slug: 'yoga' },
    ]
    assert.throws(
      () => checkName(rows, 'KINESIOLOGIA', null, 'Ya hay una actividad con ese nombre.'),
      'Ya hay una actividad con ese nombre.'
    )
    // Its own name is not a duplicate (a rename that only fixes the accent).
    assert.doesNotThrow(() => checkName(rows, 'Kinesiologia', 1, 'repetido'))
    assert.equal(checkName(rows, 'Yoga', null, 'repetido'), 'yoga-2')
    assert.throws(
      () => checkName(rows, '!!', null, 'repetido'),
      'Usá letras o números en el nombre.'
    )
  })
})
