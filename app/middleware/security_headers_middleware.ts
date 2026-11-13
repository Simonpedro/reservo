import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Hardening headers that Shield does not cover. They hold for every
 * response, the 404 page and static files included.
 */
const SECURITY_HEADERS = {
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
} as const

export default class SecurityHeadersMiddleware {
  handle({ response }: HttpContext, next: NextFn) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      response.header(name, value)
    }
    return next()
  }
}
