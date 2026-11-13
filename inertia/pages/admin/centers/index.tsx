import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { MapPin, Plus } from 'lucide-react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { EmptyState } from '~/components/empty_state'
import { LinkRow } from '~/components/link_row'
import { Button } from '~/components/ui/button'

type CenterListItem = { id: number; name: string; active: boolean; hint: string }

/**
 * Ajustes › Sedes: the places where classes happen.
 */
export default function AdminCentersIndex({ centers }: { centers: CenterListItem[] }) {
  const success = usePage().flash?.success

  return (
    <AdminInnerLayout
      title="Sedes"
      backHref="/admin/ajustes"
      dock={
        <Button asChild>
          <Link href="/admin/ajustes/sedes/nuevo">
            <Plus strokeWidth={2.6} aria-hidden="true" />
            Nueva sede
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

      {centers.length > 0 ? (
        <ul className="mt-5 divide-y divide-border">
          {centers.map((center) => (
            <li key={center.id}>
              <LinkRow
                href={`/admin/ajustes/sedes/${center.id}`}
                bubble={<MapPin strokeWidth={2.2} />}
                title={center.name}
                hint={center.hint}
                muted={!center.active}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MapPin} title="Todavía no hay sedes.">
          Creá la primera con el nombre con el que la conocen tus alumnos.
        </EmptyState>
      )}
    </AdminInnerLayout>
  )
}
