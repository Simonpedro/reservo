import { useForm, usePage } from '@inertiajs/react'
import { CircleAlert, Info } from 'lucide-react'
import type { FormEvent } from 'react'
import type { CloseDayView } from '#services/admin_agenda'
import type { ClosureImpact } from '#services/day_closures'
import { AdminInnerLayout } from '~/components/admin_layout'
import { Choice } from '~/components/choice'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'

const fieldClass =
  'min-h-12 w-full rounded-full border-2 border-transparent bg-input px-4 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

export function impactTitle({ classes, bookings }: ClosureImpact) {
  if (classes === 0) return 'Ese día no hay clases para suspender.'
  const classText = classes === 1 ? '1 clase' : `${classes} clases`
  const bookingText = bookings === 1 ? '1 reserva' : `${bookings} reservas`
  return classes === 1 && bookings === 0
    ? 'Se suspende 1 clase sin reservas.'
    : `Se ${classes === 1 ? 'suspende' : 'suspenden'} ${classText} y ${bookingText}.`
}

/**
 * Cerrar un día: reason, where, and what it suspends before confirming.
 */
export default function AdminCloseDay({ view }: { view: CloseDayView }) {
  const flash = usePage().flash as { error?: string } | undefined
  const form = useForm({
    date: view.date,
    reason: 'Feriado',
    centerId: view.options[0]?.centerId ?? null,
  })
  const errors = form.errors as Record<string, string | undefined>
  const chosen =
    view.options.find((option) => option.centerId === form.data.centerId) ?? view.options[0]

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/admin/agenda/cerrar')
  }

  return (
    <AdminInnerLayout
      title="Cerrar un día"
      subtitle={view.dateLabel}
      backHref={`/admin/agenda?fecha=${view.date}`}
      dock={
        <Button type="submit" form="close-day-form" disabled={form.processing}>
          {form.processing ? 'Cerrando…' : `Cerrar el ${view.dayName}`}
        </Button>
      }
    >
      {flash?.error && <Notice icon={CircleAlert} title={flash.error} className="mt-4" />}

      <form id="close-day-form" className="mt-5 grid gap-5" onSubmit={submit} noValidate>
        <div className="grid gap-1.5">
          <label htmlFor="reason" className="text-sm font-extrabold">
            Motivo
          </label>
          <input
            id="reason"
            type="text"
            autoComplete="off"
            maxLength={120}
            value={form.data.reason}
            onChange={(event) => form.setData('reason', event.target.value)}
            aria-invalid={Boolean(errors.reason)}
            aria-describedby={errors.reason ? 'reason-error' : undefined}
            required
            className={fieldClass}
          />
          {errors.reason && (
            <p id="reason-error" className="text-sm font-extrabold text-foreground">
              {errors.reason}
            </p>
          )}
        </div>

        <fieldset className="grid">
          <legend className="mb-1 text-sm font-extrabold">Dónde</legend>
          <div className="divide-y divide-border">
            {view.options.map((option) => (
              <Choice
                key={option.centerId ?? 'all'}
                type="radio"
                name="centerId"
                value={option.centerId ?? 'all'}
                checked={option.centerId === form.data.centerId}
                onChange={() => form.setData('centerId', option.centerId)}
                title={option.label}
              />
            ))}
          </div>
        </fieldset>

        {chosen && (
          <Notice icon={Info} title={impactTitle(chosen.impact)}>
            {chosen.impact.bookings > 0
              ? 'Cada persona recibe una clase pendiente y lo ve en la app.'
              : 'El sistema no va a reservar clases ese día.'}
          </Notice>
        )}
      </form>
    </AdminInnerLayout>
  )
}
