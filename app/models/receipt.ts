import MonthlyFee from '#models/monthly_fee'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export type ReceiptStatus = 'in_review' | 'approved' | 'rejected'

/**
 * A payment receipt (image or PDF) uploaded by the student. The file lives
 * in Postgres so the app does not depend on a volume.
 */
export default class Receipt extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare monthlyFeeId: number

  @column()
  declare userId: number

  @column()
  declare filename: string

  @column()
  declare mime: string

  /**
   * Bytes.
   */
  @column()
  declare size: number

  @column({ serializeAs: null })
  declare data: Buffer

  @column()
  declare status: ReceiptStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => MonthlyFee)
  declare monthlyFee: BelongsTo<typeof MonthlyFee>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
