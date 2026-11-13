import { Settings } from 'lucide-react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { EmptyState } from '~/components/empty_state'

export default function SettingsPlaceholder() {
  return (
    <AdminInnerLayout title="Ajustes" backHref="/admin/clientes">
      <EmptyState icon={Settings} title="Muy pronto.">
        Acá vas a ver planes y configuración del centro.
      </EmptyState>
    </AdminInnerLayout>
  )
}
