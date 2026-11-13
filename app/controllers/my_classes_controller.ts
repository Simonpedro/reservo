import { businessDate, businessNow } from '#services/business_calendar'
import { myUpcomingClasses, studentBookings, toClassCard } from '#services/my_classes'
import type { HttpContext } from '@adonisjs/core/http'

export default class MyClassesController {
  async index({ auth, inertia }: HttpContext) {
    const view = await myUpcomingClasses(auth.user!)
    return inertia.render('client/my_classes', { view })
  }

  /**
   * Minimal class detail; the full screen (cancel, use pending) comes next.
   */
  async show({ auth, params, inertia, response }: HttpContext) {
    const booking = await studentBookings(auth.user!).where('id', Number(params.id)).first()

    if (!booking) {
      response.status(404)
      return inertia.render('errors/not_found', {
        title: 'No encontramos esa clase',
        message: 'Puede que ya no esté entre tus clases.',
      })
    }

    return inertia.render('client/class_detail', {
      card: toClassCard(booking, businessDate(businessNow())),
    })
  }
}
