import type { TenantTheme } from '#models/tenant'

function format(value: number) {
  return Number(value.toFixed(1)).toString()
}

export function hexToHsl(hex: string): string | null {
  const match = /^#([\da-f]{6})$/i.exec(hex)
  if (!match) return null

  const value = match[1]
  const red = Number.parseInt(value.slice(0, 2), 16) / 255
  const green = Number.parseInt(value.slice(2, 4), 16) / 255
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const lightness = (max + min) / 2

  let hue = 0
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6
    if (max === green) hue = (blue - red) / delta + 2
    if (max === blue) hue = (red - green) / delta + 4
    hue = (hue * 60 + 360) % 360
  }

  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  return `hsl(${format(hue)} ${format(saturation * 100)}% ${format(lightness * 100)}%)`
}

export function tenantThemeCss(theme?: TenantTheme | null) {
  if (!theme) return ''

  const brand = theme.brandBackground && hexToHsl(theme.brandBackground)
  const green = theme.green && hexToHsl(theme.green)
  const lightBlue = theme.lightBlue && hexToHsl(theme.lightBlue)
  const blue = theme.blue && hexToHsl(theme.blue)
  const accent = theme.accent && hexToHsl(theme.accent)

  const variables: Record<string, string | null | undefined> = {
    '--brand-background': brand,
    '--brand-green': green,
    '--brand-light-blue': lightBlue,
    '--brand-blue': blue,
    '--brand-accent': accent,
    '--primary': brand,
    '--primary-foreground': 'hsl(0 0% 100%)',
    '--secondary': green,
    '--secondary-foreground': brand,
    '--accent': accent,
    '--accent-foreground': brand,
    '--ring': blue,
    '--chart-1': green,
    '--chart-2': lightBlue,
    '--chart-3': blue,
    '--chart-4': accent,
    '--chart-5': brand,
    '--sidebar-primary': brand,
    '--sidebar-primary-foreground': 'hsl(0 0% 100%)',
    '--sidebar-accent': lightBlue,
    '--sidebar-accent-foreground': brand,
    '--sidebar-ring': blue,
  }

  return Object.entries(variables)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ')
}
