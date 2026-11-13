import Activity, { type ActivityWash } from '#models/activity'
import Center from '#models/center'
import {
  activeSchedulesBy,
  activityUsage,
  centerUsage,
  usageMessage,
} from '#services/catalog_usage'
import db from '@adonisjs/lucid/services/db'

/**
 * Ajustes › Actividades and Ajustes › Sedes: what the admin can name, color
 * and turn on or off. A rename keeps the record (and its slug), so
 * schedules, plans and bookings keep pointing at it.
 */

export type ActivityInput = { name: string; wash: ActivityWash }
export type CenterInput = { name: string }

/**
 * A problem with the submitted name, or why it can't be deactivated.
 */
export class CatalogError extends Error {
  constructor(
    readonly field: 'name' | 'active',
    message: string
  ) {
    super(message)
  }
}

/**
 * "Ovidio Lagos" → "ovidio-lagos", "Kinesiología" → "kinesiologia".
 */
export function slugify(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
}

/**
 * The slug, or the first "-2", "-3"… variant not taken yet (a renamed record
 * keeps its old slug, so the bare one can be in use under another name).
 */
export function uniqueSlug(base: string, taken: Iterable<string>) {
  const used = new Set(taken)
  if (!used.has(base)) return base
  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix++
  return `${base}-${suffix}`
}

type Named = { id: number; name: string; slug: string }

/**
 * The slug for a new or renamed record. Two names that only differ in case,
 * accents or punctuation are the same name ("Yoga" and "yoga").
 */
export function checkName(
  rows: Named[],
  name: string,
  exceptId: number | null,
  duplicate: string
): string {
  const base = slugify(name)
  if (!base) throw new CatalogError('name', 'Usá letras o números en el nombre.')
  if (rows.some((row) => row.id !== exceptId && slugify(row.name) === base)) {
    throw new CatalogError('name', duplicate)
  }
  return uniqueSlug(
    base,
    rows.map((row) => row.slug)
  )
}

function schedulesText(count: number) {
  if (count === 0) return 'Sin horarios activos'
  return count === 1 ? '1 horario activo' : `${count} horarios activos`
}

const WASH_LABELS: Record<ActivityWash, string> = {
  celeste: 'Celeste',
  green: 'Verde',
  blue: 'Azul',
}

export async function listActivities(tenantId: number) {
  const activities = await Activity.query()
    .where('tenantId', tenantId)
    .orderBy('active', 'desc')
    .orderBy('name')
  const schedules = await activeSchedulesBy(tenantId, 'activity_id')
  return activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    wash: activity.wash,
    active: activity.active,
    hint: [
      `Tarjeta ${WASH_LABELS[activity.wash].toLowerCase()}`,
      schedulesText(schedules.get(activity.id) ?? 0),
      ...(activity.active ? [] : ['Desactivada']),
    ].join(' · '),
  }))
}

export async function listCenters(tenantId: number) {
  const centers = await Center.query()
    .where('tenantId', tenantId)
    .orderBy('active', 'desc')
    .orderBy('name')
  const schedules = await activeSchedulesBy(tenantId, 'center_id')
  return centers.map((center) => ({
    id: center.id,
    name: center.name,
    active: center.active,
    hint: [
      schedulesText(schedules.get(center.id) ?? 0),
      ...(center.active ? [] : ['Desactivada']),
    ].join(' · '),
  }))
}

/**
 * What the activity form needs: the activity (null for a new one) and, if
 * something uses it, why it can't be deactivated. Null when it is not in
 * the tenant.
 */
export async function activityEditor(tenantId: number, activityId: number | null) {
  if (activityId === null) return { activity: null, inUse: null }
  const activity = await Activity.query()
    .where('tenantId', tenantId)
    .where('id', activityId)
    .first()
  if (!activity) return null
  return {
    activity: {
      id: activity.id,
      name: activity.name,
      wash: activity.wash,
      active: activity.active,
    },
    inUse: usageMessage(await activityUsage(tenantId, activity.id)),
  }
}

export async function centerEditor(tenantId: number, centerId: number | null) {
  if (centerId === null) return { center: null, inUse: null }
  const center = await Center.query().where('tenantId', tenantId).where('id', centerId).first()
  if (!center) return null
  return {
    center: { id: center.id, name: center.name, active: center.active },
    inUse: usageMessage(await centerUsage(tenantId, center.id)),
  }
}

/**
 * Creates or renames an activity. Returns null when it is not in the tenant.
 */
export async function saveActivity(
  tenantId: number,
  activityId: number | null,
  input: ActivityInput
): Promise<Activity | null> {
  return db.transaction(async (trx) => {
    const rows = await Activity.query({ client: trx }).where('tenantId', tenantId).forUpdate()
    const activity = activityId === null ? null : rows.find((row) => row.id === activityId)
    if (activity === undefined) return null

    const slug = checkName(rows, input.name, activityId, 'Ya hay una actividad con ese nombre.')
    if (activity) {
      activity.useTransaction(trx)
      return activity.merge({ name: input.name, wash: input.wash }).save()
    }
    return Activity.create(
      { tenantId, name: input.name, wash: input.wash, slug, image: null, active: true },
      { client: trx }
    )
  })
}

export async function saveCenter(
  tenantId: number,
  centerId: number | null,
  input: CenterInput
): Promise<Center | null> {
  return db.transaction(async (trx) => {
    const rows = await Center.query({ client: trx }).where('tenantId', tenantId).forUpdate()
    const center = centerId === null ? null : rows.find((row) => row.id === centerId)
    if (center === undefined) return null

    const slug = checkName(rows, input.name, centerId, 'Ya hay una sede con ese nombre.')
    if (center) {
      center.useTransaction(trx)
      return center.merge({ name: input.name }).save()
    }
    return Center.create({ tenantId, name: input.name, slug, active: true }, { client: trx })
  })
}

/**
 * Turns an activity on or off. It can't be turned off while active classes
 * or active plans use it (throws a CatalogError saying what uses it).
 * Returns false when it is not in the tenant.
 */
export async function setActivityActive(tenantId: number, activityId: number, active: boolean) {
  return db.transaction(async (trx) => {
    const activity = await Activity.query({ client: trx })
      .where('tenantId', tenantId)
      .where('id', activityId)
      .forUpdate()
      .first()
    if (!activity) return false
    if (!active) {
      const problem = usageMessage(await activityUsage(tenantId, activity.id, trx))
      if (problem) throw new CatalogError('active', problem)
    }
    activity.useTransaction(trx)
    await activity.merge({ active }).save()
    return true
  })
}

export async function setCenterActive(tenantId: number, centerId: number, active: boolean) {
  return db.transaction(async (trx) => {
    const center = await Center.query({ client: trx })
      .where('tenantId', tenantId)
      .where('id', centerId)
      .forUpdate()
      .first()
    if (!center) return false
    if (!active) {
      const problem = usageMessage(await centerUsage(tenantId, center.id, trx))
      if (problem) throw new CatalogError('active', problem)
    }
    center.useTransaction(trx)
    await center.merge({ active }).save()
    return true
  })
}
