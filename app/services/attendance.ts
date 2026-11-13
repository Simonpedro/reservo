import Booking from '#models/booking'
import ClassSession from '#models/class_session'
import PendingClass from '#models/pending_class'
import PendingClasses from '#services/pending_classes'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type AttendanceFailure = 'not_active' | 'not_absent' | 'suspended' | 'pending_used' | 'full'

export class AttendanceError extends Error {
  constructor(readonly reason: AttendanceFailure) {
    super(`Cannot change attendance: ${reason}`)
  }
}

/**
 * The admin marks who is not coming to a class. The booking stops taking a
 * place and the student gets a pending class tied to the booking's quota.
 * There is no 24 h rule: the student told the center, not the app.
 */
export default class Attendance {
  /**
   * Marks an active booking as absent. A booking made with a pending class
   * gives that same pending class back (with its original expiry), like a
   * cancellation does; any other booking gets a new one with reason `absent`.
   */
  async markAbsent(booking: Booking): Promise<PendingClass> {
    return db.transaction(async (trx) => {
      const locked = await lockBooking(booking, trx)
      if (locked.status !== 'active') throw new AttendanceError('not_active')
      const session = await sessionOf(locked, trx)
      if (session.status === 'suspended') throw new AttendanceError('suspended')

      locked.status = 'absent'
      await locked.save()

      return releasePendingOrGrant(locked, 'absent', trx)
    })
  }

  /**
   * Takes an absence back while the pending class it gave is unused and the
   * class still has room.
   */
  async undoAbsent(booking: Booking): Promise<void> {
    await db.transaction(async (trx) => {
      const locked = await lockBooking(booking, trx)
      if (locked.status !== 'absent') throw new AttendanceError('not_absent')
      const session = await sessionOf(locked, trx, { lock: true })
      if (session.status === 'suspended') throw new AttendanceError('suspended')

      const pending = await pendingGivenBy(locked, trx)
      if (!pending) throw new AttendanceError('pending_used')

      await session.load('classSchedule')
      const taken = await activeCount(session, trx)
      if (taken >= session.classSchedule.capacity) throw new AttendanceError('full')

      if (locked.source === 'pending') {
        pending.status = 'used'
        pending.usedBookingId = locked.id
      } else {
        pending.status = 'revoked'
      }
      await pending.save()

      locked.status = 'active'
      await locked.save()
    })
  }
}

/**
 * A booking that is lost (absent, suspended class) leaves the student a
 * pending class: the one it was booked with, back to available, or a new one.
 */
export async function releasePendingOrGrant(
  booking: Booking,
  reason: 'absent' | 'suspended',
  trx: TransactionClientContract
): Promise<PendingClass> {
  if (booking.source === 'pending' && booking.pendingClassId) {
    const pending = await PendingClass.query({ client: trx })
      .where('tenantId', booking.tenantId)
      .where('id', booking.pendingClassId)
      .forUpdate()
      .firstOrFail()
    pending.status = 'available'
    pending.usedBookingId = null
    await pending.save()
    return pending
  }
  return new PendingClasses().grantFor(booking, reason, trx)
}

/**
 * The still-available pending class an absent booking gave, if any.
 */
export function pendingGivenBy(booking: Booking, trx?: TransactionClientContract) {
  const query = PendingClass.query({ client: trx })
    .where('tenantId', booking.tenantId)
    .where('userId', booking.userId)
    .where('status', 'available')
  if (trx) query.forUpdate()
  if (booking.source === 'pending' && booking.pendingClassId) {
    return query.where('id', booking.pendingClassId).first()
  }
  return query
    .where('originBookingId', booking.id)
    .where('reason', 'absent')
    .orderBy('id', 'desc')
    .first()
}

export async function activeCount(
  session: Pick<ClassSession, 'id' | 'tenantId'>,
  trx?: TransactionClientContract
): Promise<number> {
  const row = await Booking.query({ client: trx })
    .where('tenantId', session.tenantId)
    .where('classSessionId', session.id)
    .where('status', 'active')
    .count('* as total')
    .firstOrFail()
  return Number(row.$extras.total)
}

function lockBooking(booking: Booking, trx: TransactionClientContract) {
  return Booking.query({ client: trx })
    .where('tenantId', booking.tenantId)
    .where('id', booking.id)
    .forUpdate()
    .firstOrFail()
}

function sessionOf(booking: Booking, trx: TransactionClientContract, { lock = false } = {}) {
  return ClassSession.query({ client: trx })
    .where('tenantId', booking.tenantId)
    .where('id', booking.classSessionId)
    .if(lock, (query) => query.forUpdate())
    .firstOrFail()
}
