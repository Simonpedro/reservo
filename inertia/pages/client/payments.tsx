import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { Check, CircleAlert, Clock, CreditCard, TriangleAlert, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FeeStatus } from '#services/fees'
import type { MyPaymentsView } from '#services/my_payments'
import { ClientLayout } from '~/components/client_layout'
import { EmptyState } from '~/components/empty_state'
import { InfoLine } from '~/components/info_line'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'
import { WhatsappButton } from '~/components/whatsapp_button'
import type { PageProps } from '~/types'

const STATUS_ICONS: Record<FeeStatus, LucideIcon> = {
  pending: Clock,
  in_review: Clock,
  paid: Check,
  overdue: TriangleAlert,
}

function History({ lines }: { lines: MyPaymentsView['history'] }) {
  if (lines.length === 0) return null
  return (
    <section className="mt-[18px]" aria-labelledby="historial">
      <h2 id="historial" className="mb-2 text-lg font-black tracking-[-0.035em]">
        Historial
      </h2>
      <div className="grid gap-2.5">
        {lines.map((line) => (
          <InfoLine key={line.id} icon={STATUS_ICONS[line.status]}>
            {line.summary}
          </InfoLine>
        ))}
      </div>
    </section>
  )
}

/**
 * Pagos: this month's fee, how to pay it and the previous months. Statuses
 * are plain lines of text, never chips.
 */
export default function Payments({ view, justSent }: { view: MyPaymentsView; justSent: boolean }) {
  const page = usePage<PageProps>()
  const center = page.props.tenant?.name ?? 'tu centro'
  const error = (page.flash as { error?: string } | undefined)?.error
  const { current } = view

  if (!current) {
    return (
      <ClientLayout tab="payments" title="Pagos" dock={<WhatsappButton />}>
        <EmptyState icon={CreditCard} title="No tenés cuotas para pagar.">
          {`Cuando ${center} te asigne un plan, vas a ver acá tu cuota del mes.`}
        </EmptyState>
        <History lines={view.history} />
      </ClientLayout>
    )
  }

  const dock = current.canUpload ? (
    <>
      {view.receiptRejected && (
        <Notice
          icon={CircleAlert}
          title={`${center} no pudo validar tu comprobante.`}
          className="mb-2.5"
        >
          Subí otro.
        </Notice>
      )}
      <Button asChild>
        <Link route="client.payments.receipt" routeParams={{ id: current.id }}>
          Subir comprobante
        </Link>
      </Button>
    </>
  ) : undefined

  return (
    <ClientLayout tab="payments" title="Pagos" dock={dock} tallDock={view.receiptRejected}>
      {justSent && (
        <Notice icon={Check} title="Lo recibimos." className="mt-[18px]">
          Apenas lo revisemos, lo vas a ver acá.
        </Notice>
      )}
      {error && <Notice icon={CircleAlert} title={error} className="mt-[18px]" />}

      <section className="mt-[18px]" aria-labelledby="cuota-actual">
        <h2 id="cuota-actual" className="mb-2 text-lg font-black tracking-[-0.035em]">
          {current.title}
        </h2>
        <p className="text-[22px] leading-[1.1] font-black tracking-[-0.035em]">{current.amount}</p>
        <div className="mt-2.5 grid gap-2.5">
          <InfoLine icon={STATUS_ICONS[current.status]}>{current.statusText}</InfoLine>
          {current.canUpload && (
            <InfoLine icon={Wallet} muted>
              {view.howToPay}
            </InfoLine>
          )}
        </div>
      </section>

      <History lines={view.history} />
    </ClientLayout>
  )
}
