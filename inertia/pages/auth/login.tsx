import type { FormEvent } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Head, useForm, usePage } from '@inertiajs/react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { PageProps } from '~/types'

export default function Login() {
  const { tenant } = usePage<PageProps>().props
  const form = useForm({ email: '', password: '' })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/login')
  }

  return (
    <>
      <Head title="Ingresar" />
      <main className="grid min-h-screen lg:grid-cols-2">
        <section className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">Ingresá a {tenant?.name}</CardTitle>
              <CardDescription>
                Usá el email y la contraseña de tu cuenta. Si sos alumno, entrá con el link que te
                mandó {tenant?.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.data.email}
                    onChange={(event) => form.setData('email', event.target.value)}
                    aria-invalid={Boolean(form.errors.email)}
                    required
                    autoFocus
                  />
                  {form.errors.email && (
                    <p className="text-sm text-destructive">{form.errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.data.password}
                    onChange={(event) => form.setData('password', event.target.value)}
                    aria-invalid={Boolean(form.errors.password)}
                    required
                  />
                  {form.errors.password && (
                    <p className="text-sm text-destructive">{form.errors.password}</p>
                  )}
                </div>
                <Button className="w-full" type="submit" disabled={form.processing}>
                  {form.processing ? 'Ingresando…' : 'Ingresar'}
                </Button>
              </form>
              <Button asChild variant="link" className="mt-4 w-full">
                <Link href="/">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
        <section className="hidden items-end bg-primary p-12 text-primary-foreground lg:flex">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] uppercase opacity-70">Reservo</p>
            <p className="mt-4 max-w-lg text-4xl font-semibold text-balance">
              Tu agenda y tu plan, siempre a mano.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
