import Activity from '#models/activity'
import Plan from '#models/plan'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

/**
 * A weekly allowance inside a plan: a number of classes per week and the
 * activities they can be used for (or any activity).
 */
export default class PlanQuota extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare planId: number

  @column()
  declare weeklyCount: number

  @column()
  declare anyActivity: boolean

  @column()
  declare position: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>

  /**
   * Attach with `{ [id]: { tenant_id } }`: the pivot is tenant scoped.
   */
  @manyToMany(() => Activity, {
    pivotTable: 'plan_quota_activities',
    pivotTimestamps: true,
    pivotColumns: ['tenant_id'],
  })
  declare activities: ManyToMany<typeof Activity>
}
