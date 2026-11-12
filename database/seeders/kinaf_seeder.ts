import Tenant from '#models/tenant'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const tenant = await Tenant.updateOrCreate(
      { slug: 'kinaf' },
      {
        name: 'Kinaf',
        theme: {
          brandBackground: '#001A4D',
          green: '#8CC463',
          lightBlue: '#5AB8F0',
          blue: '#3E88F0',
          accent: '#6EF04A',
        },
      }
    )

    if (!app.inProduction) {
      await User.updateOrCreate(
        { tenantId: tenant.id, email: 'admin@kinaf.test' },
        {
          fullName: 'Admin Kinaf',
          password: 'KinafDev2026!',
          role: 'admin',
        }
      )
    }
  }
}
