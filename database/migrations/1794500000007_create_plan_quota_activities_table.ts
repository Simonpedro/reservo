import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plan_quota_activities'

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
        .integer('plan_quota_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('plan_quotas')
        .onDelete('CASCADE')
      table
        .integer('activity_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('activities')
        .onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['plan_quota_id', 'activity_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
