import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

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
      table.string('name', 120).notNullable()
      table.integer('price').notNullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.integer('position').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.check('?? >= 0', ['price'], 'plans_price_check')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
