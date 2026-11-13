import { PNG_BYTES } from '#database/factories/fee_factories'
import MonthlyFee from '#models/monthly_fee'
import Receipt from '#models/receipt'
import Tenant from '#models/tenant'
import env from '#start/env'
import { createCatalog, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const origin = () => `http://kinaf.localhost:${env.get('PORT')}`

test.group('Subir comprobante', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the student uploads a receipt and the fee goes to review', async ({
    assert,
    browserContext,
    visit,
  }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const sofi = await createStudent(catalog, { fullName: 'Sofi Ortiz' })
    await sofi.plan.merge({ price: 38000 }).save()
    await browserContext.initiateSession({ domain: 'kinaf.localhost' })
    await browserContext.loginAs(sofi.user)

    const page = await visit(`${origin()}/pagos`)
    await page.assertVisible(page.getByRole('heading', { name: 'Pagos' }))
    await page.assertVisible(page.getByText('$38.000'))
    await page.assertVisible(page.getByText(/KINAF\.KINESIOLOGIA o KINAF\.KINE\.AF/))

    await page.getByRole('link', { name: 'Subir comprobante' }).click()
    await page.waitForURL(/\/pagos\/\d+\/comprobante$/)
    await page.assertVisible(page.getByRole('heading', { name: 'Subir comprobante' }))
    await page.assertVisible(page.getByRole('button', { name: 'Elegir foto o PDF' }))

    await page.locator('input[type="file"]').setInputFiles({
      name: 'transferencia-noviembre.png',
      mimeType: 'image/png',
      buffer: PNG_BYTES,
    })
    await page.assertVisible(page.getByText('transferencia-noviembre.png'))
    await page.assertVisible(page.getByText('Foto · 1 KB'))

    await page.getByRole('button', { name: 'Enviar comprobante' }).click()
    await page.waitForURL(/\/pagos$/)
    await page.assertVisible(page.getByText('Lo recibimos.'))
    await page.assertVisible(page.getByText('En revisión'))
    await page.assertNotExists(page.getByRole('link', { name: 'Subir comprobante' }))

    const fee = await MonthlyFee.query().where('userId', sofi.user.id).firstOrFail()
    assert.equal(fee.status, 'in_review')
    const receipt = await Receipt.query().where('monthlyFeeId', fee.id).firstOrFail()
    assert.isTrue(receipt.data.equals(PNG_BYTES))
  })

  test('a file over 5 MB is refused before uploading', async ({ browserContext, visit }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const sofi = await createStudent(catalog, { fullName: 'Sofi Ortiz' })
    await browserContext.initiateSession({ domain: 'kinaf.localhost' })
    await browserContext.loginAs(sofi.user)

    const page = await visit(`${origin()}/pagos`)
    await page.getByRole('link', { name: 'Subir comprobante' }).click()
    await page.waitForURL(/\/pagos\/\d+\/comprobante$/)

    await page.locator('input[type="file"]').setInputFiles({
      name: 'enorme.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    })
    await page.assertVisible(
      page.getByText('El archivo pesa más de 5 MB. Probá con una foto más liviana.')
    )
    await page.assertVisible(page.getByRole('button', { name: 'Elegir foto o PDF' }))
  })
})
