import { test } from '@japa/runner'

const host = 'kinaf.localhost:3333'

test.group('Tenant login', () => {
  test('authenticates the Kinaf admin and reaches the admin area', async ({ client }) => {
    const login = await client
      .post('/login')
      .header('host', host)
      .form({
        email: 'admin@kinaf.test',
        password: 'KinafDev2026!',
      })
      .withCsrfToken()
      .redirects(0)

    login.assertStatus(302)
    login.assertHeader('location', '/admin')

    const home = await client
      .get('/admin')
      .header('host', host)
      .withSession(login.sessionBag.values)
      .redirects(0)

    home.assertStatus(302)
    home.assertHeader('location', '/admin/hoy')

    const today = await client
      .get('/admin/hoy')
      .header('host', host)
      .withSession(login.sessionBag.values)
      .withInertia()

    today.assertStatus(200)
    today.assertInertiaComponent('admin/today')
  })

  test('rejects invalid credentials and does not authenticate', async ({ client }) => {
    const login = await client
      .post('/login')
      .header('host', host)
      .header('referer', `http://${host}/login`)
      .form({
        email: 'admin@kinaf.test',
        password: 'incorrecta',
      })
      .withCsrfToken()
      .redirects(0)

    login.assertStatus(302)
    login.assertHeader('location', `http://${host}/login`)

    const admin = await client
      .get('/admin')
      .header('host', host)
      .withSession(login.sessionBag.values)
      .redirects(0)

    admin.assertStatus(302)
    admin.assertHeader('location', '/login')
  })
})
