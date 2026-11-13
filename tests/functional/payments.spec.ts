import { MonthlyFeeFactory, PNG_BYTES, ReceiptFactory } from '#database/factories/fee_factories'
import { UserFactory } from '#database/factories/user_factory'
import MonthlyFee from '#models/monthly_fee'
import Receipt from '#models/receipt'
import Tenant from '#models/tenant'
import { businessDate, businessNow } from '#services/business_calendar'
import { periodOf } from '#services/fees'
import { createCatalog, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const kinafHost = 'kinaf.localhost:3333'
const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')

const thisMonth = () => DateTime.fromISO(periodOf(businessDate(businessNow())))

/**
 * A Kinaf student with this month's fee still unpaid.
 */
async function world() {
  const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
  const sofi = await createStudent(catalog, { fullName: 'Sofi Ortiz' })
  await sofi.plan.merge({ price: 38000 }).save()
  const fee = await MonthlyFeeFactory.merge({
    tenantId: catalog.tenant.id,
    userId: sofi.user.id,
    subscriptionId: sofi.subscription.id,
    period: thisMonth(),
    amount: 38000,
  }).create()
  return { catalog, sofi, fee }
}

test.group('Pagos', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows this month fee, how to pay at Kinaf and the paid history', async ({
    client,
    assert,
  }) => {
    const { catalog, sofi } = await world()
    await MonthlyFeeFactory.merge({
      tenantId: catalog.tenant.id,
      userId: sofi.user.id,
      subscriptionId: sofi.subscription.id,
      period: thisMonth().minus({ months: 1 }),
    })
      .apply('paid')
      .create()

    const response = await client
      .get('/pagos')
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('client/payments')
    const { view, justSent } = response.inertiaProps
    assert.isFalse(justSent)
    assert.equal(view.current.amount, '$38.000')
    assert.oneOf(view.current.status, ['pending', 'overdue'])
    assert.isTrue(view.current.canUpload)
    assert.equal(
      view.howToPay,
      'Transferí a los alias KINAF.KINESIOLOGIA o KINAF.KINE.AF, o pagá en recepción'
    )
    assert.lengthOf(view.history, 1)
    assert.equal(view.history[0].status, 'paid')
    assert.match(view.history[0].summary, /· \$38\.000 · pagado el 5 de /)
  })

  test('creates this month fee from the plan price if the daily process did not run yet', async ({
    client,
    assert,
  }) => {
    const catalog = await createCatalog(await Tenant.findByOrFail('slug', 'kinaf'))
    const sofi = await createStudent(catalog)
    await sofi.plan.merge({ price: 41000 }).save()

    const response = await client
      .get('/pagos')
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()

    assert.equal(response.inertiaProps.view.current.amount, '$41.000')
    const fees = await MonthlyFee.query().where('userId', sofi.user.id)
    assert.lengthOf(fees, 1)
    assert.equal(fees[0].period.toISODate(), thisMonth().toISODate())
  })

  test('a student without a plan has no current fee', async ({ client }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const fede = await UserFactory.merge({ tenantId: kinaf.id }).create()

    const response = await client
      .get('/pagos')
      .header('host', kinafHost)
      .loginAs(fede)
      .withInertia()

    response.assertInertiaPropsContains({ view: { current: null, history: [] } })
  })
})

test.group('Subir comprobante', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a valid photo is stored and the fee goes to review', async ({ client, assert }) => {
    const { sofi, fee } = await world()

    const response = await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withCsrfToken()
      .file('receipt', PNG_BYTES, { filename: 'transferencia-noviembre.png' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/pagos')
    response.assertFlashMessage('receiptSent', true)
    await fee.refresh()
    assert.equal(fee.status, 'in_review')
    const receipt = await Receipt.query().where('monthlyFeeId', fee.id).firstOrFail()
    assert.equal(receipt.tenantId, sofi.user.tenantId)
    assert.equal(receipt.userId, sofi.user.id)
    assert.equal(receipt.filename, 'transferencia-noviembre.png')
    assert.equal(receipt.mime, 'image/png')
    assert.equal(receipt.size, PNG_BYTES.length)
    assert.isTrue(receipt.data.equals(PNG_BYTES))
    assert.equal(receipt.status, 'in_review')
  })

  test('after sending, Pagos says "Lo recibimos" and shows the fee in review', async ({
    client,
  }) => {
    const { sofi, fee } = await world()

    const response = await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withCsrfToken()
      .file('receipt', PDF_BYTES, { filename: 'comprobante.pdf' })
      .withInertia()

    response.assertInertiaComponent('client/payments')
    response.assertInertiaPropsContains({
      justSent: true,
      view: { current: { status: 'in_review', statusText: 'En revisión', canUpload: false } },
    })
  })

  test('after a rejected receipt, Pagos asks for another one until it is sent', async ({
    client,
    assert,
  }) => {
    const { catalog, sofi, fee } = await world()
    const asSofi = () =>
      client.get('/pagos').header('host', kinafHost).loginAs(sofi.user).withInertia()

    const before = await asSofi()
    assert.isFalse(before.inertiaProps.view.receiptRejected)

    await ReceiptFactory.merge({
      tenantId: catalog.tenant.id,
      userId: sofi.user.id,
      monthlyFeeId: fee.id,
      status: 'rejected',
    }).create()

    const rejected = await asSofi()
    assert.isTrue(rejected.inertiaProps.view.receiptRejected)
    assert.isTrue(rejected.inertiaProps.view.current.canUpload)

    await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withCsrfToken()
      .file('receipt', PNG_BYTES, { filename: 'otra.png' })
      .redirects(0)

    const resent = await asSofi()
    assert.isFalse(resent.inertiaProps.view.receiptRejected)
    assert.equal(resent.inertiaProps.view.current.status, 'in_review')
  })

  test('a file that is not an image or a PDF is refused', async ({ client, assert }) => {
    const { sofi, fee } = await world()

    const response = await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withCsrfToken()
      .file('receipt', Buffer.from('MZ not a receipt'), { filename: 'virus.exe' })
      .redirects(0)

    response.assertStatus(302)
    assert.deepEqual(response.flashMessage('inputErrorsBag'), {
      receipt: ['Subí una foto (JPG, PNG o WebP) o un PDF.'],
    })
    await fee.refresh()
    assert.equal(fee.status, 'pending')
    assert.lengthOf(await Receipt.query().where('monthlyFeeId', fee.id), 0)
  })

  test('a file over 5 MB is refused', async ({ client, assert }) => {
    const { sofi, fee } = await world()
    const big = Buffer.concat([PNG_BYTES, Buffer.alloc(5 * 1024 * 1024)])

    const response = await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withCsrfToken()
      .file('receipt', big, { filename: 'enorme.png' })
      .redirects(0)

    response.assertStatus(302)
    assert.deepEqual(response.flashMessage('inputErrorsBag'), {
      receipt: ['El archivo pesa más de 5 MB. Probá con una foto más liviana.'],
    })
    await fee.refresh()
    assert.equal(fee.status, 'pending')
    assert.lengthOf(await Receipt.query().where('monthlyFeeId', fee.id), 0)
  })

  test('sending without a file is refused', async ({ client, assert }) => {
    const { sofi, fee } = await world()

    const response = await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.deepEqual(response.flashMessage('inputErrorsBag'), {
      receipt: ['Elegí una foto o un PDF del comprobante.'],
    })
    await fee.refresh()
    assert.equal(fee.status, 'pending')
  })

  test('a paid fee takes no receipt', async ({ client, assert }) => {
    const { sofi, fee } = await world()
    await fee.merge({ status: 'paid', paidAt: DateTime.now(), method: 'cash' }).save()

    const response = await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withCsrfToken()
      .file('receipt', PNG_BYTES, { filename: 'transferencia.png' })
      .redirects(0)

    response.assertHeader('location', '/pagos')
    response.assertFlashMessage('error', 'Esa cuota ya está pagada.')
    assert.lengthOf(await Receipt.query().where('monthlyFeeId', fee.id), 0)
  })

  test('a student cannot send a receipt for another student fee', async ({ client, assert }) => {
    const { catalog, fee } = await world()
    const juan = await createStudent(catalog, { fullName: 'Juan Ponce' })

    const response = await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(juan.user)
      .withCsrfToken()
      .file('receipt', PNG_BYTES, { filename: 'transferencia.png' })
      .redirects(0)

    response.assertFlashMessage('error', 'No encontramos esa cuota.')
    await fee.refresh()
    assert.equal(fee.status, 'pending')
    assert.lengthOf(await Receipt.query().where('monthlyFeeId', fee.id), 0)
  })

  test('the upload screen only opens for an unpaid fee of the student', async ({ client }) => {
    const { catalog, sofi, fee } = await world()

    const own = await client
      .get(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(sofi.user)
      .withInertia()
    own.assertInertiaComponent('client/upload_receipt')
    own.assertInertiaPropsContains({ fee: { id: fee.id, amount: '$38.000' } })

    const juan = await createStudent(catalog, { fullName: 'Juan Ponce' })
    const other = await client
      .get(`/pagos/${fee.id}/comprobante`)
      .header('host', kinafHost)
      .loginAs(juan.user)
      .redirects(0)
    other.assertHeader('location', '/pagos')
  })
})

test.group('Ver comprobante', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function withReceipt() {
    const w = await world()
    const receipt = await ReceiptFactory.merge({
      tenantId: w.catalog.tenant.id,
      monthlyFeeId: w.fee.id,
      userId: w.sofi.user.id,
      filename: 'transferencia-noviembre.png',
    }).create()
    return { ...w, receipt }
  }

  test('the owner gets the file inline, with its type and nosniff', async ({ client, assert }) => {
    const { sofi, receipt } = await withReceipt()

    const response = await client
      .get(`/pagos/comprobantes/${receipt.id}`)
      .header('host', kinafHost)
      .loginAs(sofi.user)

    response.assertStatus(200)
    response.assertHeader('content-type', 'image/png')
    response.assertHeader('x-content-type-options', 'nosniff')
    assert.match(
      response.header('content-disposition') ?? '',
      /^inline; filename="transferencia-noviembre\.png"/
    )
    response.assertHeader('content-length', String(PNG_BYTES.length))
  })

  test('another student of the same center gets a 404', async ({ client }) => {
    const { catalog, receipt } = await withReceipt()
    const juan = await createStudent(catalog, { fullName: 'Juan Ponce' })

    const response = await client
      .get(`/pagos/comprobantes/${receipt.id}`)
      .header('host', kinafHost)
      .loginAs(juan.user)

    response.assertStatus(404)
  })

  test('an admin of the center can see it', async ({ client }) => {
    const { catalog, receipt } = await withReceipt()
    const admin = await UserFactory.apply('admin').merge({ tenantId: catalog.tenant.id }).create()

    const response = await client
      .get(`/pagos/comprobantes/${receipt.id}`)
      .header('host', kinafHost)
      .loginAs(admin)

    response.assertStatus(200)
    response.assertHeader('content-type', 'image/png')
  })

  test('an admin never sees a receipt of another center', async ({ client }) => {
    const elsewhere = await createCatalog()
    const student = await createStudent(elsewhere)
    const fee = await MonthlyFeeFactory.merge({
      tenantId: elsewhere.tenant.id,
      userId: student.user.id,
      subscriptionId: student.subscription.id,
    }).create()
    const receipt = await ReceiptFactory.merge({
      tenantId: elsewhere.tenant.id,
      monthlyFeeId: fee.id,
      userId: student.user.id,
    }).create()
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const admin = await UserFactory.apply('admin').merge({ tenantId: kinaf.id }).create()

    const response = await client
      .get(`/pagos/comprobantes/${receipt.id}`)
      .header('host', kinafHost)
      .loginAs(admin)

    response.assertStatus(404)
  })
})
