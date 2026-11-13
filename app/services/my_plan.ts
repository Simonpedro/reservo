import FixedSlot from '#models/fixed_slot'
import Subscription from '#models/subscription'
import { BUSINESS_ZONE, businessDate, businessNow } from '#services/business_calendar'
import { pendingNotice, type PendingNotice } from '#services/my_classes'
import { quotaLine, type QuotaDescriptor } from '#services/quota_text'
import type { DateTime } from 'luxon'

type StudentRef = { id: number; tenantId: number }

export type FixedScheduleLine = { label: string }

export type PlanQuotaLine = { text: string }

export type MyPlanView =
  | { state: 'no_plan' }
  | {
      state: 'with_plan'
      planName: string
      quotas: PlanQuotaLine[]
      renewalLabel: string
      /**
       * `null` when the student has a plan but Kinaf has not assigned fixed slots yet.
       */
      schedule: FixedScheduleLine[] | null
      pending: PendingNotice | null
    }

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

function cap(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * First day of the next calendar month in the business zone.
 */
export function renewalLabel(now: DateTime = businessNow()): string {
  const next = now.setZone(BUSINESS_ZONE).plus({ months: 1 }).startOf('month')
  const month = next.setLocale('es-AR').toFormat('LLLL')
  return `Se renueva el ${next.day} de ${month}`
}

function toQuotaDescriptor(quota: {
  weeklyCount: number
  anyActivity: boolean
  activities: { name: string }[]
}): QuotaDescriptor {
  return {
    weeklyCount: quota.weeklyCount,
    anyActivity: quota.anyActivity,
    activityNames: quota.activities
      .map((activity) => activity.name)
      .sort((a, b) => a.localeCompare(b, 'es')),
  }
}

function fixedSlotLabel(schedule: {
  weekday: number
  startTime: string
  activity: { name: string }
  center: { name: string }
}): string {
  const day = cap(WEEKDAYS[schedule.weekday - 1])
  return `${day} ${schedule.startTime} · ${schedule.activity.name} · ${schedule.center.name}`
}

/**
 * The student's subscription, fixed weekly schedule and pending classes.
 */
export async function myPlan(
  student: StudentRef,
  now: DateTime = businessNow()
): Promise<MyPlanView> {
  const today = businessDate(now)

  const subscription = await Subscription.query()
    .where('tenantId', student.tenantId)
    .where('userId', student.id)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    // The current plan wins over one already assigned from next Monday.
    .orderBy('startsOn', 'asc')
    .preload('plan', (plan) =>
      plan.preload('quotas', (quotas) =>
        quotas.preload('activities').orderBy('position').orderBy('id')
      )
    )
    .first()

  if (!subscription) return { state: 'no_plan' }

  const quotas = subscription.plan.quotas.map((quota) => ({
    text: `${quotaLine(toQuotaDescriptor(quota))} por semana`,
  }))

  // The schedule in force on the day the plan applies: today, or its first day
  // for a plan that has not started. Never the old and the new one together.
  const startsOn = subscription.startsOn.toISODate()!
  const day = startsOn > today ? startsOn : today
  const slots = await FixedSlot.query()
    .where('tenantId', student.tenantId)
    .where('userId', student.id)
    .where('startsOn', '<=', day)
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', day))
    .preload('classSchedule', (schedule) => schedule.preload('activity').preload('center'))

  const schedule =
    slots.length === 0
      ? null
      : slots
          .sort(
            (a, b) =>
              a.classSchedule.weekday - b.classSchedule.weekday ||
              a.classSchedule.startTime.localeCompare(b.classSchedule.startTime)
          )
          .map((slot) => ({ label: fixedSlotLabel(slot.classSchedule) }))

  return {
    state: 'with_plan',
    planName: subscription.plan.name,
    quotas,
    renewalLabel: renewalLabel(now),
    schedule,
    pending: await pendingNotice(student, today),
  }
}
