import { Head, router, usePage } from '@inertiajs/react'
import { CalendarDays, CalendarOff, CircleAlert, Clock, MapPin, Ticket, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ChooseClassView } from '#services/choose_class'
import { BackButton } from '~/components/back_button'
import { ClassCard } from '~/components/class_card'
import { EmptyState } from '~/components/empty_state'
import { DetailLine } from '~/components/info_line'
import { Notice } from '~/components/notice'
import { activitiesText, pendingCountText } from '~/components/pending_notice'
import { cn } from '~/lib/utils'
import type { PageProps } from '~/types'

export function spotsText(free: number) {
  if (free === 0) return 'Cupo completo'
  return free === 1 ? '1 lugar libre' : `${free} lugares libres`
}

function Title() {
  return (
    <>
      <Head title="Elegir clase" />
      <div className="mb-3 flex min-h-12 items-center">
        <BackButton href="/clases" />
      </div>
      <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">Elegir clase</h1>
    </>
  )
}

/**
 * Elegir clase (inner page, opened from the pending notice): the days until
 * the pending class expires and the classes it can be used in.
 */
export default function ChooseClass({ view }: { view: ChooseClassView }) {
  const page = usePage<PageProps>()
  const center = page.props.tenant?.name ?? 'el centro'
  const error = (page.flash as { error?: string } | undefined)?.error
  const strip = useRef<HTMLDivElement>(null)
  const selected = view.state === 'ready' ? view.selected : null

  useEffect(() => {
    strip.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [selected])

  if (view.state === 'none') {
    return (
      <main className="mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3 pb-10">
        <Title />
        {error && <Notice icon={CircleAlert} title={error} className="mt-4" />}
        <EmptyState icon={Ticket} title="No tenés clases pendientes.">
          Cuando no puedas ir a una clase y avises a tiempo, acá vas a poder elegir otra.
        </EmptyState>
      </main>
    )
  }

  const { pending, days } = view
  const day = days.find((option) => option.date === view.selected) ?? days[0]
  const classes = view.classes.filter((card) => card.date === day.date)

  const select = (date: string) =>
    router.replace({
      url: `/elegir-clase?dia=${date}`,
      props: (props) => ({ ...props, view: { ...view, selected: date } }),
      preserveState: true,
      preserveScroll: true,
    })

  let list
  if (day.closed) {
    list = (
      <EmptyState icon={CalendarOff} title={`Ese día ${center} está cerrado.`}>
        Probá otro día.
      </EmptyState>
    )
  } else if (classes.length === 0) {
    list = (
      <EmptyState icon={CalendarDays} title="Este día no hay clases para tu clase pendiente.">
        Probá otro día.
      </EmptyState>
    )
  } else {
    list = (
      <section aria-labelledby="clases-del-dia">
        <h2 id="clases-del-dia" className="mt-[18px] mb-2 text-lg font-black tracking-[-0.035em]">
          {`Clases del ${day.label}`}
        </h2>
        <div className="grid gap-2.5">
          {classes.map((card) => (
            <ClassCard
              key={card.sessionId}
              card={card}
              href={`/elegir-clase/${card.sessionId}`}
              returnKey={`session-${card.sessionId}`}
              lines={
                <>
                  <DetailLine
                    icon={Clock}
                  >{`${card.startTime} · ${card.instructorName}`}</DetailLine>
                  <DetailLine icon={MapPin}>{card.centerName}</DetailLine>
                  <DetailLine icon={Users}>{spotsText(card.freeSpots)}</DetailLine>
                </>
              }
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3 pb-10">
      <Title />
      <p className="mt-1.5 text-sm leading-[1.3] font-bold text-navy/72">
        {`${pendingCountText(pending.count)}. ${activitiesText(pending.activities)} Usala hasta el ${pending.expiresLabel}.`}
      </p>
      {error && <Notice icon={CircleAlert} title={error} className="mt-4" />}
      <div
        ref={strip}
        role="group"
        aria-label="Días"
        className="-mx-5 mt-1 mb-2 flex gap-1 overflow-x-auto px-5 pt-1 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((option) => {
          const isSelected = option.date === day.date
          return (
            <button
              key={option.date}
              type="button"
              aria-pressed={isSelected}
              aria-label={option.label}
              onClick={() => select(option.date)}
              className={cn(
                'flex h-[58px] flex-[0_0_46px] flex-col items-center justify-center gap-[3px] rounded-full text-navy/68',
                isSelected && 'bg-celeste text-navy shadow-[0_7px_14px_rgb(90_184_240/0.28)]'
              )}
            >
              <span className="text-xs leading-none font-extrabold uppercase">
                {option.weekday}
              </span>
              <strong className="text-[15px] leading-none font-black">{option.day}</strong>
            </button>
          )
        })}
      </div>
      {list}
    </main>
  )
}
