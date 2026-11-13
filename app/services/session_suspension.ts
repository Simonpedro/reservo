import Booking from '#models/booking'
import ClassSession from '#models/class_session'
import { releasePendingOrGrant } from '#services/attendance'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export class SessionSuspensionError extends Error {
  constructor() {
    super('Class session is already suspended')
  }
}

/**
 * The admin suspends one class on one date: nobody goes, every active
 * booking becomes `suspended` and each student gets a pending class.
 * Absent and cancelled bookings already gave theirs and stay as they are.
 */
export default class SessionSuspension {
  /**
   * Returns how many bookings were suspended.
   */
  async suspend(session: ClassSession, reason: string | null = null): Promise<number> {
    return db.transaction((trx) => this.suspendWithin(trx, session, reason))
  }

  /**
   * Same as `suspend`, inside the caller's transaction (e.g. closing a day
   * suspends many classes at once).
   */
  async suspendWithin(
    trx: TransactionClientContract,
    session: ClassSession,
    reason: string | null = null
  ): Promise<number> {
    const locked = await ClassSession.query({ client: trx })
      .where('tenantId', session.tenantId)
      .where('id', session.id)
      .forUpdate()
      .firstOrFail()
    if (locked.status === 'suspended') throw new SessionSuspensionError()

    locked.status = 'suspended'
    locked.suspensionReason = reason
    await locked.save()

    const bookings = await Booking.query({ client: trx })
      .where('tenantId', locked.tenantId)
      .where('classSessionId', locked.id)
      .where('status', 'active')
      .orderBy('id')
      .forUpdate()

    for (const booking of bookings) {
      booking.status = 'suspended'
      await booking.save()
      await releasePendingOrGrant(booking, 'suspended', trx)
    }
    return bookings.length
  }
}
