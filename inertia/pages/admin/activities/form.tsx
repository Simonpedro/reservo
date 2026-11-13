import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import type { ActivityWash } from '#models/activity'
import { AdminInnerLayout } from '~/components/admin_layout'
import { NameField } from '~/components/catalog_form'
import { Choice } from '~/components/choice'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

type EditableActivity = { id: number; name: string; wash: ActivityWash }

const WASHES: { value: ActivityWash; label: string; background: string }[] = [
  { value: 'celeste', label: 'Celeste', background: 'bg-wash-celeste' },
  { value: 'green', label: 'Verde', background: 'bg-wash-green' },
  { value: 'blue', label: 'Azul', background: 'bg-wash-blue' },
]

/**
 * Nueva / Editar actividad: name and the color of its class cards.
 */
export default function AdminActivityForm({ activity }: { activity: EditableActivity | null }) {
  const form = useForm({ name: activity?.name ?? '', wash: activity?.wash ?? 'celeste' })
  const errors = form.errors as Record<string, string | undefined>
  const preview = WASHES.find((wash) => wash.value === form.data.wash) ?? WASHES[0]

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (activity) form.put(`/admin/ajustes/actividades/${activity.id}`)
    else form.post('/admin/ajustes/actividades')
  }

  return (
    <AdminInnerLayout
      title={activity ? 'Editar actividad' : 'Nueva actividad'}
      backHref="/admin/ajustes/actividades"
      dock={
        <Button type="submit" form="activity-form" disabled={form.processing}>
          {form.processing ? 'Guardando…' : 'Guardar'}
        </Button>
      }
    >
      <form id="activity-form" className="mt-5 grid gap-5" onSubmit={submit} noValidate>
        <NameField
          value={form.data.name}
          onChange={(value) => form.setData('name', value)}
          error={errors.name}
        />

        <fieldset aria-describedby={errors.wash ? 'wash-error' : undefined}>
          <legend className="text-sm font-extrabold">Color de la tarjeta</legend>
          <div className="mt-1 divide-y divide-border">
            {WASHES.map((wash) => (
              <Choice
                key={wash.value}
                type="radio"
                name="wash"
                value={wash.value}
                checked={form.data.wash === wash.value}
                onChange={() => form.setData('wash', wash.value)}
                title={wash.label}
              />
            ))}
          </div>
          {errors.wash && (
            <p id="wash-error" role="status" className="text-sm font-extrabold text-foreground">
              {errors.wash}
            </p>
          )}
        </fieldset>

        <div aria-hidden="true">
          <p className="text-sm font-extrabold text-muted-foreground">Así se ve en la agenda</p>
          <div
            className={cn(
              'mt-2 flex min-h-20 items-center rounded-[34px] px-4',
              preview.background
            )}
          >
            <span className="text-[22px] leading-[0.98] font-black tracking-[-0.045em]">
              {form.data.name.trim() || 'Actividad'}
            </span>
          </div>
        </div>
      </form>
    </AdminInnerLayout>
  )
}
