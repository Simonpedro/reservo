import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class GenerateBookings extends BaseCommand {
  static commandName = 'bookings:generate'
  static description = 'Create the fixed-schedule bookings of the next four weeks for every tenant'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Only generate for the tenant with this slug' })
  declare tenant?: string

  async run() {
    const { default: Tenant } = await import('#models/tenant')
    const { default: BookingGenerator } = await import('#services/booking_generator')

    const tenants = await Tenant.query()
      .if(this.tenant, (query) => query.where('slug', this.tenant!))
      .orderBy('id')

    if (this.tenant && tenants.length === 0) {
      this.logger.error(`No tenant with slug "${this.tenant}"`)
      this.exitCode = 1
      return
    }

    const generator = new BookingGenerator()
    for (const tenant of tenants) {
      const summary = await generator.generate({ tenantId: tenant.id })
      this.logger.success(
        `${tenant.slug}: ${summary.created} created, ${summary.existing} existing, ${summary.skipped} skipped`
      )
    }
  }
}
