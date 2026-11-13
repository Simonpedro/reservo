import { centerEditor, CatalogError, listCenters, saveCenter } from '#services/admin_catalog'
import { centerValidator } from '#validators/catalog'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Ajustes › Centros: list, create and rename.
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

  async edit(ctx: HttpContext) {
    const editor = await centerEditor(ctx.tenant!.id, Number(ctx.params.id))
    if (!editor) return this.notFound(ctx)
    return ctx.inertia.render('admin/centers/form', editor)
  }

  async store(ctx: HttpContext) {
    return this.save(ctx, null)
  }

  async update(ctx: HttpContext) {
    return this.save(ctx, Number(ctx.params.id))
  }

  private async save(ctx: HttpContext, centerId: number | null) {
    const { request, response, session, tenant } = ctx
    const payload = await request.validateUsing(centerValidator)

    try {
      const center = await saveCenter(tenant!.id, centerId, payload)
      if (!center) return this.notFound(ctx)
    } catch (error) {
      if (!(error instanceof CatalogError)) throw error
      session.flash('errors', { [error.field]: error.message })
      return response.redirect().back()
    }

    session.flash('success', centerId ? 'Guardamos los cambios del centro.' : 'Creamos el centro.')
    return response.redirect('/admin/ajustes/centros')
  }

  private notFound({ inertia, response, tenant }: HttpContext) {
    response.status(404)
    return inertia.render('errors/not_found', {
      title: 'No encontramos ese centro',
      message: `Puede que no exista en ${tenant!.name}.`,
    })
  }
}
