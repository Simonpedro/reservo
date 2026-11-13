import vine from '@vinejs/vine'

export const scheduleAssignmentValidator = vine.compile(
  vine.object({
    planId: vine.number().withoutDecimals().positive(),
    startsOn: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    quotas: vine
      .array(
        vine.object({
          quotaId: vine.number().withoutDecimals().positive(),
          scheduleIds: vine.array(vine.number().withoutDecimals().positive()).maxLength(14),
        })
      )
      .maxLength(10),
  })
)
