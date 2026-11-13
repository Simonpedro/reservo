import { AccessLinkFactory } from '#database/factories/booking_factories'
import { TenantFactory } from '#database/factories/tenant_factory'
import { UserFactory } from '#database/factories/user_factory'
import AccessLink from '#models/access_link'
import Tenant from '#models/tenant'
import AccessLinks, { hashToken } from '#services/access_links'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const port = env.get('PORT')
const kinafHost = `kinaf.localhost:${port}`

async function kinafStudent() {
  const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
  const user = await UserFactory.merge({ tenantId: kinaf.id, fullName: 'Lu Martínez' }).create()
  return { kinaf, user }
}

test.group('Access links', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a valid link signs the student in and opens Mis clases', async ({ client, assert }) => {
    const { user } = await kinafStudent()
    const { token, url } = await new AccessLinks().issue(user)

    assert.equal(url, `${new URL(env.get('APP_URL')).origin}/acceso/${token}`)

    const access = await client.get(`/acceso/${token}`).header('host', kinafHost).redirects(0)

    access.assertStatus(302)
    access.assertHeader('location', '/clases')
    access.assertHeader('referrer-policy', 'no-referrer')

    const home = await client
      .get('/clases')
      .header('host', kinafHost)
      .withSession(access.sessionBag.values)
      .withInertia()

    home.assertStatus(200)
    home.assertInertiaComponent('client/my_classes')
    assert.equal(home.inertiaProps.auth.user.id, user.id)
  })

  test('the link keeps working until it expires and records its use', async ({
    client,
    assert,
  }) => {
    const { user } = await kinafStudent()
    const { token, link } = await new AccessLinks().issue(user)

    for (let visit = 0; visit < 2; visit++) {
      const access = await client.get(`/acceso/${token}`).header('host', kinafHost).redirects(0)
      access.assertStatus(302)
      access.assertHeader('location', '/clases')
    }

    await link.refresh()
    assert.isNotNull(link.lastUsedAt)
  })

  test('an expired link does not sign in', async ({ client }) => {
    const { kinaf, user } = await kinafStudent()
    await AccessLinkFactory.merge({
      tenantId: kinaf.id,
      userId: user.id,
      tokenHash: hashToken('vencido'),
      expiresAt: DateTime.now().minus({ minutes: 1 }),
    }).create()

    const access = await client.get('/acceso/vencido').header('host', kinafHost).withInertia()

    access.assertStatus(410)
    access.assertInertiaComponent('access/invalid')
    access.assertInertiaPropsContains({ reason: 'expired' })
    access.assertInertiaPropsContains({ auth: { user: null } })
  })

  test('issuing a new link revokes the previous one', async ({ client, assert }) => {
    const { user } = await kinafStudent()
    const links = new AccessLinks()
    const first = await links.issue(user)
    const second = await links.issue(user)

    const old = await client.get(`/acceso/${first.token}`).header('host', kinafHost).withInertia()
    old.assertStatus(410)
    old.assertInertiaPropsContains({ reason: 'revoked' })

    const current = await client
      .get(`/acceso/${second.token}`)
      .header('host', kinafHost)
      .redirects(0)
    current.assertStatus(302)

    const active = await AccessLink.query().where('userId', user.id).whereNull('revokedAt')
    assert.lengthOf(active, 1)
  })

  test("another tenant's link does not work on this tenant", async ({ client }) => {
    const other = await TenantFactory.create()
    const outsider = await UserFactory.merge({ tenantId: other.id }).create()
    const { token } = await new AccessLinks().issue(outsider)

    const access = await client.get(`/acceso/${token}`).header('host', kinafHost).withInertia()

    access.assertStatus(404)
    access.assertInertiaComponent('access/invalid')
    access.assertInertiaPropsContains({ reason: 'unknown' })

    const own = await client
      .get(`/acceso/${token}`)
      .header('host', `${other.slug}.localhost:${port}`)
      .redirects(0)
    own.assertStatus(302)
    own.assertHeader('location', '/clases')
  })

  test('an unknown token shows the friendly error', async ({ client }) => {
    const access = await client.get('/acceso/no-existe').header('host', kinafHost).withInertia()

    access.assertStatus(404)
    access.assertInertiaComponent('access/invalid')
  })

  test('links only sign in students, never admins', async ({ client }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const admin = await UserFactory.apply('admin').merge({ tenantId: kinaf.id }).create()
    const { token } = await new AccessLinks().issue(admin)

    const access = await client.get(`/acceso/${token}`).header('host', kinafHost).withInertia()

    access.assertStatus(404)
  })

  test('the link URL uses the tenant domain when APP_URL is another tenant', async ({ assert }) => {
    const other = await TenantFactory.create()
    const outsider = await UserFactory.merge({ tenantId: other.id }).create()

    const { url, token } = await new AccessLinks().issue(outsider)

    assert.equal(url, `https://${other.slug}.reservo.fit/acceso/${token}`)
  })
})
