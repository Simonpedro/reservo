import ClassSchedule from '#models/class_schedule'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export type ClassSessionStatus = 'scheduled' | 'suspended'

/**
 * A class schedule on a concrete date.
 */
export default class ClassSession extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare classScheduleId: number

  @column.date()
  declare date: DateTime

  @column()
  declare status: ClassSessionStatus

  @column()
  declare suspensionReason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => ClassSchedule)
  declare classSchedule: BelongsTo<typeof ClassSchedule>
}
