import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health': { paramsTuple?: []; params?: {} }
    'internal.dailyRun': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'access.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.today': { paramsTuple?: []; params?: {} }
    'admin.agenda': { paramsTuple?: []; params?: {} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.clients.index': { paramsTuple?: []; params?: {} }
    'admin.clients.create': { paramsTuple?: []; params?: {} }
    'admin.clients.store': { paramsTuple?: []; params?: {} }
    'admin.clients.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.clients.issueAccessLink': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.clients.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.clients.assign.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes': { paramsTuple?: []; params?: {} }
    'client.classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.undo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose': { paramsTuple?: []; params?: {} }
    'client.choose.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.plan': { paramsTuple?: []; params?: {} }
    'client.payments': { paramsTuple?: []; params?: {} }
    'client.payments.receipt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.payments.receipt.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.profile': { paramsTuple?: []; params?: {} }
    'receipts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'health': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'access.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.today': { paramsTuple?: []; params?: {} }
    'admin.agenda': { paramsTuple?: []; params?: {} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.clients.index': { paramsTuple?: []; params?: {} }
    'admin.clients.create': { paramsTuple?: []; params?: {} }
    'admin.clients.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.clients.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes': { paramsTuple?: []; params?: {} }
    'client.classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose': { paramsTuple?: []; params?: {} }
    'client.choose.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.plan': { paramsTuple?: []; params?: {} }
    'client.payments': { paramsTuple?: []; params?: {} }
    'client.payments.receipt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.profile': { paramsTuple?: []; params?: {} }
    'receipts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'health': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'access.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.today': { paramsTuple?: []; params?: {} }
    'admin.agenda': { paramsTuple?: []; params?: {} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.clients.index': { paramsTuple?: []; params?: {} }
    'admin.clients.create': { paramsTuple?: []; params?: {} }
    'admin.clients.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.clients.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes': { paramsTuple?: []; params?: {} }
    'client.classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose': { paramsTuple?: []; params?: {} }
    'client.choose.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.plan': { paramsTuple?: []; params?: {} }
    'client.payments': { paramsTuple?: []; params?: {} }
    'client.payments.receipt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.profile': { paramsTuple?: []; params?: {} }
    'receipts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'internal.dailyRun': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'admin.clients.store': { paramsTuple?: []; params?: {} }
    'admin.clients.issueAccessLink': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.clients.assign.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.undo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.payments.receipt.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}