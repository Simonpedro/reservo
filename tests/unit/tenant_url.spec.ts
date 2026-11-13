import { tenantBaseUrl, tenantSlugFromHost } from '#services/tenant_url'
import env from '#start/env'
import { test } from '@japa/runner'

function useEnv(
  cleanup: (handler: () => void) => void,
  values: Partial<Record<'APP_URL' | 'FALLBACK_TENANT_SLUG', string>>
) {
  for (const [key, value] of Object.entries(values) as [keyof typeof values, string][]) {
    const previous = env.get(key) ?? ''
    env.set(key, value)
    cleanup(() => env.set(key, previous))
  }
}

test.group('Tenant URL', () => {
  test('reads the slug from a tenant host', ({ assert }) => {
    assert.equal(tenantSlugFromHost('kinaf.reservo.fit'), 'kinaf')
    assert.equal(tenantSlugFromHost('kinaf.localhost'), 'kinaf')
    assert.equal(tenantSlugFromHost('reservo.fit'), null)
    assert.equal(tenantSlugFromHost('www.reservo.fit'), null)
    assert.isUndefined(tenantSlugFromHost('reservo.fly.dev'))
  })

  test('builds the tenant URL from APP_URL when the host is that tenant', ({ assert, cleanup }) => {
    useEnv(cleanup, { APP_URL: 'http://kinaf.localhost:3333', FALLBACK_TENANT_SLUG: 'kinaf' })

    assert.equal(tenantBaseUrl('kinaf'), 'http://kinaf.localhost:3333')
    assert.equal(tenantBaseUrl('otro'), 'https://otro.reservo.fit')
  })

  test('does not use APP_URL when it only reaches the tenant through the fallback', ({
    assert,
    cleanup,
  }) => {
    useEnv(cleanup, { APP_URL: 'https://reservo.fly.dev', FALLBACK_TENANT_SLUG: 'kinaf' })

    assert.equal(tenantBaseUrl('kinaf'), 'https://kinaf.reservo.fit')
  })
})
