import MonthlyFee from '#models/monthly_fee'
import Receipt from '#models/receipt'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const MonthlyFeeFactory = factory
  .define(MonthlyFee, () => ({
    period: DateTime.now().startOf('month'),
    amount: 38000,
    status: 'pending' as const,
    paidAt: null,
    method: null,
    recordedById: null,
  }))
  .state('paid', (fee) => {
    fee.status = 'paid'
    fee.method = 'transfer'
    fee.paidAt = fee.period.set({ day: 5, hour: 10 })
  })
  .build()

/**
 * A tiny valid PNG, enough for anything that serves or inspects the file.
 */
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

export const ReceiptFactory = factory
  .define(Receipt, () => ({
    filename: 'transferencia.png',
    mime: 'image/png',
    size: PNG_BYTES.length,
    data: PNG_BYTES,
    status: 'in_review' as const,
  }))
  .build()
