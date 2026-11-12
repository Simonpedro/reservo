import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { Button } from '~/components/ui/button'

export default function NotFound({
  title = 'Página no encontrada',
  message = 'La página que buscás no existe.',
}: {
  title?: string
  message?: string
}) {
  return (
    <>
      <Head title={title} />
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-muted-foreground">Error 404</p>
          <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
          <p className="mt-3 text-muted-foreground">{message}</p>
          <Button asChild className="mt-8">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </main>
    </>
  )
}
