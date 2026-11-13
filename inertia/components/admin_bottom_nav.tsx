import { Link } from '@adonisjs/inertia/react'
import { CalendarDays, CreditCard, Sun, Users } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export type AdminTab = 'today' | 'clients' | 'agenda' | 'payments'

const TABS = [
  { id: 'today', href: '/admin/hoy', label: 'Hoy', icon: Sun },
  { id: 'clients', href: '/admin/clientes', label: 'Clientes', icon: Users },
  { id: 'agenda', href: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'payments', href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
] as const satisfies {
  id: AdminTab
  href: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}[]

export function AdminBottomNav({ active }: { active: AdminTab }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="bottom-nav fixed inset-x-0 bottom-[18px] z-30 mx-auto w-full max-w-[430px] px-5"
    >
      <ul className="grid h-[68px] grid-cols-4 rounded-full bg-navy px-2 py-[7px] shadow-nav">
        {TABS.map(({ id, href, label, icon: Icon }) => (
          <li key={id} className="grid">
            <Link
              href={href}
              aria-current={id === active ? 'page' : undefined}
              className="flex min-h-[54px] flex-col items-center justify-center gap-[3px] rounded-full text-xs leading-none font-extrabold text-white/63 aria-[current=page]:bg-lime aria-[current=page]:text-navy"
            >
              <Icon className="size-5" strokeWidth={2.2} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
