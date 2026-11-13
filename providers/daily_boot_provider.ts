import type { ApplicationService } from '@adonisjs/core/types'

export default class DailyBootProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    if (!this.app.inProduction || process.env.DAILY_RUN_ON_BOOT === 'false') return

    const logger = await this.app.container.make('logger')
    setImmediate(() => {
      void (async () => {
        try {
          const { default: DailyProcess } = await import('#services/daily_process')
          const summary = await new DailyProcess().runAllTenants()
          logger.info({ summary }, 'Daily process completed on boot')
        } catch (error) {
          logger.error({ err: error }, 'Daily process failed on boot')
        }
      })()
    })
  }
}
