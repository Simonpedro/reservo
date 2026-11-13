import { Link } from '@adonisjs/inertia/react'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, Users } from 'lucide-react'
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

/**
 * The week URL, keeping the center filter.
 */
function weekQuery(week: string, center: string | null) {
  const query = new URLSearchParams({ semana: week })
  if (center) query.set('centro', center)
  return query.toString()
}

function weekHref(week: string, center: string | null) {
  return `/admin/agenda/semana?${weekQuery(week, center)}`
}

/**
 * Opens a schedule from the week; its "Volver" comes back to this week.
 */
function fromWeek(path: string, week: WeekView) {
  return `${path}?desde=semana&${weekQuery(week.start, week.center?.slug ?? null)}`
}

/**
 * The round arrow to the week before or after.
 */
function WeekArrow({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <Link
      href={href}
      preserveScroll
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-navy"
    >
      <Icon className="size-[22px]" strokeWidth={2.4} aria-hidden="true" />
    </Link>
  )
}

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
function WeekClassCard({ item, href }: { item: WeekClass; href: string }) {
  return (
    <Link
      href={href}
      viewTransition
      className={cn(
        'block rounded-[28px] px-4 pt-3.5 pb-3 text-navy no-underline transition-transform active:scale-[0.98]',
        WASH[item.activity.wash]
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none font-black tabular-nums">{item.startTime}</span>
        <h4 className="min-w-0 flex-1 text-lg leading-tight font-black tracking-[-0.035em]">
          {item.activity.name}
        </h4>
        <ChevronRight className="size-[18px] opacity-55" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="mt-1.5 grid gap-1">
        <Line icon={MapPin}>{`${item.centerName} · ${item.instructorName}`}</Line>
        <Line icon={Users}>{occupancyText(item.taken, item.capacity)}</Line>
      </div>
      {item.people.length > 0 ? (
        <ul className="mt-2.5 grid gap-1 border-t border-navy/12 pt-2.5 text-sm leading-tight font-bold">
          {item.people.map((person) => (
            <li key={person.userId}>{person.fullName}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 border-t border-navy/12 pt-2.5 text-sm leading-tight font-bold text-muted-foreground">
          Nadie con horario fijo esta semana.
        </p>
      )}
    </Link>
  )
}

/**
 * Agenda › Semana: one dated week (the Excel the center used to keep), with
 * arrows to the weeks before and after. On the phone, one section per day
 * with jump chips; on wide screens, one column per day.
 */
export default function AdminAgendaWeek({ week }: { week: WeekView }) {
  return (
    <AdminLayout
      tab="agenda"
      title="Agenda"
      wide
      dock={
        <Button asChild>
          <Link href={fromWeek('/admin/horarios/nuevo', week)}>
            <Plus strokeWidth={2.6} aria-hidden="true" />
            Nuevo horario
          </Link>
        </Button>
      }
    >
      <AgendaSwitch current="week" />

      <div className="mt-4 flex items-center gap-2">
        <WeekArrow
          href={weekHref(week.previous, week.center?.slug ?? null)}
          label="Semana anterior"
          icon={ChevronLeft}
        />
        <h2 className="min-w-0 flex-1 text-center text-lg leading-tight font-black tracking-[-0.035em]">
          {week.title}
        </h2>
        <WeekArrow
          href={weekHref(week.next, week.center?.slug ?? null)}
          label="Semana siguiente"
          icon={ChevronRight}
        />
      </div>

      {week.centers.length > 0 && (
        <nav aria-label="Centros" className="mt-4 flex flex-wrap gap-2">
          {[{ slug: null, name: 'Todas' }, ...week.centers].map((center) => {
            const selected = (week.center?.slug ?? null) === center.slug
            return (
              <Link
                key={center.slug ?? '*'}
                href={weekHref(week.start, center.slug)}
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
            ? `En ${week.center.name} no hay horarios activos. Probá con otro centro.`
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
                {`${day.short} ${day.day}`}
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
                  <h3
                    id={`dia-${day.weekday}-titulo`}
                    className="text-lg leading-none font-black tracking-[-0.035em]"
                  >
                    {day.name}
                  </h3>
                  <span className="text-sm font-bold text-muted-foreground">
                    {classesText(day.classes.length)}
                  </span>
                </div>
                {day.classes.length > 0 && (
                  <div className="grid gap-2.5">
                    {day.classes.map((item) => (
                      <WeekClassCard
                        key={item.scheduleId}
                        item={item}
                        href={fromWeek(`/admin/horarios/${item.scheduleId}`, week)}
                      />
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
