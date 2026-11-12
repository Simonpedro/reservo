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

const SessionController = () => import('#controllers/session_controller')
const DashboardController = () => import('#controllers/dashboard_controller')

router.get('/health', () => ({ status: 'ok' })).as('health')

router
  .group(() => {
    router.on('/').renderInertia('home', {}).as('home')

    router
      .group(() => {
        router.get('/login', [SessionController, 'create']).as('login')
        router.post('/login', [SessionController, 'store']).as('session.store')
      })
      .use(middleware.requireTenant())
      .use(middleware.guest())

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
          .on('/portal')
          .renderInertia('dashboard', { section: 'client' })
          .use(middleware.role({ roles: ['client'] }))
      })
      .use(middleware.requireTenant())
      .use(middleware.auth())
  })
  .use(middleware.tenant())
