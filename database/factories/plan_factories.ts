import FixedSlot from '#models/fixed_slot'
import Plan from '#models/plan'
import PlanQuota from '#models/plan_quota'
import Subscription from '#models/subscription'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const PlanFactory = factory
  .define(Plan, ({ faker }) => ({
    name: `Plan ${faker.word.adjective()}`,
    price: faker.number.int({ min: 20, max: 60 }) * 1000,
    active: true,
    position: 0,
  }))
  .build()

export const PlanQuotaFactory = factory
  .define(PlanQuota, () => ({
    weeklyCount: 1,
    anyActivity: true,
    position: 0,
  }))
  .build()

export const SubscriptionFactory = factory
  .define(Subscription, () => ({
    startsOn: DateTime.now().minus({ months: 1 }),
    endsOn: null,
  }))
  .build()

export const FixedSlotFactory = factory
  .define(FixedSlot, () => ({
    startsOn: DateTime.now().minus({ months: 1 }),
    endsOn: null,
  }))
  .build()
