import { CalendarClock } from 'lucide-react'
import type { ClientTab } from '~/components/bottom_nav'
import { ClientLayout } from '~/components/client_layout'
import { EmptyState } from '~/components/empty_state'

const TITLES: Record<Exclude<ClientTab, 'classes'>, string> = {
  plan: 'Mi plan',
  payments: 'Pagos',
}

/**
 * Placeholder for the student tabs that are not built yet.
 */
export default function ComingSoon({ tab }: { tab: 'plan' | 'payments' }) {
  return (
    <ClientLayout tab={tab} title={TITLES[tab]}>
      <EmptyState icon={CalendarClock} title="Muy pronto.">
        Estamos terminando esta sección. Mientras tanto, tus clases están en Mis clases.
      </EmptyState>
    </ClientLayout>
  )
}
