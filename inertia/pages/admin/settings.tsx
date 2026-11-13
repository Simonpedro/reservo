import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { Landmark, Layers, MapPin, MessageCircle, Shapes } from 'lucide-react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { firstName } from '~/components/client_layout'
import { InfoLine } from '~/components/info_line'
import { LinkRow } from '~/components/link_row'
import { Button } from '~/components/ui/button'
import type { PageProps } from '~/types'

function count(total: number, one: string, many: string) {
  return total === 1 ? `1 ${one}` : `${total} ${many}`
}

export default function AdminSettings({
  activePlans,
  activities,
  centers,
  whatsappPhone,
  transferAliases,
}: {
  activePlans: number
  activities: number
  centers: number
  whatsappPhone: string | null
  transferAliases: string[]
}) {
  const { auth, tenant } = usePage<PageProps>().props
  const hasCenterData = Boolean(whatsappPhone) || transferAliases.length > 0

  return (
    <AdminInnerLayout
      title="Ajustes"
      subtitle={`${firstName(auth.user?.fullName)} · ${tenant?.name ?? ''}`}
      backHref="/admin/clientes"
    >
      <nav aria-label="Ajustes" className="mt-5 divide-y divide-border">
        <LinkRow
          href="/admin/ajustes/planes"
          bubble={<Layers strokeWidth={2.2} />}
          title="Planes"
          hint={count(activePlans, 'plan', 'planes')}
        />
        <LinkRow
          href="/admin/ajustes/actividades"
          bubble={<Shapes strokeWidth={2.2} />}
          title="Actividades"
          hint={count(activities, 'actividad', 'actividades')}
        />
        <LinkRow
          href="/admin/ajustes/sedes"
          bubble={<MapPin strokeWidth={2.2} />}
          title="Sedes"
          hint={count(centers, 'sede', 'sedes')}
        />
      </nav>

      {hasCenterData && (
        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Datos del centro</h2>
          <div className="mt-3 grid gap-2.5">
            {whatsappPhone && (
              <InfoLine icon={MessageCircle}>{`WhatsApp ${whatsappPhone}`}</InfoLine>
            )}
            {transferAliases.map((alias) => (
              <InfoLine key={alias} icon={Landmark}>{`Alias ${alias}`}</InfoLine>
            ))}
          </div>
          <p className="mt-3 text-sm leading-snug font-bold text-muted-foreground">
            Estos datos los carga Reservo. Los ven tus alumnos al escribirte y al pagar.
          </p>
        </section>
      )}

      <div className="mt-6 flex justify-center">
        <Button asChild variant="link">
          <Link href="/logout" method="post" as="button">
            Cerrar sesión
          </Link>
        </Button>
      </div>
    </AdminInnerLayout>
  )
}
