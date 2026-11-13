import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import {
  CalendarClock,
  CircleCheck,
  Clock3,
  Copy,
  Info,
  Layers,
  Link2,
  Mail,
  Phone,
  Repeat,
  Ticket,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ClassCardData } from '#services/my_classes'
import { AdminInnerLayout } from '~/components/admin_layout'
import { ClassCard } from '~/components/class_card'
import { EmptyState } from '~/components/empty_state'
import { InfoLine } from '~/components/info_line'
import { Notice } from '~/components/notice'
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
  startsOn: string | null
  quotas: string[]
} | null

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
}) {
  const page = usePage<PageProps>()
  const flash = page.flash as {
    success?: string
    accessLink?: AccessLinkFlash
    assigned?: { startsOn: string }
  }
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

  const assignLabel = !plan
    ? 'Asignar plan y horario'
    : fixedSchedule.length === 0
      ? 'Elegir horarios'
      : 'Cambiar plan u horario'

  return (
    <AdminInnerLayout
      title={fullName}
      backHref="/admin/clientes"
      dock={
        <Button asChild>
          <Link href={`/admin/clientes/${id}/asignar`}>{assignLabel}</Link>
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

      {flash.assigned && (
        <Notice icon={CircleCheck} title="Listo, horario cargado." className="mt-4">
          {`Desde el ${formatDate(flash.assigned.startsOn)} el sistema reserva sus clases cada semana.`}
        </Notice>
      )}

      <section className="mt-5 grid gap-2.5">
        <InfoLine icon={Mail}>{email}</InfoLine>
        <InfoLine icon={Phone}>{phone ?? 'Sin teléfono'}</InfoLine>
      </section>

      {plan ? (
        <>
          <section className="mt-6">
            <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Plan</h2>
            <div className="mt-2.5 grid gap-2.5">
              <p className="text-[22px] leading-[1.1] font-black tracking-[-0.035em]">
                {plan.name}
              </p>
              {plan.startsOn && (
                <InfoLine
                  icon={CalendarClock}
                >{`Empieza el ${formatDate(plan.startsOn)}`}</InfoLine>
              )}
              {plan.quotas.map((quota) => (
                <InfoLine key={quota} icon={Layers}>
                  {quota}
                </InfoLine>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Horario fijo</h2>
            {fixedSchedule.length > 0 ? (
              <div className="mt-2.5 grid gap-2.5">
                {fixedSchedule.map((line) => (
                  <InfoLine key={line} icon={Repeat}>
                    {line}
                  </InfoLine>
                ))}
              </div>
            ) : (
              <Notice icon={Info} title="Falta elegir sus horarios." className="mt-2.5">
                Hasta que los cargues, no tiene clases reservadas.
              </Notice>
            )}
          </section>
        </>
      ) : (
        <EmptyState icon={Layers} title="Todavía no tiene plan.">
          Asignale un plan y sus horarios fijos. Desde ahí el sistema lo reserva solo cada semana.
        </EmptyState>
      )}

      {upcomingClasses.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Próximas clases</h2>
          <div className="mt-2.5 grid gap-2.5">
            {upcomingClasses.map((card) => (
              <ClassCard
                key={card.bookingId}
                card={card}
                href={`/admin/clases/${card.sessionId}`}
                returnKey={`admin-client-${id}-${card.bookingId}`}
              />
            ))}
          </div>
        </section>
      )}

      {pendingClasses && pendingClasses.available > 0 && (
        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Clases pendientes</h2>
          <div className="mt-2.5 grid gap-2.5">
            <InfoLine icon={Ticket}>
              {pendingClasses.expiresOn
                ? `${pendingClasses.available} · vence el ${formatDate(pendingClasses.expiresOn)}`
                : String(pendingClasses.available)}
            </InfoLine>
          </div>
        </section>
      )}

      {payments && (
        <section className="mt-6">
          <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Pagos</h2>
          <div className="mt-2.5 grid gap-2.5">
            <InfoLine icon={Clock3}>{`${payments.periodLabel} · ${payments.statusLabel}`}</InfoLine>
          </div>
        </section>
      )}

      <section className="mt-6 pb-2">
        <h2 className="text-lg leading-none font-black tracking-[-0.035em]">Acceso</h2>
        <p className="mt-2.5 text-base leading-tight font-bold text-muted-foreground">
          Entra con un link personal, sin contraseña.
        </p>
        <Button asChild variant="link" className="mt-1 h-11 px-0">
          <Link href={`/admin/clientes/${id}/access-link`} method="post" as="button" preserveScroll>
            Generar link de acceso
          </Link>
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
