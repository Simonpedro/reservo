import { CalendarClock } from 'lucide-react'
import { AdminLayout } from '~/components/admin_layout'
import type { AdminTab } from '~/components/admin_bottom_nav'
import { EmptyState } from '~/components/empty_state'

const TITLES: Record<Exclude<AdminTab, 'clients' | 'payments'>, string> = {
  today: 'Hoy',
  agenda: 'Agenda',
}

export default function AdminComingSoon({ tab }: { tab: 'today' | 'agenda' }) {
  return (
    <AdminLayout tab={tab} title={TITLES[tab]}>
      <EmptyState icon={CalendarClock} title="Muy pronto.">
        Estamos terminando esta sección del admin.
      </EmptyState>
    </AdminLayout>
  )
}
