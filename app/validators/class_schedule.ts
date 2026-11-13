import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const MAX_CAPACITY = 200

export const classScheduleValidator = vine.compile(
  vine.object({
    activityId: vine.number().withoutDecimals().positive(),
    centerId: vine.number().withoutDecimals().positive(),
    weekday: vine.number().withoutDecimals().range([1, 7]),
    startTime: vine
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    capacity: vine.number().withoutDecimals().min(1).max(MAX_CAPACITY),
    instructorName: vine.string().trim().minLength(1).maxLength(120),
  })
)

classScheduleValidator.messagesProvider = new SimpleMessagesProvider({
  'activityId.required': 'Elegí la actividad.',
  'centerId.required': 'Elegí el centro.',
  'weekday.required': 'Elegí el día.',
  'weekday.range': 'Elegí el día.',
  'startTime.required': 'Elegí la hora.',
  'startTime.regex': 'Elegí la hora.',
  'capacity.required': 'Poné el cupo.',
  'capacity.number': 'El cupo tiene que ser un número.',
  'capacity.withoutDecimals': 'El cupo tiene que ser un número entero.',
  'capacity.min': 'El cupo tiene que ser de al menos 1 lugar.',
  'capacity.max': `El cupo puede ser de hasta ${MAX_CAPACITY} lugares.`,
  'instructorName.required': 'Poné quién da la clase.',
  'instructorName.minLength': 'Poné quién da la clase.',
  'instructorName.maxLength': 'El nombre es muy largo.',
})
