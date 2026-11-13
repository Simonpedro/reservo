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
    'logout': { paramsTuple?: []; params?: {} }
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.today': { paramsTuple?: []; params?: {} }
    'admin.classes.show': { paramsTuple: [ParamValue]; params: {'sessionId': ParamValue} }
    'admin.classes.suspend': { paramsTuple: [ParamValue]; params: {'sessionId': ParamValue} }
    'admin.classes.absent': { paramsTuple: [ParamValue,ParamValue]; params: {'sessionId': ParamValue,'bookingId': ParamValue} }
    'admin.classes.undoAbsent': { paramsTuple: [ParamValue,ParamValue]; params: {'sessionId': ParamValue,'bookingId': ParamValue} }
    'admin.agenda': { paramsTuple?: []; params?: {} }
    'admin.agenda.closeForm': { paramsTuple?: []; params?: {} }
    'admin.agenda.close': { paramsTuple?: []; params?: {} }
    'admin.schedules.create': { paramsTuple?: []; params?: {} }
    'admin.schedules.store': { paramsTuple?: []; params?: {} }
    'admin.schedules.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.schedules.deactivate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.schedules.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.payments.create': { paramsTuple?: []; params?: {} }
    'admin.payments.store': { paramsTuple?: []; params?: {} }
    'admin.payments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.approve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.undoApprove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.reject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.plans.index': { paramsTuple?: []; params?: {} }
    'admin.plans.create': { paramsTuple?: []; params?: {} }
    'admin.plans.store': { paramsTuple?: []; params?: {} }
    'admin.plans.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plans.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plans.deactivate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plans.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.index': { paramsTuple?: []; params?: {} }
    'admin.activities.create': { paramsTuple?: []; params?: {} }
    'admin.activities.store': { paramsTuple?: []; params?: {} }
    'admin.activities.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.deactivate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.index': { paramsTuple?: []; params?: {} }
    'admin.centers.create': { paramsTuple?: []; params?: {} }
    'admin.centers.store': { paramsTuple?: []; params?: {} }
    'admin.centers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.deactivate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.today': { paramsTuple?: []; params?: {} }
    'admin.classes.show': { paramsTuple: [ParamValue]; params: {'sessionId': ParamValue} }
    'admin.agenda': { paramsTuple?: []; params?: {} }
    'admin.agenda.closeForm': { paramsTuple?: []; params?: {} }
    'admin.schedules.create': { paramsTuple?: []; params?: {} }
    'admin.schedules.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.payments.create': { paramsTuple?: []; params?: {} }
    'admin.payments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.plans.index': { paramsTuple?: []; params?: {} }
    'admin.plans.create': { paramsTuple?: []; params?: {} }
    'admin.plans.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.index': { paramsTuple?: []; params?: {} }
    'admin.activities.create': { paramsTuple?: []; params?: {} }
    'admin.activities.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.index': { paramsTuple?: []; params?: {} }
    'admin.centers.create': { paramsTuple?: []; params?: {} }
    'admin.centers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.today': { paramsTuple?: []; params?: {} }
    'admin.classes.show': { paramsTuple: [ParamValue]; params: {'sessionId': ParamValue} }
    'admin.agenda': { paramsTuple?: []; params?: {} }
    'admin.agenda.closeForm': { paramsTuple?: []; params?: {} }
    'admin.schedules.create': { paramsTuple?: []; params?: {} }
    'admin.schedules.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments': { paramsTuple?: []; params?: {} }
    'admin.payments.create': { paramsTuple?: []; params?: {} }
    'admin.payments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.settings': { paramsTuple?: []; params?: {} }
    'admin.plans.index': { paramsTuple?: []; params?: {} }
    'admin.plans.create': { paramsTuple?: []; params?: {} }
    'admin.plans.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.index': { paramsTuple?: []; params?: {} }
    'admin.activities.create': { paramsTuple?: []; params?: {} }
    'admin.activities.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.index': { paramsTuple?: []; params?: {} }
    'admin.centers.create': { paramsTuple?: []; params?: {} }
    'admin.centers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'admin.classes.suspend': { paramsTuple: [ParamValue]; params: {'sessionId': ParamValue} }
    'admin.classes.absent': { paramsTuple: [ParamValue,ParamValue]; params: {'sessionId': ParamValue,'bookingId': ParamValue} }
    'admin.classes.undoAbsent': { paramsTuple: [ParamValue,ParamValue]; params: {'sessionId': ParamValue,'bookingId': ParamValue} }
    'admin.agenda.close': { paramsTuple?: []; params?: {} }
    'admin.schedules.store': { paramsTuple?: []; params?: {} }
    'admin.schedules.deactivate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.schedules.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.store': { paramsTuple?: []; params?: {} }
    'admin.payments.approve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.undoApprove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.reject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plans.store': { paramsTuple?: []; params?: {} }
    'admin.plans.deactivate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plans.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.store': { paramsTuple?: []; params?: {} }
    'admin.activities.deactivate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.store': { paramsTuple?: []; params?: {} }
    'admin.centers.deactivate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.clients.store': { paramsTuple?: []; params?: {} }
    'admin.clients.issueAccessLink': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.clients.assign.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.undo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.payments.receipt.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'admin.schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plans.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.activities.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.centers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}