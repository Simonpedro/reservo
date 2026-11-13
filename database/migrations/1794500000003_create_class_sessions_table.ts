import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'class_sessions'

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
        .integer('class_schedule_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('class_schedules')
        .onDelete('CASCADE')
      table.date('date').notNullable()
      table
        .enu('status', ['scheduled', 'suspended'], {
          useNative: false,
          enumName: 'class_sessions_status_check',
        })
        .notNullable()
        .defaultTo('scheduled')
      table.string('suspension_reason', 120).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['class_schedule_id', 'date'])
      table.index(['tenant_id', 'date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
