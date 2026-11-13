import vine, { SimpleMessagesProvider } from '@vinejs/vine'

/**
 * Receipt files the app accepts, by detected extension, with the
 * Content-Type they are served with.
 */
export const RECEIPT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
} as const

export type ReceiptExtname = keyof typeof RECEIPT_TYPES

export const RECEIPT_MAX_SIZE = '5mb'

export const receiptValidator = vine.compile(
  vine.object({
    receipt: vine.file({
      size: RECEIPT_MAX_SIZE,
      extnames: Object.keys(RECEIPT_TYPES),
    }),
  })
)

receiptValidator.messagesProvider = new SimpleMessagesProvider({
  'receipt.required': 'Elegí una foto o un PDF del comprobante.',
  'receipt.file': 'Elegí una foto o un PDF del comprobante.',
  'receipt.file.size': 'El archivo pesa más de 5 MB. Probá con una foto más liviana.',
  'receipt.file.extname': 'Subí una foto (JPG, PNG o WebP) o un PDF.',
})
