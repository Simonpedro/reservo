import { PendingClassFactory } from '#database/factories/booking_factories'
import Booking from '#models/booking'
import { BUSINESS_ZONE } from '#services/business_calendar'
import {
  createBooking,
  createCatalog,
  createSchedule,
  createStudent,
} from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import env from '#start/env'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

const TOKEN = 'test-daily-run-token'

function useDailyToken(cleanup: (handler: () => void) => void, token: string | null) {
  const previous = env.get('DAILY_RUN_TOKEN') ?? ''
  env.set('DAILY_RUN_TOKEN', token ?? '')
  cleanup(() => env.set('DAILY_RUN_TOKEN', previous))
}

test.group('POST /internal/daily-run', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 404 when no token is configured', async ({ client, cleanup }) => {
    useDailyToken(cleanup, null)

    const response = await client.post('/internal/daily-run')

    response.assertStatus(404)
  })

  test('returns 401 without authorization', async ({ client, cleanup }) => {
    useDailyToken(cleanup, TOKEN)

    const response = await client.post('/internal/daily-run')

    response.assertStatus(401)
  })

  test('returns 401 with a wrong token', async ({ client, cleanup }) => {
    useDailyToken(cleanup, TOKEN)

    const response = await client
      .post('/internal/daily-run')
      .header('authorization', 'Bearer wrong-token')

    response.assertStatus(401)
  })

  test('runs the daily process with a valid token', async ({ client, cleanup, assert }) => {
    useDailyToken(cleanup, TOKEN)

    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: 1, startTime: '18:00' })
    const student = await createStudent(catalog, { schedules: [monday] })
    const origin = await createBooking(catalog, student, monday, day('2026-11-16'))
    await PendingClassFactory.merge({
      tenantId: catalog.tenant.id,
      userId: student.user.id,
      planQuotaId: student.quota.id,
      originBookingId: origin.id,
      expiresOn: day('2026-11-10'),
      status: 'available',
    }).create()

    const before = await Booking.query().where('tenantId', catalog.tenant.id).count('* as total')
    const beforeCount = Number(before[0].$extras.total)

    const response = await client
      .post('/internal/daily-run')
      .header('authorization', `Bearer ${TOKEN}`)

    response.assertStatus(200)
    const body = response.body()
    assert.properties(body, ['tenants'])
    assert.isAtLeast(body.tenants.length, 1)

    const kinaf = body.tenants.find((row: { slug: string }) => row.slug === catalog.tenant.slug)
    assert.isDefined(kinaf)
    assert.isAbove(kinaf.bookings.created, 0)
    assert.equal(kinaf.fees.created, 1)
    assert.equal(kinaf.pendings.expired, 1)

    const after = await Booking.query().where('tenantId', catalog.tenant.id).count('* as total')
    assert.isAbove(Number(after[0].$extras.total), beforeCount)
  })
})
