import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import {
  Ban,
  CalendarOff,
  Check,
  CircleAlert,
  Clock,
  Info,
  MapPin,
  Repeat,
  Ticket,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ClassDetailView } from '#services/my_classes'
import { BottomSheet } from '~/components/bottom_sheet'
import { ClassHero } from '~/components/class_hero'
import { Dock } from '~/components/client_layout'
import { InfoLine } from '~/components/info_line'
import { Notice } from '~/components/notice'
import { ChooseClassButton, pendingCountText } from '~/components/pending_notice'
import { Button } from '~/components/ui/button'
import { WhatsappButton } from '~/components/whatsapp_button'
import { cn } from '~/lib/utils'
import type { PageProps } from '~/types'

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function ClassDetail({
  detail,
  justCancelled,
  justBooked,
}: {
  detail: ClassDetailView
  justCancelled: boolean
  /**
   * Just booked with a pending class from Elegir clase.
   */
  justBooked: boolean
}) {
  const { card, state, pending } = detail
  const page = usePage<PageProps>()
  const tenantName = page.props.tenant?.name ?? 'tu centro'
  const error = (page.flash as { error?: string } | undefined)?.error
  const heading = useRef<HTMLHeadingElement>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  const cancelled = state === 'cancelled'
  const suspended = state === 'suspended'

  let notice = null
  if (error) {
    notice = <Notice icon={CircleAlert} title={error} />
  } else if (justBooked && state !== 'cancelled') {
    notice = (
      <Notice
        icon={Check}
        title="Listo, ya tenés tu lugar."
        action={
          state === 'cancellable' && (
            <Button asChild variant="link" className="-my-2.5 h-11 px-0">
              <Link
                route="client.classes.cancel"
                routeParams={{ id: card.bookingId }}
                method="post"
                data={{ volver: 'elegir' }}
                as="button"
              >
                Deshacer
              </Link>
            </Button>
          )
        }
      />
    )
  } else if (cancelled && justCancelled) {
    notice = (
      <Notice
        icon={Check}
        title={`Listo, no vas el ${detail.dayName}.`}
        action={
          detail.gavePending && (
            <Button asChild variant="link" className="-my-2.5 h-11 px-0">
              <Link
                route="client.classes.undo"
                routeParams={{ id: card.bookingId }}
                method="post"
                as="button"
                preserveScroll
              >
                Deshacer
              </Link>
            </Button>
          )
        }
      >
        {pending
          ? `${pendingCountText(pending.count)} hasta el ${pending.expiresLabel}.`
          : undefined}
      </Notice>
    )
  } else if (state === 'too_late') {
    notice = (
      <Notice icon={Info} title="Faltan menos de 24 h.">
        {`Desde la app ya no se puede cancelar. Si no podés venir, avisale a ${tenantName}.`}
      </Notice>
    )
  }

  let stateLine
  if (cancelled) stateLine = <InfoLine icon={Ban}>No vas esta vez</InfoLine>
  else if (suspended) {
    stateLine = (
      <InfoLine
        icon={CalendarOff}
      >{`Suspendida · ${card.suspensionReason ?? 'Sin clase'}`}</InfoLine>
    )
  } else if (card.source === 'pending') {
    stateLine = <InfoLine icon={Ticket}>Con tu clase pendiente</InfoLine>
  } else stateLine = <InfoLine icon={Repeat}>Tu horario fijo</InfoLine>

  let copy = null
  if (state === 'cancellable' && !justBooked) {
    copy = 'Si no podés venir, avisá con 24 h o más y te queda una clase pendiente para otro día.'
  } else if (suspended) {
    copy = detail.gavePending
      ? `Ese día no hay clase. Te dimos una clase pendiente para usar hasta el ${detail.expiresLabel}.`
      : 'Ese día no hay clase.'
  }

  let dock = null
  if (justBooked) {
    dock = null
  } else if (state === 'cancellable') {
    dock = (
      <Button type="button" onClick={() => setConfirming(true)}>
        No voy a ir
      </Button>
    )
  } else if (state === 'too_late') {
    dock = <WhatsappButton />
  } else if ((cancelled || suspended) && pending) {
    dock = <ChooseClassButton />
  }

  return (
    <>
      <Head title={card.activity.name} />
      <main
        className={cn('mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3', dock ? 'pb-36' : 'pb-10')}
      >
        <ClassHero
          ref={heading}
          activity={card.activity}
          backHref="/clases"
          returnKey={`booking-${card.bookingId}`}
          muted={suspended}
        />
        {notice && <div className="relative z-[2] mt-4 pl-0.5">{notice}</div>}
        <div className="relative z-[2] mt-4 grid gap-2.5">
          <InfoLine icon={Clock}>{`${capitalize(detail.dayName)} · ${card.startTime}`}</InfoLine>
          <InfoLine icon={User}>{card.instructorName}</InfoLine>
          <InfoLine icon={MapPin}>{card.centerName}</InfoLine>
          {stateLine}
          {copy && <p className="text-base leading-[1.35] font-bold text-navy/78">{copy}</p>}
        </div>
      </main>
      {dock && <Dock withNav={false}>{dock}</Dock>}
      {state === 'cancellable' && (
        <BottomSheet
          open={confirming}
          onClose={() => setConfirming(false)}
          title={`¿No vas el ${detail.dayName}?`}
          action={
            <Button asChild>
              <Link
                route="client.classes.cancel"
                routeParams={{ id: card.bookingId }}
                method="post"
                as="button"
                preserveScroll
                onSuccess={() => setConfirming(false)}
              >
                Sí, no voy
              </Link>
            </Button>
          }
        >
          {`Liberamos tu lugar y te damos una clase pendiente para usar hasta el ${detail.expiresLabel}. Tu horario fijo sigue igual.`}
        </BottomSheet>
      )}
    </>
  )
}
