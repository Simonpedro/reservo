import { Link } from '@adonisjs/inertia/react'
import { CalendarOff, ChevronRight, Clock, MapPin, Ticket } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { ClassCardData } from '#services/my_classes'
import { DetailLine } from '~/components/info_line'
import { cn } from '~/lib/utils'

const WASH = {
  green: 'bg-wash-green',
  celeste: 'bg-wash-celeste',
  blue: 'bg-wash-blue',
} as const

/**
 * Cut-out sizes per photo, tuned in the prototype (app.css › .cutout).
 */
const CUTOUT: Record<string, string> = {
  yoga: '-right-[7px] w-[152px] h-[136px]',
  gimnasio: 'right-[3px] w-[120px] h-[140px]',
}

const HERO_CUTOUT: Record<string, string> = {
  yoga: '-right-2 bottom-0 w-[172px] h-[188px]',
  gimnasio: 'right-1 -bottom-2 w-[148px] h-[200px]',
}

function photoName(image: string | null) {
  return image?.split('/').pop()?.split('.')[0] ?? ''
}

export function cutoutClass(image: string | null) {
  return CUTOUT[photoName(image)] ?? '-right-[5px] w-[150px] h-[140px]'
}

export function heroCutoutClass(image: string | null) {
  return HERO_CUTOUT[photoName(image)] ?? '-right-1.5 -bottom-2 w-[178px] h-[200px]'
}

const RETURN_KEY = 'reservo:return-class'

/**
 * Called when leaving a class detail, so the matching card on the list takes
 * the shared transition names and the hero morphs back into it.
 */
export function rememberReturn(returnKey: string) {
  sessionStorage.setItem(RETURN_KEY, returnKey)
}

function takeReturn(returnKey: string) {
  if (typeof sessionStorage === 'undefined') return false
  if (sessionStorage.getItem(RETURN_KEY) !== returnKey) return false
  sessionStorage.removeItem(RETURN_KEY)
  return true
}

/**
 * Names shared with the class detail hero so the card morphs into it.
 */
export const TRANSITION_NAMES = {
  background: 'clase-fondo',
  title: 'clase-titulo',
  photo: 'clase-foto',
} as const

function markForTransition(card: HTMLElement) {
  const set = (selector: string, name: string) => {
    const element = card.querySelector<HTMLElement>(selector)
    if (element) element.style.viewTransitionName = name
  }
  card.style.viewTransitionName = TRANSITION_NAMES.background
  set('[data-card-title]', TRANSITION_NAMES.title)
  set('[data-card-photo]', TRANSITION_NAMES.photo)
}

/**
 * What every card shows. Bookings add their source and suspension.
 */
export type CardFace = Pick<
  ClassCardData,
  'activity' | 'dayLabel' | 'startTime' | 'instructorName' | 'centerName'
> &
  Partial<Pick<ClassCardData, 'source' | 'suspended' | 'suspensionReason'>>

/**
 * The one class card, for students and admins: wash by activity, photo that
 * overflows, information lines. The whole card opens the class detail.
 */
export function ClassCard({
  card,
  href,
  returnKey,
  lines,
}: {
  card: CardFace
  href: string
  /**
   * Identifies the card when coming back from its detail (see rememberReturn).
   */
  returnKey: string
  /**
   * Replaces the default lines (admins and Elegir clase show places instead).
   */
  lines?: ReactNode
}) {
  const [returning, setReturning] = useState(() => takeReturn(returnKey))
  useEffect(() => {
    if (!returning) return
    const timer = setTimeout(() => setReturning(false), 800)
    return () => clearTimeout(timer)
  }, [returning])
  const names = (name: string) => (returning ? { viewTransitionName: name } : undefined)

  return (
    <Link
      href={href}
      viewTransition
      onClick={(event) => markForTransition(event.currentTarget as HTMLElement)}
      style={names(TRANSITION_NAMES.background)}
      className={cn(
        'relative isolate block min-h-32 w-full overflow-visible rounded-[34px] py-3.5 pr-[142px] pb-3 pl-4 text-left text-navy no-underline transition-transform active:scale-[0.97]',
        card.suspended ? 'bg-wash-navy' : WASH[card.activity.wash]
      )}
    >
      <div className="flex items-center gap-1">
        <h3
          data-card-title
          style={names(TRANSITION_NAMES.title)}
          className="w-fit text-[22px] leading-[0.98] font-black tracking-[-0.045em]"
        >
          {card.activity.name}
        </h3>
        <ChevronRight className="size-[18px] opacity-55" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="mt-[7px] grid gap-[5px]">
        {lines ?? (
          <>
            <DetailLine icon={Clock}>
              {`${card.dayLabel} · ${card.startTime} · ${card.instructorName}`}
            </DetailLine>
            <DetailLine icon={MapPin}>{card.centerName}</DetailLine>
            {card.suspended ? (
              <DetailLine icon={CalendarOff}>
                {`Suspendida · ${card.suspensionReason ?? 'Sin clase'}`}
              </DetailLine>
            ) : card.source === 'pending' ? (
              <DetailLine icon={Ticket}>Con tu clase pendiente</DetailLine>
            ) : null}
          </>
        )}
      </div>
      {card.activity.image && (
        <img
          data-card-photo
          style={names(TRANSITION_NAMES.photo)}
          src={card.activity.image}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            'pointer-events-none absolute drop-shadow-[0_12px_10px_rgb(0_26_77/0.14)] -bottom-[5px] z-[3] object-contain object-right-bottom',
            cutoutClass(card.activity.image),
            card.suspended && 'grayscale opacity-55'
          )}
        />
      )}
    </Link>
  )
}
