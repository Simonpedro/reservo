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
  'internal.dailyRun': {
    methods: ["POST"],
    pattern: '/internal/daily-run',
    tokens: [[0,"internal"],[0,"daily-run"]],
    types: placeholder as Registry['internal.dailyRun']['types'],
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
  'logout': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['logout']['types'],
  },
  'admin.home': {
    methods: ["GET","HEAD"],
    pattern: '/admin',
    tokens: [[0,"admin"]],
    types: placeholder as Registry['admin.home']['types'],
  },
  'admin.today': {
    methods: ["GET","HEAD"],
    pattern: '/admin/hoy',
    tokens: [[0,"admin"],[0,"hoy"]],
    types: placeholder as Registry['admin.today']['types'],
  },
  'admin.classes.show': {
    methods: ["GET","HEAD"],
    pattern: '/admin/clases/:sessionId',
    tokens: [[0,"admin"],[0,"clases"],[1,"sessionId"]],
    types: placeholder as Registry['admin.classes.show']['types'],
  },
  'admin.classes.suspend': {
    methods: ["POST"],
    pattern: '/admin/clases/:sessionId/suspender',
    tokens: [[0,"admin"],[0,"clases"],[1,"sessionId"],[0,"suspender"]],
    types: placeholder as Registry['admin.classes.suspend']['types'],
  },
  'admin.classes.absent': {
    methods: ["POST"],
    pattern: '/admin/clases/:sessionId/reservas/:bookingId/ausente',
    tokens: [[0,"admin"],[0,"clases"],[1,"sessionId"],[0,"reservas"],[1,"bookingId"],[0,"ausente"]],
    types: placeholder as Registry['admin.classes.absent']['types'],
  },
  'admin.classes.undoAbsent': {
    methods: ["POST"],
    pattern: '/admin/clases/:sessionId/reservas/:bookingId/deshacer',
    tokens: [[0,"admin"],[0,"clases"],[1,"sessionId"],[0,"reservas"],[1,"bookingId"],[0,"deshacer"]],
    types: placeholder as Registry['admin.classes.undoAbsent']['types'],
  },
  'admin.agenda': {
    methods: ["GET","HEAD"],
    pattern: '/admin/agenda',
    tokens: [[0,"admin"],[0,"agenda"]],
    types: placeholder as Registry['admin.agenda']['types'],
  },
  'admin.agenda.week': {
    methods: ["GET","HEAD"],
    pattern: '/admin/agenda/semana',
    tokens: [[0,"admin"],[0,"agenda"],[0,"semana"]],
    types: placeholder as Registry['admin.agenda.week']['types'],
  },
  'admin.agenda.closeForm': {
    methods: ["GET","HEAD"],
    pattern: '/admin/agenda/cerrar',
    tokens: [[0,"admin"],[0,"agenda"],[0,"cerrar"]],
    types: placeholder as Registry['admin.agenda.closeForm']['types'],
  },
  'admin.agenda.close': {
    methods: ["POST"],
    pattern: '/admin/agenda/cerrar',
    tokens: [[0,"admin"],[0,"agenda"],[0,"cerrar"]],
    types: placeholder as Registry['admin.agenda.close']['types'],
  },
  'admin.schedules.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/horarios/nuevo',
    tokens: [[0,"admin"],[0,"horarios"],[0,"nuevo"]],
    types: placeholder as Registry['admin.schedules.create']['types'],
  },
  'admin.schedules.store': {
    methods: ["POST"],
    pattern: '/admin/horarios',
    tokens: [[0,"admin"],[0,"horarios"]],
    types: placeholder as Registry['admin.schedules.store']['types'],
  },
  'admin.schedules.edit': {
    methods: ["GET","HEAD"],
    pattern: '/admin/horarios/:id',
    tokens: [[0,"admin"],[0,"horarios"],[1,"id"]],
    types: placeholder as Registry['admin.schedules.edit']['types'],
  },
  'admin.schedules.update': {
    methods: ["PUT"],
    pattern: '/admin/horarios/:id',
    tokens: [[0,"admin"],[0,"horarios"],[1,"id"]],
    types: placeholder as Registry['admin.schedules.update']['types'],
  },
  'admin.schedules.deactivate': {
    methods: ["POST"],
    pattern: '/admin/horarios/:id/desactivar',
    tokens: [[0,"admin"],[0,"horarios"],[1,"id"],[0,"desactivar"]],
    types: placeholder as Registry['admin.schedules.deactivate']['types'],
  },
  'admin.schedules.activate': {
    methods: ["POST"],
    pattern: '/admin/horarios/:id/activar',
    tokens: [[0,"admin"],[0,"horarios"],[1,"id"],[0,"activar"]],
    types: placeholder as Registry['admin.schedules.activate']['types'],
  },
  'admin.payments': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pagos',
    tokens: [[0,"admin"],[0,"pagos"]],
    types: placeholder as Registry['admin.payments']['types'],
  },
  'admin.payments.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pagos/registrar',
    tokens: [[0,"admin"],[0,"pagos"],[0,"registrar"]],
    types: placeholder as Registry['admin.payments.create']['types'],
  },
  'admin.payments.store': {
    methods: ["POST"],
    pattern: '/admin/pagos',
    tokens: [[0,"admin"],[0,"pagos"]],
    types: placeholder as Registry['admin.payments.store']['types'],
  },
  'admin.payments.show': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pagos/:id',
    tokens: [[0,"admin"],[0,"pagos"],[1,"id"]],
    types: placeholder as Registry['admin.payments.show']['types'],
  },
  'admin.payments.approve': {
    methods: ["POST"],
    pattern: '/admin/pagos/:id/aprobar',
    tokens: [[0,"admin"],[0,"pagos"],[1,"id"],[0,"aprobar"]],
    types: placeholder as Registry['admin.payments.approve']['types'],
  },
  'admin.payments.undoApprove': {
    methods: ["POST"],
    pattern: '/admin/pagos/:id/deshacer',
    tokens: [[0,"admin"],[0,"pagos"],[1,"id"],[0,"deshacer"]],
    types: placeholder as Registry['admin.payments.undoApprove']['types'],
  },
  'admin.payments.reject': {
    methods: ["POST"],
    pattern: '/admin/pagos/:id/rechazar',
    tokens: [[0,"admin"],[0,"pagos"],[1,"id"],[0,"rechazar"]],
    types: placeholder as Registry['admin.payments.reject']['types'],
  },
  'admin.settings': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes',
    tokens: [[0,"admin"],[0,"ajustes"]],
    types: placeholder as Registry['admin.settings']['types'],
  },
  'admin.plans.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/planes',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"planes"]],
    types: placeholder as Registry['admin.plans.index']['types'],
  },
  'admin.plans.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/planes/nuevo',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"planes"],[0,"nuevo"]],
    types: placeholder as Registry['admin.plans.create']['types'],
  },
  'admin.plans.store': {
    methods: ["POST"],
    pattern: '/admin/ajustes/planes',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"planes"]],
    types: placeholder as Registry['admin.plans.store']['types'],
  },
  'admin.plans.edit': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/planes/:id',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"planes"],[1,"id"]],
    types: placeholder as Registry['admin.plans.edit']['types'],
  },
  'admin.plans.update': {
    methods: ["PUT"],
    pattern: '/admin/ajustes/planes/:id',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"planes"],[1,"id"]],
    types: placeholder as Registry['admin.plans.update']['types'],
  },
  'admin.plans.deactivate': {
    methods: ["POST"],
    pattern: '/admin/ajustes/planes/:id/desactivar',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"planes"],[1,"id"],[0,"desactivar"]],
    types: placeholder as Registry['admin.plans.deactivate']['types'],
  },
  'admin.plans.activate': {
    methods: ["POST"],
    pattern: '/admin/ajustes/planes/:id/activar',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"planes"],[1,"id"],[0,"activar"]],
    types: placeholder as Registry['admin.plans.activate']['types'],
  },
  'admin.activities.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/actividades',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"actividades"]],
    types: placeholder as Registry['admin.activities.index']['types'],
  },
  'admin.activities.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/actividades/nuevo',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"actividades"],[0,"nuevo"]],
    types: placeholder as Registry['admin.activities.create']['types'],
  },
  'admin.activities.store': {
    methods: ["POST"],
    pattern: '/admin/ajustes/actividades',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"actividades"]],
    types: placeholder as Registry['admin.activities.store']['types'],
  },
  'admin.activities.edit': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/actividades/:id',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"actividades"],[1,"id"]],
    types: placeholder as Registry['admin.activities.edit']['types'],
  },
  'admin.activities.update': {
    methods: ["PUT"],
    pattern: '/admin/ajustes/actividades/:id',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"actividades"],[1,"id"]],
    types: placeholder as Registry['admin.activities.update']['types'],
  },
  'admin.activities.deactivate': {
    methods: ["POST"],
    pattern: '/admin/ajustes/actividades/:id/desactivar',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"actividades"],[1,"id"],[0,"desactivar"]],
    types: placeholder as Registry['admin.activities.deactivate']['types'],
  },
  'admin.activities.activate': {
    methods: ["POST"],
    pattern: '/admin/ajustes/actividades/:id/activar',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"actividades"],[1,"id"],[0,"activar"]],
    types: placeholder as Registry['admin.activities.activate']['types'],
  },
  'admin.centers.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/sedes',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"sedes"]],
    types: placeholder as Registry['admin.centers.index']['types'],
  },
  'admin.centers.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/sedes/nuevo',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"sedes"],[0,"nuevo"]],
    types: placeholder as Registry['admin.centers.create']['types'],
  },
  'admin.centers.store': {
    methods: ["POST"],
    pattern: '/admin/ajustes/sedes',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"sedes"]],
    types: placeholder as Registry['admin.centers.store']['types'],
  },
  'admin.centers.edit': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajustes/sedes/:id',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"sedes"],[1,"id"]],
    types: placeholder as Registry['admin.centers.edit']['types'],
  },
  'admin.centers.update': {
    methods: ["PUT"],
    pattern: '/admin/ajustes/sedes/:id',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"sedes"],[1,"id"]],
    types: placeholder as Registry['admin.centers.update']['types'],
  },
  'admin.centers.deactivate': {
    methods: ["POST"],
    pattern: '/admin/ajustes/sedes/:id/desactivar',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"sedes"],[1,"id"],[0,"desactivar"]],
    types: placeholder as Registry['admin.centers.deactivate']['types'],
  },
  'admin.centers.activate': {
    methods: ["POST"],
    pattern: '/admin/ajustes/sedes/:id/activar',
    tokens: [[0,"admin"],[0,"ajustes"],[0,"sedes"],[1,"id"],[0,"activar"]],
    types: placeholder as Registry['admin.centers.activate']['types'],
  },
  'admin.clients.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/clientes',
    tokens: [[0,"admin"],[0,"clientes"]],
    types: placeholder as Registry['admin.clients.index']['types'],
  },
  'admin.clients.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/clientes/nuevo',
    tokens: [[0,"admin"],[0,"clientes"],[0,"nuevo"]],
    types: placeholder as Registry['admin.clients.create']['types'],
  },
  'admin.clients.store': {
    methods: ["POST"],
    pattern: '/admin/clientes',
    tokens: [[0,"admin"],[0,"clientes"]],
    types: placeholder as Registry['admin.clients.store']['types'],
  },
  'admin.clients.show': {
    methods: ["GET","HEAD"],
    pattern: '/admin/clientes/:id',
    tokens: [[0,"admin"],[0,"clientes"],[1,"id"]],
    types: placeholder as Registry['admin.clients.show']['types'],
  },
  'admin.clients.issueAccessLink': {
    methods: ["POST"],
    pattern: '/admin/clientes/:id/access-link',
    tokens: [[0,"admin"],[0,"clientes"],[1,"id"],[0,"access-link"]],
    types: placeholder as Registry['admin.clients.issueAccessLink']['types'],
  },
  'admin.clients.assign': {
    methods: ["GET","HEAD"],
    pattern: '/admin/clientes/:id/asignar',
    tokens: [[0,"admin"],[0,"clientes"],[1,"id"],[0,"asignar"]],
    types: placeholder as Registry['admin.clients.assign']['types'],
  },
  'admin.clients.assign.store': {
    methods: ["POST"],
    pattern: '/admin/clientes/:id/asignar',
    tokens: [[0,"admin"],[0,"clientes"],[1,"id"],[0,"asignar"]],
    types: placeholder as Registry['admin.clients.assign.store']['types'],
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
  'client.payments.receipt': {
    methods: ["GET","HEAD"],
    pattern: '/pagos/:id/comprobante',
    tokens: [[0,"pagos"],[1,"id"],[0,"comprobante"]],
    types: placeholder as Registry['client.payments.receipt']['types'],
  },
  'client.payments.receipt.store': {
    methods: ["POST"],
    pattern: '/pagos/:id/comprobante',
    tokens: [[0,"pagos"],[1,"id"],[0,"comprobante"]],
    types: placeholder as Registry['client.payments.receipt.store']['types'],
  },
  'client.profile': {
    methods: ["GET","HEAD"],
    pattern: '/perfil',
    tokens: [[0,"perfil"]],
    types: placeholder as Registry['client.profile']['types'],
  },
  'receipts.show': {
    methods: ["GET","HEAD"],
    pattern: '/pagos/comprobantes/:id',
    tokens: [[0,"pagos"],[0,"comprobantes"],[1,"id"]],
    types: placeholder as Registry['receipts.show']['types'],
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
