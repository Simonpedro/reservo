import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class DailyRun extends BaseCommand {
  static commandName = 'daily:run'
  static description =
    "Daily process: create the next four weeks' fixed-schedule bookings, this month's fees, and expire overdue pending classes for every tenant"

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Only run for the tenant with this slug' })
  declare tenant?: string

  async run() {
    const { default: Tenant } = await import('#models/tenant')
    const { default: DailyProcess } = await import('#services/daily_process')

    const tenants = await Tenant.query()
      .if(this.tenant, (query) => query.where('slug', this.tenant!))
      .orderBy('id')

    if (this.tenant && tenants.length === 0) {
      this.logger.error(`No tenant with slug "${this.tenant}"`)
      this.exitCode = 1
      return
    }

    const process = new DailyProcess()
    for (const tenant of tenants) {
      const { bookings, fees, pendings } = await process.run({ tenantId: tenant.id })
      this.logger.success(
        `${tenant.slug}: bookings ${bookings.created} created, ${bookings.existing} existing, ${bookings.skipped} skipped; fees ${fees.created} created, ${fees.existing} existing; pendings ${pendings.expired} expired`
      )
    }
  }
}
