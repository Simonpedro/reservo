import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { CalendarDays, CalendarX, CircleAlert, CircleCheck, Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { AgendaClosure, AgendaView } from '#services/admin_agenda'
import { AdminLayout } from '~/components/admin_layout'
import { AgendaSwitch } from '~/components/agenda_switch'
import { AdminSessionCard } from '~/components/admin_session_card'
import { EmptyState } from '~/components/empty_state'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

/**
 * "Cerrado por feriado." or "Mendoza cerrado: Pintura del salón."
 */
export function closedTitle(closure: AgendaClosure) {
  const reason = closure.reason.trim().replace(/\.$/, '')
  const subject = closure.centerName ? `${closure.centerName} cerrado` : 'Cerrado'
  return /^feriado/i.test(reason)
    ? `${subject} por ${reason.charAt(0).toLowerCase()}${reason.slice(1)}.`
    : `${subject}: ${reason}.`
}

function closedText(closure: AgendaClosure) {
  return closure.centerName
    ? `Las clases de ${closure.centerName} de este día están suspendidas y cada persona tiene una clase pendiente.`
    : 'Las clases de este día están suspendidas y cada persona tiene una clase pendiente.'
}

/**
 * Agenda: two weeks of days and the classes of the selected one, with how
 * many places are taken, and the way to close the day.
 */
export default function AdminAgenda({ view }: { view: AgendaView }) {
  const flash = usePage().flash as { success?: string; error?: string } | undefined
  const strip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    strip.current
      ?.querySelector('[aria-current="date"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [view.selected])

  return (
    <AdminLayout
      tab="agenda"
      title="Agenda"
      dock={
        <Button asChild>
          <Link href={`/admin/horarios/nuevo?dia=${view.weekday}`}>
            <Plus strokeWidth={2.6} aria-hidden="true" />
            Nuevo horario
          </Link>
        </Button>
      }
    >
      <AgendaSwitch current="day" />
      <nav
        ref={strip}
        aria-label="Días"
        className="-mx-5 mt-4 mb-2 flex gap-1 overflow-x-auto px-5 pt-1 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {view.days.map((day) => {
          const isSelected = day.date === view.selected
          return (
            <Link
              key={day.date}
              href={`/admin/agenda?fecha=${day.date}`}
              preserveScroll
              replace
              aria-current={isSelected ? 'date' : undefined}
              aria-label={day.label}
              className={cn(
                'flex h-[58px] flex-[0_0_46px] flex-col items-center justify-center gap-[3px] rounded-full text-navy/68 no-underline',
                isSelected && 'bg-celeste text-navy shadow-[0_7px_14px_rgb(90_184_240/0.28)]'
              )}
            >
              <span className="text-xs leading-none font-extrabold uppercase">{day.weekday}</span>
              <strong className="text-[15px] leading-none font-black">{day.day}</strong>
            </Link>
          )
        })}
      </nav>

      {flash?.success && <Notice icon={CircleCheck} title={flash.success} className="mt-3" />}
      {flash?.error && <Notice icon={CircleAlert} title={flash.error} className="mt-3" />}

      <section aria-labelledby="dia-agenda">
        <h2
          id="dia-agenda"
          className="mt-[18px] mb-3 text-lg leading-none font-black tracking-[-0.035em]"
        >
          {view.title}
        </h2>
        {view.closures.length > 0 && (
          <div className="mb-3 grid gap-3">
            {view.closures.map((closure) => (
              <Notice key={closure.centerName ?? '*'} icon={CalendarX} title={closedTitle(closure)}>
                {closedText(closure)}
              </Notice>
            ))}
          </div>
        )}
        {view.classes.length > 0 ? (
          <div className="grid gap-2.5">
            {view.classes.map((card) => (
              <AdminSessionCard key={card.sessionId} card={card} />
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarDays} title="Este día no hay clases.">
            Podés crear un horario nuevo.
          </EmptyState>
        )}
      </section>

      {!view.closedEverywhere && view.classes.length > 0 && (
        <div className="mt-6 grid">
          <Button asChild variant="link" className="h-auto min-h-12 whitespace-normal">
            <Link href={`/admin/agenda/cerrar?fecha=${view.selected}`}>
              {`Cerrar el ${view.dayName} (feriado o cierre)`}
            </Link>
          </Button>
        </div>
      )}
    </AdminLayout>
  )
}
