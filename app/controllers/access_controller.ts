import AccessLinks from '#services/access_links'
import { roleHome } from '#services/role_home'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccessController {
  /**
   * Signs a student in with their personal link and keeps them signed in.
   */
  async show({ params, tenant, auth, response, inertia }: HttpContext) {
    response.header('Referrer-Policy', 'no-referrer')
    response.header('Cache-Control', 'no-store')

    const result = await new AccessLinks().consume(tenant!, String(params.token))

    if (!result.ok) {
      response.status(result.reason === 'unknown' ? 404 : 410)
      return inertia.render('access/invalid', { reason: result.reason })
    }

    await auth.use('web').login(result.user, true)
    return response.redirect(roleHome(result.user.role))
  }
}
