import { Link } from '@adonisjs/inertia/react'
import { useForm, usePage } from '@inertiajs/react'
import { Check, ChevronDown, CircleAlert, Layers, Lock } from 'lucide-react'
import type { FormEvent } from 'react'
import { quotaText } from '#services/quota_text'
import { AdminInnerLayout } from '~/components/admin_layout'
import { InfoLine } from '~/components/info_line'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

type QuotaValue = {
  id?: number
  weeklyCount: number
  anyActivity: boolean
  activityIds: number[]
}

type EditablePlan = {
  id: number
  name: string
  price: number
  active: boolean
  quotas: QuotaValue[]
}

type Activity = { id: number; name: string }

const COUNTS = [1, 2, 3, 4, 5, 6, 7]

const fieldClass =
  'min-h-12 w-full rounded-full border-2 border-transparent bg-input px-4 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatPrice(digits: string) {
  return digits ? Number(digits).toLocaleString('es-AR') : ''
}

function describedBy(id: string, message: unknown) {
  return message ? id : undefined
}

/**
 * The field points at this message with aria-describedby (see describedBy).
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="status" className="text-sm font-extrabold text-foreground">
      {message}
    </p>
  )
}

/**
 * A pill that turns an option on or off (native checkbox underneath).
 */
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-2 border-navy bg-white px-4 text-sm font-black text-navy has-checked:border-celeste has-checked:bg-celeste has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {checked && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
      {label}
    </label>
  )
}

export default function AdminPlanForm({
  plan,
  lockedStudents,
  activities,
}: {
  plan: EditablePlan | null
  lockedStudents: number
  activities: Activity[]
}) {
  const flash = usePage().flash as { success?: string } | undefined
  const locked = lockedStudents > 0

  const form = useForm({
    name: plan?.name ?? '',
    price: plan ? String(plan.price) : '',
    quotas: (plan?.quotas ?? [{ weeklyCount: 1, anyActivity: true, activityIds: [] }]).map(
      (quota, index) => ({ ...quota, key: index })
    ),
  })
  const errors = form.errors as Record<string, string | undefined>
  const names = new Map(activities.map((activity) => [activity.id, activity.name]))

  const describe = (quota: QuotaValue) =>
    quotaText({
      weeklyCount: quota.weeklyCount,
      anyActivity: quota.anyActivity,
      activityNames: quota.activityIds.flatMap((id) => names.get(id) ?? []),
    })
  const complete = form.data.quotas.filter(
    (quota) => quota.anyActivity || quota.activityIds.length > 0
  )
  const total = form.data.quotas.reduce((sum, quota) => sum + quota.weeklyCount, 0)
  const totalLine = [
    `Total: ${total} ${total === 1 ? 'clase' : 'clases'} por semana`,
    ...(complete.length > 0 ? [capitalize(complete.map(describe).join(' + '))] : []),
  ].join(' · ')

  function updateQuota(index: number, change: Partial<QuotaValue>) {
    form.setData(
      'quotas',
      form.data.quotas.map((quota, position) =>
        position === index ? { ...quota, ...change } : quota
      )
    )
  }

  function toggleActivity(index: number, activityId: number) {
    const quota = form.data.quotas[index]
    const activityIds = quota.activityIds.includes(activityId)
      ? quota.activityIds.filter((id) => id !== activityId)
      : [...quota.activityIds, activityId]
    updateQuota(index, { anyActivity: false, activityIds })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.transform((data) => ({
      name: data.name,
      price: data.price === '' ? null : Number(data.price),
      quotas: data.quotas.map(({ key: _key, ...quota }) => ({
        ...quota,
        activityIds: quota.anyActivity ? [] : quota.activityIds,
      })),
    }))
    if (plan) form.put(`/admin/ajustes/planes/${plan.id}`)
    else form.post('/admin/ajustes/planes')
  }

  return (
    <AdminInnerLayout
      title={plan ? 'Editar plan' : 'Nuevo plan'}
      backHref="/admin/ajustes/planes"
      dock={
        <Button type="submit" form="plan-form" disabled={form.processing}>
          {form.processing ? 'Guardando…' : 'Guardar'}
        </Button>
      }
    >
      {flash?.success && (
        <p
          className="mt-4 text-sm leading-tight font-extrabold text-muted-foreground"
          role="status"
        >
          {flash.success}
        </p>
      )}

      {plan && !plan.active && (
        <Notice icon={CircleAlert} title="Este plan está desactivado." className="mt-4">
          No se puede asignar a alumnos. Quienes ya lo tienen lo siguen usando.
        </Notice>
      )}

      <form id="plan-form" className="mt-5" onSubmit={submit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid content-start gap-1.5">
            <label htmlFor="name" className="text-sm font-extrabold">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              autoComplete="off"
              value={form.data.name}
              onChange={(event) => form.setData('name', event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy('name-error', errors.name)}
              required
              className={fieldClass}
            />
            <FieldError id="name-error" message={errors.name} />
          </div>
          <div className="grid content-start gap-1.5">
            <label htmlFor="price" className="text-sm font-extrabold">
              Precio por mes
            </label>
            <input
              id="price"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatPrice(form.data.price)}
              onChange={(event) =>
                form.setData('price', event.target.value.replace(/\D/g, '').slice(0, 8))
              }
              aria-invalid={Boolean(errors.price)}
              aria-describedby={describedBy('price-error', errors.price)}
              required
              className={fieldClass}
            />
            <FieldError id="price-error" message={errors.price} />
          </div>
        </div>

        <section
          className="mt-6"
          aria-labelledby="quotas-title"
          aria-describedby={describedBy('quotas-error', errors.quotas)}
        >
          <h2 id="quotas-title" className="text-lg leading-none font-black tracking-[-0.035em]">
            Cupos semanales
          </h2>
          <p className="mt-2 text-base leading-snug font-bold text-muted-foreground">
            Cada cupo es una cantidad de clases y las actividades en las que se pueden usar.
          </p>

          {locked ? (
            <>
              <div className="mt-4 grid gap-2.5">
                {form.data.quotas.map((quota) => (
                  <InfoLine key={quota.key} icon={Layers}>
                    {`${capitalize(describe(quota))} por semana`}
                  </InfoLine>
                ))}
              </div>
              <Notice icon={Lock} title="Los cupos no se pueden cambiar." className="mt-5">
                {`${lockedStudents === 1 ? '1 alumno tiene' : `${lockedStudents} alumnos tienen`} horario fijo con este plan. Podés cambiar el nombre y el precio. Para otros cupos, creá un plan nuevo y pasá a los alumnos.`}
              </Notice>
            </>
          ) : (
            <>
              {form.data.quotas.map((quota, index) => (
                <fieldset
                  key={quota.key}
                  className="grid gap-2.5 border-t border-border py-3.5 first-of-type:border-t-0"
                >
                  <legend className="sr-only">{`Cupo ${index + 1}`}</legend>
                  <div className="grid gap-1.5">
                    <label htmlFor={`quota-${quota.key}`} className="text-sm font-extrabold">
                      {`Cupo ${index + 1}: clases por semana`}
                    </label>
                    <div className="relative">
                      <select
                        id={`quota-${quota.key}`}
                        value={quota.weeklyCount}
                        onChange={(event) =>
                          updateQuota(index, { weeklyCount: Number(event.target.value) })
                        }
                        aria-invalid={Boolean(errors[`quotas.${index}.weeklyCount`])}
                        aria-describedby={describedBy(
                          `quota-${quota.key}-count-error`,
                          errors[`quotas.${index}.weeklyCount`]
                        )}
                        className={cn(fieldClass, 'appearance-none pr-12')}
                      >
                        {COUNTS.map((count) => (
                          <option key={count} value={count}>
                            {count}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2"
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                    </div>
                    <FieldError
                      id={`quota-${quota.key}-count-error`}
                      message={errors[`quotas.${index}.weeklyCount`]}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <span className="text-sm font-extrabold" id={`quota-${quota.key}-activities`}>
                      Actividades
                    </span>
                    <div
                      role="group"
                      aria-labelledby={`quota-${quota.key}-activities`}
                      aria-describedby={describedBy(
                        `quota-${quota.key}-activities-error`,
                        errors[`quotas.${index}.activityIds`]
                      )}
                      className="flex flex-wrap gap-2"
                    >
                      <Toggle
                        label="Cualquiera"
                        checked={quota.anyActivity}
                        onChange={() =>
                          updateQuota(index, { anyActivity: !quota.anyActivity, activityIds: [] })
                        }
                      />
                      {activities.map((activity) => (
                        <Toggle
                          key={activity.id}
                          label={activity.name}
                          checked={!quota.anyActivity && quota.activityIds.includes(activity.id)}
                          onChange={() => toggleActivity(index, activity.id)}
                        />
                      ))}
                    </div>
                    <FieldError
                      id={`quota-${quota.key}-activities-error`}
                      message={errors[`quotas.${index}.activityIds`]}
                    />
                  </div>
                  {form.data.quotas.length > 1 && (
                    <Button
                      type="button"
                      variant="link"
                      className="justify-self-start px-1 text-sm"
                      onClick={() =>
                        form.setData(
                          'quotas',
                          form.data.quotas.filter((_, position) => position !== index)
                        )
                      }
                    >
                      {`Quitar cupo ${index + 1}`}
                    </Button>
                  )}
                </fieldset>
              ))}
              <Button
                type="button"
                variant="link"
                className="px-1 text-sm"
                onClick={() =>
                  form.setData('quotas', [
                    ...form.data.quotas,
                    {
                      weeklyCount: 1,
                      anyActivity: true,
                      activityIds: [],
                      key: Math.max(-1, ...form.data.quotas.map((quota) => quota.key)) + 1,
                    },
                  ])
                }
              >
                Agregar otro cupo
              </Button>
              <div className="mt-3">
                <InfoLine icon={Layers}>{totalLine}</InfoLine>
              </div>
            </>
          )}
          <div className="mt-3">
            <FieldError id="quotas-error" message={errors.quotas} />
          </div>
        </section>
      </form>

      {plan && (
        <div className="mt-6 flex justify-center">
          <Button asChild variant="link">
            <Link
              href={`/admin/ajustes/planes/${plan.id}/${plan.active ? 'desactivar' : 'activar'}`}
              method="post"
              as="button"
            >
              {plan.active ? 'Desactivar plan' : 'Activar plan'}
            </Link>
          </Button>
        </div>
      )}
    </AdminInnerLayout>
  )
}
