import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fixed_slots'

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
        .integer('subscription_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('subscriptions')
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
        .integer('class_schedule_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('class_schedules')
        .onDelete('RESTRICT')
      table.date('starts_on').notNullable()
      table.date('ends_on').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.index(['tenant_id', 'user_id'])
      table.index(['class_schedule_id'])
      table.check(
        '?? is null or ?? >= ??',
        ['ends_on', 'ends_on', 'starts_on'],
        'fixed_slots_range_check'
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
