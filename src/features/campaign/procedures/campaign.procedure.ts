import { igniter } from '@/igniter'
import { prisma } from '@/providers/prisma'
import {
  Campaign,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '../campaign.types'

export const CampaignFeatureProcedure = igniter.procedure({
  name: 'CampaignFeatureProcedure',
  handler: async (options, { request, context }) => {
    return {
      campaign: {
        create: async (
          data: CreateCampaignInput & {
            organizationId: string
            createdBy: string
          },
        ): Promise<Campaign> => {
          const { organizationId, createdBy, ...campaignData } = data

          const campaign = await prisma.campaign.create({
            data: {
              ...campaignData,
              organization: { connect: { id: organizationId } },
              createdBy: { connect: { id: createdBy } },
              status: campaignData.type === 'SCHEDULED' ? 'SCHEDULED' : 'DRAFT',
              progress: 0,
              totalLeads: 0,
              sentCount: 0,
              deliveredCount: 0,
              readCount: 0,
              failedCount: 0,
            },
          })
          return campaign as Campaign
        },

        list: async (params: {
          organizationId: string
          page?: number
          limit?: number
          status?: string
          type?: string
          search?: string
        }) => {
          const {
            organizationId,
            page = 1,
            limit = 20,
            status,
            type,
            search,
          } = params

          const where: any = {
            organizationId,
          }

          if (status) {
            where.status = status
          }

          if (type) {
            where.type = type
          }

          if (search) {
            where.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ]
          }

          const [campaigns, total] = await Promise.all([
            prisma.campaign.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              skip: (page - 1) * limit,
              take: limit,
            }),
            prisma.campaign.count({ where }),
          ])

          return {
            campaigns: campaigns as Campaign[],
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          }
        },

        getById: async (params: {
          id: string
          organizationId: string
        }): Promise<Campaign | null> => {
          const campaign = await prisma.campaign.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
          })
          return campaign as Campaign | null
        },

        update: async (params: {
          id: string
          organizationId: string
          data: UpdateCampaignInput
        }): Promise<Campaign> => {
          const campaign = await prisma.campaign.update({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
            data: params.data,
          })
          return campaign as Campaign
        },

        delete: async (params: {
          id: string
          organizationId: string
        }): Promise<void> => {
          await prisma.campaign.delete({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
          })
        },

        pause: async (params: {
          id: string
          organizationId: string
        }): Promise<Campaign> => {
          const campaign = await prisma.campaign.update({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
            data: { status: 'PAUSED' },
          })
          return campaign as Campaign
        },

        resume: async (params: {
          id: string
          organizationId: string
        }): Promise<Campaign> => {
          const campaign = await prisma.campaign.update({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
            data: { status: 'RUNNING' },
          })
          return campaign as Campaign
        },

        cancel: async (params: {
          id: string
          organizationId: string
        }): Promise<Campaign> => {
          const campaign = await prisma.campaign.update({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
            data: { status: 'CANCELLED' },
          })
          return campaign as Campaign
        },

        uploadLeads: async (params: {
          campaignId: string
          organizationId: string
          leads: Array<{ name?: string; phone: string; email?: string }>
        }) => {
          // Criar leads
          const leads = await prisma.campaignLead.createMany({
            data: params.leads.map((lead) => ({
              ...lead,
              campaignId: params.campaignId,
            })),
          })

          // Atualizar contador de leads na campanha
          await prisma.campaign.update({
            where: { id: params.campaignId },
            data: { totalLeads: { increment: leads.count } },
          })

          return { leadsCreated: leads.count }
        },

        startDispatch: async (params: {
          campaignId: string
          organizationId: string
          instanceName?: string
        }) => {
          // Verificar se a campanha existe
          const campaign = await prisma.campaign.findUnique({
            where: {
              id: params.campaignId,
              organizationId: params.organizationId,
            },
          })

          if (!campaign) {
            throw new Error('Campanha não encontrada')
          }

          if (campaign.status === 'RUNNING') {
            throw new Error('Campanha já está em execução')
          }

          // Atualizar status para RUNNING
          await prisma.campaign.update({
            where: { id: params.campaignId },
            data: { status: 'RUNNING', startedAt: new Date() },
          })

          // Aqui você implementaria a lógica de disparo real
          // Por enquanto, apenas retornamos sucesso
          return { message: 'Disparo iniciado com sucesso' }
        },

        getStats: async (params: { id: string; organizationId: string }) => {
          const campaign = await prisma.campaign.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
            include: {
              leads: true,
            },
          })

          if (!campaign) {
            throw new Error('Campanha não encontrada')
          }

          return {
            totalLeads: campaign.totalLeads,
            sentCount: campaign.sentCount,
            deliveredCount: campaign.deliveredCount,
            readCount: campaign.readCount,
            failedCount: campaign.failedCount,
            progress: campaign.progress,
          }
        },

        getInstanceHealth: async (params: { organizationId: string }) => {
          // Buscar instâncias do WhatsApp da organização
          const instances = await prisma.whatsAppInstance.findMany({
            where: { organizationId: params.organizationId },
          })

          // Converter para o formato esperado
          return instances.map((instance) => ({
            instanceName: instance.id,
            status: instance.status
              ?.toString()
              .toLowerCase()
              .includes('connected')
              ? 'open'
              : 'connecting',
            warmupProgress: 0, // Default value since field doesn't exist
            healthScore: 80, // Default value since field doesn't exist
            isRecommended: true, // Default value
            lastSeen: instance.lastSeen,
            messagesSent24h: 0, // Default value since field doesn't exist
            messagesReceived24h: 0, // Default value since field doesn't exist
            responseRate: 0.8, // Default value since field doesn't exist
            deliveryRate: 0.9, // Default value since field doesn't exist
            riskLevel: 'LOW' as const,
          }))
        },
      },
    }
  },
})
