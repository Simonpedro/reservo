import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

/**
 * A plain text notice with an icon: never a chip or a button (DESIGN.md ›
 * Estados). An optional inline action (e.g. "Deshacer") sits on the right.
 */
export function Notice({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  children?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <section
      role="status"
      className={cn('flex gap-2.5', action ? 'items-center' : 'items-start', className)}
    >
      <Icon className="mt-px size-[22px] shrink-0" strokeWidth={2.3} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <strong className="block text-base leading-[1.2] font-black">{title}</strong>
        {children && (
          <span className="mt-[3px] block text-sm leading-[1.3] font-bold text-muted-foreground">
            {children}
          </span>
        )}
      </div>
      {action}
    </section>
  )
}
