import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'activities'

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
      table
        .enu('wash', ['celeste', 'green', 'blue'], {
          useNative: false,
          enumName: 'activities_wash_check',
        })
        .notNullable()
        .defaultTo('celeste')
      table.string('image', 255).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['tenant_id', 'slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
