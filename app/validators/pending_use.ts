import vine from '@vinejs/vine'

export const pendingUseValidator = vine.compile(
  vine.object({
    pendingId: vine.number().withoutDecimals().positive(),
  })
)
