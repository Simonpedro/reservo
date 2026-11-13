import { businessNow } from '#services/business_calendar'
import { chooseClassView, sessionDetail } from '#services/choose_class'
import PendingEligibility, {
  PendingUseError,
  type PendingUseFailure,
} from '#services/pending_eligibility'
import type { HttpContext } from '@adonisjs/core/http'

const FAILURES: Record<PendingUseFailure, string> = {
  pending_unavailable: 'Esa clase pendiente ya no está disponible.',
  not_allowed: 'Tu clase pendiente no vale para esta actividad.',
  unavailable: 'Esta clase ya no se puede reservar.',
  already_booked: 'Ya tenés lugar en esta clase.',
  full: 'Esta clase ya no tiene lugares libres.',
}

/**
 * Elegir clase: booking a class by hand with a pending class.
 */
export default class ChooseClassController {
  async index({ auth, request, inertia }: HttpContext) {
    const day = request.input('dia')
    const view = await chooseClassView(auth.user!, typeof day === 'string' ? day : undefined)
    return inertia.render('client/choose_class', { view })
  }

  async show({ auth, params, inertia, response }: HttpContext) {
    const detail = await sessionDetail(auth.user!, Number(params.id), businessNow())
    if (!detail) {
      response.status(404)
      return inertia.render('errors/not_found', {
        title: 'No encontramos esa clase',
        message: 'Puede que ya no esté disponible para tu clase pendiente.',
      })
    }
    return inertia.render('client/session_detail', { detail })
  }

  /**
   * "Usar clase pendiente". The server picks which pending class to use and
   * checks every rule again.
   */
  async store({ auth, params, response, session }: HttpContext) {
    const sessionId = Number(params.id)

    try {
      const booking = await new PendingEligibility().use(auth.user!, sessionId, businessNow())
      session.flash('booked', booking.id)
      return response.redirect().toRoute('client.classes.show', { id: booking.id })
    } catch (error) {
      if (!(error instanceof PendingUseError)) throw error
      session.flash('error', FAILURES[error.reason])
      if (error.reason === 'full') {
        return response.redirect().toRoute('client.choose.show', { id: sessionId })
      }
      return response.redirect().toRoute('client.choose')
    }
  }
}
