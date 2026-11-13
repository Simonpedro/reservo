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
const DashboardController = () => import('#controllers/dashboard_controller')
const MyClassesController = () => import('#controllers/my_classes_controller')
const ChooseClassController = () => import('#controllers/choose_class_controller')
const MyPlanController = () => import('#controllers/my_plan_controller')
const PaymentsController = () => import('#controllers/payments_controller')

router.get('/health', () => ({ status: 'ok' })).as('health')

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
        router.get('/dashboard', [DashboardController, 'index']).as('dashboard')
        router.post('/logout', [SessionController, 'destroy']).as('logout')

        router
          .on('/admin')
          .renderInertia('dashboard', { section: 'admin' })
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
