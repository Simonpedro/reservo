/**
 * Free places as the student sees them: "11 lugares libres", "Cupo completo".
 */
export function spotsText(free: number) {
  if (free <= 0) return 'Cupo completo'
  return free === 1 ? '1 lugar libre' : `${free} lugares libres`
}

/**
 * A class's places as the admin sees them, never ambiguous about which number
 * is free: "3 anotados · 9 lugares libres", "12 anotados · Cupo completo".
 */
export function occupancyText(taken: number, capacity: number) {
  const people = taken === 1 ? '1 anotado' : `${taken} anotados`
  return `${people} · ${spotsText(capacity - taken)}`
}
