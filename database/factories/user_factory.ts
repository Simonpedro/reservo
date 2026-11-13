import User from '#models/user'
import { randomBytes } from 'node:crypto'
import factory from '@adonisjs/lucid/factories'

/**
 * Students by default. Merge `tenantId`. Students get an unusable random
 * password: they sign in with an access link.
 */
export const UserFactory = factory
  .define(User, ({ faker }) => ({
    email: faker.internet.email().toLowerCase(),
    fullName: faker.person.fullName(),
    password: randomBytes(24).toString('base64url'),
    role: 'client' as const,
    phone: null,
  }))
  .state('admin', (user) => {
    user.role = 'admin'
  })
  .build()
