import Receipt from '#models/receipt'
import Subscription from '#models/subscription'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export type MonthlyFeeStatus = 'pending' | 'in_review' | 'paid'
export type MonthlyFeeMethod = 'cash' | 'transfer' | 'forced'

/**
 * A student's fee for one month (`period` is always the 1st). "Overdue" is
 * never stored: it is computed by `statusOf` in `#services/fees`.
 */
export default class MonthlyFee extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare userId: number

  @column()
  declare subscriptionId: number

  @column.date()
  declare period: DateTime

  /**
   * Whole pesos, copied from the plan price when the fee is created.
   */
  @column()
  declare amount: number

  @column()
  declare status: MonthlyFeeStatus

  @column.dateTime()
  declare paidAt: DateTime | null

  @column()
  declare method: MonthlyFeeMethod | null

  @column()
  declare recordedById: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>

  @hasMany(() => Receipt)
  declare receipts: HasMany<typeof Receipt>
}
