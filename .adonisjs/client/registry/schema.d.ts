/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse, Method, PathWithRegistry, PatternsByMethod, RouteWithRegistry } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'
import type { routes } from './index.ts'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'health': {
    methods: ["GET","HEAD"]
    pattern: '/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'internal.dailyRun': {
    methods: ["POST"]
    pattern: '/internal/daily-run'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/internal_daily_controller').default['run']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/internal_daily_controller').default['run']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/internal_daily_controller').default['run']>>>
    }
  }
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
    }
  }
  'login': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/session').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/session').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'access.show': {
    methods: ["GET","HEAD"]
    pattern: '/acceso/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/access_controller').default['show']>>>
    }
  }
  'logout': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'admin.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'admin.today': {
    methods: ["GET","HEAD"]
    pattern: '/admin/hoy'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['today']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['today']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['today']>>>
    }
  }
  'admin.classes.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/clases/:sessionId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { sessionId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['show']>>>
    }
  }
  'admin.classes.suspend': {
    methods: ["POST"]
    pattern: '/admin/clases/:sessionId/suspender'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { sessionId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['suspend']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['suspend']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['suspend']>>>
    }
  }
  'admin.classes.absent': {
    methods: ["POST"]
    pattern: '/admin/clases/:sessionId/reservas/:bookingId/ausente'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { sessionId: ParamValue; bookingId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['absent']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['absent']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['absent']>>>
    }
  }
  'admin.classes.undoAbsent': {
    methods: ["POST"]
    pattern: '/admin/clases/:sessionId/reservas/:bookingId/deshacer'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { sessionId: ParamValue; bookingId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['undoAbsent']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['undoAbsent']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_classes_controller').default['undoAbsent']>>>
    }
  }
  'admin.agenda': {
    methods: ["GET","HEAD"]
    pattern: '/admin/agenda'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['index']>>>
    }
  }
  'admin.agenda.week': {
    methods: ["GET","HEAD"]
    pattern: '/admin/agenda/semana'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['week']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['week']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['week']>>>
    }
  }
  'admin.agenda.closeForm': {
    methods: ["GET","HEAD"]
    pattern: '/admin/agenda/cerrar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['closeForm']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['closeForm']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['closeForm']>>>
    }
  }
  'admin.agenda.close': {
    methods: ["POST"]
    pattern: '/admin/agenda/cerrar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/closure').closureValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/closure').closureValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['close']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['close']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_agenda_controller').default['close']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.schedules.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/horarios/nuevo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['create']>>>
    }
  }
  'admin.schedules.store': {
    methods: ["POST"]
    pattern: '/admin/horarios'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['store']>>>
    }
  }
  'admin.schedules.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/horarios/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['edit']>>>
    }
  }
  'admin.schedules.update': {
    methods: ["PUT"]
    pattern: '/admin/horarios/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['update']>>>
    }
  }
  'admin.schedules.deactivate': {
    methods: ["POST"]
    pattern: '/admin/horarios/:id/desactivar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['deactivate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['deactivate']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['deactivate']>>>
    }
  }
  'admin.schedules.activate': {
    methods: ["POST"]
    pattern: '/admin/horarios/:id/activar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['activate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['activate']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_schedules_controller').default['activate']>>>
    }
  }
  'admin.payments': {
    methods: ["GET","HEAD"]
    pattern: '/admin/pagos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['index']>>>
    }
  }
  'admin.payments.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/pagos/registrar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['create']>>>
    }
  }
  'admin.payments.store': {
    methods: ["POST"]
    pattern: '/admin/pagos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/payment').paymentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/payment').paymentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.payments.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/pagos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['show']>>>
    }
  }
  'admin.payments.approve': {
    methods: ["POST"]
    pattern: '/admin/pagos/:id/aprobar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['approve']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['approve']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['approve']>>>
    }
  }
  'admin.payments.undoApprove': {
    methods: ["POST"]
    pattern: '/admin/pagos/:id/deshacer'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['undoApprove']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['undoApprove']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['undoApprove']>>>
    }
  }
  'admin.payments.reject': {
    methods: ["POST"]
    pattern: '/admin/pagos/:id/rechazar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['reject']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['reject']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_payments_controller').default['reject']>>>
    }
  }
  'admin.settings': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_settings_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_settings_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_settings_controller').default['show']>>>
    }
  }
  'admin.plans.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/planes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['index']>>>
    }
  }
  'admin.plans.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/planes/nuevo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['create']>>>
    }
  }
  'admin.plans.store': {
    methods: ["POST"]
    pattern: '/admin/ajustes/planes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['store']>>>
    }
  }
  'admin.plans.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/planes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['edit']>>>
    }
  }
  'admin.plans.update': {
    methods: ["PUT"]
    pattern: '/admin/ajustes/planes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['update']>>>
    }
  }
  'admin.plans.deactivate': {
    methods: ["POST"]
    pattern: '/admin/ajustes/planes/:id/desactivar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['deactivate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['deactivate']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['deactivate']>>>
    }
  }
  'admin.plans.activate': {
    methods: ["POST"]
    pattern: '/admin/ajustes/planes/:id/activar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['activate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['activate']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_plans_controller').default['activate']>>>
    }
  }
  'admin.activities.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/actividades'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['index']>>>
    }
  }
  'admin.activities.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/actividades/nuevo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['create']>>>
    }
  }
  'admin.activities.store': {
    methods: ["POST"]
    pattern: '/admin/ajustes/actividades'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['store']>>>
    }
  }
  'admin.activities.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/actividades/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['edit']>>>
    }
  }
  'admin.activities.update': {
    methods: ["PUT"]
    pattern: '/admin/ajustes/actividades/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['update']>>>
    }
  }
  'admin.activities.deactivate': {
    methods: ["POST"]
    pattern: '/admin/ajustes/actividades/:id/desactivar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['deactivate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['deactivate']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['deactivate']>>>
    }
  }
  'admin.activities.activate': {
    methods: ["POST"]
    pattern: '/admin/ajustes/actividades/:id/activar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['activate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['activate']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_activities_controller').default['activate']>>>
    }
  }
  'admin.centers.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/sedes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['index']>>>
    }
  }
  'admin.centers.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/sedes/nuevo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['create']>>>
    }
  }
  'admin.centers.store': {
    methods: ["POST"]
    pattern: '/admin/ajustes/sedes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['store']>>>
    }
  }
  'admin.centers.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajustes/sedes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['edit']>>>
    }
  }
  'admin.centers.update': {
    methods: ["PUT"]
    pattern: '/admin/ajustes/sedes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['update']>>>
    }
  }
  'admin.centers.deactivate': {
    methods: ["POST"]
    pattern: '/admin/ajustes/sedes/:id/desactivar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['deactivate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['deactivate']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['deactivate']>>>
    }
  }
  'admin.centers.activate': {
    methods: ["POST"]
    pattern: '/admin/ajustes/sedes/:id/activar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['activate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['activate']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_centers_controller').default['activate']>>>
    }
  }
  'admin.clients.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/clientes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['index']>>>
    }
  }
  'admin.clients.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/clientes/nuevo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['create']>>>
    }
  }
  'admin.clients.store': {
    methods: ["POST"]
    pattern: '/admin/clientes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_client').createClientValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_client').createClientValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.clients.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/clientes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['show']>>>
    }
  }
  'admin.clients.issueAccessLink': {
    methods: ["POST"]
    pattern: '/admin/clientes/:id/access-link'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['issueAccessLink']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['issueAccessLink']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['issueAccessLink']>>>
    }
  }
  'admin.clients.assign': {
    methods: ["GET","HEAD"]
    pattern: '/admin/clientes/:id/asignar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['assign']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['assign']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['assign']>>>
    }
  }
  'admin.clients.assign.store': {
    methods: ["POST"]
    pattern: '/admin/clientes/:id/asignar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule_assignment').scheduleAssignmentValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule_assignment').scheduleAssignmentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['storeAssignment']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['storeAssignment']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_clients_controller').default['storeAssignment']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'client.classes': {
    methods: ["GET","HEAD"]
    pattern: '/clases'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['index']>>>
    }
  }
  'client.classes.show': {
    methods: ["GET","HEAD"]
    pattern: '/clases/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['show']>>>
    }
  }
  'client.classes.cancel': {
    methods: ["POST"]
    pattern: '/clases/:id/cancelar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['cancel']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['cancel']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['cancel']>>>
    }
  }
  'client.classes.undo': {
    methods: ["POST"]
    pattern: '/clases/:id/deshacer'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['undo']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['undo']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_classes_controller').default['undo']>>>
    }
  }
  'client.choose': {
    methods: ["GET","HEAD"]
    pattern: '/elegir-clase'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['index']>>>
    }
  }
  'client.choose.show': {
    methods: ["GET","HEAD"]
    pattern: '/elegir-clase/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['show']>>>
    }
  }
  'client.choose.store': {
    methods: ["POST"]
    pattern: '/elegir-clase/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/choose_class_controller').default['store']>>>
    }
  }
  'client.plan': {
    methods: ["GET","HEAD"]
    pattern: '/plan'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_plan_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_plan_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_plan_controller').default['index']>>>
    }
  }
  'client.payments': {
    methods: ["GET","HEAD"]
    pattern: '/pagos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['index']>>>
    }
  }
  'client.payments.receipt': {
    methods: ["GET","HEAD"]
    pattern: '/pagos/:id/comprobante'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['create']>>>
    }
  }
  'client.payments.receipt.store': {
    methods: ["POST"]
    pattern: '/pagos/:id/comprobante'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/receipt').receiptValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/receipt').receiptValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'client.profile': {
    methods: ["GET","HEAD"]
    pattern: '/perfil'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'receipts.show': {
    methods: ["GET","HEAD"]
    pattern: '/pagos/comprobantes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['receipt']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['receipt']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/payments_controller').default['receipt']>>>
    }
  }
}

export namespace Route {
  export type Request<Name extends keyof typeof routes> = RouteWithRegistry.Request<typeof routes, Name>
  export type Response<Name extends keyof typeof routes> = RouteWithRegistry.Response<typeof routes, Name>
  export type Params<Name extends keyof typeof routes> = RouteWithRegistry.Params<typeof routes, Name>
  export type Body<Name extends keyof typeof routes> = RouteWithRegistry.Body<typeof routes, Name>
  export type Query<Name extends keyof typeof routes> = RouteWithRegistry.Query<typeof routes, Name>
  export type Error<Name extends keyof typeof routes> = RouteWithRegistry.Error<typeof routes, Name>
}

export namespace Path {
  export type Request<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Request<typeof routes, M, P>
  export type Response<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Response<typeof routes, M, P>
  export type Params<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Params<typeof routes, M, P>
  export type Body<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Body<typeof routes, M, P>
  export type Query<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Query<typeof routes, M, P>
  export type Error<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Error<typeof routes, M, P>
}
