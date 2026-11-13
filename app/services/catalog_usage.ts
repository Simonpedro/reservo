import ClassSchedule from '#models/class_schedule'
import Plan from '#models/plan'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * What keeps an activity or a center in use: active weekly classes and, for
 * activities, active plans with a quota that names it.
 */
export type CatalogUsage = { schedules: number; plans: number }

function countText(count: number, one: string, many: string) {
  return count === 1 ? `1 ${one}` : `${count} ${many}`
}

/**
 * Why it can't be deactivated, in plain words, or null when nothing uses it:
 * "La usan 3 horarios activos. Desactivalos primero."
 */
export function usageMessage(usage: CatalogUsage): string | null {
  const parts = [
    ...(usage.schedules > 0
      ? [countText(usage.schedules, 'horario activo', 'horarios activos')]
      : []),
    ...(usage.plans > 0 ? [countText(usage.plans, 'plan activo', 'planes activos')] : []),
  ]
  if (parts.length === 0) return null
  const total = usage.schedules + usage.plans
  const verb = total === 1 ? 'La usa' : 'La usan'
  const then = total === 1 ? 'Desactivalo primero.' : 'Desactivalos primero.'
  return `${verb} ${parts.join(' y ')}. ${then}`
}

async function activeSchedules(
  tenantId: number,
  column: 'activityId' | 'centerId',
  id: number,
  client?: TransactionClientContract
) {
  const rows = await ClassSchedule.query({ client })
    .where('tenantId', tenantId)
    .where(column, id)
    .where('active', true)
    .count('* as total')
  return Number(rows[0].$extras.total)
}

export async function activityUsage(
  tenantId: number,
  activityId: number,
  client?: TransactionClientContract
): Promise<CatalogUsage> {
  const plans = await Plan.query({ client })
    .where('tenantId', tenantId)
    .where('active', true)
    .whereIn(
      'id',
      (client ?? db)
        .from('plan_quotas')
        .join('plan_quota_activities', 'plan_quota_activities.plan_quota_id', 'plan_quotas.id')
        .where('plan_quotas.tenant_id', tenantId)
        .where('plan_quota_activities.tenant_id', tenantId)
        .where('plan_quota_activities.activity_id', activityId)
        .select('plan_quotas.plan_id')
    )
    .count('* as total')
  return {
    schedules: await activeSchedules(tenantId, 'activityId', activityId, client),
    plans: Number(plans[0].$extras.total),
  }
}

export async function centerUsage(
  tenantId: number,
  centerId: number,
  client?: TransactionClientContract
): Promise<CatalogUsage> {
  return {
    schedules: await activeSchedules(tenantId, 'centerId', centerId, client),
    plans: 0,
  }
}

/**
 * Active weekly classes per activity or center id, for the lists.
 */
export async function activeSchedulesBy(tenantId: number, column: 'activity_id' | 'center_id') {
  const rows = (await db
    .from('class_schedules')
    .where('tenant_id', tenantId)
    .where('active', true)
    .groupBy(column)
    .select(column)
    .count('* as total')) as Array<Record<string, number | string>>
  return new Map(rows.map((row) => [Number(row[column]), Number(row.total)]))
}
