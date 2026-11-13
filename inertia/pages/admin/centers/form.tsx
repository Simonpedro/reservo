import { useForm } from '@inertiajs/react'
import { CircleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { AdminInnerLayout } from '~/components/admin_layout'
import { ActiveAction, FormFlash, NameField } from '~/components/catalog_form'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'

type EditableCenter = { id: number; name: string; active: boolean }

/**
 * Nueva / Editar sede: its name.
 */
export default function AdminCenterForm({
  center,
  inUse,
}: {
  center: EditableCenter | null
  inUse: string | null
}) {
  const form = useForm({ name: center?.name ?? '' })
  const errors = form.errors as Record<string, string | undefined>

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (center) form.put(`/admin/ajustes/sedes/${center.id}`)
    else form.post('/admin/ajustes/sedes')
  }

  return (
    <AdminInnerLayout
      title={center ? 'Editar sede' : 'Nueva sede'}
      backHref="/admin/ajustes/sedes"
      dock={
        <Button type="submit" form="center-form" disabled={form.processing}>
          {form.processing ? 'Guardando…' : 'Guardar'}
        </Button>
      }
    >
      <FormFlash />
      {center && !center.active && (
        <Notice icon={CircleAlert} title="Esta sede está desactivada." className="mt-4">
          No se ofrece en horarios nuevos. Lo que ya la tiene la sigue mostrando.
        </Notice>
      )}

      <form id="center-form" className="mt-5 grid gap-5" onSubmit={submit} noValidate>
        <NameField
          value={form.data.name}
          onChange={(value) => form.setData('name', value)}
          error={errors.name}
        />
      </form>

      {center && (
        <ActiveAction
          href={`/admin/ajustes/sedes/${center.id}`}
          active={center.active}
          inUse={inUse}
          noun="sede"
        />
      )}
    </AdminInnerLayout>
  )
}
