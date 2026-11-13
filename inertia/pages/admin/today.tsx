import { Link } from '@adonisjs/inertia/react'
import { CalendarDays, CalendarX, ChevronRight, CreditCard, Repeat } from 'lucide-react'
import type { AdminAlert, AdminTodayView } from '#services/admin_classes'
import { AdminLayout } from '~/components/admin_layout'
import { AdminSessionCard } from '~/components/admin_session_card'
import { EmptyState } from '~/components/empty_state'
import { usePage } from '@inertiajs/react'
import type { PageProps } from '~/types'

function receiptsText(count: number) {
  return count === 1 ? '1 comprobante para revisar' : `${count} comprobantes para revisar`
}

function AlertRow({ alert }: { alert: AdminAlert }) {
  const Icon = alert.kind === 'receipts' ? CreditCard : Repeat
  const title =
    alert.kind === 'receipts' ? receiptsText(alert.count) : `${alert.fullName} no tiene horario`
  const text = alert.kind === 'receipts' ? alert.periodLabel : 'Tiene plan, elegí sus horarios'
  return (
    <li>
      <Link
        href={alert.href}
        className="flex min-h-[60px] items-center gap-3 border-b border-border py-2.5 no-underline last:border-b-0"
      >
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-wash-celeste"
        >
          <Icon className="size-5" strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-base leading-tight font-black">{title}</strong>
          <span className="mt-0.5 block text-sm leading-tight font-bold text-muted-foreground">
            {text}
          </span>
        </span>
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          strokeWidth={2.3}
          aria-hidden="true"
        />
      </Link>
    </li>
  )
}

export default function AdminToday({ view }: { view: AdminTodayView }) {
  const center = usePage<PageProps>().props.tenant?.name ?? 'El centro'

  let classes
  if (view.closed) {
    classes = (
      <EmptyState icon={CalendarX} title={`Hoy ${center} está cerrado.`}>
        {`${view.closedReason ? `${view.closedReason}: las` : 'Las'} clases de hoy están suspendidas y cada persona tiene una clase pendiente.`}
      </EmptyState>
    )
  } else if (view.classes.length === 0) {
    classes = (
      <EmptyState icon={CalendarDays} title="Hoy no hay clases.">
        Las clases de la semana aparecen en Agenda.
      </EmptyState>
    )
  } else {
    classes = (
      <div className="mt-3 grid gap-2.5">
        {view.classes.map((card) => (
          <AdminSessionCard key={card.sessionId} card={card} />
        ))}
      </div>
    )
  }

  return (
    <AdminLayout tab="today" title="Hoy">
      <p className="mt-1.5 text-lg leading-tight font-bold text-muted-foreground">
        {view.dateLabel}
      </p>
      {view.alerts.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Para resolver</h2>
          <ul className="mt-1.5 grid">
            {view.alerts.map((alert) => (
              <AlertRow
                key={alert.kind === 'receipts' ? 'receipts' : `user-${alert.userId}`}
                alert={alert}
              />
            ))}
          </ul>
        </section>
      )}
      <section className="mt-6">
        <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Clases de hoy</h2>
        {classes}
      </section>
    </AdminLayout>
  )
}
