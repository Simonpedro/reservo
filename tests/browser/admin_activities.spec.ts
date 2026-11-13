import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const baseUrl = `http://kinaf.localhost:${env.get('PORT')}`

test.group('Admin activities', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin creates and renames an activity from Ajustes', async ({ assert, visit }) => {
    const page = await visit(`${baseUrl}/login`)

    await page.getByLabel('Email').fill('admin@kinaf.test')
    await page.getByLabel('Contraseña').fill('KinafDev2026!')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await page.waitForURL(`${baseUrl}/admin/hoy`)

    await page.getByRole('link', { name: 'Abrir ajustes' }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes`)
    await page.getByRole('link', { name: /Actividades/ }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes/actividades`)
    await page.getByRole('link', { name: 'Nueva actividad' }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes/actividades/nuevo`)

    await page.getByLabel('Nombre').fill('yoga')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await page.assertTextContains('#name-error', 'Ya hay una actividad con ese nombre.')

    await page.getByLabel('Nombre').fill('Kinesio')
    await page.getByLabel('Verde').check()
    await page.getByRole('button', { name: 'Guardar' }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes/actividades`)
    await page.assertTextContains('main', 'Creamos la actividad.')

    await page.getByRole('link', { name: /Kinesio.*Tarjeta verde · Sin clases/ }).click()
    await page.assertInputValue(page.getByLabel('Nombre'), 'Kinesio')
    await page.getByLabel('Nombre').fill('Kinesiología')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await page.waitForURL(`${baseUrl}/admin/ajustes/actividades`)
    await page.assertTextContains('main', 'Guardamos los cambios de la actividad.')
    await page.assertVisible(page.getByRole('link', { name: /Kinesiología/ }))
    assert.equal(await page.getByRole('link', { name: /Kinesio/ }).count(), 1)
  })
})
