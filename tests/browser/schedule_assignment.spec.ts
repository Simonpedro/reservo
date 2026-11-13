import { FixedSlotFactory } from '#database/factories/plan_factories'
import { UserFactory } from '#database/factories/user_factory'
import Tenant from '#models/tenant'
import User from '#models/user'
import env from '#start/env'
import { createCatalog, createPlan, createSchedule, createStudent } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const origin = () => `http://kinaf.localhost:${env.get('PORT')}`

test.group('Admin › assign plan and schedule', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('assign a plan and a fixed schedule to a student without a plan', async ({
    browserContext,
    visit,
  }) => {
    const kinaf = await Tenant.findByOrFail('slug', 'kinaf')
    const admin = await User.findByOrFail({ tenantId: kinaf.id, email: 'admin@kinaf.test' })
    const catalog = await createCatalog(kinaf)
    await createSchedule(catalog, { weekday: 2, startTime: '06:30', activity: catalog.yoga })
    const full = await createSchedule(catalog, {
      weekday: 2,
      startTime: '07:00',
      activity: catalog.yoga,
      capacity: 1,
    })
    const taken = await createStudent(catalog)
    await FixedSlotFactory.merge({
      tenantId: kinaf.id,
      subscriptionId: taken.subscription.id,
      userId: taken.user.id,
      planQuotaId: taken.quota.id,
      classScheduleId: full.id,
    }).create()
    await createPlan(catalog, [{ count: 1, activities: [catalog.yoga] }], 'Prueba Yoga 1x')
    const student = await UserFactory.merge({
      tenantId: kinaf.id,
      fullName: 'Rocío Sin Plan',
    }).create()

    await browserContext.initiateSession({ domain: 'kinaf.localhost' })
    await browserContext.loginAs(admin)
    const page = await visit(`${origin()}/admin/clientes/${student.id}`)
    await page.assertTextContains('main', 'Todavía no tiene plan.')

    await page.getByRole('link', { name: 'Asignar plan y horario' }).click()
    await page.waitForURL(`${origin()}/admin/clientes/${student.id}/asignar`)
    await page.assertVisible(page.getByRole('heading', { level: 1, name: 'Elegí el plan' }))
    await page.assertDisabled(page.getByRole('button', { name: 'Siguiente' }))

    await page.getByRole('radio', { name: /Prueba Yoga 1x/ }).check()
    await page.assertTextContains('main', 'Paso 1 de 3')
    await page.getByRole('button', { name: 'Siguiente' }).click()

    await page.assertVisible(page.getByRole('heading', { level: 1, name: '1 clase de Yoga' }))
    await page.assertTextContains('main', 'Martes 07:00 · Yoga · Mendoza · Completo')
    await page.assertNotExists(page.getByRole('radio', { name: /Martes 07:00/ }))
    await page.getByRole('radio', { name: /Martes 06:30 · Yoga/ }).check()
    await page.assertTextContains('main', '(1 de 1)')
    await page.getByRole('button', { name: 'Siguiente' }).click()

    await page.assertVisible(page.getByRole('heading', { level: 1, name: '¿Desde cuándo?' }))
    await page.assertChecked(page.getByRole('radio', { name: /La semana que viene/ }))
    await page.assertTextContains('main', 'Martes 06:30 · Yoga · Mendoza')
    await page.getByRole('button', { name: 'Confirmar' }).click()

    await page.waitForURL(`${origin()}/admin/clientes/${student.id}`)
    await page.assertTextContains('main', 'Listo, horario cargado.')
    await page.assertTextContains('main', 'Prueba Yoga 1x')
    await page.assertTextContains('main', 'Martes 06:30 · Yoga · Mendoza')
    await page.assertNotExists(page.getByText('No tiene clases próximas.'))
    await page.assertExists(page.locator('main a[href="/admin/agenda"]').first())
  })
})
