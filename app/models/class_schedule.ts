import Activity from '#models/activity'
import Center from '#models/center'
import ClassSession from '#models/class_session'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

/**
 * A weekly recurring class: activity, center, ISO weekday (1 = Monday)
 * and start time in the business time zone.
 */
export default class ClassSchedule extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare activityId: number

  @column()
  declare centerId: number

  @column()
  declare weekday: number

  /**
   * 'HH:mm' in America/Argentina/Buenos_Aires.
   */
  @column()
  declare startTime: string

  @column()
  declare durationMinutes: number

  @column()
  declare capacity: number

  @column()
  declare instructorName: string

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Activity)
  declare activity: BelongsTo<typeof Activity>

  @belongsTo(() => Center)
  declare center: BelongsTo<typeof Center>

  @hasMany(() => ClassSession)
  declare sessions: HasMany<typeof ClassSession>
}
