import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import { ArrowRight, CalendarCheck, Users } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import type { PageProps } from '~/types'

export default function Home() {
  const { tenant } = usePage<PageProps>().props

  if (!tenant) {
    return (
      <>
        <Head title="Gestión de clases y reservas" />
        <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
          <Card className="w-full max-w-2xl">
            <CardHeader className="space-y-4">
              <span className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Reservo
              </span>
              <CardTitle className="text-4xl">
                Clases, reservas y gestión en un solo lugar.
              </CardTitle>
              <CardDescription className="text-base">
                Una plataforma para centros de kinesiología, gimnasios y estudios.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <Head title={tenant.name} />
      <main className="min-h-screen bg-background">
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto flex min-h-[62vh] max-w-6xl flex-col justify-center px-6 py-20">
            <p className="mb-5 text-sm font-semibold tracking-[0.2em] uppercase opacity-75">
              Reservo
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance md:text-7xl">
              Tu espacio en {tenant.name}.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 opacity-80">
              Reservá tus clases y consultá toda la información de tu plan desde un mismo lugar.
            </p>
            <div className="mt-10">
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">
                  Ingresar <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CalendarCheck className="size-6 text-primary" />
              <CardTitle>Reservas simples</CardTitle>
              <CardDescription>Elegí una clase disponible dentro de tu plan.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="size-6 text-primary" />
              <CardTitle>Un lugar para cada rol</CardTitle>
              <CardDescription>
                Clientes, instructores y administradores con la información que necesitan.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>
    </>
  )
}
