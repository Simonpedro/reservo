import MonthlyFee, { type MonthlyFeeMethod } from '#models/monthly_fee'
import Receipt from '#models/receipt'
import Subscription from '#models/subscription'
import User from '#models/user'
import { fullNameInitials } from '#services/admin_clients'
import { BUSINESS_ZONE, businessDate, businessNow, type IsoDate } from '#services/business_calendar'
import { DUE_DAY, ensureCurrentFees, ensureFee, periodOf, statusOf } from '#services/fees'
import { formatPesos } from '#services/money'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export type PaymentRow = {
  feeId: number
  userId: number
  fullName: string
  initials: string
  /**
   * "Comprobante · $38.000" or "Desde el 11 · $42.000" (the month is added
   * when it is not the current one).
   */
  hint: string
  period: IsoDate
}

export type PaymentsOverview = {
  /**
   * "noviembre".
   */
  month: string
  review: PaymentRow[]
  overdue: PaymentRow[]
}

export type ReceiptReview = {
  feeId: number
  fullName: string
  /**
   * "Cuota de noviembre · $38.000 · subido hoy".
   */
  subtitle: string
  receipt: { id: number; filename: string; isPdf: boolean }
}

export type RegisterOption = { value: string; label: string }

export type RegisterStudent = {
  id: number
  fullName: string
  /**
   * Suggested amount per period: the fee amount if it exists, otherwise the
   * plan price.
   */
  amounts: Record<IsoDate, number>
  /**
   * Periods already paid: registering them again is refused.
   */
  paid: IsoDate[]
}

export type RegisterForm = {
  months: RegisterOption[]
  students: RegisterStudent[]
  defaults: { userId: number | null; period: IsoDate }
}

export type PaymentFailure = 'not_found' | 'not_in_review' | 'paid' | 'no_plan'

export class PaymentError extends Error {
  constructor(readonly reason: PaymentFailure) {
    super(reason)
  }
}

/**
 * How far back the register form offers unpaid months.
 */
const PAST_MONTHS = 12

function parse(date: IsoDate) {
  return DateTime.fromISO(date, { zone: BUSINESS_ZONE })
}

/**
 * "noviembre", or "diciembre 2025" outside the year of `today`.
 */
export function monthName(period: IsoDate, today: IsoDate): string {
  const date = parse(period)
  const name = date.setLocale('es-AR').toFormat('LLLL')
  return date.year === parse(today).year ? name : `${name} ${date.year}`
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * "hoy", "ayer" or "el 9 de noviembre", for when a receipt was uploaded.
 */
export function uploadedWhen(moment: DateTime, today: IsoDate): string {
  const day = businessDate(moment)
  if (day === today) return 'hoy'
  if (day === parse(today).minus({ days: 1 }).toISODate()) return 'ayer'
  return `el ${parse(day).setLocale('es-AR').toFormat("d 'de' LLLL")}`
}

function row(fee: MonthlyFee, user: User, hint: string): PaymentRow {
  return {
    feeId: fee.id,
    userId: user.id,
    fullName: user.fullName,
    initials: fullNameInitials(user.fullName),
    hint,
    period: fee.period.toISODate()!,
  }
}

/**
 * Pagos (admin): fees with a receipt to check and overdue fees, oldest first.
 * This month's fees are created first, in case the daily process did not run.
 */
export async function paymentsOverview(
  tenantId: number,
  now: DateTime = businessNow()
): Promise<PaymentsOverview> {
  const today = businessDate(now)
  const current = periodOf(today)
  await ensureCurrentFees({ tenantId, now })

  const fees = await MonthlyFee.query()
    .where('tenantId', tenantId)
    .whereIn('status', ['pending', 'in_review'])
    .where('period', '<=', current)
    .preload('user')
    .orderBy('period', 'asc')
    .orderBy('id', 'asc')

  const suffix = (fee: MonthlyFee) => {
    const period = fee.period.toISODate()!
    return period === current ? '' : ` de ${monthName(period, today)}`
  }

  const review: PaymentRow[] = []
  const overdue: PaymentRow[] = []
  for (const fee of fees) {
    const status = statusOf(fee, today)
    const amount = formatPesos(fee.amount)
    if (status === 'in_review') {
      review.push(row(fee, fee.user, `Comprobante${suffix(fee)} · ${amount}`))
    } else if (status === 'overdue') {
      overdue.push(row(fee, fee.user, `Desde el ${DUE_DAY + 1}${suffix(fee)} · ${amount}`))
    }
  }

  return { month: monthName(current, today), review, overdue }
}

/**
 * The receipt to check for a fee in review, or null if the fee is not in
 * this tenant or no longer waiting for a review.
 */
export async function receiptReview(
  tenantId: number,
  feeId: number,
  now: DateTime = businessNow()
): Promise<ReceiptReview | null> {
  const today = businessDate(now)
  const fee = await MonthlyFee.query()
    .where('tenantId', tenantId)
    .where('id', feeId)
    .where('status', 'in_review')
    .preload('user')
    .first()
  if (!fee) return null

  const receipt = await Receipt.query()
    .where('tenantId', tenantId)
    .where('monthlyFeeId', fee.id)
    .where('status', 'in_review')
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .first()
  if (!receipt) return null

  return {
    feeId: fee.id,
    fullName: fee.user.fullName,
    subtitle: [
      `Cuota de ${monthName(fee.period.toISODate()!, today)}`,
      formatPesos(fee.amount),
      `subido ${uploadedWhen(receipt.createdAt, today)}`,
    ].join(' · '),
    receipt: {
      id: receipt.id,
      filename: receipt.filename,
      isPdf: receipt.mime === 'application/pdf',
    },
  }
}

/**
 * The admin checked the receipt: the fee is paid by transfer.
 */
export async function approveReceipt(
  tenantId: number,
  feeId: number,
  adminId: number,
  now: DateTime = DateTime.now()
): Promise<MonthlyFee> {
  return db.transaction(async (trx) => {
    const fee = await MonthlyFee.query({ client: trx })
      .where('tenantId', tenantId)
      .where('id', feeId)
      .forUpdate()
      .first()
    if (!fee) throw new PaymentError('not_found')
    if (fee.status !== 'in_review') throw new PaymentError('not_in_review')

    await Receipt.query({ client: trx })
      .where('tenantId', tenantId)
      .where('monthlyFeeId', fee.id)
      .where('status', 'in_review')
      .update({ status: 'approved', updatedAt: now.toSQL() })

    fee.useTransaction(trx)
    fee.merge({ status: 'paid', method: 'transfer', paidAt: now, recordedById: adminId })
    await fee.save()
    await fee.load('user')
    return fee
  })
}

/**
 * The receipt is not valid: it is voided and the fee goes back to pending,
 * so the student can upload another one.
 */
export async function rejectReceipt(tenantId: number, feeId: number): Promise<MonthlyFee> {
  return db.transaction(async (trx) => {
    const fee = await MonthlyFee.query({ client: trx })
      .where('tenantId', tenantId)
      .where('id', feeId)
      .forUpdate()
      .first()
    if (!fee) throw new PaymentError('not_found')
    if (fee.status !== 'in_review') throw new PaymentError('not_in_review')

    await Receipt.query({ client: trx })
      .where('tenantId', tenantId)
      .where('monthlyFeeId', fee.id)
      .where('status', 'in_review')
      .update({ status: 'rejected', updatedAt: DateTime.now().toSQL() })

    fee.useTransaction(trx)
    fee.status = 'pending'
    await fee.save()
    await fee.load('user')
    return fee
  })
}

/**
 * The subscription that covers `period` (any day of that month), latest
 * first.
 */
function subscriptionFor(tenantId: number, userId: number, period: IsoDate) {
  const first = periodOf(period)
  const last = parse(first).endOf('month').toISODate()!
  return Subscription.query()
    .where('tenantId', tenantId)
    .where('userId', userId)
    .where('startsOn', '<=', last)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', first))
    .orderBy('startsOn', 'desc')
    .first()
}

export type RegisterPayment = {
  userId: number
  period: IsoDate
  amount: number
  /**
   * `forced` marks the fee paid without collecting anything.
   */
  method: MonthlyFeeMethod
}

/**
 * The admin records a payment made at the front desk (cash or transfer) or
 * forces the fee as paid. The fee is created if it does not exist yet and is
 * paid right away with the amount given.
 */
export async function registerPayment(
  tenantId: number,
  adminId: number,
  payment: RegisterPayment,
  now: DateTime = DateTime.now()
): Promise<MonthlyFee> {
  const student = await User.query()
    .where('tenantId', tenantId)
    .where('id', payment.userId)
    .where('role', 'client')
    .first()
  if (!student) throw new PaymentError('not_found')

  const subscription = await subscriptionFor(tenantId, student.id, payment.period)
  if (!subscription) throw new PaymentError('no_plan')
  const { id } = await ensureFee(subscription, payment.period)

  return db.transaction(async (trx) => {
    const fee = await MonthlyFee.query({ client: trx })
      .where('tenantId', tenantId)
      .where('id', id)
      .forUpdate()
      .firstOrFail()
    if (fee.status === 'paid') throw new PaymentError('paid')

    fee.useTransaction(trx)
    fee.merge({
      amount: payment.amount,
      status: 'paid',
      method: payment.method,
      paidAt: now,
      recordedById: adminId,
    })
    await fee.save()
    fee.$setRelated('user', student)
    return fee
  })
}

/**
 * Registrar un pago: the months on offer (unpaid past months of anyone, this
 * month and the next) and every student with a plan in that range, with the
 * amount to suggest for each month.
 */
export async function registerForm(
  tenantId: number,
  preselected: { userId?: number; period?: string } = {},
  now: DateTime = businessNow()
): Promise<RegisterForm> {
  const today = businessDate(now)
  const current = periodOf(today)
  const next = parse(current).plus({ months: 1 }).toISODate()!
  const oldest = parse(current).minus({ months: PAST_MONTHS }).toISODate()!

  const unpaidPast = await MonthlyFee.query()
    .where('tenantId', tenantId)
    .whereNot('status', 'paid')
    .where('period', '>=', oldest)
    .where('period', '<', current)
    .distinct('period')
    .orderBy('period', 'asc')
  const periods = [...unpaidPast.map((fee) => fee.period.toISODate()!), current, next]
  const lastDay = parse(next).endOf('month').toISODate()!

  const subscriptions = await Subscription.query()
    .where('tenantId', tenantId)
    .where('startsOn', '<=', lastDay)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', periods[0]))
    .preload('user')
    .preload('plan')
    .orderBy('startsOn', 'asc')

  const fees = await MonthlyFee.query()
    .where('tenantId', tenantId)
    .whereIn('period', periods)
    .whereIn(
      'userId',
      subscriptions.map((subscription) => subscription.userId)
    )

  const students = new Map<number, RegisterStudent>()
  for (const subscription of subscriptions) {
    const student = students.get(subscription.userId) ?? {
      id: subscription.userId,
      fullName: subscription.user.fullName,
      amounts: {},
      paid: [],
    }
    for (const period of periods) {
      const end = subscription.endsOn?.toISODate()
      const covers =
        subscription.startsOn.toISODate()! <= parse(period).endOf('month').toISODate()! &&
        (!end || end >= period)
      // Later subscriptions overwrite earlier ones: the newest plan wins.
      if (covers) student.amounts[period] = subscription.plan.price
    }
    students.set(subscription.userId, student)
  }
  for (const fee of fees) {
    const student = students.get(fee.userId)
    if (!student) continue
    const period = fee.period.toISODate()!
    student.amounts[period] = fee.amount
    if (fee.status === 'paid') student.paid.push(period)
  }

  const list = [...students.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'))
  const userId = list.some((student) => student.id === preselected.userId)
    ? preselected.userId!
    : null
  const period = periods.includes(preselected.period ?? '') ? preselected.period! : current

  return {
    months: periods.map((value) => ({ value, label: capitalize(monthName(value, today)) })),
    students: list,
    defaults: { userId, period },
  }
}
