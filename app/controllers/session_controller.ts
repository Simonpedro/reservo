import User from '#models/user'
import { roleHome } from '#services/role_home'
import { loginValidator } from '#validators/session'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, response, auth, session, tenant }: HttpContext) {
    const credentials = await request.validateUsing(loginValidator)
    const user = await User.query()
      .where('tenantId', tenant!.id)
      .where('email', credentials.email)
      .first()

    if (!user || !(await user.verifyPassword(credentials.password))) {
      session.flashExcept(['password'])
      session.flash('errors', { credentials: 'El email o la contraseña no coinciden.' })
      return response.redirect().back()
    }

    await auth.use('web').login(user)
    return response.redirect(roleHome(user.role))
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }
}
