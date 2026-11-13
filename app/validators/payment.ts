import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const PAYMENT_METHODS = ['cash', 'transfer', 'forced'] as const

export const paymentValidator = vine.compile(
  vine.object({
    userId: vine.number().withoutDecimals().positive(),
    period: vine.string().regex(/^\d{4}-\d{2}-01$/),
    amount: vine.number().withoutDecimals().min(0).max(10_000_000),
    method: vine.enum(PAYMENT_METHODS),
  })
)

paymentValidator.messagesProvider = new SimpleMessagesProvider({
  'userId.required': 'Elegí a la persona.',
  'userId.number': 'Elegí a la persona.',
  'period.required': 'Elegí el mes.',
  'period.regex': 'Elegí el mes.',
  'amount.required': 'Poné el monto.',
  'amount.number': 'El monto tiene que ser un número.',
  'amount.withoutDecimals': 'El monto va sin centavos.',
  'amount.min': 'El monto no puede ser negativo.',
  'amount.max': 'El monto es demasiado alto.',
  'method.required': 'Elegí el medio de pago.',
  'method.enum': 'Elegí el medio de pago.',
})
