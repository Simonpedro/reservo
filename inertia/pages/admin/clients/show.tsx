import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import {
  CalendarClock,
  Clock3,
  Copy,
  Link2,
  Mail,
  MapPin,
  Phone,
  Ticket,
  Wallet,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ClassCardData } from '#services/my_classes'
import { AdminInnerLayout } from '~/components/admin_layout'
import { ClassCard } from '~/components/class_card'
import { InfoLine } from '~/components/info_line'
import { WhatsappIcon } from '~/components/icons'
import { Button } from '~/components/ui/button'
import type { PageProps } from '~/types'

type AccessLinkFlash = {
  url: string
  whatsappUrl: string | null
}

type PendingClasses = {
  available: number
  expiresOn: string | null
} | null

type Payments = {
  periodLabel: string
  statusLabel: string
  amount: number
} | null

type Plan = {
  name: string
  quotas: string[]
} | null

function formatMoney(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function AdminClientShow({
  id,
  fullName,
  email,
  phone,
  plan,
  fixedSchedule,
  upcomingClasses,
  pendingClasses,
  payments,
  hasPendingClassesTable,
  hasMonthlyFeesTable,
}: {
  id: number
  fullName: string
  email: string
  phone: string | null
  plan: Plan
  fixedSchedule: string[]
  upcomingClasses: ClassCardData[]
  pendingClasses: PendingClasses
  payments: Payments
  hasPendingClassesTable: boolean
  hasMonthlyFeesTable: boolean
}) {
  const page = usePage<PageProps>()
  const flash = page.flash as { success?: string; accessLink?: AccessLinkFlash }
  const accessLink = flash.accessLink
  const [copyFeedback, setCopyFeedback] = useState('')
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  async function copyAccessLink() {
    if (!accessLink?.url) return

    let message = 'Link copiado.'
    try {
      await navigator.clipboard.writeText(accessLink.url)
    } catch {
      message = 'No pudimos copiarlo. Copialo manualmente.'
    }

    setCopyFeedback(message)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopyFeedback(''), 2000)
  }

  return (
    <AdminInnerLayout
      title={fullName}
      backHref="/admin/clientes"
      dock={
        <Button asChild>
          <Link href={`/admin/clientes/${id}/access-link`} method="post" as="button">
            Generar link de acceso
          </Link>
        </Button>
      }
    >
      {flash.success && (
        <p
          className="mt-4 text-sm leading-tight font-extrabold text-muted-foreground"
          role="status"
        >
          {flash.success}
        </p>
      )}

      <section className="mt-5 grid gap-2.5">
        <InfoLine icon={Mail}>{email}</InfoLine>
        <InfoLine icon={Phone}>{phone ?? 'Sin teléfono'}</InfoLine>
      </section>

      <section className="mt-6">
        <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Plan</h2>
        {plan ? (
          <div className="mt-2.5 grid gap-2.5">
            <p className="text-[22px] leading-[1.1] font-black tracking-[-0.035em]">{plan.name}</p>
            {plan.quotas.map((quota) => (
              <InfoLine key={quota} icon={Ticket}>
                {quota}
              </InfoLine>
            ))}
          </div>
        ) : (
          <p className="mt-2.5 text-base leading-tight font-bold text-muted-foreground">
            Todavía no tiene plan.
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Horario fijo</h2>
        {fixedSchedule.length > 0 ? (
          <div className="mt-2.5 grid gap-2.5">
            {fixedSchedule.map((line) => (
              <InfoLine key={line} icon={CalendarClock}>
                {line}
              </InfoLine>
            ))}
          </div>
        ) : (
          <p className="mt-2.5 text-base leading-tight font-bold text-muted-foreground">
            Falta elegir sus horarios.
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Próximas clases</h2>
        {upcomingClasses.length > 0 ? (
          <div className="mt-2.5 grid gap-2.5">
            {upcomingClasses.map((card) => (
              <ClassCard key={card.bookingId} card={card} href="/admin/agenda" />
            ))}
          </div>
        ) : (
          <p className="mt-2.5 text-base leading-tight font-bold text-muted-foreground">
            No tiene clases próximas.
          </p>
        )}
      </section>

      {hasPendingClassesTable && (
        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Pendientes</h2>
          {pendingClasses && pendingClasses.available > 0 ? (
            <div className="mt-2.5 grid gap-2.5">
              <InfoLine icon={Ticket}>{`${pendingClasses.available} disponibles`}</InfoLine>
              {pendingClasses.expiresOn && (
                <InfoLine icon={Clock3}>
                  {`Vencen ${formatDate(pendingClasses.expiresOn)}`}
                </InfoLine>
              )}
            </div>
          ) : (
            <p className="mt-2.5 text-base leading-tight font-bold text-muted-foreground">
              No tiene pendientes.
            </p>
          )}
        </section>
      )}

      {hasMonthlyFeesTable && (
        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Pagos</h2>
          {payments ? (
            <div className="mt-2.5 grid gap-2.5">
              <InfoLine
                icon={Wallet}
              >{`${payments.periodLabel} · ${formatMoney(payments.amount)}`}</InfoLine>
              <InfoLine icon={MapPin}>{payments.statusLabel}</InfoLine>
            </div>
          ) : (
            <p className="mt-2.5 text-base leading-tight font-bold text-muted-foreground">
              No hay pagos cargados.
            </p>
          )}
        </section>
      )}

      <section className="mt-6 pb-2">
        <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Asignaciones</h2>
        <Button asChild variant="link" className="mt-1 h-11 px-0">
          <Link href={`/admin/clientes/${id}/asignar-plan-horario`}>Asignar plan y horario</Link>
        </Button>
      </section>

      {accessLink && (
        <section className="mt-6 rounded-[28px] bg-wash-celeste p-4">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Link de acceso</h2>
          <p className="mt-2 break-all text-sm leading-tight font-bold">{accessLink.url}</p>
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={copyAccessLink}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-navy bg-white px-4 text-sm font-black"
              aria-label="Copiar link de acceso"
            >
              <Copy className="size-4" aria-hidden="true" />
              Copiar link
            </button>
            <span role="status" className="text-sm font-extrabold">
              {copyFeedback}
            </span>
            {accessLink.whatsappUrl ? (
              <a
                href={accessLink.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-4 text-sm font-black text-white no-underline"
              >
                <WhatsappIcon className="size-4" />
                Abrir WhatsApp
              </a>
            ) : (
              <p className="text-sm leading-tight font-bold text-muted-foreground">
                Cargá su teléfono para compartirlo por WhatsApp.
              </p>
            )}
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
              <Link2 className="size-4" strokeWidth={2.1} aria-hidden="true" />
              No se envía nada automáticamente.
            </p>
          </div>
        </section>
      )}
    </AdminInnerLayout>
  )
}
