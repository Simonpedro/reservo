import type Booking from '#models/booking'
import ClassSession from '#models/class_session'
import PendingClass from '#models/pending_class'
import type { PendingClassReason } from '#models/pending_class'
import { addDays, BUSINESS_ZONE, endOfWeek, type IsoDate } from '#services/business_calendar'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

type StudentRef = { id: number; tenantId: number }

/**
 * What the student sees about their pending classes: how many, the earliest
 * expiry and where they can be used (`null` = any activity of the plan).
 */
export type PendingSummary = {
  count: number
  expiresOn: IsoDate
  activities: string[] | null
}

/**
 * A pending class can be used until the Sunday of the week after the missed
 * class (missed Monday 16 → Sunday 29), in the business time zone.
 */
export function expiryFor(missedOn: IsoDate): IsoDate {
  return addDays(endOfWeek(missedOn), 7)
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
  }

  async summaryFor(student: StudentRef, today: IsoDate): Promise<PendingSummary | null> {
    const pendings = await this.available(student, today).preload('planQuota', (quota) =>
      quota.preload('activities')
    )
    if (pendings.length === 0) return null

    const anyActivity = pendings.some((pending) => pending.planQuota.anyActivity)
    const activities = [
      ...new Set(
        pendings.flatMap((pending) => pending.planQuota.activities.map((activity) => activity.name))
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'))

    return {
      count: pendings.length,
      expiresOn: pendings[0].expiresOn.toISODate()!,
      activities: anyActivity || activities.length === 0 ? null : activities,
    }
  }
}
