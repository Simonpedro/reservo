import AccessLink from '#models/access_link'
import Activity from '#models/activity'
import Booking from '#models/booking'
import Center from '#models/center'
import ClassSchedule from '#models/class_schedule'
import Closure from '#models/closure'
import FixedSlot from '#models/fixed_slot'
import MonthlyFee from '#models/monthly_fee'
import PendingClass, { type PendingClassReason } from '#models/pending_class'
import Plan from '#models/plan'
import type PlanQuota from '#models/plan_quota'
import Receipt from '#models/receipt'
import Subscription from '#models/subscription'
import Tenant from '#models/tenant'
import User from '#models/user'
import { ACCESS_LINK_DAYS, hashToken } from '#services/access_links'
import {
  addDays,
  BUSINESS_ZONE,
  businessDate,
  businessNow,
  isoWeekday,
  type IsoDate,
} from '#services/business_calendar'
import { findOrCreateSession } from '#services/class_sessions'
import DailyProcess from '#services/daily_process'
import { ensureFee } from '#services/fees'
import PendingClasses from '#services/pending_classes'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { randomBytes } from 'node:crypto'
import { crc32, deflateSync } from 'node:zlib'
import { DateTime } from 'luxon'
import KinafSeeder from './kinaf_seeder.js'

/**
 * Known token of the demo student's access link (README). Demo data only.
 */
export const DEMO_ACCESS_TOKEN = 'demo-sofi-kinaf'

/**
 * Kinaf weekly classes: [weekday, time, activity, center, instructor, capacity].
 * The evening ones come from the prototype; mornings are Gimnasio, plus a
 * few Pilates and Yoga classes.
 */
const SCHEDULES = [
  [1, '08:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [1, '18:00', 'pilates', 'mendoza', 'Agus', 10],
  [1, '19:00', 'yoga', 'ovidio-lagos', 'Mica', 10],
  [2, '09:00', 'gimnasio', 'ovidio-lagos', 'Lean', 10],
  [2, '10:00', 'pilates', 'mendoza', 'Agus', 8],
  [2, '18:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [2, '19:30', 'pilates', 'ovidio-lagos', 'Agus', 8],
  [3, '08:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [3, '18:00', 'pilates', 'mendoza', 'Agus', 10],
  [3, '19:00', 'yoga', 'ovidio-lagos', 'Mica', 10],
  [3, '20:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [4, '09:00', 'gimnasio', 'ovidio-lagos', 'Lean', 10],
  [4, '10:00', 'yoga', 'ovidio-lagos', 'Mica', 10],
  [4, '18:00', 'pilates', 'mendoza', 'Agus', 10],
  [4, '19:00', 'gimnasio', 'ovidio-lagos', 'Nico', 12],
  [5, '08:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [5, '18:00', 'gimnasio', 'mendoza', 'Nico', 12],
  [5, '19:00', 'yoga', 'mendoza', 'Mica', 10],
  [6, '09:00', 'gimnasio', 'ovidio-lagos', 'Lean', 10],
  [6, '10:00', 'pilates', 'mendoza', 'Agus', 8],
] as const

type ScheduleKey = `${(typeof SCHEDULES)[number][0]}-${(typeof SCHEDULES)[number][1]}`

/**
 * This month's fee as the student sees it. `overdue` leaves last month unpaid.
 */
type DemoFee = 'pending' | 'in_review' | 'paid' | 'overdue'

type DemoStudent = {
  email: string
  fullName: string
  phone: string
  plan: string | null
  /**
   * Fixed slots: class (weekday-time) and the index of the plan quota it uses.
   */
  slots: Array<[ScheduleKey, number]>
  fee: DemoFee | null
  /**
   * Past months with a fee (all paid, except last month when `overdue`).
   */
  history?: number
  /**
   * A pending class from the last occurrence of the first fixed slot.
   */
  pending?: PendingClassReason
}

const STUDENTS: DemoStudent[] = [
  {
    email: 'sofi@kinaf.test',
    fullName: 'Sofi Ortiz',
    phone: '5493415550101',
    plan: '2 Gym/Pilates + 1 Yoga',
    slots: [
      ['1-18:00', 0],
      ['5-18:00', 0],
      ['3-19:00', 1],
    ],
    fee: 'pending',
    history: 3,
    pending: 'cancelled',
  },
  {
    email: 'lu.martinez@kinaf.test',
    fullName: 'Lu Martínez',
    phone: '5493415550102',
    plan: 'Gimnasio 3x semana',
    slots: [
      ['1-08:00', 0],
      ['3-08:00', 0],
      ['5-08:00', 0],
    ],
    fee: 'paid',
  },
  {
    email: 'juan.ponce@kinaf.test',
    fullName: 'Juan Ponce',
    phone: '5493415550103',
    plan: 'Pilates 2x semana',
    slots: [
      ['2-19:30', 0],
      ['4-18:00', 0],
    ],
    fee: 'paid',
  },
  {
    email: 'carla.vico@kinaf.test',
    fullName: 'Carla Vico',
    phone: '5493415550104',
    plan: '1 Gym + 1 Pilates',
    slots: [],
    fee: 'paid',
  },
  {
    email: 'mati.ruiz@kinaf.test',
    fullName: 'Mati Ruiz',
    phone: '5493415550105',
    plan: '2 Gym/Pilates + 1 Gym/Pilates',
    slots: [
      ['3-20:00', 0],
      ['4-19:00', 0],
      ['6-09:00', 1],
    ],
    fee: 'overdue',
    pending: 'absent',
  },
  {
    email: 'ana.gomez@kinaf.test',
    fullName: 'Ana Gómez',
    phone: '5493415550106',
    plan: '1 Gym/Pilates + 1 Yoga',
    slots: [
      ['3-18:00', 0],
      ['1-19:00', 1],
    ],
    fee: 'in_review',
  },
  {
    email: 'fede.paz@kinaf.test',
    fullName: 'Fede Paz',
    phone: '5493415550107',
    plan: null,
    slots: [],
    fee: null,
  },
  {
    email: 'nati.acosta@kinaf.test',
    fullName: 'Nati Acosta',
    phone: '5493415550108',
    plan: 'Yoga 2x semana',
    slots: [
      ['1-19:00', 0],
      ['5-19:00', 0],
    ],
    fee: 'in_review',
  },
  {
    email: 'tomi.sosa@kinaf.test',
    fullName: 'Tomi Sosa',
    phone: '5493415550109',
    plan: '1 Gym + 1 Pilates + 1 Yoga',
    slots: [
      ['2-18:00', 0],
      ['6-10:00', 1],
      ['4-10:00', 2],
    ],
    fee: 'pending',
  },
  {
    email: 'flor.ibanez@kinaf.test',
    fullName: 'Flor Ibáñez',
    phone: '5493415550110',
    plan: 'Pilates 1x semana',
    slots: [['2-10:00', 0]],
    fee: 'overdue',
  },
  {
    email: 'pau.rey@kinaf.test',
    fullName: 'Pau Rey',
    phone: '5493415550111',
    plan: '1 Gym/Pilates + 2 Yoga',
    slots: [
      ['2-09:00', 0],
      ['1-19:00', 1],
      ['4-10:00', 1],
    ],
    fee: 'paid',
  },
  {
    email: 'leo.funes@kinaf.test',
    fullName: 'Leo Funes',
    phone: '5493415550112',
    plan: 'Gimnasio 2x semana',
    slots: [],
    fee: 'pending',
  },
]

/**
 * Argentine national holidays (non-movable ones for 2027). The demo closes
 * the next one within the booking window; if there is none, an example
 * closure ten days ahead.
 */
const HOLIDAYS: Array<[IsoDate, string]> = [
  ['2026-11-23', 'Feriado: Día de la Soberanía Nacional'],
  ['2026-12-08', 'Feriado: Inmaculada Concepción de María'],
  ['2026-12-25', 'Feriado: Navidad'],
  ['2027-01-01', 'Feriado: Año Nuevo'],
  ['2027-02-08', 'Feriado: Carnaval'],
  ['2027-02-09', 'Feriado: Carnaval'],
  ['2027-03-24', 'Feriado: Día de la Memoria'],
  ['2027-03-26', 'Feriado: Viernes Santo'],
  ['2027-04-02', 'Feriado: Día de los Veteranos de Malvinas'],
  ['2027-05-01', 'Feriado: Día del Trabajador'],
  ['2027-05-25', 'Feriado: Revolución de Mayo'],
  ['2027-06-20', 'Feriado: Día de la Bandera'],
  ['2027-07-09', 'Feriado: Día de la Independencia'],
  ['2027-12-08', 'Feriado: Inmaculada Concepción de María'],
  ['2027-12-25', 'Feriado: Navidad'],
]

/**
 * Development/demo data on top of `kinaf_seeder`: class schedules, the demo
 * admin, a dozen students with plans, fixed slots, pending classes and fees
 * in every status, and one closed day. Dates are relative to today so the
 * demo always makes sense. Runs outside production, or in production only
 * with DEMO_SEED=true. Idempotent.
 */
export default class extends BaseSeeder {
  async run() {
    if (app.inProduction && !env.get('DEMO_SEED')) return

    await new KinafSeeder(this.client).run()
    const tenant = await Tenant.findByOrFail('slug', 'kinaf')
    const tenantId = tenant.id
    const now = businessNow()
    const today = businessDate(now)

    if (!app.inProduction && !tenant.whatsappPhone) {
      tenant.whatsappPhone = '5493410000000'
      await tenant.save()
    }

    const admin = await User.updateOrCreate(
      { tenantId, email: 'admin@kinaf.test' },
      { fullName: 'Admin Kinaf', password: 'KinafDev2026!', role: 'admin' }
    )

    const schedules = await this.seedSchedules(tenantId)
    const planRows = await Plan.query()
      .where('tenantId', tenantId)
      .preload('quotas', (quotas) => quotas.orderBy('position'))
    const plans = new Map(planRows.map((plan) => [plan.name, plan]))

    for (const student of STUDENTS) {
      const user = await User.firstOrCreate(
        { tenantId, email: student.email },
        {
          fullName: student.fullName,
          phone: student.phone,
          password: randomBytes(24).toString('base64url'),
          role: 'client',
        }
      )
      if (!student.plan) continue

      const plan = plans.get(student.plan)!
      const subscription = await this.subscribe(user, plan, now)
      const slots = await this.seedSlots(user, subscription, plan, student, schedules, today)
      await this.seedFees(user, subscription, plan, student, admin, now)
      if (student.pending) await this.seedPending(slots[0], student.pending, today)
    }

    const sofi = await User.findByOrFail({ tenantId, email: 'sofi@kinaf.test' })
    await AccessLink.updateOrCreate(
      { tokenHash: hashToken(DEMO_ACCESS_TOKEN) },
      {
        tenantId,
        userId: sofi.id,
        expiresAt: DateTime.now().plus({ days: ACCESS_LINK_DAYS }),
        revokedAt: null,
      }
    )

    await this.seedClosure(tenantId, today)
    await new DailyProcess().run({ tenantId, now })
  }

  private async seedSchedules(tenantId: number) {
    const centerRows = await Center.query().where('tenantId', tenantId)
    const centers = new Map(centerRows.map((center) => [center.slug, center]))
    const activityRows = await Activity.query().where('tenantId', tenantId)
    const activities = new Map(activityRows.map((activity) => [activity.slug, activity]))

    const schedules = new Map<ScheduleKey, ClassSchedule>()
    for (const [weekday, startTime, activity, center, instructorName, capacity] of SCHEDULES) {
      const schedule = await ClassSchedule.updateOrCreate(
        {
          tenantId,
          weekday,
          startTime,
          activityId: activities.get(activity)!.id,
          centerId: centers.get(center)!.id,
        },
        { instructorName, capacity, durationMinutes: 60, active: true }
      )
      schedules.set(`${weekday}-${startTime}`, schedule)
    }
    return schedules
  }

  /**
   * The student's subscription, moved to `plan` if it had another one. It
   * started three months ago so the Pagos screen has a history.
   */
  private async subscribe(user: User, plan: Plan, now: DateTime) {
    const existing = await Subscription.query()
      .where('tenantId', user.tenantId)
      .where('userId', user.id)
      .orderBy('id')
      .first()
    if (existing) return existing.merge({ planId: plan.id, endsOn: null }).save()

    return Subscription.create({
      tenantId: user.tenantId,
      userId: user.id,
      planId: plan.id,
      startsOn: now.startOf('month').minus({ months: 3 }),
      endsOn: null,
    })
  }

  /**
   * Leaves the student with exactly the fixed slots of the list. Slots that
   * no longer belong (another class or quota) end yesterday and lose their
   * future bookings, so the daily process books the new ones.
   */
  private async seedSlots(
    user: User,
    subscription: Subscription,
    plan: Plan,
    student: DemoStudent,
    schedules: Map<ScheduleKey, ClassSchedule>,
    today: IsoDate
  ) {
    const tenantId = user.tenantId
    const yesterday = DateTime.fromISO(addDays(today, -1), { zone: BUSINESS_ZONE })
    const wanted = []
    for (const [key, quotaIndex] of student.slots) {
      const schedule = schedules.get(key)!
      const quota = plan.quotas[quotaIndex]
      await this.assertQuotaFits(quota, schedule, student)
      wanted.push({ schedule, quota })
    }

    const existing = await FixedSlot.query()
      .where('tenantId', tenantId)
      .where('userId', user.id)
      .where((query) => query.whereNull('endsOn').orWhere('endsOn', '>=', today))
    const slots: FixedSlot[] = []
    for (const { schedule, quota } of wanted) {
      const match = existing.find(
        (slot) =>
          slot.classScheduleId === schedule.id &&
          slot.planQuotaId === quota.id &&
          slot.subscriptionId === subscription.id
      )
      slots.push(
        match ??
          (await FixedSlot.create({
            tenantId,
            userId: user.id,
            subscriptionId: subscription.id,
            planQuotaId: quota.id,
            classScheduleId: schedule.id,
            startsOn: subscription.startsOn,
            endsOn: null,
          }))
      )
    }

    for (const stale of existing.filter((slot) => !slots.includes(slot))) {
      await Booking.query()
        .where('tenantId', tenantId)
        .where('fixedSlotId', stale.id)
        .where('status', 'active')
        .whereHas('classSession', (query) => query.where('date', '>=', today))
        .delete()
      await stale
        .merge({
          startsOn: stale.startsOn < yesterday ? stale.startsOn : yesterday,
          endsOn: yesterday,
        })
        .save()
    }
    return slots
  }

  private async assertQuotaFits(quota: PlanQuota, schedule: ClassSchedule, student: DemoStudent) {
    await quota.load('activities')
    if (!quota.activities.some((activity) => activity.id === schedule.activityId)) {
      throw new Error(`Demo slot of ${student.fullName} does not fit its plan quota`)
    }
  }

  /**
   * Past months are paid (last month unpaid when `overdue`), and this
   * month's fee is in the given status.
   */
  private async seedFees(
    user: User,
    subscription: Subscription,
    plan: Plan,
    student: DemoStudent,
    admin: User,
    now: DateTime
  ) {
    const fee = student.fee!
    const history = student.history ?? 1
    const thisMonth = now.startOf('month')
    for (let monthsAgo = history; monthsAgo >= 1; monthsAgo--) {
      const period = thisMonth.minus({ months: monthsAgo })
      const unpaid = fee === 'overdue' && monthsAgo === 1
      await MonthlyFee.updateOrCreate(
        { tenantId: user.tenantId, userId: user.id, period },
        unpaid
          ? { subscriptionId: subscription.id, amount: plan.price, status: 'pending' }
          : this.paid(
              subscription,
              plan,
              period.plus({ days: 2 + monthsAgo }),
              user.id % 2 === 0,
              admin
            )
      )
    }

    const current = await ensureFee(subscription, thisMonth.toISODate()!)
    if (fee === 'paid') {
      const paidAt = DateTime.min(thisMonth.plus({ days: 3 }), now)
      await current.merge(this.paid(subscription, plan, paidAt, true, admin)).save()
    }
    if (fee === 'in_review') {
      await current.merge({ status: 'in_review' }).save()
      const png = receiptPng()
      await Receipt.firstOrCreate(
        { tenantId: user.tenantId, monthlyFeeId: current.id },
        {
          userId: user.id,
          filename: 'comprobante-transferencia.png',
          mime: 'image/png',
          size: png.length,
          data: png,
          status: 'in_review',
        }
      )
    }
  }

  private paid(
    subscription: Subscription,
    plan: Plan,
    paidAt: DateTime,
    cash: boolean,
    admin: User
  ) {
    return {
      subscriptionId: subscription.id,
      amount: plan.price,
      status: 'paid' as const,
      method: cash ? ('cash' as const) : ('transfer' as const),
      paidAt,
      recordedById: cash ? admin.id : null,
    }
  }

  /**
   * A pending class from the slot's class in the last seven days, unless the
   * student already has one available for the same reason.
   */
  private async seedPending(slot: FixedSlot, reason: PendingClassReason, today: IsoDate) {
    const available = await PendingClass.query()
      .where('tenantId', slot.tenantId)
      .where('userId', slot.userId)
      .where('reason', reason)
      .where('status', 'available')
      .where('expiresOn', '>=', today)
      .first()
    if (available) return

    await slot.load('classSchedule')
    let missedOn = addDays(today, -1)
    while (isoWeekday(missedOn) !== slot.classSchedule.weekday) missedOn = addDays(missedOn, -1)

    const session = await findOrCreateSession(slot.classSchedule, missedOn)
    const status = reason === 'cancelled' ? 'cancelled' : 'absent'
    const cancelledAt =
      reason === 'cancelled'
        ? DateTime.fromISO(addDays(missedOn, -2), { zone: BUSINESS_ZONE }).set({ hour: 9 })
        : null
    const booking = await Booking.updateOrCreate(
      { tenantId: slot.tenantId, userId: slot.userId, classSessionId: session.id },
      {
        planQuotaId: slot.planQuotaId,
        source: 'fixed',
        fixedSlotId: slot.id,
        pendingClassId: null,
        status,
        cancelledAt,
      }
    )
    await new PendingClasses().grantFor(booking, reason)
  }

  private async seedClosure(tenantId: number, today: IsoDate) {
    const lastDay = addDays(today, 27)
    const [date, reason] = HOLIDAYS.find(([day]) => day > today && day <= lastDay) ?? [
      addDays(today, 10),
      'Cierre por mantenimiento',
    ]
    const existing = await Closure.query()
      .where('tenantId', tenantId)
      .where('date', date)
      .whereNull('centerId')
      .first()
    if (existing) return

    await Closure.create({
      tenantId,
      date: DateTime.fromISO(date, { zone: BUSINESS_ZONE }),
      centerId: null,
      reason,
    })
  }
}

/**
 * A small transfer-receipt-like PNG (white card with grey text lines and a
 * green "sent" bar), generated so the repo carries no binary fixture.
 */
function receiptPng(width = 120, height = 160): Buffer {
  const color = (x: number, y: number): [number, number, number] => {
    const inside = x >= 10 && x < width - 10
    if (inside && y >= 14 && y < 26) return [140, 196, 99]
    if (inside && y >= 40 && y < 120 && y % 14 < 4 && x < width - 10 - ((y * 7) % 40)) {
      return [190, 196, 204]
    }
    if (inside && y >= 132 && y < 142 && x < 70) return [0, 26, 77]
    return [255, 255, 255]
  }

  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1)
    for (let x = 0; x < width; x++) raw.set(color(x, y), row + 1 + x * 3)
  }

  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([length, body, crc])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 2, 0, 0, 0], 8)

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
