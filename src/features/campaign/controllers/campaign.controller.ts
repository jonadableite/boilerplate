import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'
import { igniter } from '@/igniter'
import { z } from 'zod'
import { CreateCampaignSchema, UpdateCampaignSchema } from '../campaign.types'
import { CampaignFeatureProcedure } from '../procedures/campaign.procedure'

export const CampaignController = igniter.controller({
  name: 'campaign',
  path: '/campaign',
  actions: {
    create: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      body: CreateCampaignSchema,
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.create({
            ...request.body,
            organizationId: session.organization.id,
            createdById: session.user.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao criar campanha:', error)
          return response.error({
            code: 'CAMPAIGN_CREATION_FAILED',
            message: 'Erro ao criar campanha',
            status: 500,
          })
        }
      },
    }),

    list: igniter.query({
      method: 'GET',
      path: '/',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        status: z.string().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.list({
            organizationId: session.organization.id,
            ...request.query,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao listar campanhas:', error)
          return response.error({
            code: 'CAMPAIGN_LIST_FAILED',
            message: 'Erro ao listar campanhas',
            status: 500,
          })
        }
      },
    }),

    get: igniter.query({
      method: 'GET',
      path: '/:id',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.getById({
            id: request.params.id,
            organizationId: session.organization.id,
          })

          if (!result) {
            return response.error({
              code: 'CAMPAIGN_NOT_FOUND',
              message: 'Campanha não encontrada',
              status: 404,
            })
          }

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao obter campanha:', error)
          return response.error({
            code: 'CAMPAIGN_GET_FAILED',
            message: 'Erro ao obter campanha',
            status: 500,
          })
        }
      },
    }),

    update: igniter.mutation({
      method: 'PUT',
      path: '/:id',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      body: UpdateCampaignSchema,
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.update({
            id: request.params.id,
            organizationId: session.organization.id,
            data: request.body,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao atualizar campanha:', error)
          return response.error({
            code: 'CAMPAIGN_UPDATE_FAILED',
            message: 'Erro ao atualizar campanha',
            status: 500,
          })
        }
      },
    }),

    delete: igniter.mutation({
      method: 'DELETE',
      path: '/:id',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          await context.campaign.delete({
            id: request.params.id,
            organizationId: session.organization.id,
          })

          return response.success({ message: 'Campanha deletada com sucesso' })
        } catch (error) {
          console.error('[CampaignController] Erro ao deletar campanha:', error)
          return response.error({
            code: 'CAMPAIGN_DELETE_FAILED',
            message: 'Erro ao deletar campanha',
            status: 500,
          })
        }
      },
    }),

    pause: igniter.mutation({
      method: 'POST',
      path: '/:id/pause',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.pause({
            id: request.params.id,
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao pausar campanha:', error)
          return response.error({
            code: 'CAMPAIGN_PAUSE_FAILED',
            message: 'Erro ao pausar campanha',
            status: 500,
          })
        }
      },
    }),

    resume: igniter.mutation({
      method: 'POST',
      path: '/:id/resume',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.resume({
            id: request.params.id,
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao retomar campanha:', error)
          return response.error({
            code: 'CAMPAIGN_RESUME_FAILED',
            message: 'Erro ao retomar campanha',
            status: 500,
          })
        }
      },
    }),

    cancel: igniter.mutation({
      method: 'POST',
      path: '/:id/cancel',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.cancel({
            id: request.params.id,
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao cancelar campanha:', error)
          return response.error({
            code: 'CAMPAIGN_CANCEL_FAILED',
            message: 'Erro ao cancelar campanha',
            status: 500,
          })
        }
      },
    }),

    uploadLeads: igniter.mutation({
      method: 'POST',
      path: '/:id/leads',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        leads: z.array(
          z.object({
            name: z.string().optional(),
            phone: z.string().min(10),
            email: z.string().email().optional(),
          }),
        ),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.uploadLeads({
            campaignId: request.params.id,
            organizationId: session.organization.id,
            leads: request.body.leads,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao fazer upload de leads:', error)
          return response.error({
            code: 'LEADS_UPLOAD_FAILED',
            message: 'Erro ao fazer upload de leads',
            status: 500,
          })
        }
      },
    }),

    startDispatch: igniter.mutation({
      method: 'POST',
      path: '/:id/start',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        instanceName: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.startDispatch({
            campaignId: request.params.id,
            organizationId: session.organization.id,
            instanceName: request.body.instanceName,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro no disparo em background:', error)
          return response.error({
            code: 'DISPATCH_START_FAILED',
            message: 'Erro ao iniciar disparo',
            status: 500,
          })
        }
      },
    }),

    getStats: igniter.query({
      method: 'GET',
      path: '/:id/stats',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.getStats({
            id: request.params.id,
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao obter estatísticas:', error)
          return response.error({
            code: 'CAMPAIGN_STATS_FAILED',
            message: 'Erro ao obter estatísticas',
            status: 500,
          })
        }
      },
    }),

    getInstanceHealth: igniter.query({
      method: 'GET',
      path: '/instances/health',
      use: [CampaignFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: 'authenticated',
          })

          const result = await context.campaign.getInstanceHealth({
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[CampaignController] Erro ao obter saúde das instâncias:', error)
          return response.error({
            code: 'INSTANCE_HEALTH_FAILED',
            message: 'Erro ao obter saúde das instâncias',
            status: 500,
          })
        }
      },
    }),
  },
})