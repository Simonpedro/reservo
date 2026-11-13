/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const HomeController = () => import('#controllers/home_controller')
const SessionController = () => import('#controllers/session_controller')
const AccessController = () => import('#controllers/access_controller')
const MyClassesController = () => import('#controllers/my_classes_controller')
const ChooseClassController = () => import('#controllers/choose_class_controller')
const MyPlanController = () => import('#controllers/my_plan_controller')
const PaymentsController = () => import('#controllers/payments_controller')
const InternalDailyController = () => import('#controllers/internal_daily_controller')
const AdminClientsController = () => import('#controllers/admin_clients_controller')
const AdminSettingsController = () => import('#controllers/admin_settings_controller')
const AdminPlansController = () => import('#controllers/admin_plans_controller')
const AdminActivitiesController = () => import('#controllers/admin_activities_controller')
const AdminCentersController = () => import('#controllers/admin_centers_controller')
const AdminPaymentsController = () => import('#controllers/admin_payments_controller')
const AdminClassesController = () => import('#controllers/admin_classes_controller')
const AdminAgendaController = () => import('#controllers/admin_agenda_controller')
const AdminSchedulesController = () => import('#controllers/admin_schedules_controller')

router.get('/health', () => ({ status: 'ok' })).as('health')
router.post('/internal/daily-run', [InternalDailyController, 'run']).as('internal.dailyRun')

router
  .group(() => {
    router.get('/', [HomeController, 'index']).as('home')

    router
      .group(() => {
        router.get('/login', [SessionController, 'create']).as('login')
        router.post('/login', [SessionController, 'store']).as('session.store')
      })
      .use(middleware.requireTenant())
      .use(middleware.guest())

    router
      .get('/acceso/:token', [AccessController, 'show'])
      .as('access.show')
      .use(middleware.requireTenant())

    router
      .group(() => {
        router.post('/logout', [SessionController, 'destroy']).as('logout')

        router
          .group(() => {
            router.get('/admin', ({ response }) => response.redirect('/admin/hoy')).as('admin.home')
            router.get('/admin/hoy', [AdminClassesController, 'today']).as('admin.today')
            router
              .get('/admin/clases/:sessionId', [AdminClassesController, 'show'])
              .where('sessionId', router.matchers.number())
              .as('admin.classes.show')
            router
              .post('/admin/clases/:sessionId/suspender', [AdminClassesController, 'suspend'])
              .where('sessionId', router.matchers.number())
              .as('admin.classes.suspend')
            router
              .post('/admin/clases/:sessionId/reservas/:bookingId/ausente', [
                AdminClassesController,
                'absent',
              ])
              .where('sessionId', router.matchers.number())
              .where('bookingId', router.matchers.number())
              .as('admin.classes.absent')
            router
              .post('/admin/clases/:sessionId/reservas/:bookingId/deshacer', [
                AdminClassesController,
                'undoAbsent',
              ])
              .where('sessionId', router.matchers.number())
              .where('bookingId', router.matchers.number())
              .as('admin.classes.undoAbsent')
            router.get('/admin/agenda', [AdminAgendaController, 'index']).as('admin.agenda')
            router
              .get('/admin/agenda/cerrar', [AdminAgendaController, 'closeForm'])
              .as('admin.agenda.closeForm')
            router
              .post('/admin/agenda/cerrar', [AdminAgendaController, 'close'])
              .as('admin.agenda.close')
            router
              .get('/admin/horarios/nuevo', [AdminSchedulesController, 'create'])
              .as('admin.schedules.create')
            router
              .post('/admin/horarios', [AdminSchedulesController, 'store'])
              .as('admin.schedules.store')
            router
              .get('/admin/horarios/:id', [AdminSchedulesController, 'edit'])
              .where('id', router.matchers.number())
              .as('admin.schedules.edit')
            router
              .put('/admin/horarios/:id', [AdminSchedulesController, 'update'])
              .where('id', router.matchers.number())
              .as('admin.schedules.update')
            router
              .post('/admin/horarios/:id/desactivar', [AdminSchedulesController, 'deactivate'])
              .where('id', router.matchers.number())
              .as('admin.schedules.deactivate')
            router
              .post('/admin/horarios/:id/activar', [AdminSchedulesController, 'activate'])
              .where('id', router.matchers.number())
              .as('admin.schedules.activate')
            router.get('/admin/pagos', [AdminPaymentsController, 'index']).as('admin.payments')
            router
              .get('/admin/pagos/registrar', [AdminPaymentsController, 'create'])
              .as('admin.payments.create')
            router
              .post('/admin/pagos', [AdminPaymentsController, 'store'])
              .as('admin.payments.store')
            router
              .get('/admin/pagos/:id', [AdminPaymentsController, 'show'])
              .where('id', router.matchers.number())
              .as('admin.payments.show')
            router
              .post('/admin/pagos/:id/aprobar', [AdminPaymentsController, 'approve'])
              .where('id', router.matchers.number())
              .as('admin.payments.approve')
            router
              .post('/admin/pagos/:id/deshacer', [AdminPaymentsController, 'undoApprove'])
              .where('id', router.matchers.number())
              .as('admin.payments.undoApprove')
            router
              .post('/admin/pagos/:id/rechazar', [AdminPaymentsController, 'reject'])
              .where('id', router.matchers.number())
              .as('admin.payments.reject')
            router.get('/admin/ajustes', [AdminSettingsController, 'show']).as('admin.settings')
            router
              .get('/admin/ajustes/planes', [AdminPlansController, 'index'])
              .as('admin.plans.index')
            router
              .get('/admin/ajustes/planes/nuevo', [AdminPlansController, 'create'])
              .as('admin.plans.create')
            router
              .post('/admin/ajustes/planes', [AdminPlansController, 'store'])
              .as('admin.plans.store')
            router
              .get('/admin/ajustes/planes/:id', [AdminPlansController, 'edit'])
              .where('id', router.matchers.number())
              .as('admin.plans.edit')
            router
              .put('/admin/ajustes/planes/:id', [AdminPlansController, 'update'])
              .where('id', router.matchers.number())
              .as('admin.plans.update')
            router
              .post('/admin/ajustes/planes/:id/desactivar', [AdminPlansController, 'deactivate'])
              .where('id', router.matchers.number())
              .as('admin.plans.deactivate')
            router
              .post('/admin/ajustes/planes/:id/activar', [AdminPlansController, 'activate'])
              .where('id', router.matchers.number())
              .as('admin.plans.activate')
            router
              .get('/admin/ajustes/actividades', [AdminActivitiesController, 'index'])
              .as('admin.activities.index')
            router
              .get('/admin/ajustes/actividades/nuevo', [AdminActivitiesController, 'create'])
              .as('admin.activities.create')
            router
              .post('/admin/ajustes/actividades', [AdminActivitiesController, 'store'])
              .as('admin.activities.store')
            router
              .get('/admin/ajustes/actividades/:id', [AdminActivitiesController, 'edit'])
              .where('id', router.matchers.number())
              .as('admin.activities.edit')
            router
              .put('/admin/ajustes/actividades/:id', [AdminActivitiesController, 'update'])
              .where('id', router.matchers.number())
              .as('admin.activities.update')
            router
              .post('/admin/ajustes/actividades/:id/desactivar', [
                AdminActivitiesController,
                'deactivate',
              ])
              .where('id', router.matchers.number())
              .as('admin.activities.deactivate')
            router
              .post('/admin/ajustes/actividades/:id/activar', [
                AdminActivitiesController,
                'activate',
              ])
              .where('id', router.matchers.number())
              .as('admin.activities.activate')
            router
              .get('/admin/ajustes/sedes', [AdminCentersController, 'index'])
              .as('admin.centers.index')
            router
              .get('/admin/ajustes/sedes/nuevo', [AdminCentersController, 'create'])
              .as('admin.centers.create')
            router
              .post('/admin/ajustes/sedes', [AdminCentersController, 'store'])
              .as('admin.centers.store')
            router
              .get('/admin/ajustes/sedes/:id', [AdminCentersController, 'edit'])
              .where('id', router.matchers.number())
              .as('admin.centers.edit')
            router
              .put('/admin/ajustes/sedes/:id', [AdminCentersController, 'update'])
              .where('id', router.matchers.number())
              .as('admin.centers.update')
            router
              .post('/admin/ajustes/sedes/:id/desactivar', [AdminCentersController, 'deactivate'])
              .where('id', router.matchers.number())
              .as('admin.centers.deactivate')
            router
              .post('/admin/ajustes/sedes/:id/activar', [AdminCentersController, 'activate'])
              .where('id', router.matchers.number())
              .as('admin.centers.activate')

            router
              .get('/admin/clientes', [AdminClientsController, 'index'])
              .as('admin.clients.index')
            router
              .get('/admin/clientes/nuevo', [AdminClientsController, 'create'])
              .as('admin.clients.create')
            router
              .post('/admin/clientes', [AdminClientsController, 'store'])
              .as('admin.clients.store')
            router
              .get('/admin/clientes/:id', [AdminClientsController, 'show'])
              .where('id', router.matchers.number())
              .as('admin.clients.show')
            router
              .post('/admin/clientes/:id/access-link', [AdminClientsController, 'issueAccessLink'])
              .where('id', router.matchers.number())
              .as('admin.clients.issueAccessLink')
            router
              .get('/admin/clientes/:id/asignar', [AdminClientsController, 'assign'])
              .where('id', router.matchers.number())
              .as('admin.clients.assign')
            router
              .post('/admin/clientes/:id/asignar', [AdminClientsController, 'storeAssignment'])
              .where('id', router.matchers.number())
              .as('admin.clients.assign.store')
          })
          .use(middleware.role({ roles: ['admin'] }))

        router
          .on('/instructor')
          .renderInertia('dashboard', { section: 'instructor' })
          .use(middleware.role({ roles: ['instructor'] }))

        router
          .group(() => {
            router.get('/clases', [MyClassesController, 'index']).as('client.classes')
            router
              .get('/clases/:id', [MyClassesController, 'show'])
              .where('id', router.matchers.number())
              .as('client.classes.show')
            router
              .post('/clases/:id/cancelar', [MyClassesController, 'cancel'])
              .where('id', router.matchers.number())
              .as('client.classes.cancel')
            router
              .post('/clases/:id/deshacer', [MyClassesController, 'undo'])
              .where('id', router.matchers.number())
              .as('client.classes.undo')
            router.get('/elegir-clase', [ChooseClassController, 'index']).as('client.choose')
            router
              .get('/elegir-clase/:id', [ChooseClassController, 'show'])
              .where('id', router.matchers.number())
              .as('client.choose.show')
            router
              .post('/elegir-clase/:id', [ChooseClassController, 'store'])
              .where('id', router.matchers.number())
              .as('client.choose.store')
            router.get('/plan', [MyPlanController, 'index']).as('client.plan')
            router.get('/pagos', [PaymentsController, 'index']).as('client.payments')
            router
              .get('/pagos/:id/comprobante', [PaymentsController, 'create'])
              .where('id', router.matchers.number())
              .as('client.payments.receipt')
            router
              .post('/pagos/:id/comprobante', [PaymentsController, 'store'])
              .where('id', router.matchers.number())
              .as('client.payments.receipt.store')
            router.on('/perfil').renderInertia('client/profile', {}).as('client.profile')
          })
          .use(middleware.role({ roles: ['client'] }))

        router
          .get('/pagos/comprobantes/:id', [PaymentsController, 'receipt'])
          .where('id', router.matchers.number())
          .as('receipts.show')
          .use(middleware.role({ roles: ['client', 'admin'] }))
      })
      .use(middleware.requireTenant())
      .use(middleware.auth())
  })
  .use(middleware.tenant())
