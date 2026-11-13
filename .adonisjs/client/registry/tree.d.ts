/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: typeof routes['health']
  internal: {
    dailyRun: typeof routes['internal.dailyRun']
  }
  home: typeof routes['home']
  login: typeof routes['login']
  session: {
    store: typeof routes['session.store']
  }
  access: {
    show: typeof routes['access.show']
  }
  logout: typeof routes['logout']
  admin: {
    home: typeof routes['admin.home']
    today: typeof routes['admin.today']
    classes: {
      show: typeof routes['admin.classes.show']
      suspend: typeof routes['admin.classes.suspend']
      absent: typeof routes['admin.classes.absent']
      undoAbsent: typeof routes['admin.classes.undoAbsent']
    }
    agenda: typeof routes['admin.agenda'] & {
      closeForm: typeof routes['admin.agenda.closeForm']
      close: typeof routes['admin.agenda.close']
    }
    schedules: {
      create: typeof routes['admin.schedules.create']
      store: typeof routes['admin.schedules.store']
      edit: typeof routes['admin.schedules.edit']
      update: typeof routes['admin.schedules.update']
      deactivate: typeof routes['admin.schedules.deactivate']
      activate: typeof routes['admin.schedules.activate']
    }
    payments: typeof routes['admin.payments'] & {
      create: typeof routes['admin.payments.create']
      store: typeof routes['admin.payments.store']
      show: typeof routes['admin.payments.show']
      approve: typeof routes['admin.payments.approve']
      undoApprove: typeof routes['admin.payments.undoApprove']
      reject: typeof routes['admin.payments.reject']
    }
    settings: typeof routes['admin.settings']
    plans: {
      index: typeof routes['admin.plans.index']
      create: typeof routes['admin.plans.create']
      store: typeof routes['admin.plans.store']
      edit: typeof routes['admin.plans.edit']
      update: typeof routes['admin.plans.update']
      deactivate: typeof routes['admin.plans.deactivate']
      activate: typeof routes['admin.plans.activate']
    }
    activities: {
      index: typeof routes['admin.activities.index']
      create: typeof routes['admin.activities.create']
      store: typeof routes['admin.activities.store']
      edit: typeof routes['admin.activities.edit']
      update: typeof routes['admin.activities.update']
      deactivate: typeof routes['admin.activities.deactivate']
      activate: typeof routes['admin.activities.activate']
    }
    centers: {
      index: typeof routes['admin.centers.index']
      create: typeof routes['admin.centers.create']
      store: typeof routes['admin.centers.store']
      edit: typeof routes['admin.centers.edit']
      update: typeof routes['admin.centers.update']
      deactivate: typeof routes['admin.centers.deactivate']
      activate: typeof routes['admin.centers.activate']
    }
    clients: {
      index: typeof routes['admin.clients.index']
      create: typeof routes['admin.clients.create']
      store: typeof routes['admin.clients.store']
      show: typeof routes['admin.clients.show']
      issueAccessLink: typeof routes['admin.clients.issueAccessLink']
      assign: typeof routes['admin.clients.assign'] & {
        store: typeof routes['admin.clients.assign.store']
      }
    }
  }
  client: {
    classes: typeof routes['client.classes'] & {
      show: typeof routes['client.classes.show']
      cancel: typeof routes['client.classes.cancel']
      undo: typeof routes['client.classes.undo']
    }
    choose: typeof routes['client.choose'] & {
      show: typeof routes['client.choose.show']
      store: typeof routes['client.choose.store']
    }
    plan: typeof routes['client.plan']
    payments: typeof routes['client.payments'] & {
      receipt: typeof routes['client.payments.receipt'] & {
        store: typeof routes['client.payments.receipt.store']
      }
    }
    profile: typeof routes['client.profile']
  }
  receipts: {
    show: typeof routes['receipts.show']
  }
}
