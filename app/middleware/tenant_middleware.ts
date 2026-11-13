import Tenant from '#models/tenant'
import { tenantSlugFromHost } from '#services/tenant_url'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type { NextFn } from '@adonisjs/core/types/http'

export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const host = (ctx.request.header('host') ?? '').split(':')[0].toLowerCase()
    let slug = tenantSlugFromHost(host)

    if (slug === null) {
      ctx.tenant = null
      return next()
    }

    if (!slug && !app.inProduction) {
      slug = ctx.request.header('x-tenant') || env.get('DEFAULT_TENANT_SLUG')
    }

    /**
     * Hosts outside the tenant domains (e.g. reservo.fly.dev while there is
     * no DNS) resolve to the fallback tenant, also in production.
     */
    if (!slug) {
      slug = env.get('FALLBACK_TENANT_SLUG')
    }

    if (!slug || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) {
      ctx.tenant = null
      ctx.response.status(404)
      return ctx.response.send(
        await ctx.inertia.render('errors/not_found', {
          title: 'Centro no encontrado',
          message: 'No encontramos un centro para este dominio.',
        })
      )
    }

    ctx.tenant = await Tenant.findBy('slug', slug)
    if (!ctx.tenant) {
      ctx.response.status(404)
      return ctx.response.send(
        await ctx.inertia.render('errors/not_found', {
          title: 'Centro no encontrado',
          message: `No existe un centro con el identificador "${slug}".`,
        })
      )
    }

    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    tenant: Tenant | null
  }
}
