import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import { CalendarDays } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import type { PageProps, UserRole } from '~/types'

const content: Record<UserRole, { title: string; description: string }> = {
  admin: {
    title: 'Panel de administración',
    description: 'Acá vas a gestionar clases, clientes, planes, asistencias y pagos.',
  },
  instructor: {
    title: 'Vista del instructor',
    description: 'Acá vas a consultar las clases de hoy y sus asistentes.',
  },
  client: {
    title: 'Mi portal',
    description: 'Acá vas a reservar clases y consultar tu plan y tus pagos.',
  },
}

export default function Dashboard({ section }: { section: UserRole }) {
  const { tenant, auth } = usePage<PageProps>().props
  const page = content[section]

  return (
    <>
      <Head title={page.title} />
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="font-semibold">{tenant?.name}</p>
            <p className="text-xs text-muted-foreground">Reservo</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/logout" method="post" as="button">
              Cerrar sesión
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-muted-foreground">Hola, {auth.user?.fullName}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{page.title}</h1>
        <Card className="mt-8 max-w-2xl">
          <CardHeader>
            <CalendarDays className="size-6 text-primary" />
            <CardTitle>Próximamente</CardTitle>
            <CardDescription>{page.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este boilerplate incluye autenticación, roles y multi-tenancy. Las funciones de
              negocio se implementarán en las próximas etapas.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
