import { Head } from '@inertiajs/react'
import { CalendarOff, Clock, MapPin, Repeat, Ticket, User } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ClassCardData } from '#services/my_classes'
import { BackButton } from '~/components/back_button'
import { heroCutoutClass, rememberReturn, TRANSITION_NAMES } from '~/components/class_card'
import { InfoLine } from '~/components/info_line'
import { cn } from '~/lib/utils'

const WASH = {
  green: 'bg-wash-green',
  celeste: 'bg-wash-celeste',
  blue: 'bg-wash-blue',
} as const

export default function ClassDetail({ card }: { card: ClassCardData }) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  return (
    <>
      <Head title={card.activity.name} />
      <main className="mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3 pb-10">
        <article
          style={{ viewTransitionName: TRANSITION_NAMES.background }}
          className={cn(
            'relative isolate mb-2.5 min-h-[214px] overflow-visible rounded-[34px] px-4 pt-2 pb-5 text-navy',
            card.suspended ? 'bg-wash-navy' : WASH[card.activity.wash]
          )}
        >
          <div onClickCapture={() => rememberReturn(card.bookingId)}>
            <BackButton href="/clases" viewTransition />
          </div>
          <h1
            ref={heading}
            tabIndex={-1}
            style={{ viewTransitionName: TRANSITION_NAMES.title }}
            className="mt-[18px] w-fit max-w-[calc(100%-150px)] text-[32px] leading-[0.95] font-black tracking-[-0.045em] outline-none"
          >
            {card.activity.name}
          </h1>
          {card.activity.image && (
            <img
              src={card.activity.image}
              alt=""
              style={{ viewTransitionName: TRANSITION_NAMES.photo }}
              className={cn(
                'pointer-events-none absolute z-[3] object-contain object-right-bottom drop-shadow-[0_12px_10px_rgb(0_26_77/0.14)]',
                heroCutoutClass(card.activity.image),
                card.suspended && 'opacity-55 grayscale'
              )}
            />
          )}
        </article>
        <div className="relative z-[2] mt-2 grid gap-2.5">
          <InfoLine icon={Clock}>{`${card.dayLabel} · ${card.startTime}`}</InfoLine>
          <InfoLine icon={User}>{card.instructorName}</InfoLine>
          <InfoLine icon={MapPin}>{card.centerName}</InfoLine>
          {card.suspended ? (
            <InfoLine icon={CalendarOff}>
              {`Suspendida · ${card.suspensionReason ?? 'Sin clase'}`}
            </InfoLine>
          ) : card.source === 'pending' ? (
            <InfoLine icon={Ticket}>Con tu clase pendiente</InfoLine>
          ) : (
            <InfoLine icon={Repeat}>Tu horario fijo</InfoLine>
          )}
        </div>
      </main>
    </>
  )
}
