import { Link } from '@adonisjs/inertia/react'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

/**
 * A navigation row: round bubble (icon or number), title, hint and chevron.
 * Wrap the rows in `divide-y divide-border`.
 */
export function LinkRow({
  href,
  bubble,
  title,
  hint,
  muted = false,
}: {
  href: string
  bubble: ReactNode
  title: string
  hint?: string
  muted?: boolean
}) {
  return (
    <Link
      href={href}
      viewTransition
      className="flex min-h-[60px] items-center gap-3 py-2 text-navy no-underline"
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full text-sm font-black [&_svg]:size-5',
          muted ? 'bg-muted' : 'bg-wash-celeste'
        )}
      >
        {bubble}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-base leading-[1.2] font-black">{title}</strong>
        {hint && (
          <span className="mt-0.5 block text-sm leading-tight font-bold text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 opacity-55" strokeWidth={2.4} aria-hidden="true" />
    </Link>
  )
}
