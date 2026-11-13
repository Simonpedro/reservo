import { Head } from '@inertiajs/react'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

/**
 * Generic landing for the apex domain. Tenant hosts redirect `/` to the login.
 */
export default function Home() {
  return (
    <>
      <Head title="Gestión de clases y reservas" />
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-4">
            <span className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Reservo
            </span>
            <CardTitle className="text-4xl">Clases, reservas y gestión en un solo lugar.</CardTitle>
            <CardDescription className="text-base">
              Una plataforma para centros de kinesiología, gimnasios y estudios.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </>
  )
}
