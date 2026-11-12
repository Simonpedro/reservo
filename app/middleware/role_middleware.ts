import type { UserRole } from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { roles: UserRole[] }) {
    if (ctx.auth.user && options.roles.includes(ctx.auth.user.role)) return next()

    ctx.response.status(403)
    return ctx.response.send(await ctx.inertia.render('errors/forbidden', {}))
  }
}
