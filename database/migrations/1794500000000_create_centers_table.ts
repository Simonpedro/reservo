import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'centers'

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
      table.string('slug', 63).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['tenant_id', 'slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
