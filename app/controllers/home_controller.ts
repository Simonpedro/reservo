import { roleHome } from '#services/role_home'
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  /**
   * Inside a tenant, `/` is never a page of its own: signed-in people go to
   * their home screen (the auth middleware fails closed on a foreign
   * session) and everyone else to the login. Only the apex shows a landing.
   */
  index({ auth, tenant, inertia, response }: HttpContext) {
    if (!tenant) {
      return inertia.render('home', {})
    }
    return response.redirect(auth.user ? roleHome(auth.user.role) : '/login')
  }
}
