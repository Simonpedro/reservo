import { PendingClassFactory } from '#database/factories/booking_factories'
import { BUSINESS_ZONE } from '#services/business_calendar'
import { expirePendingClasses } from '#services/pending_classes'
import {
  createBooking,
  createCatalog,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

test.group('Expire pending classes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('marks only available pendings past expiresOn', async ({ assert }) => {
    const catalog = await createCatalog()
    const student = await createStudent(catalog)
    const schedule = await createSchedule(catalog)
    const origin = await createBooking(catalog, student, schedule, day('2026-11-16'))
    const base = {
      tenantId: catalog.tenant.id,
      userId: student.user.id,
      planQuotaId: student.quota.id,
      originBookingId: origin.id,
    }

    const past = await PendingClassFactory.merge({
      ...base,
      expiresOn: day('2026-11-20'),
      status: 'available',
    }).create()
    const stillValid = await PendingClassFactory.merge({
      ...base,
      expiresOn: day('2026-11-29'),
      status: 'available',
    }).create()
    const alreadyUsed = await PendingClassFactory.merge({
      ...base,
      expiresOn: day('2026-11-18'),
      status: 'used',
    }).create()

    const count = await expirePendingClasses(catalog.tenant.id, '2026-11-22')

    assert.equal(count, 1)
    await past.refresh()
    await stillValid.refresh()
    await alreadyUsed.refresh()
    assert.equal(past.status, 'expired')
    assert.equal(stillValid.status, 'available')
    assert.equal(alreadyUsed.status, 'used')
  })

  test('is idempotent on a second run', async ({ assert }) => {
    const catalog = await createCatalog()
    const student = await createStudent(catalog)
    const schedule = await createSchedule(catalog)
    const origin = await createBooking(catalog, student, schedule, day('2026-11-16'))
    await PendingClassFactory.merge({
      tenantId: catalog.tenant.id,
      userId: student.user.id,
      planQuotaId: student.quota.id,
      originBookingId: origin.id,
      expiresOn: day('2026-11-20'),
      status: 'available',
    }).create()

    assert.equal(await expirePendingClasses(catalog.tenant.id, '2026-11-22'), 1)
    assert.equal(await expirePendingClasses(catalog.tenant.id, '2026-11-22'), 0)
  })
})
