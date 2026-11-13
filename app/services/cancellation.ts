import Booking from '#models/booking'
import type ClassSchedule from '#models/class_schedule'
import ClassSession from '#models/class_session'
import PendingClass from '#models/pending_class'
import { businessNow, classStart } from '#services/business_calendar'
import PendingClasses from '#services/pending_classes'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { DateTime } from 'luxon'

/**
 * Students can only skip a class from the app this long before it starts.
 */
export const CANCEL_NOTICE_HOURS = 24

/**
 * The parts of a booking that say when its class starts.
 */
type Timed = { classSession: { date: DateTime; classSchedule: { startTime: string } } }

export function bookingStart(booking: Timed): DateTime {
  return classStart(
    booking.classSession.date.toISODate()!,
    booking.classSession.classSchedule.startTime
  )
}

/**
 * The 24 h rule, in the business time zone: exactly 24 h before the class
 * still allows cancelling; one minute less does not.
 */
export function canCancel(booking: Timed, now: DateTime): boolean {
  return bookingStart(booking).diff(now, 'hours').hours >= CANCEL_NOTICE_HOURS
}

export type CancellationFailure =
  'not_active' | 'not_cancelled' | 'suspended' | 'too_late' | 'pending_used' | 'full'

export class CancellationError extends Error {
  constructor(readonly reason: CancellationFailure) {
    super(`Cannot change booking: ${reason}`)
  }
}

/**
 * "No voy a ir": skipping one date of a class, and undoing it right after.
 * The server always re-checks the 24 h rule, whatever the screen showed.
 */
export default class Cancellation {
  /**
   * Cancels an active booking with 24 h or more of notice: its place goes
   * back to that date and the student gets a pending class. A booking made
   * with a pending class gives that same pending class back, with its
   * original expiry.
   */
  async cancel(booking: Booking, now: DateTime = businessNow()): Promise<PendingClass> {
    return db.transaction(async (trx) => {
      const locked = await this.lock(booking, trx)
      if (locked.status !== 'active') throw new CancellationError('not_active')
      const session = await this.session(locked, trx)
      if (session.status === 'suspended') throw new CancellationError('suspended')
      if (!canCancel({ classSession: session }, now)) throw new CancellationError('too_late')

      locked.status = 'cancelled'
      locked.cancelledAt = now
      await locked.save()

      if (locked.source === 'pending' && locked.pendingClassId) {
        const pending = await PendingClass.query({ client: trx })
          .where('tenantId', locked.tenantId)
          .where('id', locked.pendingClassId)
          .forUpdate()
          .firstOrFail()
        pending.status = 'available'
        pending.usedBookingId = null
        await pending.save()
        return pending
      }

      return new PendingClasses().grantFor(locked, 'cancelled', trx)
    })
  }

  /**
   * Takes a cancellation back while it is still on time, the pending class
   * it gave has not been used and the class still has room.
   */
  async undo(booking: Booking, now: DateTime = businessNow()): Promise<void> {
    await db.transaction(async (trx) => {
      const locked = await this.lock(booking, trx)
      if (locked.status !== 'cancelled') throw new CancellationError('not_cancelled')
      const session = await this.session(locked, trx, { lock: true })
      if (session.status === 'suspended') throw new CancellationError('suspended')
      if (!canCancel({ classSession: session }, now)) throw new CancellationError('too_late')

      const pending = await this.pendingGivenBy(locked, trx)
      if (!pending) throw new CancellationError('pending_used')

      const taken = await Booking.query({ client: trx })
        .where('tenantId', locked.tenantId)
        .where('classSessionId', session.id)
        .where('status', 'active')
        .count('* as total')
        .firstOrFail()
      if (Number(taken.$extras.total) >= session.classSchedule.capacity) {
        throw new CancellationError('full')
      }

      if (locked.source === 'pending') {
        pending.status = 'used'
        pending.usedBookingId = locked.id
      } else {
        pending.status = 'revoked'
      }
      await pending.save()

      locked.status = 'active'
      locked.cancelledAt = null
      await locked.save()
    })
  }

  private lock(booking: Booking, trx: TransactionClientContract) {
    return Booking.query({ client: trx })
      .where('tenantId', booking.tenantId)
      .where('id', booking.id)
      .forUpdate()
      .firstOrFail()
  }

  /**
   * The booking's session with its schedule. Undo locks the session so two
   * undos (or bookings) cannot take the last place at the same time.
   */
  private async session(
    booking: Booking,
    trx: TransactionClientContract,
    { lock = false } = {}
  ): Promise<ClassSession & { classSchedule: ClassSchedule }> {
    const session = await ClassSession.query({ client: trx })
      .where('tenantId', booking.tenantId)
      .where('id', booking.classSessionId)
      .if(lock, (query) => query.forUpdate())
      .firstOrFail()
    await session.load('classSchedule')
    return session
  }

  private pendingGivenBy(booking: Booking, trx: TransactionClientContract) {
    const query = PendingClass.query({ client: trx })
      .where('tenantId', booking.tenantId)
      .where('userId', booking.userId)
      .where('status', 'available')
      .forUpdate()
    if (booking.source === 'pending' && booking.pendingClassId) {
      return query.where('id', booking.pendingClassId).first()
    }
    return query
      .where('originBookingId', booking.id)
      .where('reason', 'cancelled')
      .orderBy('id', 'desc')
      .first()
  }
}
