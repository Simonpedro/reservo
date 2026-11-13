import { MonthlyFeeFactory, ReceiptFactory } from '#database/factories/fee_factories'
import { UserFactory } from '#database/factories/user_factory'
import MonthlyFee from '#models/monthly_fee'
import Receipt from '#models/receipt'
import {
  approveReceipt,
  monthName,
  PaymentError,
  paymentsOverview,
  receiptReview,
  registerForm,
  registerPayment,
  rejectReceipt,
  uploadedWhen,
} from '#services/admin_payments'
import { BUSINESS_ZONE } from '#services/business_calendar'
import { createCatalog, createStudent, type Catalog } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const at = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })
const NOW = at('2026-11-13T10:00')
const SINCE_SEPTEMBER = { startsOn: at('2026-09-01'), endsOn: null }

async function student(catalog: Catalog, fullName: string, price: number) {
  const created = await createStudent(catalog, { fullName, subscription: SINCE_SEPTEMBER })
  await created.plan.merge({ price }).save()
  return created
}

function fee(
  catalog: Catalog,
  owner: Awaited<ReturnType<typeof student>>,
  period: string,
  attributes: Partial<Pick<MonthlyFee, 'status' | 'amount'>> = {}
) {
  return MonthlyFeeFactory.merge({
    tenantId: catalog.tenant.id,
    userId: owner.user.id,
    subscriptionId: owner.subscription.id,
    period: at(period),
    amount: owner.plan.price,
    ...attributes,
  }).create()
}

function receipt(catalog: Catalog, monthlyFee: MonthlyFee, createdAt = NOW) {
  return ReceiptFactory.merge({
    tenantId: catalog.tenant.id,
    monthlyFeeId: monthlyFee.id,
    userId: monthlyFee.userId,
    createdAt,
  }).create()
}

test.group('Admin payments › wording', () => {
  test('months are named in Spanish, with the year only outside the current one', ({ assert }) => {
    assert.equal(monthName('2026-11-01', '2026-11-13'), 'noviembre')
    assert.equal(monthName('2025-12-01', '2026-01-05'), 'diciembre 2025')
  })

  test('a receipt reads as uploaded today, yesterday or on a date (Buenos Aires days)', ({
    assert,
  }) => {
    assert.equal(uploadedWhen(at('2026-11-13T00:10'), '2026-11-13'), 'hoy')
    assert.equal(uploadedWhen(at('2026-11-12T23:50'), '2026-11-13'), 'ayer')
    assert.equal(uploadedWhen(at('2026-11-09T08:52'), '2026-11-13'), 'el 9 de noviembre')
    // 01:30 UTC on the 13th is still the 12th in Buenos Aires.
    assert.equal(
      uploadedWhen(DateTime.fromISO('2026-11-13T01:30', { zone: 'utc' }), '2026-11-13'),
      'ayer'
    )
  })
})

test.group('Admin payments › overview', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists receipts to check and overdue fees, oldest first, naming past months', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const ana = await student(catalog, 'Ana Gómez', 38000)
    const mati = await student(catalog, 'Mati Ruiz', 42000)
    const flor = await student(catalog, 'Flor Ibáñez', 29000)
    const paid = await student(catalog, 'Juli Paz', 30000)

    await fee(catalog, ana, '2026-11-01', { status: 'in_review' })
    await fee(catalog, mati, '2026-11-01')
    await fee(catalog, flor, '2026-10-01')
    await fee(catalog, flor, '2026-11-01', { status: 'paid' })
    await fee(catalog, paid, '2026-11-01', { status: 'paid' })

    const overview = await paymentsOverview(catalog.tenant.id, NOW)

    assert.equal(overview.month, 'noviembre')
    assert.deepEqual(
      overview.review.map((row) => [row.fullName, row.initials, row.hint]),
      [['Ana Gómez', 'AG', 'Comprobante · $38.000']]
    )
    assert.deepEqual(
      overview.overdue.map((row) => [row.fullName, row.hint]),
      [
        ['Flor Ibáñez', 'Desde el 11 de octubre · $29.000'],
        ['Mati Ruiz', 'Desde el 11 · $42.000'],
      ]
    )
  })

  test('before the 11th an unpaid fee is not overdue yet', async ({ assert }) => {
    const catalog = await createCatalog()
    const mati = await student(catalog, 'Mati Ruiz', 42000)
    await fee(catalog, mati, '2026-11-01')

    const overview = await paymentsOverview(catalog.tenant.id, at('2026-11-10T20:00'))

    assert.lengthOf(overview.overdue, 0)
  })

  test('creates the missing fees of this month so overdue students show up', async ({ assert }) => {
    const catalog = await createCatalog()
    await student(catalog, 'Mati Ruiz', 42000)

    const overview = await paymentsOverview(catalog.tenant.id, NOW)

    assert.deepEqual(
      overview.overdue.map((row) => row.hint),
      ['Desde el 11 · $42.000']
    )
  })

  test('never shows fees of another center', async ({ assert }) => {
    const mine = await createCatalog()
    const other = await createCatalog()
    const stranger = await student(other, 'Otra Persona', 30000)
    await fee(other, stranger, '2026-11-01', { status: 'in_review' })

    const overview = await paymentsOverview(mine.tenant.id, NOW)

    assert.deepEqual(overview, { month: 'noviembre', review: [], overdue: [] })
  })
})

test.group('Admin payments › receipt review', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows the latest receipt in review of the fee', async ({ assert }) => {
    const catalog = await createCatalog()
    const ana = await student(catalog, 'Ana Gómez', 38000)
    const monthlyFee = await fee(catalog, ana, '2026-11-01', { status: 'in_review' })
    const old = await receipt(catalog, monthlyFee, at('2026-11-05T09:00'))
    await old.merge({ status: 'rejected' }).save()
    const latest = await receipt(catalog, monthlyFee, at('2026-11-13T08:52'))

    const review = await receiptReview(catalog.tenant.id, monthlyFee.id, NOW)

    assert.deepEqual(review, {
      feeId: monthlyFee.id,
      fullName: 'Ana Gómez',
      subtitle: 'Cuota de noviembre · $38.000 · subido hoy',
      receipt: { id: latest.id, filename: 'transferencia.png', isPdf: false },
    })
  })

  test('a fee no longer in review, or of another center, has nothing to review', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const ana = await student(catalog, 'Ana Gómez', 38000)
    const pending = await fee(catalog, ana, '2026-10-01')
    const inReview = await fee(catalog, ana, '2026-11-01', { status: 'in_review' })
    await receipt(catalog, inReview)

    assert.isNull(await receiptReview(catalog.tenant.id, pending.id, NOW))
    assert.isNull(await receiptReview(other.tenant.id, inReview.id, NOW))
  })
})

test.group('Admin payments › approve and reject', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('approving pays the fee by transfer and approves the receipt', async ({ assert }) => {
    const catalog = await createCatalog()
    const admin = await UserFactory.merge({ tenantId: catalog.tenant.id, role: 'admin' }).create()
    const ana = await student(catalog, 'Ana Gómez', 38000)
    const monthlyFee = await fee(catalog, ana, '2026-11-01', { status: 'in_review' })
    const sent = await receipt(catalog, monthlyFee)

    await approveReceipt(catalog.tenant.id, monthlyFee.id, admin.id, NOW)

    await monthlyFee.refresh()
    assert.equal(monthlyFee.status, 'paid')
    assert.equal(monthlyFee.method, 'transfer')
    assert.equal(monthlyFee.recordedById, admin.id)
    assert.equal(monthlyFee.paidAt?.toMillis(), NOW.toMillis())
    await sent.refresh()
    assert.equal(sent.status, 'approved')
  })

  test('rejecting voids the receipt and the fee goes back to pending', async ({ assert }) => {
    const catalog = await createCatalog()
    const ana = await student(catalog, 'Ana Gómez', 38000)
    const monthlyFee = await fee(catalog, ana, '2026-11-01', { status: 'in_review' })
    const sent = await receipt(catalog, monthlyFee)

    await rejectReceipt(catalog.tenant.id, monthlyFee.id)

    await monthlyFee.refresh()
    assert.equal(monthlyFee.status, 'pending')
    assert.isNull(monthlyFee.paidAt)
    await sent.refresh()
    assert.equal(sent.status, 'rejected')
  })

  test('a fee that is not in review cannot be approved or rejected twice', async ({ assert }) => {
    const catalog = await createCatalog()
    const ana = await student(catalog, 'Ana Gómez', 38000)
    const paid = await fee(catalog, ana, '2026-11-01', { status: 'paid' })

    await assert.rejects(
      () => approveReceipt(catalog.tenant.id, paid.id, ana.user.id),
      PaymentError
    )
    await assert.rejects(() => rejectReceipt(catalog.tenant.id, paid.id), PaymentError)
    await paid.refresh()
    assert.equal(paid.status, 'paid')
  })

  test('a fee of another center is not found', async ({ assert }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const ana = await student(catalog, 'Ana Gómez', 38000)
    const monthlyFee = await fee(catalog, ana, '2026-11-01', { status: 'in_review' })
    await receipt(catalog, monthlyFee)

    const error = await rejectReceipt(other.tenant.id, monthlyFee.id).catch((e) => e)

    assert.instanceOf(error, PaymentError)
    assert.equal(error.reason, 'not_found')
    await monthlyFee.refresh()
    assert.equal(monthlyFee.status, 'in_review')
    const receipts = await Receipt.query().where('monthlyFeeId', monthlyFee.id)
    assert.deepEqual(
      receipts.map((row) => row.status),
      ['in_review']
    )
  })
})

test.group('Admin payments › register', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a cash payment pays the existing fee with the amount given', async ({ assert }) => {
    const catalog = await createCatalog()
    const admin = await UserFactory.merge({ tenantId: catalog.tenant.id, role: 'admin' }).create()
    const mati = await student(catalog, 'Mati Ruiz', 42000)
    const monthlyFee = await fee(catalog, mati, '2026-11-01')

    await registerPayment(
      catalog.tenant.id,
      admin.id,
      { userId: mati.user.id, period: '2026-11-01', amount: 40000, method: 'cash' },
      NOW
    )

    await monthlyFee.refresh()
    assert.equal(monthlyFee.status, 'paid')
    assert.equal(monthlyFee.method, 'cash')
    assert.equal(monthlyFee.amount, 40000)
    assert.equal(monthlyFee.recordedById, admin.id)
  })

  test('paying a month in advance creates its fee', async ({ assert }) => {
    const catalog = await createCatalog()
    const admin = await UserFactory.merge({ tenantId: catalog.tenant.id, role: 'admin' }).create()
    const mati = await student(catalog, 'Mati Ruiz', 42000)

    await registerPayment(catalog.tenant.id, admin.id, {
      userId: mati.user.id,
      period: '2026-12-01',
      amount: 42000,
      method: 'transfer',
    })

    const fees = await MonthlyFee.query().where('userId', mati.user.id)
    assert.lengthOf(fees, 1)
    assert.equal(fees[0].period.toISODate(), '2026-12-01')
    assert.equal(fees[0].status, 'paid')
    assert.equal(fees[0].method, 'transfer')
  })

  test('forcing paid marks a fee in review as paid, method forced', async ({ assert }) => {
    const catalog = await createCatalog()
    const admin = await UserFactory.merge({ tenantId: catalog.tenant.id, role: 'admin' }).create()
    const ana = await student(catalog, 'Ana Gómez', 38000)
    const monthlyFee = await fee(catalog, ana, '2026-11-01', { status: 'in_review' })

    await registerPayment(catalog.tenant.id, admin.id, {
      userId: ana.user.id,
      period: '2026-11-01',
      amount: 38000,
      method: 'forced',
    })

    await monthlyFee.refresh()
    assert.equal(monthlyFee.status, 'paid')
    assert.equal(monthlyFee.method, 'forced')
  })

  test('refuses a paid month, a month without plan and a student of another center', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const admin = await UserFactory.merge({ tenantId: catalog.tenant.id, role: 'admin' }).create()
    const mati = await student(catalog, 'Mati Ruiz', 42000)
    const paid = await fee(catalog, mati, '2026-11-01', { status: 'paid', amount: 42000 })
    const stranger = await student(other, 'Otra Persona', 30000)

    const reason = (period: string, userId: number) =>
      registerPayment(catalog.tenant.id, admin.id, {
        userId,
        period,
        amount: 1,
        method: 'cash',
      }).catch((error: PaymentError) => error.reason)

    assert.equal(await reason('2026-11-01', mati.user.id), 'paid')
    assert.equal(await reason('2026-08-01', mati.user.id), 'no_plan')
    assert.equal(await reason('2026-11-01', stranger.user.id), 'not_found')
    assert.equal(await reason('2026-11-01', admin.id), 'not_found')
    await paid.refresh()
    assert.equal(paid.amount, 42000)
  })

  test('the form offers unpaid past months, this month and the next, with suggested amounts', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const mati = await student(catalog, 'Mati Ruiz', 42000)
    const ana = await student(catalog, 'Ana Gómez', 38000)
    await fee(catalog, mati, '2026-10-01', { amount: 40000 })
    await fee(catalog, ana, '2026-10-01', { status: 'paid' })
    await fee(catalog, ana, '2026-11-01', { status: 'paid' })

    const form = await registerForm(
      catalog.tenant.id,
      { userId: mati.user.id, period: '2026-10-01' },
      NOW
    )

    assert.deepEqual(form.months, [
      { value: '2026-10-01', label: 'Octubre' },
      { value: '2026-11-01', label: 'Noviembre' },
      { value: '2026-12-01', label: 'Diciembre' },
    ])
    assert.deepEqual(form.students, [
      {
        id: ana.user.id,
        fullName: 'Ana Gómez',
        amounts: { '2026-10-01': 38000, '2026-11-01': 38000, '2026-12-01': 38000 },
        paid: ['2026-10-01', '2026-11-01'],
      },
      {
        id: mati.user.id,
        fullName: 'Mati Ruiz',
        amounts: { '2026-10-01': 40000, '2026-11-01': 42000, '2026-12-01': 42000 },
        paid: [],
      },
    ])
    assert.deepEqual(form.defaults, { userId: mati.user.id, period: '2026-10-01' })
  })

  test('the form ignores a preselected student or month it does not offer', async ({ assert }) => {
    const catalog = await createCatalog()
    const other = await createCatalog()
    const stranger = await student(other, 'Otra Persona', 30000)

    const form = await registerForm(
      catalog.tenant.id,
      { userId: stranger.user.id, period: '2020-01-01' },
      NOW
    )

    assert.deepEqual(form.defaults, { userId: null, period: '2026-11-01' })
    assert.lengthOf(form.students, 0)
  })
})
