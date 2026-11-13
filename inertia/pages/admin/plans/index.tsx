import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { Layers, Plus } from 'lucide-react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { EmptyState } from '~/components/empty_state'
import { LinkRow } from '~/components/link_row'
import { Button } from '~/components/ui/button'

type PlanListItem = {
  id: number
  name: string
  active: boolean
  weeklyTotal: number
  summary: string
  price: string
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function AdminPlansIndex({ plans }: { plans: PlanListItem[] }) {
  const success = (usePage().flash as { success?: string } | undefined)?.success

  return (
    <AdminInnerLayout
      title="Planes"
      backHref="/admin/ajustes"
      dock={
        <Button asChild>
          <Link href="/admin/ajustes/planes/nuevo">
            <Plus strokeWidth={2.6} aria-hidden="true" />
            Nuevo plan
          </Link>
        </Button>
      }
    >
      {success && (
        <p
          className="mt-4 text-sm leading-tight font-extrabold text-muted-foreground"
          role="status"
        >
          {success}
        </p>
      )}

      {plans.length > 0 ? (
        <ul className="mt-5 divide-y divide-border">
          {plans.map((plan) => (
            <li key={plan.id}>
              <LinkRow
                href={`/admin/ajustes/planes/${plan.id}`}
                bubble={plan.weeklyTotal}
                title={plan.name}
                hint={[
                  capitalize(plan.summary),
                  plan.price,
                  ...(plan.active ? [] : ['Desactivado']),
                ].join(' · ')}
                muted={!plan.active}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Layers} title="Todavía no hay planes.">
          Creá el primero: nombre, precio y cuántas clases por semana incluye.
        </EmptyState>
      )}
    </AdminInnerLayout>
  )
}
