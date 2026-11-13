import DailyProcess from '#services/daily_process'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import { createHash, timingSafeEqual } from 'node:crypto'

function bearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

function tokensMatch(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export default class InternalDailyController {
  async run({ request, response }: HttpContext) {
    const configured = env.get('DAILY_RUN_TOKEN')
    if (!configured) {
      return response.status(404).send({ error: 'Not found' })
    }

    const token = bearerToken(request.header('authorization'))
    if (!token || !tokensMatch(token, configured)) {
      return response.status(401).send({ error: 'Unauthorized' })
    }

    const summary = await new DailyProcess().runAllTenants()
    return response.status(200).send(summary)
  }
}
