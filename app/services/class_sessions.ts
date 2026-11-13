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

/**
 * Many sessions at once (schedule + date pairs of one tenant), creating the
 * missing ones in a single insert. Returns them keyed by `scheduleId:date`.
 */
export async function findOrCreateSessions(
  tenantId: number,
  pairs: { scheduleId: number; date: IsoDate }[],
  client?: TransactionClientContract
): Promise<Map<string, ClassSession>> {
  const sessions = new Map<string, ClassSession>()
  if (pairs.length === 0) return sessions

  const now = new Date()
  await (client ?? db)
    .insertQuery()
    .table(ClassSession.table)
    .multiInsert(
      pairs.map((pair) => ({
        tenant_id: tenantId,
        class_schedule_id: pair.scheduleId,
        date: pair.date,
        status: 'scheduled',
        created_at: now,
        updated_at: now,
      }))
    )
    .knexQuery.onConflict(['class_schedule_id', 'date'])
    .ignore()

  const dates = pairs.map((pair) => pair.date).sort()
  const rows = await ClassSession.query({ client })
    .where('tenantId', tenantId)
    .whereIn('classScheduleId', [...new Set(pairs.map((pair) => pair.scheduleId))])
    .whereBetween('date', [dates[0], dates[dates.length - 1]])
  for (const row of rows) sessions.set(sessionKey(row.classScheduleId, row.date.toISODate()!), row)
  return sessions
}

export function sessionKey(scheduleId: number, date: IsoDate) {
  return `${scheduleId}:${date}`
}
