import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { NameField } from '~/components/catalog_form'
import { Button } from '~/components/ui/button'

type EditableCenter = { id: number; name: string }

/**
 * Nuevo / Editar centro: its name.
 */
export default function AdminCenterForm({ center }: { center: EditableCenter | null }) {
  const form = useForm({ name: center?.name ?? '' })
  const errors = form.errors as Record<string, string | undefined>

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (center) form.put(`/admin/ajustes/centros/${center.id}`)
    else form.post('/admin/ajustes/centros')
  }

  return (
    <AdminInnerLayout
      title={center ? 'Editar centro' : 'Nuevo centro'}
      backHref="/admin/ajustes/centros"
      dock={
        <Button type="submit" form="center-form" disabled={form.processing}>
          {form.processing ? 'Guardando…' : 'Guardar'}
        </Button>
      }
    >
      <form id="center-form" className="mt-5 grid gap-5" onSubmit={submit} noValidate>
        <NameField
          value={form.data.name}
          onChange={(value) => form.setData('name', value)}
          error={errors.name}
        />
      </form>
    </AdminInnerLayout>
  )
}
