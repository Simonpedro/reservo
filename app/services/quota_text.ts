/**
 * Human-readable weekly quota lines for plans (prototype: data.js › quotaText).
 */
export type QuotaDescriptor = {
  weeklyCount: number
  anyActivity: boolean
  activityNames: string[]
}

export function activitiesText(activityNames: string[]) {
  return new Intl.ListFormat('es-AR', { type: 'disjunction' }).format(activityNames)
}

/**
 * "2 clases libres" or "1 clase de Yoga" / "2 clases de Gimnasio o Pilates".
 */
export function quotaText(quota: QuotaDescriptor): string {
  const count = quota.weeklyCount
  const noun = count === 1 ? 'clase' : 'clases'
  if (quota.anyActivity) {
    const free = count === 1 ? 'clase libre' : 'clases libres'
    return `${count} ${free}`
  }
  return `${count} ${noun} de ${activitiesText(quota.activityNames)}`
}

/**
 * Same as {@link quotaText} with the first letter capitalized, for section lines.
 */
export function quotaLine(quota: QuotaDescriptor): string {
  const text = quotaText(quota)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
