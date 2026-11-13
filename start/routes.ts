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
              .on('/plan')
              .renderInertia('client/coming_soon', { tab: 'plan' })
              .as('client.plan')
            router
              .on('/pagos')
              .renderInertia('client/coming_soon', { tab: 'payments' })
              .as('client.payments')
            router.on('/perfil').renderInertia('client/profile', {}).as('client.profile')
          })
          .use(middleware.role({ roles: ['client'] }))
      })
      .use(middleware.requireTenant())
      .use(middleware.auth())
  })
  .use(middleware.tenant())
