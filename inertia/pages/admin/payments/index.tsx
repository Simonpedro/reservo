import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import type { PaymentRow, PaymentsOverview } from '#services/admin_payments'
import { AdminLayout } from '~/components/admin_layout'
import { LinkRow } from '~/components/link_row'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'

function Section({
  id,
  title,
  rows,
  empty,
  href,
}: {
  id: string
  title: string
  rows: PaymentRow[]
  empty: string
  href: (row: PaymentRow) => string
}) {
  return (
    <section className="mt-6" aria-labelledby={id}>
      <h2 id={id} className="text-[22px] leading-none font-black tracking-[-0.04em]">
        {title}
      </h2>
      {rows.length > 0 ? (
        <ul className="mt-2 divide-y divide-border">
          {rows.map((row) => (
            <li key={row.feeId}>
              <LinkRow
                href={href(row)}
                bubble={row.initials}
                title={row.fullName}
                hint={row.hint}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-base leading-snug font-bold text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}

/**
 * Pagos (admin tab): receipts to check and overdue fees.
 */
export default function AdminPayments({ overview }: { overview: PaymentsOverview }) {
  const flash = (usePage().flash ?? {}) as {
    success?: string
    error?: string
    approvedFeeId?: number
  }
  const undo = flash.approvedFeeId ? (
    <Button asChild variant="link" className="-my-2.5 h-11 px-0">
      <Link href={`/admin/pagos/${flash.approvedFeeId}/deshacer`} method="post" as="button">
        Deshacer
      </Link>
    </Button>
  ) : undefined

  return (
    <AdminLayout
      tab="payments"
      title="Pagos"
      subtitle={`Cuotas de ${overview.month}`}
      dock={
        <Button asChild>
          <Link href="/admin/pagos/registrar">Registrar pago</Link>
        </Button>
      }
    >
      {flash.success && (
        <Notice icon={CircleCheck} title={flash.success} action={undo} className="mt-5" />
      )}
      {flash.error && <Notice icon={CircleAlert} title={flash.error} className="mt-5" />}

      <Section
        id="review-title"
        title="Para revisar"
        rows={overview.review}
        empty="No hay comprobantes para revisar."
        href={(row) => `/admin/pagos/${row.feeId}`}
      />
      <Section
        id="overdue-title"
        title="Atrasadas"
        rows={overview.overdue}
        empty="Nadie tiene la cuota atrasada."
        href={(row) => `/admin/pagos/registrar?alumno=${row.userId}&mes=${row.period}`}
      />
    </AdminLayout>
  )
}
