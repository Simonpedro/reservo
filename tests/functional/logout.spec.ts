import Tenant from '#models/tenant'
import { createCatalog, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const kinafHost = 'kinaf.localhost:3333'

test.group('Logout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('ends the session and returns to login', async ({ client }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const { user } = await createStudent(catalog)

    const signedIn = await client.get('/plan').header('host', kinafHost).loginAs(user).withInertia()

    signedIn.assertStatus(200)

    const logout = await client
      .post('/logout')
      .header('host', kinafHost)
      .withSession(signedIn.sessionBag.values)
      .withCsrfToken()
      .redirects(0)

    logout.assertStatus(302)
    logout.assertHeader('location', '/login')
    logout.assertHeader('clear-site-data', '"cache", "storage"')

    const after = await client
      .get('/plan')
      .header('host', kinafHost)
      .withSession(logout.sessionBag.values)
      .redirects(0)

    after.assertStatus(302)
    after.assertHeader('location', '/login')
  })
})
