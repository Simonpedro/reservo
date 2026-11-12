import { test } from '@japa/runner'

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
