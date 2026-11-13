import { tenantThemeCss } from '#services/tenant_theme'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    /**
     * The share method is called everytime an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     *
     * In that case, we must always assume that HttpContext is not fully hydrated
     * with all the properties
     */
    const { auth, tenant } = ctx as Partial<HttpContext>

    /**
     * Data shared with all Inertia pages. Make sure you are using
     * transformers for rich data-types like Models.
     */
    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      tenant: ctx.inertia.always(
        tenant
          ? {
              name: tenant.name,
              slug: tenant.slug,
              theme: tenant.theme,
              whatsappPhone: tenant.whatsappPhone,
              themeCss: tenantThemeCss(tenant.theme),
            }
          : null
      ),
      auth: ctx.inertia.always({
        user: auth?.user
          ? {
              id: auth.user.id,
              email: auth.user.email,
              fullName: auth.user.fullName,
              role: auth.user.role,
              phone: auth.user.phone,
            }
          : null,
      }),
    }
  }

  flash(ctx: HttpContext) {
    /**
     * Flash messages travel in the dedicated `flash` field of the page
     * object instead of props, and the client strips them from history
     * state so they never reappear when navigating back.
     */
    const { session } = ctx as Partial<HttpContext>

    const success: string | undefined = session?.flashMessages.get('success')
    const error: string | undefined = session?.flashMessages.get('error')
    const accessLink:
      | {
          url: string
          whatsappUrl: string | null
        }
      | undefined = session?.flashMessages.get('accessLink')
    const assigned: { startsOn: string } | undefined = session?.flashMessages.get('assigned')
    const capacityBlocked: { fixed: number; requested: number } | undefined =
      session?.flashMessages.get('capacityBlocked')

    return { success, error, accessLink, assigned, capacityBlocked }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
