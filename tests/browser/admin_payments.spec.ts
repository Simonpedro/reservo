import { MonthlyFeeFactory, ReceiptFactory } from '#database/factories/fee_factories'
import Tenant from '#models/tenant'
import User from '#models/user'
import { businessDate, businessNow } from '#services/business_calendar'
import { periodOf } from '#services/fees'
import env from '#start/env'
import { createCatalog, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const origin = () => `http://kinaf.localhost:${env.get('PORT')}`

test.group('Admin pagos', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the admin reviews a receipt and approves it', async ({ assert, browserContext, visit }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const admin = await User.findByOrFail({ tenantId: kinaf.id, email: 'admin@kinaf.test' })
    const catalog = await createCatalog(kinaf)
    const ana = await createStudent(catalog, { fullName: 'Ana Gómez Prueba' })
    const fee = await MonthlyFeeFactory.merge({
      tenantId: kinaf.id,
      userId: ana.user.id,
      subscriptionId: ana.subscription.id,
      period: DateTime.fromISO(periodOf(businessDate(businessNow()))),
      amount: 38000,
      status: 'in_review',
    }).create()
    const receipt = await ReceiptFactory.merge({
      tenantId: kinaf.id,
      monthlyFeeId: fee.id,
      userId: ana.user.id,
    }).create()

    await browserContext.initiateSession({ domain: 'kinaf.localhost' })
    await browserContext.loginAs(admin)

    const page = await visit(`${origin()}/admin/pagos`)
    await page.assertVisible(page.getByRole('heading', { name: 'Pagos', level: 1 }))
    await page.assertVisible(page.getByRole('heading', { name: 'Para revisar' }))

    await page.getByRole('link', { name: /Ana Gómez Prueba.*Comprobante · \$38\.000/ }).click()
    await page.waitForURL(`${origin()}/admin/pagos/${fee.id}`)
    await page.assertVisible(page.getByRole('heading', { name: 'Ana Gómez Prueba' }))
    await page.assertVisible(page.getByText(/\$38\.000 · subido hoy/))
    await page.assertVisible(page.getByRole('img', { name: 'Comprobante de Ana Gómez Prueba' }))

    await page.getByRole('button', { name: 'Aprobar pago' }).click()
    await page.waitForURL(`${origin()}/admin/pagos`)
    await page.assertVisible(page.getByText('Listo, Ana quedó al día.'))
    await page.assertNotExists(page.getByRole('link', { name: /Ana Gómez Prueba/ }))

    await fee.refresh()
    assert.equal(fee.status, 'paid')
    assert.equal(fee.method, 'transfer')
    assert.equal(fee.recordedById, admin.id)
    await receipt.refresh()
    assert.equal(receipt.status, 'approved')
  })

  test('the admin rejects a receipt after confirming', async ({
    assert,
    browserContext,
    visit,
  }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const admin = await User.findByOrFail({ tenantId: kinaf.id, email: 'admin@kinaf.test' })
    const catalog = await createCatalog(kinaf)
    const tomi = await createStudent(catalog, { fullName: 'Tomi Sosa Prueba' })
    const fee = await MonthlyFeeFactory.merge({
      tenantId: kinaf.id,
      userId: tomi.user.id,
      subscriptionId: tomi.subscription.id,
      period: DateTime.fromISO(periodOf(businessDate(businessNow()))),
      amount: 30000,
      status: 'in_review',
    }).create()
    await ReceiptFactory.merge({
      tenantId: kinaf.id,
      monthlyFeeId: fee.id,
      userId: tomi.user.id,
    }).create()

    await browserContext.initiateSession({ domain: 'kinaf.localhost' })
    await browserContext.loginAs(admin)

    const page = await visit(`${origin()}/admin/pagos/${fee.id}`)
    await page.getByRole('button', { name: 'Rechazar comprobante' }).click()
    await page.assertVisible(page.getByRole('heading', { name: '¿Rechazamos el comprobante?' }))
    await page.assertVisible(page.getByText('Tomi lo va a ver en la app y va a poder subir otro.'))
    await page.getByRole('button', { name: 'Rechazar', exact: true }).click()
    await page.waitForURL(`${origin()}/admin/pagos`)
    await page.assertVisible(page.getByText(/Rechazamos el comprobante\. Tomi/))

    await fee.refresh()
    assert.equal(fee.status, 'pending')
  })

  test('the admin registers a cash payment from an overdue fee', async ({
    assert,
    browserContext,
    visit,
  }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const admin = await User.findByOrFail({ tenantId: kinaf.id, email: 'admin@kinaf.test' })
    const catalog = await createCatalog(kinaf)
    const mati = await createStudent(catalog, { fullName: 'Mati Ruiz Prueba' })
    await mati.plan.merge({ price: 42000 }).save()
    const fee = await MonthlyFeeFactory.merge({
      tenantId: kinaf.id,
      userId: mati.user.id,
      subscriptionId: mati.subscription.id,
      period: DateTime.fromISO(periodOf(businessDate(businessNow()))).minus({ months: 1 }),
      amount: 42000,
    }).create()

    await browserContext.initiateSession({ domain: 'kinaf.localhost' })
    await browserContext.loginAs(admin)

    const page = await visit(`${origin()}/admin/pagos`)
    await page.getByRole('link', { name: /Mati Ruiz Prueba.*Desde el 11 de/ }).click()
    await page.waitForURL(/\/admin\/pagos\/registrar\?/)
    await page.assertVisible(page.getByRole('heading', { name: 'Registrar un pago' }))
    await page.assertInputValue(page.getByLabel('Monto'), '42.000')
    await page.getByLabel('Monto').fill('40000')
    await page.assertInputValue(page.getByLabel('Monto'), '40.000')
    await page.getByLabel('Medio').selectOption('cash')

    await page.getByRole('button', { name: 'Registrar pago' }).click()
    await page.waitForURL(`${origin()}/admin/pagos`)
    await page.assertVisible(page.getByText('Listo, Mati quedó al día.'))

    await fee.refresh()
    assert.equal(fee.status, 'paid')
    assert.equal(fee.method, 'cash')
    assert.equal(fee.amount, 40000)
  })
})
