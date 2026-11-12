import Tenant from '#models/tenant'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type { NextFn } from '@adonisjs/core/types/http'

function tenantSlugFromHost(host: string): string | null | undefined {
  const baseDomain = env.get('APP_BASE_DOMAIN', 'reservo.fit').toLowerCase()

  if (host === baseDomain || host === `www.${baseDomain}`) return null
  if (host.endsWith('.localhost')) return host.slice(0, -'.localhost'.length)
  if (host.endsWith(`.${baseDomain}`)) return host.slice(0, -(baseDomain.length + 1))
  if (host === 'localhost' || host === '127.0.0.1') return undefined
  return undefined
}

export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const host = (ctx.request.header('host') ?? '').split(':')[0].toLowerCase()
    let slug = tenantSlugFromHost(host)

    if (slug === null) {
      ctx.tenant = null
      return next()
    }

    if (!app.inProduction && !slug) {
      slug = ctx.request.header('x-tenant') ?? env.get('DEFAULT_TENANT_SLUG')
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
