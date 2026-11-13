import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { BottomNav, type ClientTab } from '~/components/bottom_nav'
import { cn } from '~/lib/utils'
import type { PageProps } from '~/types'

export function firstName(fullName: string | undefined) {
  return fullName?.trim().split(/\s+/)[0] ?? ''
}

export function initials(fullName: string | undefined) {
  const parts = fullName?.trim().split(/\s+/) ?? []
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * Primary action anchored at the bottom, over the tab bar when there is one.
 */
export function Dock({ children, withNav = true }: { children: ReactNode; withNav?: boolean }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 mx-auto grid w-full max-w-[430px] gap-1 bg-[linear-gradient(rgb(255_255_255/0),#fff_22px)] px-5 pt-5',
        withNav ? 'pb-[100px]' : 'pb-7'
      )}
    >
      {children}
    </div>
  )
}

/**
 * Student tab screens: greeting with the avatar (opens Perfil), the screen
 * title, content, an optional docked action and the tab bar.
 */
export function ClientLayout({
  tab,
  title,
  dock,
  tallDock = false,
  children,
}: {
  tab: ClientTab
  title: string
  dock?: ReactNode
  /**
   * The dock carries a notice above its button.
   */
  tallDock?: boolean
  children: ReactNode
}) {
  const { auth } = usePage<PageProps>().props
  const name = auth.user?.fullName

  return (
    <>
      <Head title={title} />
      <div
        className={cn(
          'mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-5 pt-3',
          dock ? (tallDock ? 'pb-64' : 'pb-44') : 'pb-[104px]'
        )}
      >
        <header className="mb-2 flex min-h-12 items-center justify-between">
          <div>
            <p className="text-sm leading-none font-extrabold text-muted-foreground">¡Buenas,</p>
            <p className="mt-0.5 text-lg leading-none font-black tracking-[-0.035em]">
              {firstName(name)}!
            </p>
          </div>
          <Link
            route="client.profile"
            aria-label="Abrir perfil"
            className="grid size-12 place-items-center rounded-full bg-white p-0.5 shadow-[0_7px_18px_rgb(0_26_77/0.14)]"
          >
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-full bg-wash-celeste text-base font-black"
            >
              {initials(name)}
            </span>
          </Link>
        </header>
        <main>
          <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">{title}</h1>
          {children}
        </main>
      </div>
      {dock && <Dock>{dock}</Dock>}
      <BottomNav active={tab} />
    </>
  )
}
