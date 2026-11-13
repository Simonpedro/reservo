import { test } from '@japa/runner'
import env from '#start/env'

const loginUrl = `http://kinaf.localhost:${env.get('PORT')}/login`

test.group('Login page', () => {
  test('shows the tenant name and the login form', async ({ visit }) => {
    const page = await visit(loginUrl)

    await page.assertTextContains('[data-slot="card-title"]', 'Ingresá a Kinaf')
    await page.assertVisible(page.getByLabel('Email'))
    await page.assertVisible(page.getByLabel('Contraseña'))
    await page.assertVisible(page.getByRole('button', { name: 'Ingresar' }))
  })
})
