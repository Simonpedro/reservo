import { UserFactory } from '#database/factories/user_factory'
import { createCatalog, createSchedule, createStudent, type Catalog } from '#tests/support/scenario'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const hostOf = (catalog: Catalog) => `${catalog.tenant.slug}.localhost`

type Props = {
  week: {
    centers: { slug: string; name: string }[]
    center: { slug: string; name: string } | null
    days: Array<{
      name: string
      classes: Array<{ scheduleId: number; taken: number; people: { fullName: string }[] }>
    }>
  }
}

function names(props: Props) {
  return props.week.days.flatMap((day) =>
    day.classes.flatMap((item) => item.people.map((person) => person.fullName))
  )
}

/**
 * A tenant with its admin, Monday Pilates in Mendoza (Ana and Juan) and
 * Thursday Yoga in Ovidio Lagos (Sofi).
 */
async function world() {
  const catalog = await createCatalog()
  const admin = await UserFactory.apply('admin').merge({ tenantId: catalog.tenant.id }).create()
  const pilates = await createSchedule(catalog, { weekday: 1, startTime: '18:00' })
  const yoga = await createSchedule(catalog, {
    activity: catalog.yoga,
    center: catalog.ovidio,
    weekday: 4,
    startTime: '09:00',
  })
  const ana = await createStudent(catalog, { schedules: [pilates], fullName: 'Ana Ruiz' })
  await createStudent(catalog, { schedules: [pilates], fullName: 'Juan Ponce' })
  await createStudent(catalog, { schedules: [yoga], fullName: 'Sofi Ortiz' })
  return { catalog, admin, pilates, yoga, ana }
}

test.group('Admin · Agenda › Semana', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(15_000)

  test('shows the week with the names of the people of each class', async ({ client, assert }) => {
    const w = await world()
    const other = await createCatalog()
    const foreign = await createSchedule(other, { weekday: 1 })
    await createStudent(other, { schedules: [foreign], fullName: 'Ajena Total' })

    const response = await client
      .get('/admin/agenda/semana')
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/agenda_week')
    const props = response.inertiaProps as Props
    assert.deepEqual(
      props.week.days.map((day) => day.name),
      ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    )
    assert.deepEqual(
      props.week.days[0].classes.map((item) => [item.scheduleId, item.taken]),
      [[w.pilates.id, 2]]
    )
    assert.deepEqual(names(props), ['Ana Ruiz', 'Juan Ponce', 'Sofi Ortiz'])
    assert.deepEqual(
      props.week.centers.map((center) => center.name),
      ['Mendoza', 'Ovidio Lagos']
    )
  })

  test('filters by center', async ({ client, assert }) => {
    const w = await world()

    const response = await client
      .get('/admin/agenda/semana')
      .qs({ sede: w.catalog.ovidio.slug })
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()

    response.assertStatus(200)
    const props = response.inertiaProps as Props
    assert.deepEqual(props.week.center, { slug: w.catalog.ovidio.slug, name: 'Ovidio Lagos' })
    assert.deepEqual(names(props), ['Sofi Ortiz'])
  })

  test('only admins see the week', async ({ client }) => {
    const w = await world()

    const response = await client
      .get('/admin/agenda/semana')
      .header('host', hostOf(w.catalog))
      .loginAs(w.ana.user)
      .redirects(0)

    response.assertStatus(403)
  })

  test('the schedule form opened from the week goes back to the week', async ({
    client,
    assert,
  }) => {
    const w = await world()

    const fromWeek = await client
      .get(`/admin/horarios/${w.pilates.id}`)
      .qs({ desde: 'semana' })
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()
    fromWeek.assertInertiaComponent('admin/schedule_form')
    assert.equal(fromWeek.inertiaProps.backHref, '/admin/agenda/semana')

    const fromDay = await client
      .get(`/admin/horarios/${w.pilates.id}`)
      .header('host', hostOf(w.catalog))
      .loginAs(w.admin)
      .withInertia()
    assert.equal(fromDay.inertiaProps.backHref, '/admin/agenda')
  })
})
