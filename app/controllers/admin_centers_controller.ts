import { centerEditor, CatalogError, listCenters, saveCenter } from '#services/admin_catalog'
import { centerValidator } from '#validators/catalog'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Ajustes › Sedes: list, create and rename.
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
