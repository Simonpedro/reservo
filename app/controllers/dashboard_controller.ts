import { roleHome } from '#services/role_home'
import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  index({ auth, response }: HttpContext) {
    return response.redirect(roleHome(auth.user!.role))
  }
}
