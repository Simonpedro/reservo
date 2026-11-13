import {
  approveReceipt,
  PaymentError,
  paymentsOverview,
  receiptReview,
  registerForm,
  registerPayment,
  rejectReceipt,
  undoApproval,
  type PaymentFailure,
} from '#services/admin_payments'
import { paymentValidator } from '#validators/payment'
import type { HttpContext } from '@adonisjs/core/http'

const FAILURES: Record<PaymentFailure, string> = {
  not_found: 'No encontramos esa cuota.',
  not_in_review: 'Ese comprobante ya se revisó.',
  not_approved: 'Ese pago ya no se puede deshacer.',
  paid: 'Esa cuota ya está pagada.',
  no_plan: 'Esa persona no tiene plan ese mes.',
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0]
}

/**
 * Pagos (admin): check receipts and record payments.
 */
export default class AdminPaymentsController {
  async index({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/payments/index', { overview: await paymentsOverview(tenant!.id) })
  }

  async show({ inertia, params, response, session, tenant }: HttpContext) {
    const review = await receiptReview(tenant!.id, Number(params.id))
    if (!review) {
      session.flash('error', FAILURES.not_in_review)
      return response.redirect().toRoute('admin.payments')
    }
    return inertia.render('admin/payments/receipt', { review })
  }

  async approve({ auth, params, response, session, tenant }: HttpContext) {
    try {
      const fee = await approveReceipt(tenant!.id, Number(params.id), auth.user!.id)
      session.flash('success', `Listo, ${firstName(fee.user.fullName)} quedó al día.`)
      session.flash('approvedFeeId', fee.id)
    } catch (error) {
      if (!(error instanceof PaymentError)) throw error
      session.flash('error', FAILURES[error.reason])
    }
    return response.redirect().toRoute('admin.payments')
  }

  /**
   * "Deshacer" right after approving: the receipt goes back to review.
   */
  async undoApprove({ params, response, session, tenant }: HttpContext) {
    try {
      await undoApproval(tenant!.id, Number(params.id))
    } catch (error) {
      if (!(error instanceof PaymentError)) throw error
      session.flash('error', FAILURES[error.reason])
    }
    return response.redirect().toRoute('admin.payments')
  }

  async reject({ params, response, session, tenant }: HttpContext) {
    try {
      const fee = await rejectReceipt(tenant!.id, Number(params.id))
      session.flash(
        'success',
        `Rechazamos el comprobante. ${firstName(fee.user.fullName)} lo va a ver en la app y puede subir otro.`
      )
    } catch (error) {
      if (!(error instanceof PaymentError)) throw error
      session.flash('error', FAILURES[error.reason])
    }
    return response.redirect().toRoute('admin.payments')
  }

  async create({ inertia, request, tenant }: HttpContext) {
    const form = await registerForm(tenant!.id, {
      userId: Number(request.input('alumno')) || undefined,
      period: request.input('mes'),
    })
    return inertia.render('admin/payments/register', { form })
  }

  async store({ auth, request, response, session, tenant }: HttpContext) {
    const payload = await request.validateUsing(paymentValidator)

    try {
      const fee = await registerPayment(tenant!.id, auth.user!.id, payload)
      session.flash('success', `Listo, ${firstName(fee.user.fullName)} quedó al día.`)
    } catch (error) {
      if (!(error instanceof PaymentError)) throw error
      session.flash('errors', {
        [error.reason === 'not_found' ? 'userId' : 'period']: FAILURES[error.reason],
      })
      return response.redirect().back()
    }
    return response.redirect().toRoute('admin.payments')
  }
}
