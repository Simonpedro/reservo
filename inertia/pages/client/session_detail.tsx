import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import { CircleAlert, Clock, MapPin, User, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { SessionDetailView } from '#services/choose_class'
import { ClassHero } from '~/components/class_hero'
import { Dock } from '~/components/client_layout'
import { InfoLine } from '~/components/info_line'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { spotsText } from '~/pages/client/choose_class'
import type { PageProps } from '~/types'

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * A class opened from Elegir clase: "Usar clase pendiente" when it has room,
 * otherwise only the explanation.
 */
export default function SessionDetail({ detail }: { detail: SessionDetailView }) {
  const { card } = detail
  const error = (usePage<PageProps>().flash as { error?: string } | undefined)?.error
  const heading = useRef<HTMLHeadingElement>(null)
  const full = card.freeSpots === 0

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  return (
    <>
      <Head title={card.activity.name} />
      <main
        className={cn('mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3', full ? 'pb-10' : 'pb-36')}
      >
        <ClassHero
          ref={heading}
          activity={card.activity}
          backHref={`/elegir-clase?dia=${card.date}`}
          returnKey={`session-${card.sessionId}`}
        />
        {error && !full && (
          <div className="relative z-[2] mt-4 pl-0.5">
            <Notice icon={CircleAlert} title={error} />
          </div>
        )}
        <div className="relative z-[2] mt-4 grid gap-2.5">
          <InfoLine icon={Clock}>{`${capitalize(detail.dayName)} · ${card.startTime}`}</InfoLine>
          <InfoLine icon={User}>{card.instructorName}</InfoLine>
          <InfoLine icon={MapPin}>{card.centerName}</InfoLine>
          <InfoLine icon={Users}>{spotsText(card.freeSpots)}</InfoLine>
          {full && (
            <p className="text-base leading-[1.35] font-bold text-navy/78">
              Esta clase ya no tiene lugares libres. Probá otro horario.
            </p>
          )}
        </div>
        {!full && (
          <Dock withNav={false}>
            <Button asChild>
              <Link
                route="client.choose.store"
                routeParams={{ id: card.sessionId }}
                method="post"
                as="button"
              >
                Usar clase pendiente
              </Link>
            </Button>
          </Dock>
        )}
      </main>
    </>
  )
}
