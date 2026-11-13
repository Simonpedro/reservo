import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('whatsapp_phone', 32).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('whatsapp_phone')
    })
  }
}
