import { listPlans, PlanError, planEditor, savePlan, setPlanActive } from '#services/admin_plans'
import { planValidator } from '#validators/plan'
import type { HttpContext } from '@adonisjs/core/http'

export default class AdminPlansController {
  async index({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/plans/index', { plans: await listPlans(tenant!.id) })
  }

  async create({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/plans/form', (await planEditor(tenant!.id, null))!)
  }

  async edit({ inertia, params, response, tenant }: HttpContext) {
    const editor = await planEditor(tenant!.id, Number(params.id))
    if (!editor) return this.notFound(inertia, response)
    return inertia.render('admin/plans/form', editor)
  }

  async store(ctx: HttpContext) {
    return this.save(ctx, null)
  }

  async update(ctx: HttpContext) {
    return this.save(ctx, Number(ctx.params.id))
  }

  async deactivate({ params, response, session, tenant }: HttpContext) {
    if (!(await setPlanActive(tenant!.id, Number(params.id), false))) {
      return response.status(404).send('Not found')
    }
    session.flash('success', 'Desactivamos el plan. Ya no se puede asignar.')
    return response.redirect('/admin/ajustes/planes')
  }

  async activate({ params, response, session, tenant }: HttpContext) {
    if (!(await setPlanActive(tenant!.id, Number(params.id), true))) {
      return response.status(404).send('Not found')
    }
    session.flash('success', 'Activamos el plan.')
    return response.redirect(`/admin/ajustes/planes/${params.id}`)
  }

  private async save(
    { inertia, request, response, session, tenant }: HttpContext,
    planId: number | null
  ) {
    const payload = await request.validateUsing(planValidator)

    try {
      const plan = await savePlan(tenant!.id, planId, payload)
      if (!plan) return this.notFound(inertia, response)
    } catch (error) {
      if (error instanceof PlanError) {
        session.flash('errors', { [error.field]: error.message })
        return response.redirect().back()
      }
      throw error
    }

    session.flash('success', planId ? 'Guardamos los cambios del plan.' : 'Creamos el plan.')
    return response.redirect('/admin/ajustes/planes')
  }

  private notFound(inertia: HttpContext['inertia'], response: HttpContext['response']) {
    response.status(404)
    return inertia.render('errors/not_found', {
      title: 'No encontramos ese plan',
      message: 'Puede que no exista en este centro.',
    })
  }
}
