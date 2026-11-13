import {
  activateSchedule,
  deactivateSchedule,
  saveSchedule,
  ScheduleError,
  scheduleEditor,
} from '#services/admin_schedules'
import { nextDateOn } from '#services/admin_agenda'
import { businessDate, businessNow } from '#services/business_calendar'
import { classScheduleValidator } from '#validators/class_schedule'
import type { HttpContext } from '@adonisjs/core/http'

function peopleText(count: number) {
  return count === 1 ? '1 persona' : `${count} personas`
}

/**
 * "Volver" goes back to the week when the form was opened from it, keeping
 * the week and the center the admin was looking at.
 */
function backHrefOf(request: HttpContext['request']) {
  if (request.input('desde') !== 'semana') return '/admin/agenda'
  const query = new URLSearchParams()
  const week = request.input('semana')
  const center = request.input('centro')
  if (typeof week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(week)) query.set('semana', week)
  if (typeof center === 'string' && /^[a-z0-9-]{1,63}$/.test(center)) query.set('centro', center)
  return query.size ? `/admin/agenda/semana?${query}` : '/admin/agenda/semana'
}

/**
 * Nuevo / Editar horario: the weekly classes of the agenda.
 */
export default class AdminSchedulesController {
  async create({ inertia, request, tenant }: HttpContext) {
    const weekday = Number(request.input('dia'))
    return inertia.render('admin/schedule_form', {
      editor: (await scheduleEditor(tenant!.id, null))!,
      weekday: Number.isInteger(weekday) && weekday >= 1 && weekday <= 7 ? weekday : null,
      backHref: backHrefOf(request),
    })
  }

  async edit({ inertia, params, request, response, tenant }: HttpContext) {
    const editor = await scheduleEditor(tenant!.id, Number(params.id))
    if (!editor) return this.notFound(inertia, response)
    return inertia.render('admin/schedule_form', {
      editor,
      weekday: null,
      backHref: backHrefOf(request),
    })
  }

  async store(ctx: HttpContext) {
    return this.save(ctx, null)
  }

  async update(ctx: HttpContext) {
    return this.save(ctx, Number(ctx.params.id))
  }

  async deactivate({ inertia, params, response, session, tenant }: HttpContext) {
    try {
      const found = await deactivateSchedule(tenant!.id, Number(params.id))
      if (!found) return this.notFound(inertia, response)
    } catch (error) {
      if (!(error instanceof ScheduleError)) throw error
      session.flash(
        'error',
        `Hay ${peopleText(error.detail.fixed ?? 0)} con esta clase como horario fijo. Para desactivarla, primero cambiá su horario desde su ficha.`
      )
      return response.redirect(`/admin/horarios/${Number(params.id)}`)
    }
    session.flash('success', 'Desactivamos la clase. Ya no aparece en la agenda.')
    return response.redirect('/admin/agenda')
  }

  async activate({ inertia, params, response, session, tenant }: HttpContext) {
    if (!(await activateSchedule(tenant!.id, Number(params.id)))) {
      return this.notFound(inertia, response)
    }
    session.flash('success', 'Activamos la clase.')
    return response.redirect(`/admin/horarios/${Number(params.id)}`)
  }

  private async save(
    { inertia, request, response, session, tenant }: HttpContext,
    scheduleId: number | null
  ) {
    const payload = await request.validateUsing(classScheduleValidator)

    try {
      const schedule = await saveSchedule(tenant!.id, scheduleId, payload)
      if (!schedule) return this.notFound(inertia, response)
    } catch (error) {
      if (!(error instanceof ScheduleError)) throw error
      if (error.reason === 'capacity') {
        session.flash('capacityBlocked', {
          fixed: error.detail.fixed,
          requested: error.detail.requested,
        })
        session.flash('errors', {
          capacity: `El cupo no puede ser menor a ${error.detail.fixed}.`,
        })
      } else if (error.reason === 'locked') {
        session.flash(
          'error',
          'Esta clase tiene gente anotada. No se puede cambiar el día, el centro ni la actividad.'
        )
      } else {
        session.flash('error', 'Elegí una actividad y un centro de la lista.')
      }
      return response.redirect().back()
    }

    session.flash(
      'success',
      scheduleId ? 'Guardamos los cambios de la clase.' : 'Creamos la clase.'
    )
    const date = nextDateOn(businessDate(businessNow()), payload.weekday)
    return response.redirect(`/admin/agenda?fecha=${date}`)
  }

  private notFound(inertia: HttpContext['inertia'], response: HttpContext['response']) {
    response.status(404)
    return inertia.render('errors/not_found', {
      title: 'No encontramos esa clase',
      message: 'Puede que no exista en este centro.',
    })
  }
}
