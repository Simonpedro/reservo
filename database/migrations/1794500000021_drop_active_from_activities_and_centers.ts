import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Activities and centers are no longer turned off: every one is offered.
 */
export default class extends BaseSchema {
  async up() {
    for (const tableName of ['activities', 'centers']) {
      this.schema.alterTable(tableName, (table) => {
        table.dropColumn('active')
      })
    }
  }

  async down() {
    for (const tableName of ['activities', 'centers']) {
      this.schema.alterTable(tableName, (table) => {
        table.boolean('active').notNullable().defaultTo(true)
      })
    }
  }
}
