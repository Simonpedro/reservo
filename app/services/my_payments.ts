import MonthlyFee from '#models/monthly_fee'
import Receipt from '#models/receipt'
import { BUSINESS_ZONE, businessDate, businessNow, type IsoDate } from '#services/business_calendar'
import {
  currentSubscriptionOf,
  DUE_DAY,
  ensureFee,
  periodOf,
  statusOf,
  type FeeStatus,
} from '#services/fees'
import { formatPesos } from '#services/money'
import type { DateTime } from 'luxon'

type StudentRef = { id: number; tenantId: number }

export type FeeLine = {
  id: number
  /**
   * "Cuota de noviembre".
   */
  title: string
  /**
   * "Noviembre", or "Diciembre 2025" outside the current year.
   */
  month: string
  amount: string
  status: FeeStatus
  /**
   * The status as a sentence: "Pendiente · pagá hasta el 10".
   */
  statusText: string
  /**
   * One line for the history: "Octubre · $38.000 · pagado el 4 de octubre".
   */
  summary: string
  /**
   * The student can send a receipt (not paid, not already in review).
   */
  canUpload: boolean
}

export type MyPaymentsView = {
  current: FeeLine | null
  history: FeeLine[]
  /**
   * How to pay, shown while the current fee is unpaid.
   */
  howToPay: string
  /**
   * The last receipt sent for the current fee was rejected and the student
   * has to upload another one.
   */
  receiptRejected: boolean
}

const HISTORY_LIMIT = 12

function month(period: DateTime, today: IsoDate): string {
  const name = period.setLocale('es-AR').toFormat('LLLL')
  const label = name.charAt(0).toUpperCase() + name.slice(1)
  return period.year === Number(today.slice(0, 4)) ? label : `${label} ${period.year}`
}

function dayAndMonth(moment: DateTime): string {
  return moment.setZone(BUSINESS_ZONE).setLocale('es-AR').toFormat("d 'de' LLLL")
}

function statusText(fee: MonthlyFee, status: FeeStatus): string {
  switch (status) {
    case 'paid':
      return fee.paidAt ? `Pagado el ${dayAndMonth(fee.paidAt)}` : 'Pagado'
    case 'in_review':
      return 'En revisión'
    case 'overdue':
      return `Atrasada desde el ${DUE_DAY + 1}`
    case 'pending':
      return `Pendiente · pagá hasta el ${DUE_DAY}`
  }
}

function historyText(fee: MonthlyFee, status: FeeStatus): string {
  if (status === 'paid') return fee.paidAt ? `pagado el ${dayAndMonth(fee.paidAt)}` : 'pagado'
  if (status === 'in_review') return 'en revisión'
  return 'sin pagar'
}

/**
 * "Transferí al alias KINAF.KINESIOLOGIA o KINAF.KINE.AF, o pagá en recepción".
 */
export function howToPay(aliases: string[]): string {
  if (aliases.length === 0) return 'Pagá en recepción'
  const list =
    aliases.length === 1 ? aliases[0] : `${aliases.slice(0, -1).join(', ')} o ${aliases.at(-1)}`
  const noun = aliases.length === 1 ? 'al alias' : 'a los alias'
  return `Transferí ${noun} ${list}, o pagá en recepción`
}

/**
 * One fee as the student sees it, on `today`.
 */
export function feeLine(fee: MonthlyFee, today: IsoDate): FeeLine {
  const status = statusOf(fee, today)
  const label = month(fee.period, today)
  return {
    id: fee.id,
    title: `Cuota de ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
    month: label,
    amount: formatPesos(fee.amount),
    status,
    statusText: statusText(fee, status),
    summary: `${label} · ${formatPesos(fee.amount)} · ${historyText(fee, status)}`,
    canUpload: status === 'pending' || status === 'overdue',
  }
}

/**
 * Pagos: this month's fee (created on the fly if the daily process has not
 * run yet) and the previous ones.
 */
export async function myPayments(
  student: StudentRef,
  transferAliases: string[],
  now: DateTime = businessNow()
): Promise<MyPaymentsView> {
  const today = businessDate(now)
  const period = periodOf(today)

  const subscription = await currentSubscriptionOf(student, today)
  if (subscription) await ensureFee(subscription, period)

  const fees = await MonthlyFee.query()
    .where('tenantId', student.tenantId)
    .where('userId', student.id)
    .where('period', '<=', period)
    .orderBy('period', 'desc')
    .limit(HISTORY_LIMIT + 1)

  const currentFee = fees.find((fee) => fee.period.toISODate() === period) ?? null
  const previous = fees.filter((fee) => fee !== currentFee).slice(0, HISTORY_LIMIT)

  const current = currentFee ? feeLine(currentFee, today) : null

  return {
    current,
    history: previous.map((fee) => feeLine(fee, today)),
    howToPay: howToPay(transferAliases),
    receiptRejected: Boolean(current?.canUpload) && (await lastReceiptRejected(currentFee!)),
  }
}

async function lastReceiptRejected(fee: MonthlyFee): Promise<boolean> {
  const last = await Receipt.query()
    .where('tenantId', fee.tenantId)
    .where('monthlyFeeId', fee.id)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .first()
  return last?.status === 'rejected'
}

/**
 * The fee a receipt is being uploaded for, if it belongs to the student and
 * still takes one.
 */
export async function uploadableFee(
  student: StudentRef,
  feeId: number,
  now: DateTime = businessNow()
): Promise<FeeLine | null> {
  const fee = await MonthlyFee.query()
    .where('tenantId', student.tenantId)
    .where('userId', student.id)
    .where('id', feeId)
    .first()
  if (!fee) return null
  const line = feeLine(fee, businessDate(now))
  return line.canUpload ? line : null
}
