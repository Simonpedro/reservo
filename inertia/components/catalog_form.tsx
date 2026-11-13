const fieldClass =
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
