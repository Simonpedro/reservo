import Activity from '#models/activity'
import Center from '#models/center'
import ClassSchedule from '#models/class_schedule'
import Closure from '#models/closure'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

/**
 * Every factory here needs `tenantId` (and the parent ids) merged in, so
 * records never cross tenants by accident.
 */
export const CenterFactory = factory
  .define(Center, ({ faker }) => {
    const name = faker.location.street()
    return {
      name,
      slug: `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(4)}`,
    }
  })
  .build()

export const ActivityFactory = factory
  .define(Activity, ({ faker }) => {
    const name = faker.helpers.arrayElement(['Pilates', 'Yoga', 'Gimnasio'])
    return {
      name,
      slug: `${name.toLowerCase()}-${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
      wash: faker.helpers.arrayElement(['celeste', 'green', 'blue'] as const),
      image: null,
    }
  })
  .build()

export const ClassScheduleFactory = factory
  .define(ClassSchedule, ({ faker }) => ({
    weekday: faker.number.int({ min: 1, max: 6 }),
    startTime: '18:00',
    durationMinutes: 60,
    capacity: 10,
    instructorName: faker.person.firstName(),
    active: true,
  }))
  .build()

export const ClosureFactory = factory
  .define(Closure, () => ({
    date: DateTime.now(),
    centerId: null,
    reason: 'Feriado',
  }))
  .build()
