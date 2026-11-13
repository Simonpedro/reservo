import { Check } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { cn } from '~/lib/utils'

/**
 * A row to pick one option (radio) or several (checkbox). Native inputs keep
 * keyboard and screen reader behavior; only their look is replaced. Wrap
 * the rows in `divide-y divide-border`.
 */
export function Choice({
  type,
  name,
  value,
  checked,
  onChange,
  title,
  hint,
  disabled = false,
}: {
  type: 'radio' | 'checkbox'
  name: string
  value: string | number
  checked: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  title: string
  hint?: string
  disabled?: boolean
}) {
  return (
    <label
      className={cn(
        'flex min-h-14 items-center gap-3 py-2 text-navy',
        disabled ? 'cursor-default text-navy/60' : 'cursor-pointer'
      )}
    >
      <span className="relative grid size-6 shrink-0 place-items-center">
        <input
          type={type}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'peer size-6 cursor-pointer appearance-none border-2 border-navy outline-none checked:bg-navy disabled:cursor-default disabled:border-dashed disabled:border-navy/30 focus-visible:ring-3 focus-visible:ring-ring/50 forced-colors:appearance-auto',
            type === 'radio' ? 'rounded-full' : 'rounded-lg'
          )}
        />
        <Check
          className="pointer-events-none absolute size-4 text-white opacity-0 peer-checked:opacity-100"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-base leading-[1.2] font-black">{title}</strong>
        {hint && (
          <span className="mt-0.5 block text-sm leading-tight font-bold text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}
