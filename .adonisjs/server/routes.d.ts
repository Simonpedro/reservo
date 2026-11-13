import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'access.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'client.classes': { paramsTuple?: []; params?: {} }
    'client.classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.undo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose': { paramsTuple?: []; params?: {} }
    'client.choose.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.plan': { paramsTuple?: []; params?: {} }
    'client.payments': { paramsTuple?: []; params?: {} }
    'client.profile': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'health': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'access.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'client.classes': { paramsTuple?: []; params?: {} }
    'client.classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose': { paramsTuple?: []; params?: {} }
    'client.choose.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.plan': { paramsTuple?: []; params?: {} }
    'client.payments': { paramsTuple?: []; params?: {} }
    'client.profile': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'access.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'client.classes': { paramsTuple?: []; params?: {} }
    'client.classes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose': { paramsTuple?: []; params?: {} }
    'client.choose.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.plan': { paramsTuple?: []; params?: {} }
    'client.payments': { paramsTuple?: []; params?: {} }
    'client.profile': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'client.classes.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.classes.undo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client.choose.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}