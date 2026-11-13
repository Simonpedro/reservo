import { myPlan } from '#services/my_plan'
import type { HttpContext } from '@adonisjs/core/http'

export default class MyPlanController {
  async index({ auth, inertia }: HttpContext) {
    const view = await myPlan(auth.user!)
    return inertia.render('client/plan', { view })
  }
}
