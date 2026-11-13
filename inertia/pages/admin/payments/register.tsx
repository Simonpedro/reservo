import { useForm } from '@inertiajs/react'
import { ChevronDown } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import type { RegisterForm } from '#services/admin_payments'
import { AdminInnerLayout } from '~/components/admin_layout'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const fieldClass =
  'min-h-12 w-full rounded-full border-2 border-transparent bg-input px-4 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

const METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'forced', label: 'Forzar pagado' },
] as const

type Method = (typeof METHODS)[number]['value']

function formatAmount(digits: string) {
  return digits ? Number(digits).toLocaleString('es-AR') : ''
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="status" className="text-sm font-extrabold text-foreground">
      {message}
    </p>
  )
}

function Select({
  id,
  value,
  onChange,
  invalid,
  children,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
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
 * Registrar un pago (admin inner page): a payment at the front desk, or a
 * fee forced as paid. It is paid right away.
 */
export default function RegisterPayment({ form: options }: { form: RegisterForm }) {
  const { students, months, defaults } = options

  const suggested = (userId: string, period: string) => {
    const amount = students.find((student) => String(student.id) === userId)?.amounts[period]
    return amount === undefined ? '' : String(amount)
  }

  const initialUser = defaults.userId ? String(defaults.userId) : ''
  const form = useForm({
    userId: initialUser,
    period: defaults.period,
    amount: suggested(initialUser, defaults.period),
    method: 'cash' as Method,
  })
  const errors = form.errors as Record<string, string | undefined>

  const student = students.find((item) => String(item.id) === form.data.userId)
  const alreadyPaid = Boolean(student?.paid.includes(form.data.period))
  const noPlan = Boolean(student) && student!.amounts[form.data.period] === undefined

  function pick(field: 'userId' | 'period', value: string) {
    const next = { ...form.data, [field]: value }
    form.setData({ ...next, amount: suggested(next.userId, next.period) })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.transform((data) => ({
      userId: data.userId ? Number(data.userId) : null,
      period: data.period,
      amount: data.amount === '' ? null : Number(data.amount),
      method: data.method,
    }))
    form.post('/admin/pagos')
  }

  return (
    <AdminInnerLayout
      title="Registrar un pago"
      subtitle="Queda pagado en el momento."
      backHref="/admin/pagos"
      dock={
        <Button
          type="submit"
          form="register-payment-form"
          disabled={form.processing || alreadyPaid || noPlan}
        >
          {form.processing ? 'Guardando…' : 'Registrar pago'}
        </Button>
      }
    >
      <form id="register-payment-form" className="mt-5 grid gap-4" onSubmit={submit} noValidate>
        <div className="grid gap-1.5">
          <label htmlFor="userId" className="text-sm font-extrabold">
            Persona
          </label>
          <Select
            id="userId"
            value={form.data.userId}
            onChange={(value) => pick('userId', value)}
            invalid={Boolean(errors.userId)}
          >
            <option value="" disabled>
              Elegí a la persona
            </option>
            {students.map((item) => (
              <option key={item.id} value={item.id}>
                {item.fullName}
              </option>
            ))}
          </Select>
          <FieldError message={errors.userId} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid content-start gap-1.5">
            <label htmlFor="period" className="text-sm font-extrabold">
              Mes
            </label>
            <Select
              id="period"
              value={form.data.period}
              onChange={(value) => pick('period', value)}
              invalid={Boolean(errors.period) || alreadyPaid || noPlan}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid content-start gap-1.5">
            <label htmlFor="amount" className="text-sm font-extrabold">
              Monto
            </label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatAmount(form.data.amount)}
              onChange={(event) =>
                form.setData('amount', event.target.value.replace(/\D/g, '').slice(0, 8))
              }
              aria-invalid={Boolean(errors.amount)}
              required
              className={fieldClass}
            />
          </div>
        </div>
        <FieldError
          message={
            alreadyPaid
              ? 'Esa cuota ya está pagada.'
              : noPlan
                ? 'Esa persona no tiene plan ese mes.'
                : (errors.period ?? errors.amount)
          }
        />

        <div className="grid gap-1.5">
          <label htmlFor="method" className="text-sm font-extrabold">
            Medio
          </label>
          <Select
            id="method"
            value={form.data.method}
            onChange={(value) => form.setData('method', value as Method)}
            invalid={Boolean(errors.method)}
          >
            {METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
          {form.data.method === 'forced' && (
            <p className="text-sm leading-snug font-bold text-muted-foreground">
              Queda pagada aunque no hayas cobrado.
            </p>
          )}
          <FieldError message={errors.method} />
        </div>
      </form>
    </AdminInnerLayout>
  )
}
