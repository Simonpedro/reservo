import type { FormEvent } from 'react'
import { useForm } from '@inertiajs/react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { Button } from '~/components/ui/button'

export default function NewAdminClient() {
  const form = useForm({
    fullName: '',
    email: '',
    phone: '',
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/admin/clientes')
  }

  return (
    <AdminInnerLayout
      title="Alta de alumno"
      backHref="/admin/clientes"
      dock={
        <Button type="submit" form="create-client-form" disabled={form.processing}>
          {form.processing ? 'Guardando…' : 'Crear alumno'}
        </Button>
      }
    >
      <form id="create-client-form" className="mt-5 grid gap-4" onSubmit={submit} noValidate>
        <div className="grid gap-1.5">
          <label htmlFor="fullName" className="text-sm font-extrabold">
            Nombre y apellido
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={form.data.fullName}
            onChange={(event) => form.setData('fullName', event.target.value)}
            aria-invalid={Boolean(form.errors.fullName)}
            required
            className="min-h-12 w-full rounded-full border-2 border-transparent bg-input px-4 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {form.errors.fullName && (
            <p role="status" className="text-sm font-bold text-destructive">
              {form.errors.fullName}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="email" className="text-sm font-extrabold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.data.email}
            onChange={(event) => form.setData('email', event.target.value)}
            aria-invalid={Boolean(form.errors.email)}
            required
            className="min-h-12 w-full rounded-full border-2 border-transparent bg-input px-4 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {form.errors.email && (
            <p role="status" className="text-sm font-bold text-destructive">
              {form.errors.email}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="phone" className="text-sm font-extrabold">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.data.phone}
            onChange={(event) => form.setData('phone', event.target.value)}
            aria-invalid={Boolean(form.errors.phone)}
            className="min-h-12 w-full rounded-full border-2 border-transparent bg-input px-4 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {form.errors.phone && (
            <p role="status" className="text-sm font-bold text-destructive">
              {form.errors.phone}
            </p>
          )}
        </div>
      </form>
    </AdminInnerLayout>
  )
}
