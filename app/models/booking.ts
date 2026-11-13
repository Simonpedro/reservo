import ClassSession from '#models/class_session'
import FixedSlot from '#models/fixed_slot'
import PlanQuota from '#models/plan_quota'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export type BookingSource = 'fixed' | 'pending'
export type BookingStatus = 'active' | 'cancelled' | 'absent' | 'suspended'

/**
 * A student's place in a class session. Only `active` bookings take a spot.
 */
export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare userId: number

  @column()
  declare classSessionId: number

  @column()
  declare planQuotaId: number

  @column()
  declare source: BookingSource

  @column()
  declare fixedSlotId: number | null

  @column()
  declare pendingClassId: number | null

  @column()
  declare status: BookingStatus

  @column.dateTime()
  declare cancelledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => ClassSession)
  declare classSession: BelongsTo<typeof ClassSession>

  @belongsTo(() => PlanQuota)
  declare planQuota: BelongsTo<typeof PlanQuota>

  @belongsTo(() => FixedSlot)
  declare fixedSlot: BelongsTo<typeof FixedSlot>
}
