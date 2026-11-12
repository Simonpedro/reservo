/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: typeof routes['health']
  home: typeof routes['home']
  login: typeof routes['login']
  session: {
    store: typeof routes['session.store']
  }
  dashboard: typeof routes['dashboard']
  logout: typeof routes['logout']
}
