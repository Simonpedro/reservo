import ClassSession from '#models/class_session'
import type { IsoDate } from '#services/business_calendar'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Returns the session of a class schedule on a date, creating it if needed.
 * Safe under concurrency: the unique (class_schedule_id, date) index decides.
 */
export async function findOrCreateSession(
  schedule: { id: number; tenantId: number },
  date: IsoDate,
  client?: TransactionClientContract
): Promise<ClassSession> {
  const now = new Date()
  await (client ?? db)
    .insertQuery()
    .table(ClassSession.table)
    .insert({
      tenant_id: schedule.tenantId,
      class_schedule_id: schedule.id,
      date,
      status: 'scheduled',
      created_at: now,
      updated_at: now,
    })
    .knexQuery.onConflict(['class_schedule_id', 'date'])
    .ignore()

  return ClassSession.query({ client })
    .where('tenantId', schedule.tenantId)
    .where('classScheduleId', schedule.id)
    .where('date', date)
    .firstOrFail()
}
