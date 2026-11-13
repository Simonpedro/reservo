import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { Button } from '~/components/ui/button'

export default function Forbidden() {
  return (
    <>
      <Head title="Acceso denegado" />
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-muted-foreground">Error 403</p>
          <h1 className="mt-3 text-3xl font-semibold">No tenés acceso a esta sección.</h1>
          <Button asChild className="mt-8">
            <Link href="/">Ir a mi inicio</Link>
          </Button>
        </div>
      </main>
    </>
  )
}
