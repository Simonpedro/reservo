import Activity from '#models/activity'
import Center from '#models/center'
import Tenant from '#models/tenant'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/**
 * Production-safe Kinaf data: the tenant, its centers and its activities.
 * The development admin is only created outside production.
 */
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

    for (const center of [
      { slug: 'mendoza', name: 'Mendoza' },
      { slug: 'ovidio-lagos', name: 'Ovidio Lagos' },
    ]) {
      await Center.updateOrCreate({ tenantId: tenant.id, slug: center.slug }, center)
    }

    for (const activity of [
      { slug: 'gimnasio', name: 'Gimnasio', wash: 'blue' as const },
      { slug: 'pilates', name: 'Pilates', wash: 'celeste' as const },
      { slug: 'yoga', name: 'Yoga', wash: 'green' as const },
    ]) {
      await Activity.updateOrCreate(
        { tenantId: tenant.id, slug: activity.slug },
        { ...activity, image: `/images/activities/${activity.slug}.webp` }
      )
    }

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
