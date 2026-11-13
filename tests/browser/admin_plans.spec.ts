import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const baseUrl = `http://kinaf.localhost:${env.get('PORT')}`

test.group('Admin plans', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin creates a plan with two quotas from Ajustes', async ({ visit }) => {
    const page = await visit(`${baseUrl}/login`)

    await page.getByLabel('Email').fill('admin@kinaf.test')
    await page.getByLabel('Contraseña').fill('KinafDev2026!')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await page.waitForURL(`${baseUrl}/admin/hoy`)

    await page.getByRole('link', { name: 'Abrir ajustes' }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes`)
    await page.getByRole('link', { name: /Planes/ }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes/planes`)
    await page.getByRole('link', { name: 'Nuevo plan' }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes/planes/nuevo`)

    await page.getByLabel('Nombre').fill('Yoga más libre')
    await page.getByLabel('Precio por mes').fill('36500')
    await page.assertInputValue(page.getByLabel('Precio por mes'), '36.500')

    await page.locator('label', { hasText: 'Yoga' }).click()
    await page.assertChecked(page.getByRole('checkbox', { name: 'Yoga' }))
    await page.getByRole('button', { name: 'Agregar otro cupo' }).click()
    await page.getByLabel('Cupo 2: clases por semana').selectOption('2')
    await page.assertTextContains(
      'main',
      'Total: 3 clases por semana · 1 clase de Yoga + 2 clases libres'
    )

    await page.getByRole('button', { name: 'Guardar' }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes/planes`)
    await page.assertTextContains('main', 'Creamos el plan.')
    await page.assertVisible(
      page.getByRole('link', {
        name: /Yoga más libre.*1 clase de Yoga \+ 2 clases libres · \$36\.500/,
      })
    )
  })
})
