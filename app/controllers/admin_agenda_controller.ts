import { adminAgenda, closeDayForm } from '#services/admin_agenda'
import { adminWeek } from '#services/admin_week'
import { dayName } from '#services/business_calendar'
import DayClosures, { ClosureError, type ClosureFailure } from '#services/day_closures'
import { closureValidator } from '#validators/closure'
import type { HttpContext } from '@adonisjs/core/http'

const FAILURES: Record<ClosureFailure, string> = {
  past: 'Ese día ya pasó.',
  already_closed: 'Ese día ya está cerrado ahí.',
  unknown_center: 'Elegí dónde se cierra.',
}

function bookingsText(count: number) {
  return count === 1 ? '1 reserva quedó suspendida' : `${count} reservas quedaron suspendidas`
}

/**
 * Agenda: the classes of each day and closing a day (holiday or closure).
 */
export default class AdminAgendaController {
  async index({ inertia, request, tenant }: HttpContext) {
    return inertia.render('admin/agenda', {
      view: await adminAgenda(tenant!.id, request.input('fecha')),
    })
  }

  /**
   * Semana: the typical week with the people of each class.
   */
  async week({ inertia, request, tenant }: HttpContext) {
    return inertia.render('admin/agenda_week', {
      week: await adminWeek(tenant!.id, request.input('sede')),
    })
  }

  async closeForm({ inertia, request, response, tenant }: HttpContext) {
    const view = await closeDayForm(tenant!.id, request.input('fecha'))
    if (!view) return response.redirect(`/admin/agenda?fecha=${request.input('fecha') ?? ''}`)
    return inertia.render('admin/close_day', { view })
  }

  async close({ request, response, session, tenant }: HttpContext) {
    const payload = await request.validateUsing(closureValidator)

    try {
      const impact = await new DayClosures().close(tenant!.id, payload)
      session.flash(
        'success',
        `Cerramos el ${dayName(payload.date)}. ${impact.bookings > 0 ? `${bookingsText(impact.bookings)} con su clase pendiente.` : 'No había reservas.'}`
      )
    } catch (error) {
      if (!(error instanceof ClosureError)) throw error
      session.flash('error', FAILURES[error.reason])
      return response.redirect().back()
    }
    return response.redirect(`/admin/agenda?fecha=${payload.date}`)
  }
}
