import AccessLink from '#models/access_link'
import Activity from '#models/activity'
import Center from '#models/center'
import ClassSchedule from '#models/class_schedule'
import FixedSlot from '#models/fixed_slot'
import Plan from '#models/plan'
import PlanQuota from '#models/plan_quota'
import Subscription from '#models/subscription'
import Tenant from '#models/tenant'
import User from '#models/user'
import { ACCESS_LINK_DAYS, hashToken } from '#services/access_links'
import BookingGenerator from '#services/booking_generator'
import { businessNow } from '#services/business_calendar'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import KinafSeeder from './kinaf_seeder.js'

/**
 * Known token of the demo student's access link (README). Demo data only.
 */
export const DEMO_ACCESS_TOKEN = 'demo-sofi-kinaf'

/**
 * Kinaf weekly classes from the prototype: [weekday, time, activity, center, instructor, capacity].
 */
const SCHEDULES = [
  [1, '18:00', 'pilates', 'mendoza', 'Agus', 10],
  [1, '19:00', 'yoga', 'ovidio-lagos', 'Mica', 10],
  [2, '18:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [2, '19:30', 'pilates', 'ovidio-lagos', 'Agus', 8],
  [3, '18:00', 'pilates', 'mendoza', 'Agus', 10],
  [3, '19:00', 'yoga', 'ovidio-lagos', 'Mica', 10],
  [3, '20:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [4, '18:00', 'pilates', 'mendoza', 'Agus', 10],
  [4, '19:00', 'gimnasio', 'ovidio-lagos', 'Nico', 12],
  [5, '18:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [5, '19:00', 'yoga', 'mendoza', 'Mica', 10],
  [6, '10:00', 'pilates', 'mendoza', 'Agus', 8],
] as const

/**
 * Development/demo data: class schedules, one plan and the demo student
 * Sofi Ortiz with her fixed schedule and access link. Runs outside
 * production, or in production only with DEMO_SEED=true.
 */
export default class extends BaseSeeder {
  async run() {
    if (app.inProduction && !env.get('DEMO_SEED')) return

    await new KinafSeeder(this.client).run()
    const tenant = await Tenant.findByOrFail('slug', 'kinaf')
    const tenantId = tenant.id

    if (!app.inProduction && !tenant.whatsappPhone) {
      tenant.whatsappPhone = '5493410000000'
      await tenant.save()
    }

    const centers = new Map(
      (await Center.query().where('tenantId', tenantId)).map((center) => [center.slug, center])
    )
    const activities = new Map(
      (await Activity.query().where('tenantId', tenantId)).map((activity) => [
        activity.slug,
        activity,
      ])
    )

    const schedules = new Map<string, ClassSchedule>()
    for (const [weekday, startTime, activity, center, instructorName, capacity] of SCHEDULES) {
      const schedule = await ClassSchedule.updateOrCreate(
        {
          tenantId,
          weekday,
          startTime,
          activityId: activities.get(activity)!.id,
          centerId: centers.get(center)!.id,
        },
        { instructorName, capacity, durationMinutes: 60, active: true }
      )
      schedules.set(`${weekday}-${startTime}`, schedule)
    }

    const plan = await Plan.updateOrCreate(
      { tenantId, name: '1 Gym/Pilates + 1 Yoga' },
      { price: 38000, active: true, position: 0 }
    )
    const gymPilates = await PlanQuota.updateOrCreate(
      { tenantId, planId: plan.id, position: 0 },
      { weeklyCount: 1, anyActivity: false }
    )
    const yoga = await PlanQuota.updateOrCreate(
      { tenantId, planId: plan.id, position: 1 },
      { weeklyCount: 1, anyActivity: false }
    )
    await gymPilates.related('activities').sync({
      [activities.get('gimnasio')!.id]: { tenant_id: tenantId },
      [activities.get('pilates')!.id]: { tenant_id: tenantId },
    })
    await yoga.related('activities').sync({
      [activities.get('yoga')!.id]: { tenant_id: tenantId },
    })

    const sofi = await User.firstOrCreate(
      { tenantId, email: 'sofi@kinaf.test' },
      {
        fullName: 'Sofi Ortiz',
        password: randomBytes(24).toString('base64url'),
        role: 'client',
      }
    )

    const startsOn = businessNow().startOf('month')
    const subscription = await Subscription.firstOrCreate(
      { tenantId, userId: sofi.id, planId: plan.id },
      { startsOn }
    )
    for (const [key, quota] of [
      ['1-18:00', gymPilates],
      ['3-19:00', yoga],
    ] as const) {
      await FixedSlot.firstOrCreate(
        {
          tenantId,
          userId: sofi.id,
          subscriptionId: subscription.id,
          classScheduleId: schedules.get(key)!.id,
        },
        { planQuotaId: quota.id, startsOn }
      )
    }

    await AccessLink.updateOrCreate(
      { tokenHash: hashToken(DEMO_ACCESS_TOKEN) },
      {
        tenantId,
        userId: sofi.id,
        expiresAt: DateTime.now().plus({ days: ACCESS_LINK_DAYS }),
        revokedAt: null,
      }
    )

    await new BookingGenerator().generate({ tenantId })
  }
}
