/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: typeof routes['health']
  home: typeof routes['home']
  login: typeof routes['login']
  session: {
    store: typeof routes['session.store']
  }
  access: {
    show: typeof routes['access.show']
  }
  dashboard: typeof routes['dashboard']
  logout: typeof routes['logout']
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
