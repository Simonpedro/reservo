import { CalendarClock } from 'lucide-react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { EmptyState } from '~/components/empty_state'

export default function AssignPlaceholder({ id, fullName }: { id: number; fullName: string }) {
  return (
    <AdminInnerLayout title="Asignar plan y horario" backHref={`/admin/clientes/${id}`}>
      <p className="mt-2 text-sm leading-tight font-extrabold text-muted-foreground">{fullName}</p>
      <EmptyState icon={CalendarClock} title="Próximo ticket (#17).">
        Acá va el flujo de plan + horarios en pasos.
      </EmptyState>
    </AdminInnerLayout>
  )
}
