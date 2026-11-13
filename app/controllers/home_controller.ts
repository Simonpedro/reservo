import { roleHome } from '#services/role_home'
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  /**
   * Signed-in people of this tenant go straight to their home screen.
   */
  index({ auth, tenant, inertia, response }: HttpContext) {
    const user = auth.user
    if (user && tenant && user.tenantId === tenant.id) {
      return response.redirect(roleHome(user.role))
    }
    return inertia.render('home', {})
  }
}
