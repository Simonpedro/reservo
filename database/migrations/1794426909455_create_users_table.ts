import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

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
      table.string('email', 254).notNullable()
      table.string('full_name', 120).notNullable()
      table.string('password').notNullable()
      table
        .enu('role', ['admin', 'instructor', 'client'], {
          useNative: false,
          enumName: 'users_role_check',
        })
        .notNullable()
        .defaultTo('client')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['tenant_id', 'email'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
