import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const closureValidator = vine.compile(
  vine.object({
    date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: vine.string().trim().minLength(1).maxLength(120),
    centerId: vine.number().withoutDecimals().positive().nullable(),
  })
)

closureValidator.messagesProvider = new SimpleMessagesProvider({
  'reason.required': 'Poné el motivo, por ejemplo "Feriado".',
  'reason.minLength': 'Poné el motivo, por ejemplo "Feriado".',
  'reason.maxLength': 'El motivo es muy largo.',
})
