import env from '#start/env'

/**
 * Tenant slug a host points to: a slug, `null` for the apex/`www` (no
 * tenant), or `undefined` when the host is outside the tenant domains.
 */
export function tenantSlugFromHost(host: string): string | null | undefined {
  const baseDomain = env.get('APP_BASE_DOMAIN', 'reservo.fit').toLowerCase()

  if (host === baseDomain || host === `www.${baseDomain}`) return null
  if (host.endsWith('.localhost')) return host.slice(0, -'.localhost'.length)
  if (host.endsWith(`.${baseDomain}`)) return host.slice(0, -(baseDomain.length + 1))
  return undefined
}

/**
 * Absolute origin where a tenant is served. APP_URL wins only when its
 * host is already that tenant (local `kinaf.localhost`, or
 * `kinaf.reservo.fit` in production). Hosts that reach a tenant through
 * FALLBACK_TENANT_SLUG (for example reservo.fly.dev) do not win, so
 * admin-issued links always use `https://<slug>.<base domain>`.
 */
export function tenantBaseUrl(slug: string): string {
  const appUrl = new URL(env.get('APP_URL'))
  if (tenantSlugFromHost(appUrl.hostname.toLowerCase()) === slug) {
    return appUrl.origin
  }
  return `https://${slug}.${env.get('APP_BASE_DOMAIN', 'reservo.fit')}`
}
