import type { FormEvent } from 'react'
import { Head, useForm, usePage } from '@inertiajs/react'
import { TriangleAlert } from 'lucide-react'
import { Dock } from '~/components/client_layout'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'
import type { PageProps } from '~/types'

const inputClass =
  'min-h-12 w-full rounded-full border-2 border-transparent bg-input px-5 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * Three stacked chevrons drawn with the tenant colors, unless the tenant has
 * its own logo.
 */
function BrandMark({ logoUrl }: { logoUrl?: string }) {
  if (logoUrl) return <img src={logoUrl} alt="" className="h-[46px] w-[52px] object-contain" />
  const chevron = (y: number, color: string) => (
    <path
      d={`M6 ${y} 26 ${y - 16}l20 16`}
      fill="none"
      stroke={color}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
  return (
    <svg viewBox="0 0 52 46" className="h-[46px] w-[52px]" aria-hidden="true">
      {chevron(30, 'var(--green)')}
      {chevron(40, 'var(--celeste)')}
      {chevron(20, 'var(--blue)')}
    </svg>
  )
}

export default function Login() {
  const { tenant } = usePage<PageProps>().props
  const form = useForm({ email: '', password: '' })
  const errors = form.errors as Partial<Record<'email' | 'password' | 'credentials', string>>

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/login')
  }

  return (
    <>
      <Head title="Ingresar" />
      <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-5 pt-3 pb-40">
        <div className="mb-7 flex items-center gap-3">
          <BrandMark logoUrl={tenant?.theme?.logoUrl} />
          <div>
            <p className="text-[32px] leading-none font-black tracking-[-0.05em]">{tenant?.name}</p>
            <p className="mt-1 text-sm font-extrabold text-muted-foreground">
              Tus clases, con Reservo
            </p>
          </div>
        </div>
        <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">Ingresá</h1>
        {errors.credentials && (
          <Notice icon={TriangleAlert} title={errors.credentials} className="mt-4">
            Revisalos y probá de nuevo.
          </Notice>
        )}
        <form id="login-form" className="mt-1 grid gap-3.5" onSubmit={submit} noValidate>
          <div className="mt-3 grid gap-1.5">
            <label htmlFor="email" className="text-sm font-extrabold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              value={form.data.email}
              onChange={(event) => form.setData('email', event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              required
              className={inputClass}
            />
            {errors.email && (
              <p id="email-error" className="text-sm font-extrabold">
                {errors.email}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="password" className="text-sm font-extrabold">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.data.password}
              onChange={(event) => form.setData('password', event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              required
              className={inputClass}
            />
            {errors.password && (
              <p id="password-error" className="text-sm font-extrabold">
                {errors.password}
              </p>
            )}
          </div>
        </form>
        <p className="mt-5 text-sm leading-[1.35] font-bold text-muted-foreground">
          ¿Sos alumno? Entrá con el link que te mandó {tenant?.name}.
        </p>
      </main>
      <Dock withNav={false}>
        <Button form="login-form" type="submit" disabled={form.processing}>
          {form.processing ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </Dock>
    </>
  )
}
