import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class DemoResetSofi extends BaseCommand {
  static commandName = 'demo:reset-sofi'
  static description =
    'Reset only Sofi Ortiz to the demo state (plan, fixed slots, pending class, fees and access link), without touching other students'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: KinafDemoSeeder } = await import('#database/seeders/kinaf_demo_seeder')
    const { default: db } = await import('@adonisjs/lucid/services/db')

    const result = await new KinafDemoSeeder(db.connection()).resetSofi()
    this.logger.success(
      `Sofi Ortiz: plan ${result.plan}, ${result.slots} fixed slots, access link renewed; bookings ${result.bookings.created} created, ${result.bookings.existing} existing, ${result.bookings.skipped} skipped`
    )
  }
}
