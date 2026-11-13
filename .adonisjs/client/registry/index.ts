/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'health': {
    methods: ["GET","HEAD"],
    pattern: '/health',
    tokens: [[0,"health"]],
    types: placeholder as Registry['health']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['home']['types'],
  },
  'login': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['login']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.store']['types'],
  },
  'access.show': {
    methods: ["GET","HEAD"],
    pattern: '/acceso/:token',
    tokens: [[0,"acceso"],[1,"token"]],
    types: placeholder as Registry['access.show']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [[0,"dashboard"]],
    types: placeholder as Registry['dashboard']['types'],
  },
  'logout': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['logout']['types'],
  },
  'client.classes': {
    methods: ["GET","HEAD"],
    pattern: '/clases',
    tokens: [[0,"clases"]],
    types: placeholder as Registry['client.classes']['types'],
  },
  'client.classes.show': {
    methods: ["GET","HEAD"],
    pattern: '/clases/:id',
    tokens: [[0,"clases"],[1,"id"]],
    types: placeholder as Registry['client.classes.show']['types'],
  },
  'client.classes.cancel': {
    methods: ["POST"],
    pattern: '/clases/:id/cancelar',
    tokens: [[0,"clases"],[1,"id"],[0,"cancelar"]],
    types: placeholder as Registry['client.classes.cancel']['types'],
  },
  'client.classes.undo': {
    methods: ["POST"],
    pattern: '/clases/:id/deshacer',
    tokens: [[0,"clases"],[1,"id"],[0,"deshacer"]],
    types: placeholder as Registry['client.classes.undo']['types'],
  },
  'client.choose': {
    methods: ["GET","HEAD"],
    pattern: '/elegir-clase',
    tokens: [[0,"elegir-clase"]],
    types: placeholder as Registry['client.choose']['types'],
  },
  'client.choose.show': {
    methods: ["GET","HEAD"],
    pattern: '/elegir-clase/:id',
    tokens: [[0,"elegir-clase"],[1,"id"]],
    types: placeholder as Registry['client.choose.show']['types'],
  },
  'client.choose.store': {
    methods: ["POST"],
    pattern: '/elegir-clase/:id',
    tokens: [[0,"elegir-clase"],[1,"id"]],
    types: placeholder as Registry['client.choose.store']['types'],
  },
  'client.plan': {
    methods: ["GET","HEAD"],
    pattern: '/plan',
    tokens: [[0,"plan"]],
    types: placeholder as Registry['client.plan']['types'],
  },
  'client.payments': {
    methods: ["GET","HEAD"],
    pattern: '/pagos',
    tokens: [[0,"pagos"]],
    types: placeholder as Registry['client.payments']['types'],
  },
  'client.profile': {
    methods: ["GET","HEAD"],
    pattern: '/perfil',
    tokens: [[0,"perfil"]],
    types: placeholder as Registry['client.profile']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
