import Receipt from '#models/receipt'
import { ReceiptError, submitReceipt, type ReceiptFailure } from '#services/fees'
import { myPayments, uploadableFee } from '#services/my_payments'
import { RECEIPT_TYPES, receiptValidator, type ReceiptExtname } from '#validators/receipt'
import type { HttpContext } from '@adonisjs/core/http'
import { readFile } from 'node:fs/promises'

const FAILURES: Record<ReceiptFailure, string> = {
  not_found: 'No encontramos esa cuota.',
  paid: 'Esa cuota ya está pagada.',
  in_review: 'Ya recibimos un comprobante de esa cuota. Lo estamos revisando.',
}

/**
 * `filename*` keeps accents; the plain `filename` fallback is ASCII only so
 * the header cannot be broken by quotes or line breaks.
 */
function inlineDisposition(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

/**
 * Pagos: the student's monthly fee and the receipts they upload.
 */
export default class PaymentsController {
  async index({ auth, inertia, session, tenant }: HttpContext) {
    const view = await myPayments(auth.user!, tenant!.transferAliases)
    const justSent = Boolean(session.flashMessages.get('receiptSent'))
    return inertia.render('client/payments', { view, justSent })
  }

  async create({ auth, params, inertia, response }: HttpContext) {
    const fee = await uploadableFee(auth.user!, Number(params.id))
    if (!fee) return response.redirect().toRoute('client.payments')
    return inertia.render('client/upload_receipt', { fee })
  }

  /**
   * The file is checked here (type and 5 MB), whatever the browser allowed.
   */
  async store({ auth, params, request, response, session }: HttpContext) {
    const { receipt } = await request.validateUsing(receiptValidator)
    const extname = receipt.extname!.toLowerCase() as ReceiptExtname

    try {
      await submitReceipt(auth.user!, Number(params.id), {
        filename: receipt.clientName.slice(0, 255),
        mime: RECEIPT_TYPES[extname],
        size: receipt.size,
        data: await readFile(receipt.tmpPath!),
      })
    } catch (error) {
      if (!(error instanceof ReceiptError)) throw error
      session.flash('error', FAILURES[error.reason])
      return response.redirect().toRoute('client.payments')
    }

    session.flash('receiptSent', true)
    return response.redirect().toRoute('client.payments')
  }

  /**
   * The receipt file, only for the student who sent it or an admin of the
   * same tenant. Anyone else gets a 404, as if it did not exist.
   */
  async receipt({ auth, params, response, tenant }: HttpContext) {
    const user = auth.user!
    const receipt = await Receipt.query()
      .where('tenantId', tenant!.id)
      .where('id', Number(params.id))
      .if(user.role !== 'admin', (query) => query.where('userId', user.id))
      .first()

    if (!receipt) return response.notFound('No encontramos ese comprobante.')

    response.header('Content-Type', receipt.mime)
    response.header('Content-Disposition', inlineDisposition(receipt.filename))
    response.header('X-Content-Type-Options', 'nosniff')
    response.header('Cache-Control', 'private, no-store')
    return response.send(receipt.data)
  }
}
