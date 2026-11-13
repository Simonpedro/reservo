import {
  centerEditor,
  CatalogError,
  listCenters,
  saveCenter,
  setCenterActive,
} from '#services/admin_catalog'
import { centerValidator } from '#validators/catalog'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Ajustes › Sedes: list, create, rename and turn on or off.
 */
export default class AdminCentersController {
  async index({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/centers/index', {
      centers: await listCenters(tenant!.id),
    })
  }

  async create({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/centers/form', (await centerEditor(tenant!.id, null))!)
  }

  async edit({ inertia, params, response, tenant }: HttpContext) {
    const editor = await centerEditor(tenant!.id, Number(params.id))
    if (!editor) return this.notFound(inertia, response)
    return inertia.render('admin/centers/form', editor)
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
      if (!(await setCenterActive(tenant!.id, id, active))) {
        return this.notFound(inertia, response)
      }
    } catch (error) {
      if (!(error instanceof CatalogError)) throw error
      session.flash('error', error.message)
      return response.redirect(`/admin/ajustes/sedes/${id}`)
    }
    if (active) {
      session.flash('success', 'Activamos la sede.')
      return response.redirect(`/admin/ajustes/sedes/${id}`)
    }
    session.flash('success', 'Desactivamos la sede. Ya no se ofrece en horarios nuevos.')
    return response.redirect('/admin/ajustes/sedes')
  }

  private async save(
    { inertia, request, response, session, tenant }: HttpContext,
    centerId: number | null
  ) {
    const payload = await request.validateUsing(centerValidator)

    try {
      const center = await saveCenter(tenant!.id, centerId, payload)
      if (!center) return this.notFound(inertia, response)
    } catch (error) {
      if (!(error instanceof CatalogError)) throw error
      session.flash('errors', { [error.field]: error.message })
      return response.redirect().back()
    }

    session.flash('success', centerId ? 'Guardamos los cambios de la sede.' : 'Creamos la sede.')
    return response.redirect('/admin/ajustes/sedes')
  }

  private notFound(inertia: HttpContext['inertia'], response: HttpContext['response']) {
    response.status(404)
    return inertia.render('errors/not_found', {
      title: 'No encontramos esa sede',
      message: 'Puede que no exista en este centro.',
    })
  }
}
