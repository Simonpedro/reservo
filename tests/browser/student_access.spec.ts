import { DEMO_ACCESS_TOKEN } from '#database/seeders/kinaf_demo_seeder'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const origin = () => `http://kinaf.localhost:${env.get('PORT')}`

test.group('Student access', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the demo student enters with her link and sees her classes', async ({ visit }) => {
    const page = await visit(`${origin()}/acceso/${DEMO_ACCESS_TOKEN}`)

    await page.assertPath('/clases')
    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Mis clases' }))
    await page.assertTextContains('header', 'Sofi!')
    await page.assertVisible(
      page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', {
        name: 'Mis clases',
      })
    )

    const firstClass = page.getByRole('link', { name: /^(Pilates|Yoga)/ }).first()
    await page.assertVisible(firstClass)

    await firstClass.click()
    await page.waitForURL(/\/clases\/\d+$/)
    await page.assertVisible(page.getByRole('heading', { level: 1, name: /Pilates|Yoga/ }))
    await page.assertNotExists('nav[aria-label="Navegación principal"]')
  })

  test('a broken link explains what to do', async ({ visit }) => {
    const page = await visit(`${origin()}/acceso/no-sirve`)

    await page.assertTextContains('h2', 'Este link no funciona.')
    await page.assertTextContains('main', 'Pedile a Kinaf un link nuevo')
  })
})
