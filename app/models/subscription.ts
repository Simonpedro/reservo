import FixedSlot from '#models/fixed_slot'
import Plan from '#models/plan'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

/**
 * A student's plan. It is current while `endsOn` is null or not past.
 */
export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare userId: number

  @column()
  declare planId: number

  @column.date()
  declare startsOn: DateTime

  @column.date()
  declare endsOn: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>

  @hasMany(() => FixedSlot)
  declare fixedSlots: HasMany<typeof FixedSlot>
}
