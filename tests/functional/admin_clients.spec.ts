import { TenantFactory } from '#database/factories/tenant_factory'
import { UserFactory } from '#database/factories/user_factory'
import AccessLink from '#models/access_link'
import Tenant from '#models/tenant'
import User from '#models/user'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const host = `kinaf.localhost:${env.get('PORT')}`

test.group('Admin clients', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a client user in the tenant from the admin flow', async ({ client, assert }) => {
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

    const create = await client
      .post('/admin/clientes')
      .header('host', host)
      .withSession(login.sessionBag.values)
      .form({
        fullName: 'Luz Gómez',
        email: 'luz.gomez@kinaf.test',
        phone: '341 555-0111',
      })
      .withCsrfToken()
      .redirects(0)

    create.assertStatus(302)

    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const created = await User.query()
      .where('tenantId', kinaf.id)
      .where('email', 'luz.gomez@kinaf.test')
      .firstOrFail()

    assert.equal(created.role, 'client')
    assert.equal(created.fullName, 'Luz Gómez')
    assert.equal(created.phone, '341 555-0111')
    assert.notEqual(created.password, '')
    create.assertHeader('location', `/admin/clientes/${created.id}`)
  })

  test('shows a friendly validation error when the email already exists in this tenant', async ({
    client,
    assert,
  }) => {
    const login = await client
      .post('/login')
      .header('host', host)
      .form({
        email: 'admin@kinaf.test',
        password: 'KinafDev2026!',
      })
      .withCsrfToken()
      .redirects(0)

    const create = await client
      .post('/admin/clientes')
      .header('host', host)
      .header('referer', `http://${host}/admin/clientes/nuevo`)
      .withSession(login.sessionBag.values)
      .form({
        fullName: 'Sofi Repetida',
        email: 'sofi@kinaf.test',
        phone: '341 555-0112',
      })
      .withCsrfToken()
      .redirects(0)

    create.assertStatus(302)
    create.assertHeader('location', `http://${host}/admin/clientes/nuevo`)
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const repeated = await User.query()
      .where('tenantId', kinaf.id)
      .where('email', 'sofi@kinaf.test')
    assert.lengthOf(repeated, 1)
  })

  test('search stays scoped to the current tenant', async ({ client, assert }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const other = await TenantFactory.create()

    await UserFactory.merge({
      tenantId: kinaf.id,
      fullName: 'Rocío Local',
      email: 'rocio-local@kinaf.test',
    }).create()
    await UserFactory.merge({
      tenantId: other.id,
      fullName: 'Rocío Externa',
      email: 'rocio-externa@other.test',
    }).create()

    const login = await client
      .post('/login')
      .header('host', host)
      .form({
        email: 'admin@kinaf.test',
        password: 'KinafDev2026!',
      })
      .withCsrfToken()
      .redirects(0)
    const search = await client
      .get('/admin/clientes?q=Rocío')
      .header('host', host)
      .withSession(login.sessionBag.values)
      .withInertia()

    search.assertStatus(200)
    search.assertInertiaComponent('admin/clients/index')
    const names = (search.inertiaProps.items as Array<{ fullName: string }>).map(
      (item) => item.fullName
    )
    assert.include(names, 'Rocío Local')
    assert.notInclude(names, 'Rocío Externa')
  })

  test('generating an access link revokes the previous one', async ({ client, assert }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const student = await UserFactory.merge({
      tenantId: kinaf.id,
      fullName: 'Rami Link',
      email: 'rami-link@kinaf.test',
    }).create()

    const login = await client
      .post('/login')
      .header('host', host)
      .form({
        email: 'admin@kinaf.test',
        password: 'KinafDev2026!',
      })
      .withCsrfToken()
      .redirects(0)

    await client
      .post(`/admin/clientes/${student.id}/access-link`)
      .header('host', host)
      .withSession(login.sessionBag.values)
      .withCsrfToken()
      .redirects(0)

    await client
      .post(`/admin/clientes/${student.id}/access-link`)
      .header('host', host)
      .withSession(login.sessionBag.values)
      .withCsrfToken()
      .redirects(0)

    const links = await AccessLink.query().where('tenantId', kinaf.id).where('userId', student.id)
    assert.lengthOf(links, 2)
    assert.lengthOf(
      links.filter((link) => link.revokedAt === null),
      1
    )
  })

  test('a client created from admin cannot sign in with email and password', async ({ client }) => {
    const login = await client
      .post('/login')
      .header('host', host)
      .form({
        email: 'admin@kinaf.test',
        password: 'KinafDev2026!',
      })
      .withCsrfToken()
      .redirects(0)

    await client
      .post('/admin/clientes')
      .header('host', host)
      .withSession(login.sessionBag.values)
      .form({
        fullName: 'Dani Sin Clave',
        email: 'dani-sin-clave@kinaf.test',
        phone: '341 555-0113',
      })
      .withCsrfToken()
      .redirects(0)

    const denied = await client
      .post('/login')
      .header('host', host)
      .header('referer', `http://${host}/login`)
      .form({
        email: 'dani-sin-clave@kinaf.test',
        password: 'ClaveQueNoExiste123',
      })
      .withCsrfToken()
      .redirects(0)

    denied.assertStatus(302)
    denied.assertHeader('location', `http://${host}/login`)
  })
})
