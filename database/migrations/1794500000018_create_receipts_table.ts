import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'receipts'

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
      table
        .integer('monthly_fee_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('monthly_fees')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('filename', 255).notNullable()
      table.string('mime', 100).notNullable()
      table.integer('size').notNullable()
      table.binary('data').notNullable()
      table
        .enu('status', ['in_review', 'approved', 'rejected'], {
          useNative: false,
          enumName: 'receipts_status_check',
        })
        .notNullable()
        .defaultTo('in_review')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.index(['tenant_id', 'monthly_fee_id'])
      table.index(['tenant_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
