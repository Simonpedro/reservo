import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

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
        .integer('class_session_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('class_sessions')
        .onDelete('CASCADE')
      table
        .integer('plan_quota_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('plan_quotas')
        .onDelete('RESTRICT')
      table
        .enu('source', ['fixed', 'pending'], {
          useNative: false,
          enumName: 'bookings_source_check',
        })
        .notNullable()
      table
        .integer('fixed_slot_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('fixed_slots')
        .onDelete('SET NULL')
      // References pending_classes once that table exists.
      table.integer('pending_class_id').unsigned().nullable()
      table
        .enu('status', ['active', 'cancelled', 'absent', 'suspended'], {
          useNative: false,
          enumName: 'bookings_status_check',
        })
        .notNullable()
        .defaultTo('active')
      table.timestamp('cancelled_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.index(['tenant_id', 'user_id'])
      table.index(['class_session_id', 'status'])
    })

    this.schema.raw(
      "create unique index bookings_one_active_per_session on bookings (user_id, class_session_id) where status = 'active'"
    )
    this.schema.raw(
      'create unique index bookings_one_per_fixed_slot_session on bookings (fixed_slot_id, class_session_id) where fixed_slot_id is not null'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
