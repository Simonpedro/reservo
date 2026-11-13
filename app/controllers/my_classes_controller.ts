import { businessNow } from '#services/business_calendar'
import Cancellation, { CancellationError, type CancellationFailure } from '#services/cancellation'
import { classDetail, myUpcomingClasses, studentBookings } from '#services/my_classes'
import type { HttpContext } from '@adonisjs/core/http'

const FAILURES: Record<CancellationFailure, string> = {
  not_active: 'Esta clase ya no está reservada.',
  not_cancelled: 'Esta clase ya está reservada.',
  suspended: 'Esta clase está suspendida.',
  too_late: 'Faltan menos de 24 h: desde la app ya no se puede cancelar.',
  pending_used: 'Ya usaste la clase pendiente, así que no se puede deshacer.',
  full: 'La clase se llenó y ya no se puede deshacer.',
}

export default class MyClassesController {
  async index({ auth, inertia }: HttpContext) {
    const view = await myUpcomingClasses(auth.user!)
    return inertia.render('client/my_classes', { view })
  }

  async show({ auth, params, inertia, response, session }: HttpContext) {
    const detail = await classDetail(auth.user!, Number(params.id), businessNow())
    if (!detail) return this.notFound({ inertia, response })

    const justCancelled =
      detail.state === 'cancelled' &&
      session.flashMessages.get('cancelled') === detail.card.bookingId
    return inertia.render('client/class_detail', { detail, justCancelled })
  }

  /**
   * "No voy a ir". The 24 h rule is enforced here, not only on screen.
   */
  async cancel({ auth, params, inertia, response, session }: HttpContext) {
    const booking = await studentBookings(auth.user!).where('id', Number(params.id)).first()
    if (!booking) return this.notFound({ inertia, response })

    try {
      await new Cancellation().cancel(booking, businessNow())
      session.flash('cancelled', booking.id)
    } catch (error) {
      if (!(error instanceof CancellationError)) throw error
      session.flash('error', FAILURES[error.reason])
    }
    return response.redirect().toRoute('client.classes.show', { id: booking.id })
  }

  async undo({ auth, params, inertia, response, session }: HttpContext) {
    const booking = await studentBookings(auth.user!).where('id', Number(params.id)).first()
    if (!booking) return this.notFound({ inertia, response })

    try {
      await new Cancellation().undo(booking, businessNow())
    } catch (error) {
      if (!(error instanceof CancellationError)) throw error
      session.flash('error', FAILURES[error.reason])
    }
    return response.redirect().toRoute('client.classes.show', { id: booking.id })
  }

  private notFound({ inertia, response }: Pick<HttpContext, 'inertia' | 'response'>) {
    response.status(404)
    return inertia.render('errors/not_found', {
      title: 'No encontramos esa clase',
      message: 'Puede que ya no esté entre tus clases.',
    })
  }
}
