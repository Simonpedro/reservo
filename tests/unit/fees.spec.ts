import { MonthlyFeeFactory } from '#database/factories/fee_factories'
import MonthlyFee from '#models/monthly_fee'
import { BUSINESS_ZONE } from '#services/business_calendar'
import DailyProcess from '#services/daily_process'
import { ensureCurrentFees, ensureFee, periodOf, statusOf } from '#services/fees'
import { feeLine, howToPay } from '#services/my_payments'
import { createCatalog, createSchedule, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const NOVEMBER = '2026-11-01'
const day = (iso: string) => DateTime.fromISO(iso, { zone: BUSINESS_ZONE })

test.group('statusOf', () => {
  test('an unpaid fee is pending up to the 10th, inclusive', ({ assert }) => {
    const fee = { status: 'pending' as const, period: NOVEMBER }
    assert.equal(statusOf(fee, '2026-11-01'), 'pending')
    assert.equal(statusOf(fee, '2026-11-10'), 'pending')
  })

  test('an unpaid fee is overdue from the 11th', ({ assert }) => {
    const fee = { status: 'pending' as const, period: NOVEMBER }
    assert.equal(statusOf(fee, '2026-11-11'), 'overdue')
    assert.equal(statusOf(fee, '2026-11-30'), 'overdue')
  })

  test('an unpaid fee of a past month is still overdue at the start of the next one', ({
    assert,
  }) => {
    assert.equal(statusOf({ status: 'pending', period: '2026-10-01' }, '2026-11-02'), 'overdue')
  })

  test('a fee paid late reads as paid, not overdue', ({ assert }) => {
    assert.equal(statusOf({ status: 'paid', period: NOVEMBER }, '2026-11-25'), 'paid')
  })

  test('a fee in review on the 15th stays in review: the receipt wins over overdue', ({
    assert,
  }) => {
    assert.equal(statusOf({ status: 'in_review', period: NOVEMBER }, '2026-11-15'), 'in_review')
  })

  test('accepts the period as a DateTime from the model', ({ assert }) => {
    assert.equal(statusOf({ status: 'pending', period: day(NOVEMBER) }, '2026-11-11'), 'overdue')
  })

  test('February: due on the 10th like any other month', ({ assert }) => {
    const fee = { status: 'pending' as const, period: '2027-02-01' }
    assert.equal(statusOf(fee, '2027-02-10'), 'pending')
    assert.equal(statusOf(fee, '2027-02-11'), 'overdue')
  })
})

test.group('periodOf', () => {
  test('is the first day of the month of the date', ({ assert }) => {
    assert.equal(periodOf('2026-11-30'), NOVEMBER)
    assert.equal(periodOf('2026-11-01'), NOVEMBER)
    assert.equal(periodOf('2026-12-31'), '2026-12-01')
  })
})

test.group('howToPay', () => {
  test('lists the transfer aliases of the center', ({ assert }) => {
    assert.equal(
      howToPay(['KINAF.KINESIOLOGIA', 'KINAF.KINE.AF']),
      'Transferí a los alias KINAF.KINESIOLOGIA o KINAF.KINE.AF, o pagá en recepción'
    )
    assert.equal(
      howToPay(['kinaf.rosario']),
      'Transferí al alias kinaf.rosario, o pagá en recepción'
    )
  })

  test('without aliases only offers paying at the front desk', ({ assert }) => {
    assert.equal(howToPay([]), 'Pagá en recepción')
  })
})

test.group('feeLine', () => {
  function fee(attributes: Partial<MonthlyFee>) {
    const model = new MonthlyFee()
    model.merge({ id: 1, amount: 38000, status: 'pending', paidAt: null, period: day(NOVEMBER) })
    model.merge(attributes)
    return model
  }

  test('describes the current fee as the student reads it', ({ assert }) => {
    const line = feeLine(fee({}), '2026-11-10')
    assert.include(line, {
      title: 'Cuota de noviembre',
      amount: '$38.000',
      status: 'pending',
      statusText: 'Pendiente · pagá hasta el 10',
      canUpload: true,
    })
    assert.equal(feeLine(fee({}), '2026-11-11').statusText, 'Atrasada desde el 11')
  })

  test('a paid fee shows the payment date and takes no more receipts', ({ assert }) => {
    const line = feeLine(
      fee({ status: 'paid', period: day('2026-10-01'), paidAt: day('2026-10-04T10:00') }),
      '2026-11-12'
    )
    assert.equal(line.statusText, 'Pagado el 4 de octubre')
    assert.equal(line.summary, 'Octubre · $38.000 · pagado el 4 de octubre')
    assert.isFalse(line.canUpload)
  })

  test('a fee in review takes no more receipts', ({ assert }) => {
    const line = feeLine(fee({ status: 'in_review' }), '2026-11-15')
    assert.equal(line.statusText, 'En revisión')
    assert.isFalse(line.canUpload)
  })

  test('an unpaid past month reads "sin pagar" in the history, with the year if it is not this one', ({
    assert,
  }) => {
    const line = feeLine(fee({ period: day('2025-12-01') }), '2026-11-12')
    assert.equal(line.summary, 'Diciembre 2025 · $38.000 · sin pagar')
    assert.isTrue(line.canUpload)
  })
})

test.group('ensureFee', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates the fee with the plan price for the first of the month', async ({ assert }) => {
    const catalog = await createCatalog()
    const student = await createStudent(catalog)
    await student.plan.merge({ price: 42000 }).save()

    const fee = await ensureFee(student.subscription, '2026-11-17')

    assert.equal(fee.period.toISODate(), NOVEMBER)
    assert.equal(fee.amount, 42000)
    assert.equal(fee.status, 'pending')
    assert.equal(fee.tenantId, catalog.tenant.id)
    assert.equal(fee.subscriptionId, student.subscription.id)
  })

  test('is idempotent and never reprices an existing fee', async ({ assert }) => {
    const catalog = await createCatalog()
    const student = await createStudent(catalog)
    await student.plan.merge({ price: 38000 }).save()

    const first = await ensureFee(student.subscription, NOVEMBER)
    await student.plan.merge({ price: 45000 }).save()
    const again = await ensureFee(student.subscription, '2026-11-20')

    assert.equal(again.id, first.id)
    assert.equal(again.amount, 38000)
    const count = await MonthlyFee.query().where('userId', student.user.id).count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })
})

test.group('ensureCurrentFees', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const now = day('2026-11-12T03:00')

  test('creates this month fee for every current subscription of the tenant only', async ({
    assert,
  }) => {
    const catalog = await createCatalog()
    const current = await createStudent(catalog)
    const ended = await createStudent(catalog, {
      subscription: { startsOn: day('2026-09-01'), endsOn: day('2026-10-31') },
    })
    const future = await createStudent(catalog, { subscription: { startsOn: day('2026-12-01') } })
    const otherTenant = await createStudent(await createCatalog())

    const summary = await ensureCurrentFees({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(summary, { created: 1, existing: 0 })
    const owners = await MonthlyFee.query().where('period', NOVEMBER).select('userId')
    const ids = owners.map((fee) => fee.userId)
    assert.include(ids, current.user.id)
    assert.notInclude(ids, ended.user.id)
    assert.notInclude(ids, future.user.id)
    assert.notInclude(ids, otherTenant.user.id)
  })

  test('leaves existing fees alone, paid or not', async ({ assert }) => {
    const catalog = await createCatalog()
    const student = await createStudent(catalog)
    const paid = await MonthlyFeeFactory.merge({
      tenantId: catalog.tenant.id,
      userId: student.user.id,
      subscriptionId: student.subscription.id,
      period: day(NOVEMBER),
    })
      .apply('paid')
      .create()

    const summary = await ensureCurrentFees({ tenantId: catalog.tenant.id, now })

    assert.deepEqual(summary, { created: 0, existing: 1 })
    await paid.refresh()
    assert.equal(paid.status, 'paid')
  })

  test('the daily process generates bookings and fees in one run', async ({ assert }) => {
    const catalog = await createCatalog()
    const monday = await createSchedule(catalog, { weekday: 1, startTime: '18:00' })
    await createStudent(catalog, { schedules: [monday] })

    const summary = await new DailyProcess().run({ tenantId: catalog.tenant.id, now })

    // Thursday 12 November: Mondays 16, 23, 30 November and 7 December.
    assert.equal(summary.bookings.created, 4)
    assert.equal(summary.fees.created, 1)
  })
})
