import DailyRun from './daily_run.js'

/** @deprecated Use `daily:run` */
export default class GenerateBookings extends DailyRun {
  static commandName = 'bookings:generate'
  static description = DailyRun.description
}
