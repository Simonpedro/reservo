import MonthlyFee, { type MonthlyFeeStatus } from '#models/monthly_fee'
import Receipt from '#models/receipt'
import Subscription from '#models/subscription'
import { BUSINESS_ZONE, businessDate, businessNow, type IsoDate } from '#services/business_calendar'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Day of the month the fee is due. From the next day on an unpaid fee shows
 * as overdue.
 */
export const DUE_DAY = 10

/**
 * What the student sees. `overdue` is computed, never stored, and only
 * changes the text on screen: it blocks nothing.
 */
export type FeeStatus = 'pending' | 'in_review' | 'paid' | 'overdue'

type StudentRef = { id: number; tenantId: number }

/**
 * First day of the month of `date`, as 'yyyy-MM-01'.
 */
export function periodOf(date: IsoDate): IsoDate {
  return DateTime.fromISO(date, { zone: BUSINESS_ZONE }).startOf('month').toISODate()!
}

/**
 * Status of a fee on `today` (business date).
 *
 * - `paid` wins over everything, even if it was paid after the 10th.
 * - `in_review` wins over `overdue`: once the student uploaded a receipt the
 *   ball is in the center's court, so a receipt sent on the 15th still reads
 *   "En revisión", not "Atrasada".
 * - Otherwise the fee is `overdue` from day 11 of its month (and in any later
 *   month), and `pending` until then.
 */
export function statusOf(
  fee: { status: MonthlyFeeStatus; period: IsoDate | DateTime },
  today: IsoDate
): FeeStatus {
  if (fee.status === 'paid') return 'paid'
  if (fee.status === 'in_review') return 'in_review'

  const period = typeof fee.period === 'string' ? fee.period : fee.period.toISODate()!
  const dueOn = DateTime.fromISO(periodOf(period), { zone: BUSINESS_ZONE })
    .set({ day: DUE_DAY })
    .toISODate()!
  return today > dueOn ? 'overdue' : 'pending'
}

/**
 * Creates the fee of `subscription` for the month of `period` with the plan
 * price, unless it already exists. Returns whether it was created.
 */
async function insertFee(
  subscription: Pick<Subscription, 'id' | 'tenantId' | 'userId' | 'planId'>,
  period: IsoDate
): Promise<boolean> {
  const plan = await db
    .from('plans')
    .where('tenant_id', subscription.tenantId)
    .where('id', subscription.planId)
    .select('price')
    .firstOrFail()

  const now = DateTime.now().toSQL()
  const inserted = await db
    .table('monthly_fees')
    .insert({
      tenant_id: subscription.tenantId,
      user_id: subscription.userId,
      subscription_id: subscription.id,
      period: periodOf(period),
      amount: plan.price,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .onConflict(['user_id', 'period'])
    .ignore()
    .returning('id')
  return inserted.length > 0
}

/**
 * The fee of `subscription` for the month of `period`, created with the plan
 * price if it does not exist yet. Safe to call any number of times (and
 * concurrently): the amount of an existing fee is never touched.
 */
export async function ensureFee(
  subscription: Pick<Subscription, 'id' | 'tenantId' | 'userId' | 'planId'>,
  period: IsoDate
): Promise<MonthlyFee> {
  const first = periodOf(period)
  const existing = await MonthlyFee.query()
    .where('tenantId', subscription.tenantId)
    .where('userId', subscription.userId)
    .where('period', first)
    .first()
  if (existing) return existing

  await insertFee(subscription, first)
  return MonthlyFee.query()
    .where('tenantId', subscription.tenantId)
    .where('userId', subscription.userId)
    .where('period', first)
    .firstOrFail()
}

/**
 * Daily process: every subscription current today has its fee for this month.
 */
export async function ensureCurrentFees({
  tenantId,
  now = businessNow(),
}: {
  tenantId: number
  now?: DateTime
}): Promise<{ created: number; existing: number }> {
  const today = businessDate(now)
  const subscriptions = await Subscription.query()
    .where('tenantId', tenantId)
    .where('startsOn', '<=', today)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .orderBy('id')

  const summary = { created: 0, existing: 0 }
  for (const subscription of subscriptions) {
    if (await insertFee(subscription, today)) summary.created++
    else summary.existing++
  }
  return summary
}

/**
 * The student's current subscription on `today`, if any.
 */
export function currentSubscriptionOf(student: StudentRef, today: IsoDate) {
  return Subscription.query()
    .where('tenantId', student.tenantId)
    .where('userId', student.id)
    .where('startsOn', '<=', today)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .orderBy('startsOn', 'desc')
    .first()
}

export type ReceiptFile = {
  filename: string
  mime: string
  size: number
  data: Buffer
}

export type ReceiptFailure = 'not_found' | 'paid' | 'in_review'

export class ReceiptError extends Error {
  constructor(readonly reason: ReceiptFailure) {
    super(reason)
  }
}

/**
 * The student sends a receipt for one of their fees: it is stored and the
 * fee goes to `in_review` until the center checks it.
 */
export async function submitReceipt(
  student: StudentRef,
  feeId: number,
  file: ReceiptFile
): Promise<Receipt> {
  return db.transaction(async (trx) => {
    const fee = await MonthlyFee.query({ client: trx })
      .where('tenantId', student.tenantId)
      .where('userId', student.id)
      .where('id', feeId)
      .forUpdate()
      .first()

    if (!fee) throw new ReceiptError('not_found')
    if (fee.status === 'paid') throw new ReceiptError('paid')
    if (fee.status === 'in_review') throw new ReceiptError('in_review')

    const receipt = await Receipt.create(
      {
        tenantId: student.tenantId,
        monthlyFeeId: fee.id,
        userId: student.id,
        filename: file.filename,
        mime: file.mime,
        size: file.size,
        data: file.data,
        status: 'in_review',
      },
      { client: trx }
    )

    fee.useTransaction(trx)
    fee.status = 'in_review'
    await fee.save()

    return receipt
  })
}
