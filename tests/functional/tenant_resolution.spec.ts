import { test } from '@japa/runner'
import env from '#start/env'

test.group('Tenant resolution', () => {
  test('loads Kinaf from the development host', async ({ client }) => {
    const response = await client.get('/').header('host', 'kinaf.localhost:3333').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('home')
    response.assertInertiaPropsContains({
      tenant: {
        name: 'Kinaf',
        slug: 'kinaf',
      },
    })
  })

  test('returns 404 for an unknown tenant', async ({ client }) => {
    const response = await client
      .get('/')
      .header('host', 'desconocido.localhost:3333')
      .withInertia()

    response.assertStatus(404)
    response.assertInertiaComponent('errors/not_found')
  })
})

/**
 * Overrides tenancy env vars for one test. Env values are read on every
 * request, so `env.set` takes effect immediately; an empty string unsets.
 */
function useTenantEnv(
  cleanup: (handler: () => void) => void,
  values: Partial<Record<'FALLBACK_TENANT_SLUG' | 'DEFAULT_TENANT_SLUG', string>>
) {
  for (const [key, value] of Object.entries(values) as [keyof typeof values, string][]) {
    const previous = env.get(key) ?? ''
    env.set(key, value)
    cleanup(() => env.set(key, previous))
  }
}

test.group('Tenant resolution / fallback tenant', () => {
  test('resolves a host outside the tenant domains to the fallback tenant', async ({
    client,
    cleanup,
  }) => {
    useTenantEnv(cleanup, { FALLBACK_TENANT_SLUG: 'kinaf', DEFAULT_TENANT_SLUG: '' })

    const response = await client.get('/').header('host', 'reservo.fly.dev').withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ tenant: { name: 'Kinaf', slug: 'kinaf' } })
  })

  test('returns 404 for a host outside the tenant domains without a fallback', async ({
    client,
    cleanup,
  }) => {
    useTenantEnv(cleanup, { FALLBACK_TENANT_SLUG: '', DEFAULT_TENANT_SLUG: '' })

    const response = await client.get('/').header('host', 'reservo.fly.dev').withInertia()

    response.assertStatus(404)
    response.assertInertiaComponent('errors/not_found')
  })

  test('does not apply the fallback to unknown tenant subdomains', async ({ client, cleanup }) => {
    useTenantEnv(cleanup, { FALLBACK_TENANT_SLUG: 'kinaf' })

    const response = await client.get('/').header('host', 'otro.reservo.fit').withInertia()

    response.assertStatus(404)
    response.assertInertiaComponent('errors/not_found')
  })

  test('keeps the apex domain as the generic landing', async ({ client, cleanup }) => {
    useTenantEnv(cleanup, { FALLBACK_TENANT_SLUG: 'kinaf' })

    const response = await client.get('/').header('host', 'reservo.fit').withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ tenant: null })
  })

  test('returns 404 when the fallback points to a missing tenant', async ({ client, cleanup }) => {
    useTenantEnv(cleanup, { FALLBACK_TENANT_SLUG: 'inexistente', DEFAULT_TENANT_SLUG: '' })

    const response = await client.get('/').header('host', 'reservo.fly.dev').withInertia()

    response.assertStatus(404)
    response.assertInertiaComponent('errors/not_found')
  })

  test('lets the x-tenant header win over the fallback outside production', async ({
    client,
    cleanup,
  }) => {
    useTenantEnv(cleanup, { FALLBACK_TENANT_SLUG: 'inexistente', DEFAULT_TENANT_SLUG: '' })

    const response = await client
      .get('/')
      .header('host', 'reservo.fly.dev')
      .header('x-tenant', 'kinaf')
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaPropsContains({ tenant: { slug: 'kinaf' } })
  })
})
