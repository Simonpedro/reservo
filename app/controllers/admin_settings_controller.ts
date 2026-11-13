import { settingsOverview } from '#services/admin_plans'
import type { HttpContext } from '@adonisjs/core/http'

export default class AdminSettingsController {
  async show({ inertia, tenant }: HttpContext) {
    return inertia.render('admin/settings', await settingsOverview(tenant!.id))
  }
}
