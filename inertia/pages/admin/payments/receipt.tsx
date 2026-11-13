import { Link } from '@adonisjs/inertia/react'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import type { ReceiptReview } from '#services/admin_payments'
import { AdminInnerLayout } from '~/components/admin_layout'
import { BottomSheet } from '~/components/bottom_sheet'
import { Button } from '~/components/ui/button'

/**
 * Comprobante (admin inner page): the receipt a student uploaded, to approve
 * it or reject it.
 */
export default function AdminReceipt({ review }: { review: ReceiptReview }) {
  const [rejecting, setRejecting] = useState(false)
  const firstName = review.fullName.trim().split(/\s+/)[0]
  const fileUrl = `/pagos/comprobantes/${review.receipt.id}`

  return (
    <>
      <AdminInnerLayout
        title={review.fullName}
        subtitle={review.subtitle}
        backHref="/admin/pagos"
        dock={
          <Button asChild>
            <Link
              route="admin.payments.approve"
              routeParams={{ id: review.feeId }}
              method="post"
              as="button"
            >
              Aprobar pago
            </Link>
          </Button>
        }
      >
        <figure className="mt-5 rounded-[28px] bg-wash-navy p-[18px]">
          {review.receipt.isPdf ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[20px] bg-white p-5 text-center text-navy shadow-[0_6px_16px_rgb(0_26_77/0.08)]"
            >
              <FileText className="size-10" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-base font-black underline underline-offset-4">
                Abrir el PDF
              </span>
              <span className="text-sm font-bold break-all text-muted-foreground">
                {review.receipt.filename}
              </span>
            </a>
          ) : (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="block">
              <img
                src={fileUrl}
                alt={`Comprobante de ${review.fullName}`}
                className="mx-auto max-h-[60svh] w-auto rounded-[20px] bg-white object-contain shadow-[0_6px_16px_rgb(0_26_77/0.08)]"
              />
            </a>
          )}
          <figcaption className="sr-only">{review.receipt.filename}</figcaption>
        </figure>

        <div className="mt-[18px] grid gap-1">
          <Button type="button" variant="link" onClick={() => setRejecting(true)}>
            Rechazar comprobante
          </Button>
        </div>
      </AdminInnerLayout>

      <BottomSheet
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="¿Rechazamos el comprobante?"
        action={
          <Button asChild>
            <Link
              route="admin.payments.reject"
              routeParams={{ id: review.feeId }}
              method="post"
              as="button"
              onSuccess={() => setRejecting(false)}
            >
              Rechazar
            </Link>
          </Button>
        }
      >
        {`${firstName} lo va a ver en la app y va a poder subir otro.`}
      </BottomSheet>
    </>
  )
}
