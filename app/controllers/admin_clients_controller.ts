import User from '#models/user'
import {
  buildAccessWhatsappUrl,
  createClientUser,
  DuplicateClientEmailError,
  getAdminClientDetail,
  listAdminClients,
} from '#services/admin_clients'
import AccessLinks from '#services/access_links'
import ScheduleAssignment, {
  AssignmentError,
  assignmentWizard,
} from '#services/schedule_assignment'
import { createClientValidator } from '#validators/admin_client'
import { scheduleAssignmentValidator } from '#validators/schedule_assignment'
import type { HttpContext } from '@adonisjs/core/http'

export default class AdminClientsController {
  async index({ request, inertia, tenant }: HttpContext) {
    const clients = await listAdminClients(tenant!.id, request.input('q'))
    return inertia.render('admin/clients/index', clients)
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/clients/new', {})
  }

  async store({ request, response, session, tenant }: HttpContext) {
    const payload = await request.validateUsing(createClientValidator)

    try {
      const client = await createClientUser(tenant!.id, payload)
      session.flash('success', 'Alumno creado.')
      return response.redirect(`/admin/clientes/${client.id}`)
    } catch (error) {
      if (error instanceof DuplicateClientEmailError) {
        session.flashAll()
        session.flash('errors', {
          email: 'Ese email ya existe en este centro. Revisalo o usá otro.',
        })
        return response.redirect().back()
      }
      throw error
    }
  }

  async show({ inertia, params, response, tenant }: HttpContext) {
    const detail = await getAdminClientDetail(tenant!.id, Number(params.id))

    if (!detail) {
      response.status(404)
      return inertia.render('errors/not_found', {
        title: 'No encontramos ese cliente',
        message: 'Puede que no exista en este centro.',
      })
    }

    return inertia.render('admin/clients/show', detail)
  }

  async issueAccessLink({ params, response, session, tenant }: HttpContext) {
    const client = await User.query()
      .where('tenantId', tenant!.id)
      .where('role', 'client')
      .where('id', Number(params.id))
      .first()

    if (!client) return response.status(404).send('Not found')

    const issued = await new AccessLinks().issue(client)
    const whatsappUrl = buildAccessWhatsappUrl({
      phone: client.phone,
      fullName: client.fullName,
      tenantName: tenant!.name,
      accessUrl: issued.url,
    })

    session.flash('success', 'Generamos un link nuevo.')
    session.flash('accessLink', {
      url: issued.url,
      whatsappUrl,
    })

    return response.redirect(`/admin/clientes/${client.id}`)
  }

  async assign({ inertia, params, response, tenant }: HttpContext) {
    const wizard = await assignmentWizard(tenant!.id, Number(params.id))

    if (!wizard) {
      response.status(404)
      return inertia.render('errors/not_found', {
        title: 'No encontramos ese cliente',
        message: 'Puede que no exista en este centro.',
      })
    }

    return inertia.render('admin/clients/assign', wizard)
  }

  async storeAssignment({ params, request, response, session, tenant }: HttpContext) {
    const payload = await request.validateUsing(scheduleAssignmentValidator)
    const clientId = Number(params.id)

    try {
      await new ScheduleAssignment().assign(tenant!.id, clientId, payload)
    } catch (error) {
      if (error instanceof AssignmentError) {
        session.flash('errors', { assignment: error.message })
        return response.redirect().back()
      }
      throw error
    }

    session.flash('assigned', { startsOn: payload.startsOn })
    return response.redirect(`/admin/clientes/${clientId}`)
  }
}
