import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'class_schedules'

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
        .integer('activity_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('activities')
        .onDelete('CASCADE')
      table
        .integer('center_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('centers')
        .onDelete('CASCADE')
      table.smallint('weekday').notNullable()
      table.string('start_time', 5).notNullable()
      table.integer('duration_minutes').notNullable().defaultTo(60)
      table.integer('capacity').notNullable()
      table.string('instructor_name', 120).notNullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.index(['tenant_id', 'weekday'])
      table.check('?? between 1 and 7', ['weekday'], 'class_schedules_weekday_check')
      table.check(
        "?? ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'",
        ['start_time'],
        'class_schedules_start_time_check'
      )
      table.check('?? > 0', ['capacity'], 'class_schedules_capacity_check')
      table.check('?? > 0', ['duration_minutes'], 'class_schedules_duration_check')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
