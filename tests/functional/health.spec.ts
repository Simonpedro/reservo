import { test } from '@japa/runner'

test.group('Health', () => {
  test('returns an ok response', async ({ client }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    response.assertBody({ status: 'ok' })
  })
})

test.group('Security headers', () => {
  test('every response limits the referrer, browser features and opener', async ({ client }) => {
    for (const response of [
      await client.get('/health'),
      await client.get('/login').header('host', 'kinaf.localhost:3333'),
      await client.get('/no-existe').header('host', 'kinaf.localhost:3333'),
    ]) {
      response.assertHeader('referrer-policy', 'strict-origin-when-cross-origin')
      response.assertHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()')
      response.assertHeader('cross-origin-opener-policy', 'same-origin')
    }
  })
})
