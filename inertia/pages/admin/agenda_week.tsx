import { Link } from '@adonisjs/inertia/react'
import { CalendarDays, ChevronRight, MapPin, Plus, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { WeekClass, WeekView } from '#services/admin_week'
import { occupancyText } from '#services/places_text'
import { AdminLayout } from '~/components/admin_layout'
import { AgendaSwitch } from '~/components/agenda_switch'
import { EmptyState } from '~/components/empty_state'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const WASH = {
  green: 'bg-wash-green',
  celeste: 'bg-wash-celeste',
  blue: 'bg-wash-blue',
} as const

function classesText(count: number) {
  if (count === 0) return 'Sin horarios'
  return count === 1 ? '1 horario' : `${count} horarios`
}

/**
 * Like DetailLine, but it wraps: grid columns are narrow.
 */
function Line({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <p className="flex items-start gap-1.5 text-xs leading-tight font-extrabold">
      <Icon className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

/**
 * One weekly class with the names of its people. Opens the class to edit it.
 */
function WeekClassCard({ item }: { item: WeekClass }) {
  return (
    <Link
      href={`/admin/horarios/${item.scheduleId}?desde=semana`}
      viewTransition
      className={cn(
        'block rounded-[28px] px-4 pt-3.5 pb-3 text-navy no-underline transition-transform active:scale-[0.98]',
        WASH[item.activity.wash]
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none font-black tabular-nums">{item.startTime}</span>
        <h3 className="min-w-0 flex-1 text-lg leading-tight font-black tracking-[-0.035em]">
          {item.activity.name}
        </h3>
        <ChevronRight className="size-[18px] opacity-55" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="mt-1.5 grid gap-1">
        <Line icon={MapPin}>{`${item.centerName} · ${item.instructorName}`}</Line>
        <Line icon={Users}>{occupancyText(item.taken, item.capacity)}</Line>
      </div>
      {item.people.length > 0 ? (
        <ul className="mt-2.5 grid gap-1 border-t border-navy/12 pt-2.5 text-sm leading-tight font-bold">
          {item.people.map((person) => (
            <li key={person.userId}>
              {person.fullName}
              {person.note && <span className="text-muted-foreground">{` · ${person.note}`}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 border-t border-navy/12 pt-2.5 text-sm leading-tight font-bold text-muted-foreground">
          Nadie con horario fijo todavía.
        </p>
      )}
    </Link>
  )
}

/**
 * Agenda › Semana: the typical week (the Excel the center used to keep).
 * On the phone, one section per day with jump chips; on wide screens, one
 * column per day.
 */
export default function AdminAgendaWeek({ week }: { week: WeekView }) {
  return (
    <AdminLayout
      tab="agenda"
      title="Agenda"
      wide
      dock={
        <Button asChild>
          <Link href="/admin/horarios/nuevo?desde=semana">
            <Plus strokeWidth={2.6} aria-hidden="true" />
            Nuevo horario
          </Link>
        </Button>
      }
    >
      <AgendaSwitch current="week" />

      {week.centers.length > 0 && (
        <nav aria-label="Sedes" className="mt-4 flex flex-wrap gap-2">
          {[{ slug: null, name: 'Todas' }, ...week.centers].map((center) => {
            const selected = (week.center?.slug ?? null) === center.slug
            return (
              <Link
                key={center.slug ?? '*'}
                href={
                  center.slug
                    ? `/admin/agenda/semana?sede=${encodeURIComponent(center.slug)}`
                    : '/admin/agenda/semana'
                }
                preserveScroll
                replace
                aria-current={selected ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-full border-2 border-navy px-4 text-sm font-black text-navy no-underline',
                  selected && 'border-celeste bg-celeste'
                )}
              >
                {center.name}
              </Link>
            )
          })}
        </nav>
      )}

      {week.total === 0 ? (
        <EmptyState icon={CalendarDays} title="Todavía no hay horarios.">
          {week.center
            ? `En ${week.center.name} no hay horarios activos. Probá con otra sede.`
            : 'Creá el primero y acá vas a ver la semana con la gente de cada clase.'}
        </EmptyState>
      ) : (
        <>
          <nav
            aria-label="Ir al día"
            className="sticky top-0 z-10 -mx-5 mt-3 flex gap-1.5 overflow-x-auto bg-white px-5 py-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
          >
            {week.days.map((day) => (
              <a
                key={day.weekday}
                href={`#dia-${day.weekday}`}
                aria-label={`${day.name}: ${classesText(day.classes.length)}`}
                className={cn(
                  'grid min-h-11 min-w-12 flex-[0_0_auto] place-items-center rounded-full px-3 text-xs font-extrabold uppercase no-underline',
                  day.classes.length > 0 ? 'bg-wash-celeste text-navy' : 'text-navy/62'
                )}
              >
                {day.short}
              </a>
            ))}
          </nav>

          <div className="md:mt-5 md:grid md:auto-cols-[minmax(190px,1fr)] md:grid-flow-col md:gap-3 md:overflow-x-auto md:pb-2">
            {week.days.map((day) => (
              <section
                key={day.weekday}
                id={`dia-${day.weekday}`}
                aria-labelledby={`dia-${day.weekday}-titulo`}
                className="mt-5 scroll-mt-16 md:mt-0"
              >
                <div className="mb-2.5 flex items-baseline justify-between gap-2">
                  <h2
                    id={`dia-${day.weekday}-titulo`}
                    className="text-lg leading-none font-black tracking-[-0.035em]"
                  >
                    {day.name}
                  </h2>
                  <span className="text-sm font-bold text-muted-foreground">
                    {classesText(day.classes.length)}
                  </span>
                </div>
                {day.classes.length > 0 && (
                  <div className="grid gap-2.5">
                    {day.classes.map((item) => (
                      <WeekClassCard key={item.scheduleId} item={item} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
