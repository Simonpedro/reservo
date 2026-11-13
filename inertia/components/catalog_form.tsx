import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'

export const fieldClass =
  'min-h-12 w-full rounded-full border-2 border-transparent bg-input px-4 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

/**
 * The name of an activity or a center, with its error under it.
 */
export function NameField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor="name" className="text-sm font-extrabold">
        Nombre
      </label>
      <input
        id="name"
        type="text"
        autoComplete="off"
        maxLength={120}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'name-error' : undefined}
        required
        className={fieldClass}
      />
      {error && (
        <p id="name-error" role="status" className="text-sm font-extrabold text-foreground">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * The flash of the last action, at the top of the form.
 */
export function FormFlash() {
  const flash = usePage().flash
  return (
    <>
      {flash?.success && <Notice icon={CircleCheck} title={flash.success} className="mt-4" />}
      {flash?.error && <Notice icon={CircleAlert} title={flash.error} className="mt-4" />}
    </>
  )
}

/**
 * Activar / Desactivar under the form. While something uses it, it says what
 * instead of offering to deactivate.
 */
export function ActiveAction({
  href,
  active,
  inUse,
  noun,
}: {
  /**
   * The record's page: `${href}/activar` or `${href}/desactivar`.
   */
  href: string
  active: boolean
  inUse: string | null
  /**
   * "actividad", "sede".
   */
  noun: string
}) {
  if (active && inUse) {
    return (
      <p className="mt-6 text-center text-sm leading-tight font-bold text-muted-foreground">
        {inUse}
      </p>
    )
  }
  return (
    <div className="mt-6 flex justify-center">
      <Button asChild variant="link">
        <Link href={`${href}/${active ? 'desactivar' : 'activar'}`} method="post" as="button">
          {active ? `Desactivar ${noun}` : `Activar ${noun}`}
        </Link>
      </Button>
    </div>
  )
}
