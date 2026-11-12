import { Head } from '@inertiajs/react'

export default function ServerError() {
  return (
    <>
      <Head title="Ocurrió un error" />
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-muted-foreground">Error 500</p>
          <h1 className="mt-3 text-3xl font-semibold">No pudimos completar la solicitud.</h1>
          <p className="mt-3 text-muted-foreground">Intentá nuevamente en unos minutos.</p>
        </div>
      </main>
    </>
  )
}
