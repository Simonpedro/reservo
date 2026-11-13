import Booking from '#models/booking'
import FixedSlot from '#models/fixed_slot'
import Subscription from '#models/subscription'
import User from '#models/user'
import { businessDate, businessNow, type IsoDate } from '#services/business_calendar'
import { toClassCard, type ClassCardData } from '#services/my_classes'
import PendingClasses from '#services/pending_classes'
import db from '@adonisjs/lucid/services/db'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

type FeeStatus = 'pending' | 'in_review' | 'paid'

export type AdminClientListItem = {
  id: number
  fullName: string
  initials: string
  email: string
  summary: string
}

export type AdminClientsList = {
  query: string
  items: AdminClientListItem[]
}

export type AdminClientPlan = {
  name: string
  /**
   * Set while the plan has not started yet.
   */
  startsOn: string | null
  quotas: string[]
}

export type AdminClientPending = {
  available: number
  expiresOn: string | null
} | null

export type AdminClientPayments = {
  periodLabel: string
  statusLabel: string
  amount: number
} | null

export type AdminClientDetail = {
  id: number
  fullName: string
  email: string
  phone: string | null
  plan: AdminClientPlan | null
  fixedSchedule: string[]
  upcomingClasses: ClassCardData[]
  pendingClasses: AdminClientPending
  payments: AdminClientPayments
}

export class DuplicateClientEmailError extends Error {}

type FeeRow = {
  user_id: number
  period: unknown
  status: FeeStatus
  amount: number
}

function normalizeQuery(query: string | undefined) {
  return query?.trim() ?? ''
}

export function fullNameInitials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

function periodToIsoDate(period: unknown): IsoDate {
  if (period instanceof Date) return DateTime.fromJSDate(period).toISODate()!
  if (DateTime.isDateTime(period)) return period.toISODate()!
  return DateTime.fromISO(String(period)).toISODate()!
}

function feeIsOverdue(period: unknown, today: IsoDate) {
  const dueDay = DateTime.fromISO(periodToIsoDate(period)).set({ day: 10 }).toISODate()!
  return today > dueDay
}

function feeStatusLabel(fee: Pick<FeeRow, 'status' | 'period'>, today: IsoDate) {
  if (fee.status === 'paid') return 'Al día'
  if (fee.status === 'in_review') return 'Comprobante en revisión'
  return feeIsOverdue(fee.period, today) ? 'Cuota atrasada' : 'Cuota pendiente'
}

function quotaSummaryLine(quota: {
  weeklyCount: number
  anyActivity: boolean
  activities: Array<{ name: string }>
}) {
  const amount = `${quota.weeklyCount} ${quota.weeklyCount === 1 ? 'clase' : 'clases'}`
  if (quota.anyActivity) return `${amount} libres por semana`
  const names = quota.activities.map((activity) => activity.name).join(' o ')
  return `${amount} de ${names} por semana`
}

function fixedSlotLabel(slot: FixedSlot) {
  const schedule = slot.classSchedule
  return `${WEEKDAYS[schedule.weekday - 1][0]!.toUpperCase()}${WEEKDAYS[schedule.weekday - 1].slice(1)} ${schedule.startTime} · ${schedule.activity.name} · ${schedule.center.name}`
}

function monthLabel(period: IsoDate) {
  return DateTime.fromISO(period).setLocale('es-AR').toFormat("LLLL 'de' yyyy")
}

export async function listAdminClients(
  tenantId: number,
  queryText?: string
): Promise<AdminClientsList> {
  const query = normalizeQuery(queryText)
  const now = businessNow()
  const today = businessDate(now)

  const users = await User.query()
    .where('tenantId', tenantId)
    .where('role', 'client')
    .if(query.length > 0, (builder) => {
      builder.where((search) => {
        search.whereILike('fullName', `%${query}%`).orWhereILike('email', `%${query}%`)
      })
    })
    .orderBy('fullName', 'asc')

  if (users.length === 0) return { query, items: [] }

  const userIds = users.map((user) => user.id)
  const subscriptions = await Subscription.query()
    .where('tenantId', tenantId)
    .whereIn('userId', userIds)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .orderBy('startsOn', 'desc')
    .preload('plan')

  const subscriptionByUser = new Map<number, Subscription>()
  for (const subscription of subscriptions) {
    if (!subscriptionByUser.has(subscription.userId)) {
      subscriptionByUser.set(subscription.userId, subscription)
    }
  }

  const slots = await FixedSlot.query()
    .where('tenantId', tenantId)
    .whereIn('userId', userIds)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .select('userId')

  const slotsCountByUser = new Map<number, number>()
  for (const slot of slots) {
    slotsCountByUser.set(slot.userId, (slotsCountByUser.get(slot.userId) ?? 0) + 1)
  }

  const monthlyFeeByUser = new Map<number, FeeRow>()
  const fees = (await db
    .from('monthly_fees')
    .where('tenant_id', tenantId)
    .whereIn('user_id', userIds)
    .orderBy('period', 'desc')
    .select('user_id', 'period', 'status', 'amount')) as FeeRow[]
  for (const fee of fees) {
    if (!monthlyFeeByUser.has(fee.user_id)) monthlyFeeByUser.set(fee.user_id, fee)
  }

  const items = users.map((user) => {
    const subscription = subscriptionByUser.get(user.id)
    if (!subscription) {
      return {
        id: user.id,
        fullName: user.fullName,
        initials: fullNameInitials(user.fullName),
        email: user.email,
        summary: 'Sin plan',
      }
    }

    const hasSchedule = (slotsCountByUser.get(user.id) ?? 0) > 0
    const fee = monthlyFeeByUser.get(user.id)
    const feeLabel = fee ? feeStatusLabel(fee, today) : null
    const summary = !hasSchedule
      ? `${subscription.plan.name} · Sin horario`
      : feeLabel
        ? `${subscription.plan.name} · ${feeLabel}`
        : subscription.plan.name

    return {
      id: user.id,
      fullName: user.fullName,
      initials: fullNameInitials(user.fullName),
      email: user.email,
      summary,
    }
  })

  return { query, items }
}

export async function createClientUser(
  tenantId: number,
  input: { fullName: string; email: string; phone?: string | null }
) {
  const email = input.email.toLowerCase()
  const existing = await User.query().where('tenantId', tenantId).where('email', email).first()

  if (existing) throw new DuplicateClientEmailError('Email already exists in tenant')

  const user = await User.create({
    tenantId,
    fullName: input.fullName.trim(),
    email,
    phone: input.phone?.trim() || null,
    role: 'client',
    password: randomBytes(24).toString('base64url'),
  })

  return user
}

export function buildAccessWhatsappUrl({
  phone,
  fullName,
  accessUrl,
  tenantName,
}: {
  phone: string | null
  fullName: string
  accessUrl: string
  tenantName: string
}) {
  const digits = phone?.replace(/\D/g, '')
  if (!digits) return null

  const firstName = fullName.split(/\s+/)[0] ?? fullName
  const message = `Hola ${firstName}, te comparto tu link para entrar a ${tenantName}: ${accessUrl}`

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export async function getAdminClientDetail(tenantId: number, clientId: number) {
  const now = businessNow()
  const today = businessDate(now)

  const client = await User.query()
    .where('tenantId', tenantId)
    .where('role', 'client')
    .where('id', clientId)
    .first()
  if (!client) return null

  /**
   * The latest plan not ended yet: after a change it is the one starting next.
   */
  const subscription = await Subscription.query()
    .where('tenantId', tenantId)
    .where('userId', clientId)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .orderBy('startsOn', 'desc')
    .preload('plan', (plan) =>
      plan.preload('quotas', (quota) => quota.orderBy('position').preload('activities'))
    )
    .first()

  const fixedSlots = await FixedSlot.query()
    .where('tenantId', tenantId)
    .where('userId', clientId)
    .where('subscriptionId', subscription?.id ?? 0)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .preload('classSchedule', (schedule) => schedule.preload('activity').preload('center'))

  fixedSlots.sort((left, right) => {
    const leftSchedule = left.classSchedule
    const rightSchedule = right.classSchedule
    return (
      leftSchedule.weekday - rightSchedule.weekday ||
      leftSchedule.startTime.localeCompare(rightSchedule.startTime)
    )
  })

  const bookings = await Booking.query()
    .where('tenantId', tenantId)
    .where('userId', clientId)
    .whereIn('status', ['active', 'suspended'])
    .whereHas('classSession', (session) =>
      session.where('tenantId', tenantId).where('date', '>=', today)
    )
    .preload('classSession', (session) =>
      session.preload('classSchedule', (schedule) => schedule.preload('activity').preload('center'))
    )

  const upcomingClasses = bookings
    .map((booking) => toClassCard(booking, today))
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime)
    )
    .slice(0, 4)

  // Expiry is computed: one past its date no longer counts, even before the daily process.
  const pendings = await new PendingClasses().available(client, today)
  const pendingClasses: AdminClientPending = {
    available: pendings.length,
    expiresOn: pendings[0]?.expiresOn.toISODate() ?? null,
  }

  let payments: AdminClientPayments = null
  const latestFee = (await db
    .from('monthly_fees')
    .where('tenant_id', tenantId)
    .where('user_id', clientId)
    .orderBy('period', 'desc')
    .select('period', 'status', 'amount')
    .first()) as Pick<FeeRow, 'period' | 'status' | 'amount'> | null
  if (latestFee) {
    payments = {
      periodLabel: monthLabel(periodToIsoDate(latestFee.period)),
      statusLabel: feeStatusLabel(latestFee, today),
      amount: Number(latestFee.amount),
    }
  }

  const plan = subscription
    ? {
        name: subscription.plan.name,
        startsOn:
          subscription.startsOn.toISODate()! > today ? subscription.startsOn.toISODate()! : null,
        quotas: subscription.plan.quotas
          .sort((left, right) => left.position - right.position)
          .map((quota) => quotaSummaryLine(quota)),
      }
    : null

  return {
    id: client.id,
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    plan,
    fixedSchedule: fixedSlots.map((slot) => fixedSlotLabel(slot)),
    upcomingClasses,
    pendingClasses,
    payments,
  } satisfies AdminClientDetail
}
