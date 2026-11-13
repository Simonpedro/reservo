import { CalendarClock } from 'lucide-react'
import { AdminLayout } from '~/components/admin_layout'
import { EmptyState } from '~/components/empty_state'

const TITLES: Record<'agenda', string> = {
  agenda: 'Agenda',
}

export default function AdminComingSoon({ tab }: { tab: 'agenda' }) {
  return (
    <AdminLayout tab={tab} title={TITLES[tab]}>
      <EmptyState icon={CalendarClock} title="Muy pronto.">
        Estamos terminando esta sección del admin.
      </EmptyState>
    </AdminLayout>
  )
}
