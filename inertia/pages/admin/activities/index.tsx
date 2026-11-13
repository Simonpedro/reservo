import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { Plus, Shapes } from 'lucide-react'
import type { ActivityWash } from '#models/activity'
import { AdminInnerLayout } from '~/components/admin_layout'
import { EmptyState } from '~/components/empty_state'
import { LinkRow } from '~/components/link_row'
import { Button } from '~/components/ui/button'

type ActivityListItem = {
  id: number
  name: string
  wash: ActivityWash
  active: boolean
  hint: string
}

/**
 * Ajustes › Actividades: the activities classes and plans can name.
 */
export default function AdminActivitiesIndex({ activities }: { activities: ActivityListItem[] }) {
  const success = usePage().flash?.success

  return (
    <AdminInnerLayout
      title="Actividades"
      backHref="/admin/ajustes"
      dock={
        <Button asChild>
          <Link href="/admin/ajustes/actividades/nuevo">
            <Plus strokeWidth={2.6} aria-hidden="true" />
            Nueva actividad
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

      {activities.length > 0 ? (
        <ul className="mt-5 divide-y divide-border">
          {activities.map((activity) => (
            <li key={activity.id}>
              <LinkRow
                href={`/admin/ajustes/actividades/${activity.id}`}
                bubble={<Shapes strokeWidth={2.2} />}
                title={activity.name}
                hint={activity.hint}
                muted={!activity.active}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Shapes} title="Todavía no hay actividades.">
          Creá la primera: Pilates, Yoga, Gimnasio o lo que des en tu centro.
        </EmptyState>
      )}
    </AdminInnerLayout>
  )
}
