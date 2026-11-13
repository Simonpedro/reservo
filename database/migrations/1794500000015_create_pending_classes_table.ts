import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pending_classes'

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
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('plan_quota_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('plan_quotas')
        .onDelete('RESTRICT')
      table
        .integer('origin_booking_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('bookings')
        .onDelete('CASCADE')
      table
        .enu('reason', ['cancelled', 'absent', 'suspended'], {
          useNative: false,
          enumName: 'pending_classes_reason_check',
        })
        .notNullable()
      table.date('missed_on').notNullable()
      table.date('expires_on').notNullable()
      table
        .enu('status', ['available', 'used', 'expired', 'revoked'], {
          useNative: false,
          enumName: 'pending_classes_status_check',
        })
        .notNullable()
        .defaultTo('available')
      table
        .integer('used_booking_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('bookings')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.index(['tenant_id', 'user_id', 'status'])
      table.index(['origin_booking_id'])
    })

    this.schema.alterTable('bookings', (table) => {
      table
        .foreign('pending_class_id')
        .references('id')
        .inTable(this.tableName)
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('bookings', (table) => {
      table.dropForeign(['pending_class_id'])
    })
    this.schema.dropTable(this.tableName)
  }
}
