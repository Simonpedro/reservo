import { Link } from '@adonisjs/inertia/react'
import { cn } from '~/lib/utils'

const VIEWS = [
  { key: 'day', label: 'Día', href: '/admin/agenda' },
  { key: 'week', label: 'Semana', href: '/admin/agenda/semana' },
] as const

/**
 * Día / Semana: the two ways to look at the agenda.
 */
export function AgendaSwitch({ current }: { current: 'day' | 'week' }) {
  return (
    <nav
      aria-label="Vista de la agenda"
      className="mt-4 grid w-full max-w-[390px] grid-cols-2 rounded-full bg-muted p-1"
    >
      {VIEWS.map((view) => (
        <Link
          key={view.key}
          href={view.href}
          replace
          aria-current={view.key === current ? 'page' : undefined}
          className={cn(
            'grid min-h-11 place-items-center rounded-full text-base font-black text-navy/68 no-underline',
            view.key === current && 'bg-celeste text-navy shadow-[0_7px_14px_rgb(90_184_240/0.28)]'
          )}
        >
          {view.label}
        </Link>
      ))}
    </nav>
  )
}
