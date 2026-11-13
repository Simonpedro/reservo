import { activitiesText } from '#services/quota_text'

/**
 * Pending classes that share activities and expiry, as the notices show them.
 * `activities` null = any activity of the plan; `expiresLabel` "domingo 29".
 */
export type PendingTextGroup = {
  count: number
  activities: string[] | null
  expiresLabel: string
}

export function pendingCountText(count: number) {
  return count === 1 ? 'Tenés 1 clase pendiente' : `Tenés ${count} clases pendientes`
}

/**
 * Where and until when the pending classes can be used. One group is a
 * sentence ("Vale para Yoga. Usala hasta el domingo 29."); several are one
 * line each, the soonest to expire first ("Yoga · hasta el domingo 29",
 * "2 de Gimnasio o Pilates · hasta el domingo 22").
 */
export function pendingLines(groups: PendingTextGroup[]): string[] {
  if (groups.length === 1) {
    const [{ count, activities, expiresLabel }] = groups
    const where = activities ? activitiesText(activities) : 'cualquier actividad de tu plan'
    return count === 1
      ? [`Vale para ${where}. Usala hasta el ${expiresLabel}.`]
      : [`Valen para ${where}. Usalas hasta el ${expiresLabel}.`]
  }
  return groups.map(({ count, activities, expiresLabel }) => {
    const where = activities ? activitiesText(activities) : 'cualquier actividad'
    const what =
      count === 1 ? where.charAt(0).toUpperCase() + where.slice(1) : `${count} de ${where}`
    return `${what} · hasta el ${expiresLabel}`
  })
}

/**
 * "Tenés 2 clases pendientes hasta el domingo 29." when they all expire the
 * same day, otherwise only how many.
 */
export function pendingCountUntil(groups: PendingTextGroup[]) {
  const count = groups.reduce((total, group) => total + group.count, 0)
  const labels = new Set(groups.map((group) => group.expiresLabel))
  if (labels.size === 1) return `${pendingCountText(count)} hasta el ${groups[0].expiresLabel}.`
  return `${pendingCountText(count)}.`
}
