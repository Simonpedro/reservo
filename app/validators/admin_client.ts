import vine from '@vinejs/vine'

export const createClientValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(120),
    email: vine.string().trim().email().toLowerCase(),
    phone: vine.string().trim().maxLength(40).optional(),
  })
)
