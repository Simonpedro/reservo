import { Link } from '@adonisjs/inertia/react'
import type { ComponentType, SVGProps } from 'react'
import { ClassesIcon, PaymentsIcon, PlanIcon } from '~/components/icons'

export type ClientTab = 'classes' | 'plan' | 'payments'

const TABS = [
  { id: 'classes', route: 'client.classes', label: 'Mis clases', icon: ClassesIcon },
  { id: 'plan', route: 'client.plan', label: 'Mi plan', icon: PlanIcon },
  { id: 'payments', route: 'client.payments', label: 'Pagos', icon: PaymentsIcon },
] as const satisfies {
  id: ClientTab
  route: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}[]

/**
 * Floating navy capsule with always-visible labels; the active tab is lime.
 */
export function BottomNav({ active }: { active: ClientTab }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="bottom-nav fixed inset-x-0 bottom-[18px] z-30 mx-auto w-full max-w-[430px] px-5"
    >
      <ul className="grid h-[68px] grid-cols-3 rounded-full bg-navy px-2 py-[7px] shadow-nav">
        {TABS.map(({ id, route, label, icon: Icon }) => (
          <li key={id} className="grid">
            <Link
              route={route}
              aria-current={id === active ? 'page' : undefined}
              className="flex min-h-[54px] flex-col items-center justify-center gap-[3px] rounded-full text-xs leading-none font-extrabold text-white/63 aria-[current=page]:bg-lime aria-[current=page]:text-navy"
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
