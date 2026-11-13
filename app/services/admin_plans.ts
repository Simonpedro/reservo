import Activity from '#models/activity'
import Booking from '#models/booking'
import FixedSlot from '#models/fixed_slot'
import PendingClass from '#models/pending_class'
import Plan from '#models/plan'
import PlanQuota from '#models/plan_quota'
import Tenant from '#models/tenant'
import { businessDate, businessNow, type IsoDate } from '#services/business_calendar'
import { formatPesos } from '#services/money'
import { quotaText } from '#services/quota_text'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { DateTime } from 'luxon'

/**
 * A quota as the admin edits it: how many classes per week and where they
 * can be used. `id` is set for quotas that already exist.
 */
export type QuotaInput = {
  id?: number
  weeklyCount: number
  anyActivity: boolean
  activityIds: number[]
}

export type PlanInput = {
  name: string
  price: number
  quotas: QuotaInput[]
}

/**
 * A problem with the submitted plan, tied to the form field it belongs to.
 */
export class PlanError extends Error {
  constructor(
    readonly field: string,
    message: string
  ) {
    super(message)
  }
}

export const LOCKED_QUOTAS_MESSAGE =
  'Este plan tiene alumnos con horario fijo: solo podés cambiar el nombre y el precio. Para cambiar los cupos, creá un plan nuevo y pasá a los alumnos.'

/**
 * Checks the quotas of a plan: at least one, each with one or more classes a
 * week and, unless it is "any activity", at least one activity of the
 * tenant. Returns the first problem or null.
 */
export function quotasProblem(
  quotas: QuotaInput[],
  tenantActivityIds: Iterable<number>
): PlanError | null {
  if (quotas.length === 0) return new PlanError('quotas', 'El plan necesita al menos un cupo.')

  const known = new Set(tenantActivityIds)
  for (const [index, quota] of quotas.entries()) {
    if (!Number.isInteger(quota.weeklyCount) || quota.weeklyCount < 1) {
      return new PlanError(
        `quotas.${index}.weeklyCount`,
        'Cada cupo necesita al menos 1 clase por semana.'
      )
    }
    if (quota.anyActivity) continue
    if (quota.activityIds.length === 0) {
      return new PlanError(
        `quotas.${index}.activityIds`,
        `Elegí al menos una actividad para el cupo ${index + 1}.`
      )
    }
    if (quota.activityIds.some((id) => !known.has(id))) {
      return new PlanError(`quotas.${index}.activityIds`, 'Una de las actividades no existe.')
    }
  }
  return null
}

/**
 * The comparable shape of a list of quotas: order, counts and activities.
 */
function structure(quotas: QuotaInput[]) {
  return quotas.map((quota) => ({
    weeklyCount: quota.weeklyCount,
    anyActivity: quota.anyActivity,
    activityIds: quota.anyActivity ? [] : [...new Set(quota.activityIds)].sort((a, b) => a - b),
  }))
}

/**
 * Whether two quota lists give the same allowances (ids are ignored).
 */
export function sameQuotaStructure(current: QuotaInput[], next: QuotaInput[]) {
  return JSON.stringify(structure(current)) === JSON.stringify(structure(next))
}

export function weeklyTotal(quotas: Array<{ weeklyCount: number }>) {
  return quotas.reduce((total, quota) => total + quota.weeklyCount, 0)
}

function toInput(quota: PlanQuota): QuotaInput {
  return {
    id: quota.id,
    weeklyCount: quota.weeklyCount,
    anyActivity: quota.anyActivity,
    activityIds: quota.activities.map((activity) => activity.id),
  }
}

function summaryOf(quotas: PlanQuota[]) {
  return quotas
    .map((quota) =>
      quotaText({
        weeklyCount: quota.weeklyCount,
        anyActivity: quota.anyActivity,
        activityNames: quota.activities.map((activity) => activity.name),
      })
    )
    .join(' + ')
}

function plansQuery(tenantId: number, client?: TransactionClientContract) {
  return Plan.query({ client })
    .where('tenantId', tenantId)
    .preload('quotas', (quota) =>
      quota
        .where('tenantId', tenantId)
        .orderBy('position')
        .orderBy('id')
        .preload('activities', (activity) => activity.orderBy('id'))
    )
}

/**
 * Students whose fixed schedule uses the plan today or later.
 */
export async function studentsWithFixedSlots(
  tenantId: number,
  planId: number,
  today: IsoDate,
  client?: TransactionClientContract
) {
  const rows = await FixedSlot.query({ client })
    .where('tenantId', tenantId)
    .whereIn(
      'planQuotaId',
      PlanQuota.query({ client }).select('id').where('tenantId', tenantId).where('planId', planId)
    )
    .where((range) => range.whereNull('endsOn').orWhere('endsOn', '>=', today))
    .countDistinct('user_id as total')
  return Number(rows[0].$extras.total)
}

export async function settingsOverview(tenantId: number) {
  const tenant = await Tenant.findOrFail(tenantId)
  const plans = await Plan.query()
    .where('tenantId', tenantId)
    .where('active', true)
    .count('* as total')
  return {
    activePlans: Number(plans[0].$extras.total),
    whatsappPhone: tenant.whatsappPhone,
    transferAliases: tenant.transferAliases,
  }
}

export async function listPlans(tenantId: number) {
  const plans = await plansQuery(tenantId)
    .orderBy('active', 'desc')
    .orderBy('position')
    .orderBy('id')
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    active: plan.active,
    weeklyTotal: weeklyTotal(plan.quotas),
    summary: summaryOf(plan.quotas),
    price: formatPesos(plan.price),
  }))
}

/**
 * The tenant activities a quota can name.
 */
async function tenantActivities(tenantId: number, client?: TransactionClientContract) {
  return Activity.query({ client }).where('tenantId', tenantId).orderBy('id')
}

/**
 * What the plan form needs. `planId` null is a new plan; returns null when
 * the plan is not in the tenant.
 */
export async function planEditor(tenantId: number, planId: number | null, now = businessNow()) {
  const tenantRows = await tenantActivities(tenantId)
  const activities = tenantRows.map((activity) => ({
    id: activity.id,
    name: activity.name,
  }))

  if (planId === null) return { plan: null, lockedStudents: 0, activities }

  const plan = await plansQuery(tenantId).where('id', planId).first()
  if (!plan) return null

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      active: plan.active,
      quotas: plan.quotas.map(toInput),
    },
    lockedStudents: await studentsWithFixedSlots(tenantId, plan.id, businessDate(now)),
    activities,
  }
}

/**
 * Creates or updates a plan with its quotas. A plan whose quotas back fixed
 * schedules that are still current keeps its quotas as they are: only the
 * name and the price change (changing them would leave those schedules
 * outside the plan). Returns null when the plan is not in the tenant.
 */
export async function savePlan(
  tenantId: number,
  planId: number | null,
  input: PlanInput,
  now: DateTime = businessNow()
): Promise<Plan | null> {
  return db.transaction(async (trx) => {
    let plan: Plan | null = null
    if (planId !== null) {
      plan = await plansQuery(tenantId, trx).where('id', planId).forUpdate().first()
      if (!plan) return null
    }

    const tenantRows = await tenantActivities(tenantId, trx)
    const activityIds = tenantRows.map((activity) => activity.id)
    const problem = quotasProblem(input.quotas, activityIds)
    if (problem) throw problem

    if (!plan) {
      const last = await Plan.query({ client: trx })
        .where('tenantId', tenantId)
        .max('position as position')
      plan = await Plan.create(
        {
          tenantId,
          name: input.name,
          price: input.price,
          active: true,
          position: Number(last[0].$extras.position ?? -1) + 1,
        },
        { client: trx }
      )
      await writeQuotas(trx, tenantId, plan, [], input.quotas)
      return plan
    }

    const current = plan.quotas.map(toInput)
    if (!sameQuotaStructure(current, input.quotas)) {
      const locked = await studentsWithFixedSlots(tenantId, plan.id, businessDate(now), trx)
      if (locked > 0) throw new PlanError('quotas', LOCKED_QUOTAS_MESSAGE)
      await writeQuotas(trx, tenantId, plan, plan.quotas, input.quotas)
    }

    plan.useTransaction(trx)
    await plan.merge({ name: input.name, price: input.price }).save()
    return plan
  })
}

/**
 * Applies the submitted quotas: existing ones (by id) are updated in place,
 * new ones are created and missing ones removed. A quota already used by a
 * booking, a pending class or a fixed schedule is never removed, since
 * removing it would erase that history.
 */
async function writeQuotas(
  trx: TransactionClientContract,
  tenantId: number,
  plan: Plan,
  existing: PlanQuota[],
  next: QuotaInput[]
) {
  const byId = new Map(existing.map((quota) => [quota.id, quota]))
  const keptIds = new Set(next.flatMap((quota) => (quota.id ? [quota.id] : [])))

  for (const quota of next) {
    if (quota.id && !byId.has(quota.id)) {
      throw new PlanError('quotas', 'Uno de los cupos no es de este plan. Recargá la página.')
    }
  }

  const removed = existing.filter((quota) => !keptIds.has(quota.id))
  if (removed.length > 0) {
    const removedIds = removed.map((quota) => quota.id)
    const booking = await Booking.query({ client: trx })
      .where('tenantId', tenantId)
      .whereIn('planQuotaId', removedIds)
      .first()
    const pending = await PendingClass.query({ client: trx })
      .where('tenantId', tenantId)
      .whereIn('planQuotaId', removedIds)
      .first()
    const slot = await FixedSlot.query({ client: trx })
      .where('tenantId', tenantId)
      .whereIn('planQuotaId', removedIds)
      .first()
    if (booking || pending || slot) {
      throw new PlanError(
        'quotas',
        'Uno de los cupos que quitaste ya se usó en clases. Dejalo como está o creá un plan nuevo.'
      )
    }
    await PlanQuota.query({ client: trx })
      .where('tenantId', tenantId)
      .whereIn('id', removedIds)
      .delete()
  }

  for (const [position, input] of next.entries()) {
    const attributes = {
      weeklyCount: input.weeklyCount,
      anyActivity: input.anyActivity,
      position,
    }
    let quota: PlanQuota
    if (input.id) {
      quota = byId.get(input.id)!
      quota.useTransaction(trx)
      await quota.merge(attributes).save()
    } else {
      quota = await PlanQuota.create({ tenantId, planId: plan.id, ...attributes }, { client: trx })
    }
    const activityIds = input.anyActivity ? [] : [...new Set(input.activityIds)]
    await quota
      .related('activities')
      .sync(Object.fromEntries(activityIds.map((id) => [id, { tenant_id: tenantId }])))
  }
}

/**
 * Turns a plan on or off. An inactive plan can no longer be assigned; the
 * students that have it keep it. Returns false when it is not in the tenant.
 */
export async function setPlanActive(tenantId: number, planId: number, active: boolean) {
  const plan = await Plan.query().where('tenantId', tenantId).where('id', planId).first()
  if (!plan) return false
  await plan.merge({ active }).save()
  return true
}
