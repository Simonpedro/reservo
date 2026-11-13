import type Booking from '#models/booking'
import ClassSession from '#models/class_session'
import PendingClass from '#models/pending_class'
import type { PendingClassReason } from '#models/pending_class'
import {
  addDays,
  BUSINESS_ZONE,
  businessDate,
  businessNow,
  endOfWeek,
  type IsoDate,
} from '#services/business_calendar'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

type StudentRef = { id: number; tenantId: number }

/**
 * Pending classes that share where they can be used and their expiry:
 * "2 de Gimnasio o Pilates, hasta el domingo 22". `activities` null = any
 * activity of the plan.
 */
export type PendingGroup = {
  count: number
  activities: string[] | null
  expiresOn: IsoDate
}

/**
 * What the student sees about their pending classes: how many, the earliest
 * expiry and one group per activities and expiry, the soonest first.
 */
export type PendingSummary = {
  count: number
  expiresOn: IsoDate
  groups: PendingGroup[]
}

/**
 * A pending class can be used until the Sunday of the week after the missed
 * class (missed Monday 16 → Sunday 29), in the business time zone.
 */
export function expiryFor(missedOn: IsoDate): IsoDate {
  return addDays(endOfWeek(missedOn), 7)
}

/**
 * Marks `available` pending classes past `expiresOn` as `expired` for one tenant.
 * Idempotent; returns how many rows were updated.
 */
export async function expirePendingClasses(
  tenantId: number,
  today: IsoDate = businessDate(businessNow())
): Promise<number> {
  const [count] = await PendingClass.query()
    .where('tenantId', tenantId)
    .where('status', 'available')
    .where('expiresOn', '<', today)
    .update({ status: 'expired' })
  return Number(count)
}

export default class PendingClasses {
  /**
   * Gives the student a pending class for a booking they lose, tied to the
   * booking's plan quota and expiring after the week following the class.
   */
  async grantFor(
    booking: Booking,
    reason: PendingClassReason,
    client?: TransactionClientContract
  ): Promise<PendingClass> {
    const session = await ClassSession.query({ client })
      .where('tenantId', booking.tenantId)
      .where('id', booking.classSessionId)
      .firstOrFail()
    const missedOn = session.date.toISODate()!

    return PendingClass.create(
      {
        tenantId: booking.tenantId,
        userId: booking.userId,
        planQuotaId: booking.planQuotaId,
        originBookingId: booking.id,
        reason,
        missedOn: session.date,
        expiresOn: DateTime.fromISO(expiryFor(missedOn), { zone: BUSINESS_ZONE }),
        status: 'available',
        usedBookingId: null,
      },
      { client }
    )
  }

  /**
   * Pending classes the student can still use today. Expiry is computed:
   * one past its `expiresOn` no longer counts even before the daily process
   * marks it as expired.
   */
  available(student: StudentRef, today: IsoDate) {
    return PendingClass.query()
      .where('tenantId', student.tenantId)
      .where('userId', student.id)
      .where('status', 'available')
      .where('expiresOn', '>=', today)
      .orderBy('expiresOn', 'asc')
      .orderBy('id', 'asc')
  }

  async summaryFor(student: StudentRef, today: IsoDate): Promise<PendingSummary | null> {
    const pendings = await this.available(student, today).preload('planQuota', (quota) =>
      quota.preload('activities')
    )
    if (pendings.length === 0) return null

    const groups = new Map<string, PendingGroup>()
    for (const pending of pendings) {
      const quota = pending.planQuota
      const names = quota.activities.map((activity) => activity.name)
      const activities =
        quota.anyActivity || names.length === 0
          ? null
          : names.sort((a, b) => a.localeCompare(b, 'es'))
      const expiresOn = pending.expiresOn.toISODate()!
      const key = `${expiresOn}:${activities?.join('|') ?? '*'}`
      const group = groups.get(key)
      if (group) group.count++
      else groups.set(key, { count: 1, activities, expiresOn })
    }

    return {
      count: pendings.length,
      expiresOn: pendings[0].expiresOn.toISODate()!,
      groups: [...groups.values()],
    }
  }
}
