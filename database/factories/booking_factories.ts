import AccessLink from '#models/access_link'
import Booking from '#models/booking'
import ClassSession from '#models/class_session'
import PendingClass from '#models/pending_class'
import { createHash, randomBytes } from 'node:crypto'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const ClassSessionFactory = factory
  .define(ClassSession, () => ({
    date: DateTime.now(),
    status: 'scheduled' as const,
    suspensionReason: null,
  }))
  .state('suspended', (session) => {
    session.status = 'suspended'
    session.suspensionReason = 'Feriado'
  })
  .build()

export const BookingFactory = factory
  .define(Booking, () => ({
    source: 'fixed' as const,
    fixedSlotId: null,
    pendingClassId: null,
    status: 'active' as const,
    cancelledAt: null,
  }))
  .build()

export const AccessLinkFactory = factory
  .define(AccessLink, () => ({
    tokenHash: createHash('sha256').update(randomBytes(32)).digest('hex'),
    expiresAt: DateTime.now().plus({ days: 30 }),
    revokedAt: null,
    lastUsedAt: null,
  }))
  .build()

export const PendingClassFactory = factory
  .define(PendingClass, () => ({
    reason: 'cancelled' as const,
    missedOn: DateTime.now(),
    expiresOn: DateTime.now().plus({ days: 7 }),
    status: 'available' as const,
    usedBookingId: null,
  }))
  .build()
