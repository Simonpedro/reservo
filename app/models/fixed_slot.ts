import ClassSchedule from '#models/class_schedule'
import PlanQuota from '#models/plan_quota'
import Subscription from '#models/subscription'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * A student's standing weekly class, covering one plan quota. Bookings are
 * generated from it between `startsOn` and `endsOn`.
 */
export default class FixedSlot extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare subscriptionId: number

  @column()
  declare userId: number

  @column()
  declare planQuotaId: number

  @column()
  declare classScheduleId: number

  @column.date()
  declare startsOn: DateTime

  @column.date()
  declare endsOn: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => PlanQuota)
  declare planQuota: BelongsTo<typeof PlanQuota>

  @belongsTo(() => ClassSchedule)
  declare classSchedule: BelongsTo<typeof ClassSchedule>
}
