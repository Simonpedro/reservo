import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const name = () => vine.string().trim().minLength(1).maxLength(120)

export const activityValidator = vine.compile(
  vine.object({
    name: name(),
    wash: vine.enum(['celeste', 'green', 'blue'] as const),
  })
)

activityValidator.messagesProvider = new SimpleMessagesProvider({
  'name.required': 'Poné un nombre para la actividad.',
  'name.minLength': 'Poné un nombre para la actividad.',
  'name.maxLength': 'El nombre es muy largo.',
  'wash.required': 'Elegí el color de la tarjeta.',
  'wash.enum': 'Elegí el color de la tarjeta.',
})

export const centerValidator = vine.compile(vine.object({ name: name() }))

centerValidator.messagesProvider = new SimpleMessagesProvider({
  'name.required': 'Poné un nombre para el centro.',
  'name.minLength': 'Poné un nombre para el centro.',
  'name.maxLength': 'El nombre es muy largo.',
})
