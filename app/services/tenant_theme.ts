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

function withAlpha(color: string | null | undefined, alpha: number) {
  return color ? color.replace(/\)$/, ` / ${alpha})`) : null
}

/**
 * Tenant brand colors as CSS variables: the Píldora brand aliases and washes
 * (DESIGN.md) plus the shadcn tokens derived from them.
 */
export function tenantThemeCss(theme?: TenantTheme | null) {
  if (!theme) return ''

  const navy = theme.brandBackground && hexToHsl(theme.brandBackground)
  const green = theme.green && hexToHsl(theme.green)
  const celeste = theme.lightBlue && hexToHsl(theme.lightBlue)
  const blue = theme.blue && hexToHsl(theme.blue)
  const lime = theme.accent && hexToHsl(theme.accent)

  const variables: Record<string, string | null | undefined> = {
    '--navy': navy,
    '--green': green,
    '--celeste': celeste,
    '--blue': blue,
    '--lime': lime,
    '--wash-navy': withAlpha(navy, 0.055),
    '--wash-green': withAlpha(green, 0.18),
    '--wash-celeste': withAlpha(celeste, 0.17),
    '--wash-blue': withAlpha(blue, 0.13),
    '--shadow-soft': navy && `0 14px 34px ${withAlpha(navy, 0.1)}`,
    '--shadow-nav': navy && `0 12px 34px ${withAlpha(navy, 0.2)}`,
    '--foreground': navy,
    '--card-foreground': navy,
    '--popover-foreground': navy,
    '--primary': navy,
    '--primary-foreground': 'hsl(0 0% 100%)',
    '--secondary': withAlpha(celeste, 0.16),
    '--secondary-foreground': navy,
    '--muted': withAlpha(navy, 0.06),
    '--muted-foreground': withAlpha(navy, 0.72),
    '--accent': lime,
    '--accent-foreground': navy,
    '--destructive': blue,
    '--border': withAlpha(navy, 0.11),
    '--input': withAlpha(celeste, 0.2),
    '--ring': blue,
    '--chart-1': green,
    '--chart-2': celeste,
    '--chart-3': blue,
    '--chart-4': lime,
    '--chart-5': navy,
    '--sidebar': navy,
    '--sidebar-primary': lime,
    '--sidebar-primary-foreground': navy,
    '--sidebar-accent': withAlpha(celeste, 0.22),
    '--sidebar-ring': celeste,
  }

  return Object.entries(variables)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ')
}
