import { MonthlyFeeFactory, PNG_BYTES, ReceiptFactory } from '#database/factories/fee_factories'
import { UserFactory } from '#database/factories/user_factory'
import MonthlyFee from '#models/monthly_fee'
import Receipt from '#models/receipt'
import Tenant from '#models/tenant'
import User from '#models/user'
import { businessDate, businessNow } from '#services/business_calendar'
import { periodOf } from '#services/fees'
import { createCatalog, createStudent, type Catalog } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const host = 'kinaf.localhost:3333'

const thisMonth = () => DateTime.fromISO(periodOf(businessDate(businessNow())))

async function kinafWorld() {
  const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
  const admin = await User.findByOrFail({ tenantId: kinaf.id, email: 'admin@kinaf.test' })
  const catalog = await createCatalog(kinaf)
  return { catalog, admin }
}

/**
 * A student of `catalog` whose fee of `period` (default: this month) is in
 * review with an uploaded photo.
 */
async function feeInReview(catalog: Catalog, fullName = 'Ana Gómez', period = thisMonth()) {
  const student = await createStudent(catalog, { fullName })
  await student.plan.merge({ price: 38000 }).save()
  const fee = await MonthlyFeeFactory.merge({
    tenantId: catalog.tenant.id,
    userId: student.user.id,
    subscriptionId: student.subscription.id,
    period,
    amount: 38000,
    status: 'in_review',
  }).create()
  const receipt = await ReceiptFactory.merge({
    tenantId: catalog.tenant.id,
    monthlyFeeId: fee.id,
    userId: student.user.id,
  }).create()
  return { student, fee, receipt }
}

test.group('Admin › Pagos', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('lists receipts to check and overdue fees of the center only', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { fee: inReview } = await feeInReview(catalog)
    const mati = await createStudent(catalog, { fullName: 'Mati Ruiz' })
    const overdue = await MonthlyFeeFactory.merge({
      tenantId: catalog.tenant.id,
      userId: mati.user.id,
      subscriptionId: mati.subscription.id,
      period: thisMonth().minus({ months: 1 }),
      amount: 42000,
    }).create()
    const elsewhere = await feeInReview(await createCatalog(), 'Otra Persona')

    const response = await client
      .get('/admin/pagos')
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/payments/index')
    const { overview } = response.inertiaProps
    const reviewIds = overview.review.map((row: { feeId: number }) => row.feeId)
    const overdueRow = overview.overdue.find((row: { feeId: number }) => row.feeId === overdue.id)
    assert.include(reviewIds, inReview.id)
    assert.notInclude(reviewIds, elsewhere.fee.id)
    assert.match(overdueRow.hint, /^Desde el 11 de \S+ · \$42\.000$/)
  })

  test('shows the receipt of a fee in review with a link to the file', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { fee, receipt } = await feeInReview(catalog)

    const response = await client
      .get(`/admin/pagos/${fee.id}`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()

    response.assertInertiaComponent('admin/payments/receipt')
    const { review } = response.inertiaProps
    assert.equal(review.fullName, 'Ana Gómez')
    assert.match(review.subtitle, /^Cuota de \S+ · \$38\.000 · subido hoy$/)
    assert.equal(review.receipt.id, receipt.id)

    const file = await client
      .get(`/pagos/comprobantes/${receipt.id}`)
      .header('host', host)
      .loginAs(admin)
    file.assertStatus(200)
    file.assertHeader('content-type', 'image/png')
  })

  test('approving a receipt leaves the fee paid by transfer, recorded by the admin', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { fee, receipt } = await feeInReview(catalog)

    const response = await client
      .post(`/admin/pagos/${fee.id}/aprobar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/pagos')
    response.assertFlashMessage('success', 'Listo, Ana quedó al día.')
    await fee.refresh()
    assert.equal(fee.status, 'paid')
    assert.equal(fee.method, 'transfer')
    assert.equal(fee.recordedById, admin.id)
    assert.isNotNull(fee.paidAt)
    await receipt.refresh()
    assert.equal(receipt.status, 'approved')
  })

  test('"Deshacer" right after approving sends the receipt back to Para revisar', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { fee, receipt } = await feeInReview(catalog)

    const approve = await client
      .post(`/admin/pagos/${fee.id}/aprobar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    approve.assertFlashMessage('approvedFeeId', fee.id)

    const undo = await client
      .post(`/admin/pagos/${fee.id}/deshacer`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)

    undo.assertStatus(302)
    undo.assertHeader('location', '/admin/pagos')
    await fee.refresh()
    assert.equal(fee.status, 'in_review')
    assert.isNull(fee.paidAt)
    await receipt.refresh()
    assert.equal(receipt.status, 'in_review')

    const list = await client.get('/admin/pagos').header('host', host).loginAs(admin).withInertia()
    assert.include(
      list.inertiaProps.overview.review.map((row: { feeId: number }) => row.feeId),
      fee.id
    )

    const again = await client
      .post(`/admin/pagos/${fee.id}/deshacer`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    again.assertFlashMessage('error', 'Ese pago ya no se puede deshacer.')
  })

  test('rejecting a receipt voids it and the student can upload another', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { student, fee, receipt } = await feeInReview(catalog)

    const response = await client
      .post(`/admin/pagos/${fee.id}/rechazar`)
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage(
      'success',
      'Rechazamos el comprobante. Ana lo va a ver en la app y puede subir otro.'
    )
    await fee.refresh()
    assert.equal(fee.status, 'pending')
    await receipt.refresh()
    assert.equal(receipt.status, 'rejected')

    const upload = await client
      .post(`/pagos/${fee.id}/comprobante`)
      .header('host', host)
      .loginAs(student.user)
      .withCsrfToken()
      .file('receipt', PNG_BYTES, { filename: 'otra-transferencia.png' })
      .redirects(0)
    upload.assertStatus(302)
    await fee.refresh()
    assert.equal(fee.status, 'in_review')
    const statuses = await Receipt.query().where('monthlyFeeId', fee.id).orderBy('id')
    assert.deepEqual(
      statuses.map((row) => row.status),
      ['rejected', 'in_review']
    )
  })

  test('approving or rejecting a fee of another center is refused and changes nothing', async ({
    client,
    assert,
  }) => {
    const { admin } = await kinafWorld()
    const { fee, receipt } = await feeInReview(await createCatalog(), 'Otra Persona')

    for (const action of ['aprobar', 'rechazar']) {
      const response = await client
        .post(`/admin/pagos/${fee.id}/${action}`)
        .header('host', host)
        .loginAs(admin)
        .withCsrfToken()
        .redirects(0)
      response.assertFlashMessage('error', 'No encontramos esa cuota.')
    }

    const shown = await client
      .get(`/admin/pagos/${fee.id}`)
      .header('host', host)
      .loginAs(admin)
      .redirects(0)
    shown.assertStatus(302)

    await fee.refresh()
    assert.equal(fee.status, 'in_review')
    await receipt.refresh()
    assert.equal(receipt.status, 'in_review')
  })

  test('registering a cash payment leaves the fee paid with the amount given', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const mati = await createStudent(catalog, { fullName: 'Mati Ruiz' })
    await mati.plan.merge({ price: 42000 }).save()

    const form = await client
      .get(`/admin/pagos/registrar?alumno=${mati.user.id}`)
      .header('host', host)
      .loginAs(admin)
      .withInertia()
    form.assertInertiaComponent('admin/payments/register')
    const options = form.inertiaProps.form
    const period = thisMonth().toISODate()!
    assert.deepEqual(options.defaults, { userId: mati.user.id, period })
    const listed = options.students.find((item: { id: number }) => item.id === mati.user.id)
    assert.equal(listed.amounts[period], 42000)

    const response = await client
      .post('/admin/pagos')
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .json({ userId: mati.user.id, period, amount: 42000, method: 'cash' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/pagos')
    response.assertFlashMessage('success', 'Listo, Mati quedó al día.')
    const fee = await MonthlyFee.query().where('userId', mati.user.id).firstOrFail()
    assert.equal(fee.period.toISODate(), period)
    assert.equal(fee.status, 'paid')
    assert.equal(fee.method, 'cash')
    assert.equal(fee.amount, 42000)
    assert.equal(fee.recordedById, admin.id)
  })

  test('forcing paid marks an unpaid fee as paid with method forced', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { student, fee } = await feeInReview(catalog)

    await client
      .post('/admin/pagos')
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .json({
        userId: student.user.id,
        period: thisMonth().toISODate(),
        amount: 0,
        method: 'forced',
      })
      .redirects(0)

    await fee.refresh()
    assert.equal(fee.status, 'paid')
    assert.equal(fee.method, 'forced')
    assert.equal(fee.amount, 0)
    assert.equal(fee.recordedById, admin.id)
  })

  test('registering a payment refuses a paid month and students of another center', async ({
    client,
    assert,
  }) => {
    const { catalog, admin } = await kinafWorld()
    const { student, fee } = await feeInReview(catalog)
    await fee.merge({ status: 'paid', method: 'cash' }).save()
    const stranger = await feeInReview(await createCatalog(), 'Otra Persona')
    const period = thisMonth().toISODate()

    const paid = await client
      .post('/admin/pagos')
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .json({ userId: student.user.id, period, amount: 1, method: 'transfer' })
      .redirects(0)
    paid.assertFlashMessage('errors', { period: 'Esa cuota ya está pagada.' })

    const foreign = await client
      .post('/admin/pagos')
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .json({ userId: stranger.student.user.id, period, amount: 1, method: 'cash' })
      .redirects(0)
    foreign.assertFlashMessage('errors', { userId: 'No encontramos esa cuota.' })

    await fee.refresh()
    assert.equal(fee.method, 'cash')
    await stranger.fee.refresh()
    assert.equal(stranger.fee.status, 'in_review')
  })

  test('the payment form validates the month, the amount and the method', async ({
    client,
    assert,
  }) => {
    const { admin } = await kinafWorld()

    const response = await client
      .post('/admin/pagos')
      .header('host', host)
      .loginAs(admin)
      .withCsrfToken()
      .withInertia()
      .json({ userId: 1, period: '2026-11-15', amount: 10.5, method: 'cheque' })
      .redirects(0)

    response.assertStatus(302)
    assert.deepEqual(response.flashMessage('inputErrorsBag'), {
      period: ['Elegí el mes.'],
      amount: ['El monto va sin centavos.'],
      method: ['Elegí el medio de pago.'],
    })
  })

  test('students cannot see or act on the admin payments', async ({ client, assert }) => {
    const { catalog } = await kinafWorld()
    const { student, fee } = await feeInReview(catalog)
    const other = await UserFactory.merge({ tenantId: catalog.tenant.id, role: 'client' }).create()

    const list = await client.get('/admin/pagos').header('host', host).loginAs(other).redirects(0)
    list.assertStatus(403)

    for (const user of [student.user, other]) {
      const approve = await client
        .post(`/admin/pagos/${fee.id}/aprobar`)
        .header('host', host)
        .loginAs(user)
        .withCsrfToken()
        .redirects(0)
      approve.assertStatus(403)
    }

    const register = await client
      .post('/admin/pagos')
      .header('host', host)
      .loginAs(student.user)
      .withCsrfToken()
      .json({
        userId: student.user.id,
        period: thisMonth().toISODate(),
        amount: 0,
        method: 'forced',
      })
      .redirects(0)
    register.assertStatus(403)

    await fee.refresh()
    assert.equal(fee.status, 'in_review')
  })
})
