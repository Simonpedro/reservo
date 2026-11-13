import { test } from '@japa/runner'
import env from '#start/env'

const loginUrl = `http://kinaf.localhost:${env.get('PORT')}/login`

test.group('Login page', () => {
  test('shows the tenant name and the login form', async ({ visit }) => {
    const page = await visit(loginUrl)

    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Ingresá' }))
    await page.assertTextContains('main', 'Kinaf')
    await page.assertVisible(page.getByLabel('Email'))
    await page.assertVisible(page.getByLabel('Contraseña'))
    await page.assertVisible(page.getByRole('button', { name: 'Ingresar' }))
  })

  test('tells the admin when the email or password do not match', async ({ visit }) => {
    const page = await visit(loginUrl)

    await page.getByLabel('Email').fill('admin@kinaf.test')
    await page.getByLabel('Contraseña').fill('incorrecta')
    await page.getByRole('button', { name: 'Ingresar' }).click()

    await page.assertVisible(page.getByText('El email o la contraseña no coinciden.'))
    await page.assertInputValue('#email', 'admin@kinaf.test')
  })
})
