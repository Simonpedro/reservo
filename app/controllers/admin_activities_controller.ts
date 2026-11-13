import {
  activityEditor,
  CatalogError,
  listActivities,
  saveActivity,
  setActivityActive,
} from '#services/admin_catalog'
import { activityValidator } from '#validators/catalog'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Ajustes › Actividades: list, create, rename and turn on or off.
 */
export default class AdminActivitiesController {
  async index({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/activities/index', {
      activities: await listActivities(tenant!.id),
    })
  }

  async create({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/activities/form', (await activityEditor(tenant!.id, null))!)
  }

  async edit({ inertia, params, response, tenant }: HttpContext) {
    const editor = await activityEditor(tenant!.id, Number(params.id))
    if (!editor) return this.notFound(inertia, response)
    return inertia.render('admin/activities/form', editor)
  }

  async store(ctx: HttpContext) {
    return this.save(ctx, null)
  }

  async update(ctx: HttpContext) {
    return this.save(ctx, Number(ctx.params.id))
  }

  async deactivate(ctx: HttpContext) {
    return this.setActive(ctx, false)
  }

  async activate(ctx: HttpContext) {
    return this.setActive(ctx, true)
  }

  private async setActive(
    { inertia, params, response, session, tenant }: HttpContext,
    active: boolean
  ) {
    const id = Number(params.id)
    try {
      if (!(await setActivityActive(tenant!.id, id, active))) {
        return this.notFound(inertia, response)
      }
    } catch (error) {
      if (!(error instanceof CatalogError)) throw error
      session.flash('error', error.message)
      return response.redirect(`/admin/ajustes/actividades/${id}`)
    }
    if (active) {
      session.flash('success', 'Activamos la actividad.')
      return response.redirect(`/admin/ajustes/actividades/${id}`)
    }
    session.flash('success', 'Desactivamos la actividad. Ya no se ofrece en horarios ni planes.')
    return response.redirect('/admin/ajustes/actividades')
  }

  private async save(
    { inertia, request, response, session, tenant }: HttpContext,
    activityId: number | null
  ) {
    const payload = await request.validateUsing(activityValidator)

    try {
      const activity = await saveActivity(tenant!.id, activityId, payload)
      if (!activity) return this.notFound(inertia, response)
    } catch (error) {
      if (!(error instanceof CatalogError)) throw error
      session.flash('errors', { [error.field]: error.message })
      return response.redirect().back()
    }

    session.flash(
      'success',
      activityId ? 'Guardamos los cambios de la actividad.' : 'Creamos la actividad.'
    )
    return response.redirect('/admin/ajustes/actividades')
  }

  private notFound(inertia: HttpContext['inertia'], response: HttpContext['response']) {
    response.status(404)
    return inertia.render('errors/not_found', {
      title: 'No encontramos esa actividad',
      message: 'Puede que no exista en este centro.',
    })
  }
}
