import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RequireTenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.tenant) return next()

    ctx.response.status(404)
    return ctx.response.send(
      await ctx.inertia.render('errors/not_found', {
        title: 'Centro no encontrado',
        message: 'Ingresá desde el subdominio de tu centro.',
      })
    )
  }
}
