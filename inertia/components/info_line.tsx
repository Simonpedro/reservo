import type { LucideIcon } from 'lucide-react'
import { cn } from '~/lib/utils'

/**
 * A line of information with an icon. States are lines like this one, never
 * chips (DESIGN.md › Estados).
 */
export function DetailLine({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <p className="flex min-h-4 items-center gap-1.5 text-xs leading-tight font-extrabold whitespace-nowrap">
      <Icon className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

export function InfoLine({
  icon: Icon,
  children,
  muted = false,
}: {
  icon: LucideIcon
  children: string
  muted?: boolean
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-2.5 text-base leading-tight font-extrabold',
        muted && 'font-bold text-muted-foreground'
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
