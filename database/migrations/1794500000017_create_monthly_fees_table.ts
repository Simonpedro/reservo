import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'monthly_fees'

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
        .integer('subscription_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('subscriptions')
        .onDelete('CASCADE')
      table.date('period').notNullable()
      table.integer('amount').notNullable()
      table
        .enu('status', ['pending', 'in_review', 'paid'], {
          useNative: false,
          enumName: 'monthly_fees_status_check',
        })
        .notNullable()
        .defaultTo('pending')
      table.timestamp('paid_at', { useTz: true }).nullable()
      table
        .enu('method', ['cash', 'transfer', 'forced'], {
          useNative: false,
          enumName: 'monthly_fees_method_check',
        })
        .nullable()
      table
        .integer('recorded_by_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['user_id', 'period'])
      table.index(['tenant_id', 'period', 'status'])
      table.check('extract(day from ??) = 1', ['period'], 'monthly_fees_period_first_day_check')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
