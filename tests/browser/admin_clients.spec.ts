import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const baseUrl = `http://kinaf.localhost:${env.get('PORT')}`

test.group('Admin clients', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin creates a student and gets an access link', async ({ visit }) => {
    const page = await visit(`${baseUrl}/login`)

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
  })
})
