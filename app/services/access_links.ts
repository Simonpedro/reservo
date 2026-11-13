import AccessLink from '#models/access_link'
import Tenant from '#models/tenant'
import User from '#models/user'
import { tenantBaseUrl } from '#services/tenant_url'
import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

/**
 * How long an access link works.
 */
export const ACCESS_LINK_DAYS = 30

export type ConsumeResult =
  | { ok: true; user: User; link: AccessLink }
  | { ok: false; reason: 'unknown' | 'expired' | 'revoked' }

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function accessPath(token: string): string {
  return `/acceso/${encodeURIComponent(token)}`
}

/**
 * Personal sign-in links for students. A link is reusable until it expires;
 * issuing a new one revokes the previous ones.
 */
export default class AccessLinks {
  async issue(
    user: User,
    options: {
      /**
       * Origin to build the URL with. Defaults to the tenant URL.
       */
      baseUrl?: string
      /**
       * Only for the demo seed, which needs a known token.
       */
      token?: string
      now?: DateTime
    } = {}
  ) {
    const now = options.now ?? DateTime.now()
    const token = options.token ?? randomBytes(32).toString('base64url')

    await AccessLink.query()
      .where('tenantId', user.tenantId)
      .where('userId', user.id)
      .whereNull('revokedAt')
      .update({ revokedAt: now.toJSDate(), updatedAt: now.toJSDate() })

    const link = await AccessLink.create({
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: now.plus({ days: ACCESS_LINK_DAYS }),
    })

    let baseUrl = options.baseUrl
    if (!baseUrl) {
      const tenant = await Tenant.findOrFail(user.tenantId)
      baseUrl = tenantBaseUrl(tenant.slug)
    }

    return { url: new URL(accessPath(token), baseUrl).toString(), token, link }
  }

  /**
   * Resolves a token to its student within the tenant, and records the use.
   */
  async consume(tenant: Tenant, token: string, now = DateTime.now()): Promise<ConsumeResult> {
    const link = await AccessLink.query()
      .where('tenantId', tenant.id)
      .where('tokenHash', hashToken(token))
      .first()

    if (!link) return { ok: false, reason: 'unknown' }
    if (link.revokedAt) return { ok: false, reason: 'revoked' }
    if (link.expiresAt <= now) return { ok: false, reason: 'expired' }

    const user = await User.query()
      .where('tenantId', tenant.id)
      .where('id', link.userId)
      .where('role', 'client')
      .first()
    if (!user) return { ok: false, reason: 'unknown' }

    link.lastUsedAt = now
    await link.save()

    return { ok: true, user, link }
  }
}
