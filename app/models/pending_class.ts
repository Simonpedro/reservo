import Booking from '#models/booking'
import PlanQuota from '#models/plan_quota'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export type PendingClassReason = 'cancelled' | 'absent' | 'suspended'
export type PendingClassStatus = 'available' | 'used' | 'expired' | 'revoked'

/**
 * A class the student missed and can book by hand, within the activities of
 * the plan quota it came from, until `expiresOn` (inclusive).
 */
export default class PendingClass extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare userId: number

  @column()
  declare planQuotaId: number

  @column()
  declare originBookingId: number

  @column()
  declare reason: PendingClassReason

  @column.date()
  declare missedOn: DateTime

  @column.date()
  declare expiresOn: DateTime

  @column()
  declare status: PendingClassStatus

  @column()
  declare usedBookingId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => PlanQuota)
  declare planQuota: BelongsTo<typeof PlanQuota>

  @belongsTo(() => Booking, { foreignKey: 'originBookingId' })
  declare originBooking: BelongsTo<typeof Booking>
}
