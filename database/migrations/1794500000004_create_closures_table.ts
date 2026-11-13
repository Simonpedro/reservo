import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'closures'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      table.date('date').notNullable()
      table
        .integer('center_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('centers')
        .onDelete('CASCADE')
      table.string('reason', 120).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.index(['tenant_id', 'date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
