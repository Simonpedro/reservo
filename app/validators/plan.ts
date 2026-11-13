import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const MAX_WEEKLY_COUNT = 7

export const planValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(120),
    price: vine.number().withoutDecimals().min(0).max(10_000_000),
    quotas: vine
      .array(
        vine.object({
          id: vine.number().withoutDecimals().positive().optional(),
          weeklyCount: vine.number().withoutDecimals().min(1).max(MAX_WEEKLY_COUNT),
          anyActivity: vine.boolean(),
          activityIds: vine.array(vine.number().withoutDecimals().positive()).maxLength(20),
        })
      )
      .minLength(1)
      .maxLength(MAX_WEEKLY_COUNT),
  })
)

planValidator.messagesProvider = new SimpleMessagesProvider({
  'name.required': 'Poné un nombre para el plan.',
  'name.minLength': 'Poné un nombre para el plan.',
  'name.maxLength': 'El nombre es muy largo.',
  'price.required': 'Poné el precio por mes.',
  'price.number': 'El precio tiene que ser un número.',
  'price.withoutDecimals': 'El precio va sin centavos.',
  'price.min': 'El precio no puede ser negativo.',
  'price.max': 'Revisá el precio.',
  'quotas.required': 'El plan necesita al menos un cupo.',
  'quotas.array.minLength': 'El plan necesita al menos un cupo.',
  'quotas.array.maxLength': `Un plan puede tener hasta ${MAX_WEEKLY_COUNT} cupos.`,
  'quotas.*.weeklyCount.min': 'Cada cupo necesita al menos 1 clase por semana.',
  'quotas.*.weeklyCount.max': `Cada cupo puede tener hasta ${MAX_WEEKLY_COUNT} clases por semana.`,
  'quotas.*.weeklyCount.required': 'Elegí cuántas clases por semana.',
})
