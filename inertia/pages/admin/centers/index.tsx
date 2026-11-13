import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { MapPin, Plus } from 'lucide-react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { EmptyState } from '~/components/empty_state'
import { LinkRow } from '~/components/link_row'
import { Button } from '~/components/ui/button'

type CenterListItem = { id: number; name: string; hint: string }

/**
 * Ajustes › Centros: the places where classes happen.
 */
export default function AdminCentersIndex({ centers }: { centers: CenterListItem[] }) {
  const success = usePage().flash?.success

  return (
    <AdminInnerLayout
      title="Centros"
      backHref="/admin/ajustes"
      dock={
        <Button asChild>
          <Link href="/admin/ajustes/centros/nuevo">
            <Plus strokeWidth={2.6} aria-hidden="true" />
            Nuevo centro
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
                href={`/admin/ajustes/centros/${center.id}`}
                bubble={<MapPin strokeWidth={2.2} />}
                title={center.name}
                hint={center.hint}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MapPin} title="Todavía no hay centros.">
          Creá el primero con el nombre con el que lo conocen tus alumnos.
        </EmptyState>
      )}
    </AdminInnerLayout>
  )
}
