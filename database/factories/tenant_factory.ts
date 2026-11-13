import Tenant from '#models/tenant'
import factory from '@adonisjs/lucid/factories'

export const TenantFactory = factory
  .define(Tenant, ({ faker }) => ({
    slug: `t-${faker.string.alphanumeric({ length: 10, casing: 'lower' })}`,
    name: faker.company.name(),
    theme: {},
    whatsappPhone: null,
    transferAliases: [],
  }))
  .build()
