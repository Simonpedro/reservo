import { Link } from '@adonisjs/inertia/react'
import { useForm, usePage } from '@inertiajs/react'
import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import type { ScheduleEditor } from '#services/admin_schedules'
import { AdminInnerLayout } from '~/components/admin_layout'
import { BottomSheet } from '~/components/bottom_sheet'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/**
 * Every half hour from 06:00 to 22:30.
 */
const TIMES = Array.from({ length: 34 }, (_, index) => {
  const minutes = 6 * 60 + index * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

const OTHER = '__other__'

const fieldClass =
  'min-h-12 w-full rounded-full border-2 border-transparent bg-input px-4 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:opacity-60'

function people(count: number) {
  return count === 1 ? '1 persona' : `${count} personas`
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-extrabold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm font-extrabold text-foreground">
          {error}
        </p>
      )}
    </div>
  )
}

function Select({
  id,
  value,
  onChange,
  disabled,
  invalid,
  children,
}: {
  id: string
  value: string | number
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={cn(fieldClass, 'appearance-none pr-12')}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2"
        strokeWidth={2.4}
        aria-hidden="true"
      />
    </div>
  )
}

/**
 * Nuevo / Editar horario: activity, day and time, center, instructor and
 * capacity of a weekly class.
 */
export default function AdminScheduleForm({
  editor,
  weekday,
  backHref,
}: {
  editor: ScheduleEditor
  weekday: number | null
  backHref: string
}) {
  const flash = usePage().flash
  const { schedule, activities, centers, instructors, fixedStudents, locked } = editor
  const [deactivating, setDeactivating] = useState(false)
  const [otherInstructor, setOtherInstructor] = useState(
    instructors.length === 0 ||
      (schedule !== null && !instructors.includes(schedule.instructorName))
  )

  const form = useForm({
    activityId: schedule?.activityId ?? activities[0]?.id ?? 0,
    centerId: schedule?.centerId ?? centers[0]?.id ?? 0,
    weekday: schedule?.weekday ?? weekday ?? 1,
    startTime: schedule?.startTime ?? '18:00',
    instructorName: schedule?.instructorName ?? instructors[0] ?? '',
    capacity: String(schedule?.capacity ?? 10),
  })
  const errors = form.errors as Record<string, string | undefined>
  const times = TIMES.includes(form.data.startTime) ? TIMES : [...TIMES, form.data.startTime].sort()
  const blocked = flash?.capacityBlocked

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.transform((data) => ({
      ...data,
      capacity: data.capacity === '' ? null : Number(data.capacity),
    }))
    if (schedule) form.put(`/admin/horarios/${schedule.id}`)
    else form.post('/admin/horarios')
  }

  return (
    <AdminInnerLayout
      title={schedule ? 'Editar horario' : 'Nuevo horario'}
      backHref={backHref}
      dock={
        <Button type="submit" form="schedule-form" disabled={form.processing}>
          {form.processing ? 'Guardando…' : 'Guardar'}
        </Button>
      }
    >
      {flash?.success && <Notice icon={CircleCheck} title={flash.success} className="mt-4" />}
      {flash?.error && <Notice icon={CircleAlert} title={flash.error} className="mt-4" />}
      {schedule && !schedule.active && (
        <Notice icon={CircleAlert} title="Este horario está desactivado." className="mt-4">
          No aparece en la agenda y nadie lo puede reservar.
        </Notice>
      )}
      {blocked && (
        <section className="mt-4">
          <Notice
            icon={TriangleAlert}
            title={`Hay ${people(blocked.fixed)} con este horario fijo.`}
          >
            {`Para bajar el cupo a ${blocked.requested}, primero cambiá el horario de ${people(blocked.fixed - blocked.requested)} desde su ficha.`}
          </Notice>
          <ul className="mt-1.5 grid pl-8" aria-label="Personas con este horario fijo">
            {fixedStudents.map((student) => (
              <li key={student.userId}>
                <Link
                  href={`/admin/clientes/${student.userId}`}
                  className="flex min-h-11 items-center gap-2 border-b border-border text-base font-black no-underline last:border-b-0"
                >
                  <span className="flex-1">{student.fullName}</span>
                  <ChevronRight
                    className="size-5 text-muted-foreground"
                    strokeWidth={2.3}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form id="schedule-form" className="mt-5 grid gap-4" onSubmit={submit} noValidate>
        {locked && (
          <p className="text-sm leading-tight font-bold text-muted-foreground">
            Este horario tiene gente anotada: el día, el centro y la actividad no se pueden cambiar.
          </p>
        )}
        <Field id="activityId" label="Actividad" error={errors.activityId}>
          <Select
            id="activityId"
            value={form.data.activityId}
            onChange={(value) => form.setData('activityId', Number(value))}
            disabled={locked}
            invalid={Boolean(errors.activityId)}
          >
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="weekday" label="Día" error={errors.weekday}>
            <Select
              id="weekday"
              value={form.data.weekday}
              onChange={(value) => form.setData('weekday', Number(value))}
              disabled={locked}
              invalid={Boolean(errors.weekday)}
            >
              {WEEKDAYS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="startTime" label="Hora" error={errors.startTime}>
            <Select
              id="startTime"
              value={form.data.startTime}
              onChange={(value) => form.setData('startTime', value)}
              invalid={Boolean(errors.startTime)}
            >
              {times.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field id="centerId" label="Centro" error={errors.centerId}>
          <Select
            id="centerId"
            value={form.data.centerId}
            onChange={(value) => form.setData('centerId', Number(value))}
            disabled={locked}
            invalid={Boolean(errors.centerId)}
          >
            {centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </Select>
        </Field>

        {instructors.length > 0 && (
          <Field
            id="instructor"
            label="Instructor"
            error={otherInstructor ? undefined : errors.instructorName}
          >
            <Select
              id="instructor"
              value={otherInstructor ? OTHER : form.data.instructorName}
              onChange={(value) => {
                setOtherInstructor(value === OTHER)
                form.setData('instructorName', value === OTHER ? '' : value)
              }}
            >
              {instructors.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value={OTHER}>Otra persona…</option>
            </Select>
          </Field>
        )}
        {otherInstructor && (
          <Field
            id="instructorName"
            label={instructors.length > 0 ? 'Nombre de quien da la clase' : 'Instructor'}
            error={errors.instructorName}
          >
            <input
              id="instructorName"
              type="text"
              autoComplete="off"
              maxLength={120}
              value={form.data.instructorName}
              onChange={(event) => form.setData('instructorName', event.target.value)}
              aria-invalid={Boolean(errors.instructorName)}
              aria-describedby={errors.instructorName ? 'instructorName-error' : undefined}
              required
              className={fieldClass}
            />
          </Field>
        )}

        <Field id="capacity" label="Cupo" error={errors.capacity}>
          <input
            id="capacity"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={form.data.capacity}
            onChange={(event) =>
              form.setData('capacity', event.target.value.replace(/\D/g, '').slice(0, 3))
            }
            aria-invalid={Boolean(errors.capacity)}
            aria-describedby={errors.capacity ? 'capacity-error' : undefined}
            required
            className={fieldClass}
          />
        </Field>
      </form>

      {schedule && (
        <div className="mt-6 grid">
          {!schedule.active ? (
            <Button asChild variant="link">
              <Link href={`/admin/horarios/${schedule.id}/activar`} method="post" as="button">
                Activar este horario
              </Link>
            </Button>
          ) : fixedStudents.length > 0 ? (
            <p className="text-center text-sm leading-tight font-bold text-muted-foreground">
              {`Para desactivarlo, primero cambiá el horario fijo de ${fixedStudents.length === 1 ? 'la persona que lo tiene' : `las ${fixedStudents.length} personas que lo tienen`}.`}
            </p>
          ) : (
            <Button type="button" variant="link" onClick={() => setDeactivating(true)}>
              Desactivar este horario
            </Button>
          )}
        </div>
      )}

      {schedule?.active && fixedStudents.length === 0 && (
        <BottomSheet
          open={deactivating}
          onClose={() => setDeactivating(false)}
          title="¿Desactivamos este horario?"
          action={
            <Button asChild>
              <Link
                href={`/admin/horarios/${schedule.id}/desactivar`}
                method="post"
                as="button"
                onSuccess={() => setDeactivating(false)}
              >
                Desactivar
              </Link>
            </Button>
          }
        >
          Deja de aparecer en la agenda. Si alguien ya lo reservó con una clase pendiente, la
          recupera.
        </BottomSheet>
      )}
    </AdminInnerLayout>
  )
}
