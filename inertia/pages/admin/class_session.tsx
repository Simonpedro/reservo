import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import {
  CalendarOff,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  MapPin,
  User,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AdminSessionView, Attendee } from '#services/admin_classes'
import { BottomSheet } from '~/components/bottom_sheet'
import { ClassHero } from '~/components/class_hero'
import { InfoLine } from '~/components/info_line'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'
import type { PageProps } from '~/types'
import { occupancyText } from '#services/places_text'

function peopleText(count: number) {
  return count === 1
    ? 'La persona anotada recibe una clase pendiente. Lo ve en la app.'
    : `Las ${count} personas anotadas reciben una clase pendiente. Lo ven en la app.`
}

function AttendeeRow({
  attendee,
  interactive,
  onSelect,
}: {
  attendee: Attendee
  interactive: boolean
  onSelect: () => void
}) {
  const absent = attendee.status === 'absent'
  const inner = (
    <>
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-wash-celeste text-sm font-black"
      >
        {attendee.initials}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-base leading-tight font-black">{attendee.fullName}</strong>
        {absent ? (
          <span className="mt-0.5 block text-sm leading-tight font-black">
            Ausente · tiene clase pendiente
          </span>
        ) : (
          <span className="mt-0.5 block text-sm leading-tight font-bold text-muted-foreground">
            {attendee.source === 'pending' ? 'Clase pendiente' : 'Horario fijo'}
          </span>
        )}
      </span>
    </>
  )
  const row = 'flex min-h-[60px] w-full items-center gap-3 border-b border-border py-2.5 text-left'

  if (!interactive || absent) return <li className={row}>{inner}</li>
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${attendee.fullName}, marcar ausente`}
        className={row}
      >
        {inner}
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          strokeWidth={2.3}
          aria-hidden="true"
        />
      </button>
    </li>
  )
}

export default function AdminClassSession({ view }: { view: AdminSessionView }) {
  const { card, attendees, justAbsent } = view
  const page = usePage<PageProps>()
  const error = (page.flash as { error?: string } | undefined)?.error
  const heading = useRef<HTMLHeadingElement>(null)
  // The selected person stays while the sheet closes, so its title does not blink.
  const [absentFor, setAbsentFor] = useState<Attendee | null>(null)
  const [askingAbsent, setAskingAbsent] = useState(false)
  const [suspending, setSuspending] = useState(false)
  const base = `/admin/clases/${card.sessionId}`

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  let notice = null
  if (error) {
    notice = <Notice icon={CircleAlert} title={error} />
  } else if (justAbsent) {
    notice = (
      <Notice
        icon={Check}
        title={`Marcamos ausente a ${justAbsent.fullName}.`}
        action={
          <Button asChild variant="link" className="-my-2.5 h-11 px-0">
            <Link
              href={`${base}/reservas/${justAbsent.bookingId}/deshacer`}
              method="post"
              as="button"
              preserveScroll
            >
              Deshacer
            </Link>
          </Button>
        }
      >
        {`Tiene una clase pendiente hasta el ${justAbsent.expiresLabel}.`}
      </Notice>
    )
  }

  return (
    <>
      <Head title={card.activity.name} />
      <main className="mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3 pb-10">
        <ClassHero
          ref={heading}
          activity={card.activity}
          backHref={card.dayLabel === 'Hoy' ? '/admin/hoy' : `/admin/agenda?fecha=${card.date}`}
          returnKey={`admin-session-${card.sessionId}`}
          muted={card.suspended}
        />
        {notice && <div className="relative z-[2] mt-4 pl-0.5">{notice}</div>}
        <div className="relative z-[2] mt-4 grid gap-2.5">
          <InfoLine icon={Clock}>{`${view.longDay} · ${card.startTime}`}</InfoLine>
          <InfoLine icon={User}>{card.instructorName}</InfoLine>
          <InfoLine icon={MapPin}>{card.centerName}</InfoLine>
          {card.suspended ? (
            <InfoLine icon={CalendarOff}>
              {`Suspendida · ${card.suspensionReason ?? 'Sin clase'}`}
            </InfoLine>
          ) : (
            <InfoLine icon={Users}>{occupancyText(card.taken, card.capacity)}</InfoLine>
          )}
        </div>

        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Anotados</h2>
          {!card.suspended && attendees.length > 0 && (
            <p className="mt-2 text-base leading-[1.35] font-bold text-muted-foreground">
              Si alguien avisa que no viene, tocalo para marcarlo ausente.
            </p>
          )}
          {attendees.length > 0 ? (
            <ul className="mt-1.5 grid">
              {attendees.map((attendee) => (
                <AttendeeRow
                  key={attendee.bookingId}
                  attendee={attendee}
                  interactive={!card.suspended}
                  onSelect={() => {
                    setAbsentFor(attendee)
                    setAskingAbsent(true)
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-base leading-[1.35] font-bold text-muted-foreground">
              Todavía no hay nadie anotado.
            </p>
          )}
        </section>

        <div className="mt-6 grid gap-1">
          {!card.suspended && (
            <Button type="button" variant="link" onClick={() => setSuspending(true)}>
              Suspender esta clase
            </Button>
          )}
          <Button asChild variant="link">
            <Link href={`/admin/horarios/${card.scheduleId}`}>Editar esta clase</Link>
          </Button>
        </div>
      </main>

      {!card.suspended && (
        <>
          <BottomSheet
            open={askingAbsent}
            onClose={() => setAskingAbsent(false)}
            title={`¿Marcamos ausente a ${absentFor?.fullName ?? ''}?`}
            action={
              <Button asChild>
                <Link
                  href={`${base}/reservas/${absentFor?.bookingId}/ausente`}
                  method="post"
                  as="button"
                  preserveScroll
                  onSuccess={() => setAskingAbsent(false)}
                >
                  Marcar ausente
                </Link>
              </Button>
            }
          >
            {`Le damos una clase pendiente para usar hasta el ${view.expiresLabel}. Si la clase todavía no pasó, se libera su lugar.`}
          </BottomSheet>
          <BottomSheet
            open={suspending}
            onClose={() => setSuspending(false)}
            title={`¿Suspendemos ${card.activity.name} del ${view.dayName}?`}
            action={
              <Button asChild>
                <Link
                  href={`${base}/suspender`}
                  method="post"
                  as="button"
                  preserveScroll
                  onSuccess={() => setSuspending(false)}
                >
                  Suspender clase
                </Link>
              </Button>
            }
          >
            {card.taken === 0
              ? 'No hay nadie anotado. La clase queda suspendida en la app.'
              : peopleText(card.taken)}
          </BottomSheet>
        </>
      )}
    </>
  )
}
