import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().toLowerCase(),
    password: vine.string(),
  })
)

loginValidator.messagesProvider = new SimpleMessagesProvider({
  'email.required': 'Escribí tu email.',
  'email.email': 'Ese email no parece válido.',
  'password.required': 'Escribí tu contraseña.',
})
