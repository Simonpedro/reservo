import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import type { Locator, Page } from 'playwright'

const baseUrl = `http://kinaf.localhost:${env.get('PORT')}`

/**
 * The element is inside the viewport and clicking it would reach it: nothing,
 * like the fixed button, is drawn over it.
 */
async function uncovered(page: Page, locator: Locator) {
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  if (!box || !viewport || box.y < 0 || box.y + box.height > viewport.height) return false
  return locator.click({ trial: true, timeout: 1000 }).then(
    () => true,
    () => false
  )
}

test.group('Admin clients', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin creates a student and gets an access link', async ({ visit, assert }) => {
    const page = await visit(`${baseUrl}/login`)
    await page.setViewportSize({ width: 390, height: 667 })

    await page.getByLabel('Email').fill('admin@kinaf.test')
    await page.getByLabel('Contraseña').fill('KinafDev2026!')
    await page.getByRole('button', { name: 'Ingresar' }).click()

    await page.waitForURL(`${baseUrl}/admin/hoy`)
    await page.getByRole('link', { name: 'Clientes' }).click()
    await page.waitForURL(`${baseUrl}/admin/clientes`)
    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Clientes' }))

    await page.getByRole('link', { name: 'Dar de alta un alumno' }).click()
    await page.waitForURL(`${baseUrl}/admin/clientes/nuevo`)

    await page.getByLabel('Nombre y apellido').fill('Julieta Browser')
    await page.getByLabel('Email').fill('julieta-browser@kinaf.test')
    await page.getByLabel('Teléfono').fill('341 555-0222')
    await page.getByRole('button', { name: 'Crear alumno' }).click()

    await page.waitForURL(/\/admin\/clientes\/\d+$/)
    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Julieta Browser' }))

    await page.getByRole('button', { name: 'Generar link de acceso' }).click()
    await page.assertTextContains('main', '/acceso/')
    await page.assertVisible(page.getByRole('button', { name: 'Copiar link de acceso' }))
    await page.assertVisible(page.getByRole('link', { name: 'Abrir WhatsApp' }))

    // The link shows at the top, next to "Generamos un link nuevo.", and
    // neither it nor the end of the page hides under the fixed button.
    await page.assertVisible(page.getByText('Generamos un link nuevo.'))
    assert.isTrue(await uncovered(page, page.getByRole('link', { name: 'Abrir WhatsApp' })))
    await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)')
    assert.isTrue(
      await uncovered(page, page.getByRole('button', { name: 'Generar link de acceso' }))
    )
  })
})
