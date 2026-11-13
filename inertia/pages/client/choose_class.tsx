import { Head } from '@inertiajs/react'
import { CalendarClock } from 'lucide-react'
import { BackButton } from '~/components/back_button'
import { EmptyState } from '~/components/empty_state'

/**
 * Placeholder for "Elegir clase" (inner page, opened from the pending notice).
 */
export default function ChooseClass() {
  return (
    <>
      <Head title="Elegir clase" />
      <main className="mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3 pb-10">
        <div className="mb-3 flex min-h-12 items-center">
          <BackButton href="/clases" />
        </div>
        <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">Elegir clase</h1>
        <EmptyState icon={CalendarClock} title="Muy pronto.">
          Estamos terminando esta sección. Tu clase pendiente te espera hasta que venza.
        </EmptyState>
      </main>
    </>
  )
}
