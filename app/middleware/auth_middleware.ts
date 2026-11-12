import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    if (!ctx.tenant || ctx.auth.user!.tenantId !== ctx.tenant.id) {
      await ctx.auth.use('web').logout()
      ctx.session.flash('errors', {
        email: 'La sesión no corresponde a este centro.',
      })
      return ctx.response.redirect('/login')
    }

    return next()
  }
}
