const PESOS = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

/**
 * Whole pesos as shown in the app: 38000 → "$38.000".
 */
export function formatPesos(amount: number): string {
  return `$${PESOS.format(amount)}`
}
