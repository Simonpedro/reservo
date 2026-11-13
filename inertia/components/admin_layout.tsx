import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AdminBottomNav, type AdminTab } from '~/components/admin_bottom_nav'
import { BackButton } from '~/components/back_button'
import { Dock, firstName, initials } from '~/components/client_layout'
import { cn } from '~/lib/utils'
import type { PageProps } from '~/types'

export function AdminLayout({
  tab,
  title,
  dock,
  children,
}: {
  tab: AdminTab
  title: string
  dock?: ReactNode
  children: ReactNode
}) {
  const { auth, tenant } = usePage<PageProps>().props

  return (
    <>
      <Head title={title} />
      <div
        className={cn(
          'mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-5 pt-3',
          dock ? 'pb-44' : 'pb-[104px]'
        )}
      >
        <header className="mb-2 flex min-h-12 items-center justify-between">
          <div>
            <p className="text-sm leading-none font-extrabold text-muted-foreground">
              {tenant?.name} · Admin
            </p>
            <p className="mt-0.5 text-lg leading-none font-black tracking-[-0.035em]">
              {`Hola, ${firstName(auth.user?.fullName)}`}
            </p>
          </div>
          <Link
            href="/admin/ajustes"
            aria-label="Abrir ajustes"
            className="grid size-12 place-items-center rounded-full bg-white p-0.5 shadow-[0_7px_18px_rgb(0_26_77/0.14)]"
          >
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-full bg-wash-celeste text-base font-black"
            >
              {initials(auth.user?.fullName)}
            </span>
          </Link>
        </header>
        <main>
          <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">{title}</h1>
          {children}
        </main>
      </div>
      {dock && <Dock>{dock}</Dock>}
      <AdminBottomNav active={tab} />
    </>
  )
}

export function AdminInnerLayout({
  title,
  backHref,
  dock,
  children,
}: {
  title: string
  backHref: string
  dock?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <Head title={title} />
      <main
        className={cn('mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3', dock ? 'pb-32' : 'pb-10')}
      >
        <div className="mb-3 min-h-12">
          <BackButton href={backHref} viewTransition />
        </div>
        <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">{title}</h1>
        {children}
      </main>
      {dock && <Dock withNav={false}>{dock}</Dock>}
    </>
  )
}
