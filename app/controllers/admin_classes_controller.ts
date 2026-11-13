import Booking from '#models/booking'
import ClassSession from '#models/class_session'
import { adminSession, adminToday } from '#services/admin_classes'
import Attendance, { AttendanceError, type AttendanceFailure } from '#services/attendance'
import SessionSuspension, { SessionSuspensionError } from '#services/session_suspension'
import type { HttpContext } from '@adonisjs/core/http'

const FAILURES: Record<AttendanceFailure, string> = {
  not_active: 'Esa persona ya no está anotada en esta clase.',
  not_absent: 'Esa persona ya está anotada.',
  suspended: 'Esta clase está suspendida.',
  pending_used: 'Ya usó la clase pendiente, así que no se puede deshacer.',
  full: 'La clase se llenó y ya no se puede deshacer.',
}

/**
 * Hoy and Clase del día: today's classes, absences and suspending a class.
 */
export default class AdminClassesController {
  async today({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/today', { view: await adminToday(tenant!.id) })
  }

  async show({ params, inertia, response, session, tenant }: HttpContext) {
    const justAbsentId = session.flashMessages.get('absent') as number | undefined
    const view = await adminSession(tenant!.id, Number(params.sessionId), { justAbsentId })
    if (!view) return this.notFound({ inertia, response })
    return inertia.render('admin/class_session', { view })
  }

  async absent({ params, inertia, response, session, tenant }: HttpContext) {
    const booking = await this.booking(tenant!.id, params)
    if (!booking) return this.notFound({ inertia, response })

    try {
      await new Attendance().markAbsent(booking)
      session.flash('absent', booking.id)
    } catch (error) {
      if (!(error instanceof AttendanceError)) throw error
      session.flash('error', FAILURES[error.reason])
    }
    return response.redirect(`/admin/clases/${Number(params.sessionId)}`)
  }

  async undoAbsent({ params, inertia, response, session, tenant }: HttpContext) {
    const booking = await this.booking(tenant!.id, params)
    if (!booking) return this.notFound({ inertia, response })

    try {
      await new Attendance().undoAbsent(booking)
    } catch (error) {
      if (!(error instanceof AttendanceError)) throw error
      session.flash('error', FAILURES[error.reason])
    }
    return response.redirect(`/admin/clases/${Number(params.sessionId)}`)
  }

  async suspend({ params, inertia, response, session, tenant }: HttpContext) {
    const classSession = await ClassSession.query()
      .where('tenantId', tenant!.id)
      .where('id', Number(params.sessionId))
      .first()
    if (!classSession) return this.notFound({ inertia, response })

    try {
      await new SessionSuspension().suspend(classSession)
    } catch (error) {
      if (!(error instanceof SessionSuspensionError)) throw error
      session.flash('error', 'Esta clase ya está suspendida.')
    }
    return response.redirect(`/admin/clases/${classSession.id}`)
  }

  /**
   * A booking of the session in the URL, of this tenant.
   */
  private booking(tenantId: number, params: Record<string, string>) {
    return Booking.query()
      .where('tenantId', tenantId)
      .where('classSessionId', Number(params.sessionId))
      .where('id', Number(params.bookingId))
      .first()
  }

  private notFound({ inertia, response }: Pick<HttpContext, 'inertia' | 'response'>) {
    response.status(404)
    return inertia.render('errors/not_found', {
      title: 'No encontramos esa clase',
      message: 'Puede que no exista en este centro.',
    })
  }
}
