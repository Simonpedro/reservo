import Booking from '#models/booking'
import ClassSchedule from '#models/class_schedule'
import FixedSlot from '#models/fixed_slot'
import Plan from '#models/plan'
import Subscription from '#models/subscription'
import User from '#models/user'
import BookingGenerator from '#services/booking_generator'
import {
  addDays,
  businessDate,
  businessNow,
  isoWeekday,
  type IsoDate,
} from '#services/business_calendar'
import { formatPesos } from '#services/money'
import { quotaText } from '#services/quota_text'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/**
 * What the admin picked in the wizard: a plan, the schedules of each of its
 * quotas and the date the new fixed schedule starts.
 */
export type AssignmentInput = {
  planId: number
  startsOn: IsoDate
  quotas: Array<{ quotaId: number; scheduleIds: number[] }>
}

export class AssignmentError extends Error {}

/**
 * The quotas of a plan as the validation needs them.
 */
export type QuotaRule = {
  id: number
  weeklyCount: number
  anyActivity: boolean
  activityIds: number[]
  label: string
}

export type ScheduleSeat = {
  id: number
  activityId: number
  active: boolean
  label: string
  /**
   * Fixed places left from the start date, without counting the student.
   */
  free: number
}

/**
 * Checks a selection against the plan: every quota gets exactly its weekly
 * count of active schedules of its activities, with a free fixed place, and
 * no schedule is picked twice. Returns the first problem, in Spanish, or null.
 */
export function selectionError(
  quotas: QuotaRule[],
  selection: AssignmentInput['quotas'],
  schedules: Map<number, ScheduleSeat>
): string | null {
  const picked = new Set<number>()
  const byQuota = new Map(selection.map((entry) => [entry.quotaId, entry.scheduleIds]))

  if (selection.some((entry) => !quotas.some((quota) => quota.id === entry.quotaId))) {
    return 'Ese cupo no es del plan elegido.'
  }

  for (const quota of quotas) {
    const scheduleIds = byQuota.get(quota.id) ?? []
    if (scheduleIds.length !== quota.weeklyCount) {
      const amount = quota.weeklyCount === 1 ? '1 horario' : `${quota.weeklyCount} horarios`
      return `Elegí ${amount} para ${quota.label}.`
    }

    for (const scheduleId of scheduleIds) {
      const schedule = schedules.get(scheduleId)
      if (!schedule || !schedule.active) return 'Uno de los horarios ya no existe.'
      if (picked.has(scheduleId)) return `Elegiste dos veces ${schedule.label}.`
      picked.add(scheduleId)
      if (!quota.anyActivity && !quota.activityIds.includes(schedule.activityId)) {
        return `${schedule.label} no es de una actividad de ${quota.label}.`
      }
      if (schedule.free <= 0) return `${schedule.label} está completo.`
    }
  }

  return null
}

/**
 * The first Monday after `today` (a week ahead when today is Monday).
 */
export function nextMonday(today: IsoDate): IsoDate {
  return addDays(today, 8 - isoWeekday(today))
}

export function scheduleLabel(schedule: {
  weekday: number
  startTime: string
  activity: { name: string }
}) {
  return `${WEEKDAYS[schedule.weekday - 1]} ${schedule.startTime} · ${schedule.activity.name}`
}

export function toQuotaRule(quota: Plan['quotas'][number]): QuotaRule {
  return {
    id: quota.id,
    weeklyCount: quota.weeklyCount,
    anyActivity: quota.anyActivity,
    activityIds: quota.activities.map((activity) => activity.id),
    label: quotaText({
      weeklyCount: quota.weeklyCount,
      anyActivity: quota.anyActivity,
      activityNames: quota.activities.map((activity) => activity.name),
    }),
  }
}

/**
 * Fixed slots of other students that still hold a place in each schedule on
 * or after `from` (open ended, or ending on/after it).
 */
export async function takenFixedPlaces(
  tenantId: number,
  scheduleIds: number[],
  from: IsoDate,
  exceptUserId: number,
  client?: TransactionClientContract
): Promise<Map<number, number>> {
  const taken = new Map<number, number>()
  if (scheduleIds.length === 0) return taken

  const rows = (await (client ?? db)
    .from('fixed_slots')
    .where('tenant_id', tenantId)
    .whereIn('class_schedule_id', scheduleIds)
    .whereNot('user_id', exceptUserId)
    .where((range) => range.whereNull('ends_on').orWhere('ends_on', '>=', from))
    .groupBy('class_schedule_id')
    .select('class_schedule_id')
    .count('* as taken')) as Array<{ class_schedule_id: number; taken: string | number }>

  for (const row of rows) taken.set(row.class_schedule_id, Number(row.taken))
  return taken
}

export type AssignmentResult = {
  subscription: Subscription
  slots: FixedSlot[]
  /**
   * Fixed bookings from the start date whose class is not in the new schedule.
   */
  cancelled: number
  /**
   * Bookings created by the generator right after the change.
   */
  generated: number
}

/**
 * Assigns a plan and its fixed schedule to a student from a date: closes the
 * current subscription and fixed slots the day before, creates the new ones,
 * cancels the fixed bookings from that date that no longer apply and books
 * the next weeks. Pending classes are left as they are.
 */
export default class ScheduleAssignment {
  constructor(private generator = new BookingGenerator()) {}

  async assign(
    tenantId: number,
    userId: number,
    input: AssignmentInput,
    now: DateTime = businessNow()
  ): Promise<AssignmentResult> {
    const today = businessDate(now)
    const startsOn = DateTime.fromISO(input.startsOn)
    if (!startsOn.isValid || input.startsOn <= today) {
      throw new AssignmentError('Elegí una fecha a partir de mañana.')
    }

    const result = await db.transaction(async (trx) => {
      const student = await User.query({ client: trx })
        .where('tenantId', tenantId)
        .where('role', 'client')
        .where('id', userId)
        .forUpdate()
        .first()
      if (!student) throw new AssignmentError('No encontramos ese alumno.')

      const plan = await Plan.query({ client: trx })
        .where('tenantId', tenantId)
        .where('id', input.planId)
        .where('active', true)
        .preload('quotas', (quota) => quota.orderBy('position').preload('activities'))
        .first()
      if (!plan) throw new AssignmentError('Elegí un plan.')

      const scheduleIds = [...new Set(input.quotas.flatMap((entry) => entry.scheduleIds))]
      /**
       * Locking the classes serializes two admins filling the last place.
       */
      const schedules = scheduleIds.length
        ? await ClassSchedule.query({ client: trx })
            .where('tenantId', tenantId)
            .whereIn('id', scheduleIds)
            .forUpdate()
            .preload('activity')
        : []
      const taken = await takenFixedPlaces(tenantId, scheduleIds, input.startsOn, userId, trx)
      const seats = new Map(
        schedules.map((schedule) => [
          schedule.id,
          {
            id: schedule.id,
            activityId: schedule.activityId,
            active: schedule.active,
            label: scheduleLabel(schedule),
            free: schedule.capacity - (taken.get(schedule.id) ?? 0),
          } satisfies ScheduleSeat,
        ])
      )

      const error = selectionError(plan.quotas.map(toQuotaRule), input.quotas, seats)
      if (error) throw new AssignmentError(error)

      await this.endCurrent(tenantId, userId, input.startsOn, trx)

      const subscription = await Subscription.create(
        { tenantId, userId, planId: plan.id, startsOn, endsOn: null },
        { client: trx }
      )
      const slots = await FixedSlot.createMany(
        input.quotas.flatMap((entry) =>
          entry.scheduleIds.map((classScheduleId) => ({
            tenantId,
            subscriptionId: subscription.id,
            userId,
            planQuotaId: entry.quotaId,
            classScheduleId,
            startsOn,
            endsOn: null,
          }))
        ),
        { client: trx }
      )

      const cancelled = await this.moveFixedBookings(tenantId, userId, input.startsOn, slots, trx)
      return { subscription, slots, cancelled }
    })

    const summary = await this.generator.generate({ tenantId, userId, now })
    return { ...result, generated: summary.created }
  }

  /**
   * Plans and fixed slots that had not started by `from` are dropped (they
   * have no fees yet: those are created once a plan is current); the rest
   * end the day before.
   */
  private async endCurrent(
    tenantId: number,
    userId: number,
    from: IsoDate,
    trx: TransactionClientContract
  ) {
    const dayBefore = addDays(from, -1)
    for (const model of [FixedSlot, Subscription]) {
      await model
        .query({ client: trx })
        .where('tenantId', tenantId)
        .where('userId', userId)
        .where('startsOn', '>=', from)
        .delete()
      await model
        .query({ client: trx })
        .where('tenantId', tenantId)
        .where('userId', userId)
        .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', from))
        .update({ endsOn: dayBefore })
    }
  }

  /**
   * Fixed bookings from the start date: those in a class of the new schedule
   * now belong to its fixed slot (so a class the student cancelled is not
   * booked again); the active ones in other classes are cancelled.
   */
  private async moveFixedBookings(
    tenantId: number,
    userId: number,
    from: IsoDate,
    slots: FixedSlot[],
    trx: TransactionClientContract
  ) {
    const slotBySchedule = new Map(slots.map((slot) => [slot.classScheduleId, slot]))
    const bookings = await Booking.query({ client: trx })
      .where('tenantId', tenantId)
      .where('userId', userId)
      .where('source', 'fixed')
      .whereHas('classSession', (session) =>
        session.where('tenantId', tenantId).where('date', '>=', from)
      )
      .preload('classSession')

    let cancelled = 0
    const now = DateTime.now()
    for (const booking of bookings) {
      const slot = slotBySchedule.get(booking.classSession.classScheduleId)
      if (slot) {
        booking.merge({ fixedSlotId: slot.id, planQuotaId: slot.planQuotaId })
      } else if (booking.status === 'active') {
        booking.merge({ status: 'cancelled', cancelledAt: now })
        cancelled++
      } else {
        continue
      }
      booking.useTransaction(trx)
      await booking.save()
    }
    return cancelled
  }
}

export type WizardPlan = {
  id: number
  name: string
  summary: string
  price: string
  quotas: Array<QuotaRule & { title: string }>
}

export type WizardSchedule = {
  id: number
  activityId: number
  title: string
  center: string
  free: number
}

export type AssignmentWizard = {
  client: { id: number; fullName: string }
  plans: WizardPlan[]
  schedules: WizardSchedule[]
  startOptions: Array<{ date: IsoDate; label: string; hint: string }>
  current: { planId: number; quotas: AssignmentInput['quotas'] } | null
}

function longDate(date: IsoDate) {
  const label = DateTime.fromISO(date).setLocale('es-AR').toFormat("cccc d 'de' LLLL")
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Everything the assignment wizard shows: active plans, active classes with
 * their free fixed places from next Monday, the start dates to choose from
 * and the student's current plan and schedule (to start from them).
 */
export async function assignmentWizard(
  tenantId: number,
  userId: number,
  now: DateTime = businessNow()
): Promise<AssignmentWizard | null> {
  const student = await User.query()
    .where('tenantId', tenantId)
    .where('role', 'client')
    .where('id', userId)
    .first()
  if (!student) return null

  const today = businessDate(now)
  const firstStart = nextMonday(today)

  const plans = await Plan.query()
    .where('tenantId', tenantId)
    .where('active', true)
    .orderBy('position')
    .orderBy('id')
    .preload('quotas', (quota) => quota.orderBy('position').preload('activities'))

  const schedules = await ClassSchedule.query()
    .where('tenantId', tenantId)
    .where('active', true)
    .orderBy('weekday')
    .orderBy('startTime')
    .preload('activity')
    .preload('center')
  const taken = await takenFixedPlaces(
    tenantId,
    schedules.map((schedule) => schedule.id),
    firstStart,
    userId
  )

  const subscription = await Subscription.query()
    .where('tenantId', tenantId)
    .where('userId', userId)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .orderBy('startsOn', 'desc')
    .preload('fixedSlots', (slots) =>
      slots
        .where('tenantId', tenantId)
        .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    )
    .first()

  let current: AssignmentWizard['current'] = null
  if (subscription) {
    const byQuota = new Map<number, number[]>()
    for (const slot of subscription.fixedSlots) {
      byQuota.set(slot.planQuotaId, [
        ...(byQuota.get(slot.planQuotaId) ?? []),
        slot.classScheduleId,
      ])
    }
    current = {
      planId: subscription.planId,
      quotas: [...byQuota].map(([quotaId, scheduleIds]) => ({ quotaId, scheduleIds })),
    }
  }

  return {
    client: { id: student.id, fullName: student.fullName },
    plans: plans.map((plan) => {
      const quotas = plan.quotas.map((quota) => {
        const rule = toQuotaRule(quota)
        return { ...rule, title: rule.label.charAt(0).toUpperCase() + rule.label.slice(1) }
      })
      return {
        id: plan.id,
        name: plan.name,
        summary: quotas.map((quota) => quota.label).join(' + '),
        price: formatPesos(plan.price),
        quotas,
      }
    }),
    schedules: schedules.map((schedule) => ({
      id: schedule.id,
      activityId: schedule.activityId,
      title: scheduleLabel(schedule),
      center: schedule.center.name,
      free: Math.max(0, schedule.capacity - (taken.get(schedule.id) ?? 0)),
    })),
    startOptions: [
      { date: firstStart, label: longDate(firstStart), hint: 'La semana que viene' },
      {
        date: addDays(firstStart, 7),
        label: longDate(addDays(firstStart, 7)),
        hint: 'En dos semanas',
      },
    ],
    current,
  }
}
