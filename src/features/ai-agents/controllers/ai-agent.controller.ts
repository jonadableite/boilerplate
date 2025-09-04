import { igniter } from '@/igniter'
import { z } from 'zod'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth/procedures/auth.procedure'
import { AIAgentFeatureProcedure } from '../procedures/ai-agent.procedure'
import {
  createAIAgentSchema,
  updateAIAgentSchema,
  listAgentsSchema,
  processMessageSchema,
  conversationHistorySchema,
  ragRetrievalSchema,
  addKnowledgeChunkSchema,
  updateKnowledgeChunkSchema,
  createEvolutionBotSchema,
  updateEvolutionBotSchema,
} from '../validation/ai-agent.validation'

export const AIAgentController = igniter.controller({
  name: 'ai-agent',
  path: '/ai-agents',
  actions: {
    // Listar agentes da organização
    list: igniter.query({
      method: 'GET',
      path: '/',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: listAgentsSchema.omit({ organizationId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const result = await context.aiAgent.listAgents({
          ...request.query,
          organizationId: session.organization.id,
        })

        return response.success(result)
      },
    }),

    // Obter agente por ID
    getById: igniter.query({
      method: 'GET',
      path: '/:id',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const agent = await context.aiAgent.getAgentById({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        if (!agent) {
          return response.notFound('Agent not found')
        }

        return response.success({ data: agent })
      },
    }),

    // Criar novo agente
    create: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: createAIAgentSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const agent = await context.aiAgent.createAgent({
          ...request.body,
          organizationId: session.organization.id,
          createdById: session.user.id,
        })

        return response.success({ data: agent }, 201)
      },
    }),

    // Atualizar agente
    update: igniter.mutation({
      method: 'PUT',
      path: '/:id',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
      }),
      body: updateAIAgentSchema.omit({ id: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const agent = await context.aiAgent.updateAgent({
          id: request.params.id,
          organizationId: session.organization.id,
          ...request.body,
        })

        return response.success({ data: agent })
      },
    }),

    // Deletar agente
    delete: igniter.mutation({
      method: 'DELETE',
      path: '/:id',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        await context.aiAgent.deleteAgent({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        return response.success({ message: 'Agent deleted successfully' })
      },
    }),

    // Processar mensagem com agente
    processMessage: igniter.mutation({
      method: 'POST',
      path: '/:id/process',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
      }),
      body: processMessageSchema.omit({ agentId: true, organizationId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const result = await context.aiAgent.processMessage({
          agentId: request.params.id,
          organizationId: session.organization.id,
          ...request.body,
        })

        return response.success({ data: result })
      },
    }),

    // Obter histórico de conversa
    getConversationHistory: igniter.query({
      method: 'GET',
      path: '/:id/conversations/:sessionId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
        sessionId: z.string().min(1, 'Session ID is required'),
      }),
      query: conversationHistorySchema.omit({ agentId: true, sessionId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const history = await context.aiAgent.getConversationHistory({
          agentId: request.params.id,
          sessionId: request.params.sessionId,
          organizationId: session.organization.id,
          ...request.query,
        })

        return response.success({ data: history })
      },
    }),

    // Buscar na base de conhecimento (RAG)
    searchKnowledge: igniter.query({
      method: 'GET',
      path: '/:id/knowledge/search',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
      }),
      query: ragRetrievalSchema.omit({ knowledgeBaseId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        // Obter o agente para verificar se tem base de conhecimento
        const agent = await context.aiAgent.getAgentById({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        if (!agent || !agent.knowledgeBaseId) {
          return response.badRequest('Agent does not have a knowledge base')
        }

        const results = await context.aiAgent.searchKnowledge({
          knowledgeBaseId: agent.knowledgeBaseId,
          ...request.query,
        })

        return response.success({ data: results })
      },
    }),

    // Adicionar chunk de conhecimento
    addKnowledgeChunk: igniter.mutation({
      method: 'POST',
      path: '/:id/knowledge',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
      }),
      body: addKnowledgeChunkSchema.omit({ agentId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const chunk = await context.aiAgent.addKnowledgeChunk({
          agentId: request.params.id,
          organizationId: session.organization.id,
          ...request.body,
        })

        return response.success({ data: chunk }, 201)
      },
    }),

    // Atualizar chunk de conhecimento
    updateKnowledgeChunk: igniter.mutation({
      method: 'PUT',
      path: '/:id/knowledge/:chunkId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
        chunkId: z.string().uuid('Invalid chunk ID'),
      }),
      body: updateKnowledgeChunkSchema.omit({ id: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const chunk = await context.aiAgent.updateKnowledgeChunk({
          id: request.params.chunkId,
          agentId: request.params.id,
          organizationId: session.organization.id,
          ...request.body,
        })

        return response.success({ data: chunk })
      },
    }),

    // Deletar chunk de conhecimento
    deleteKnowledgeChunk: igniter.mutation({
      method: 'DELETE',
      path: '/:id/knowledge/:chunkId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
        chunkId: z.string().uuid('Invalid chunk ID'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        await context.aiAgent.deleteKnowledgeChunk({
          id: request.params.chunkId,
          agentId: request.params.id,
          organizationId: session.organization.id,
        })

        return response.success({
          message: 'Knowledge chunk deleted successfully',
        })
      },
    }),

    // Obter estatísticas do agente
    getStats: igniter.query({
      method: 'GET',
      path: '/:id/stats',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
      }),
      query: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const stats = await context.aiAgent.getAgentStats({
          agentId: request.params.id,
          organizationId: session.organization.id,
          startDate: request.query.startDate
            ? new Date(request.query.startDate)
            : undefined,
          endDate: request.query.endDate
            ? new Date(request.query.endDate)
            : undefined,
        })

        return response.success({ data: stats })
      },
    }),

    // Criar bot da Evolution API
    createEvolutionBot: igniter.mutation({
      method: 'POST',
      path: '/:id/evolution-bot',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
      }),
      body: createEvolutionBotSchema.omit({ agentId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const bot = await context.aiAgent.createEvolutionBot({
          agentId: request.params.id,
          organizationId: session.organization.id,
          ...request.body,
        })

        return response.success({ data: bot }, 201)
      },
    }),

    // Atualizar bot da Evolution API
    updateEvolutionBot: igniter.mutation({
      method: 'PUT',
      path: '/:id/evolution-bot/:botId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
        botId: z.string().min(1, 'Bot ID is required'),
      }),
      body: updateEvolutionBotSchema.omit({ evolutionBotId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const bot = await context.aiAgent.updateEvolutionBot({
          evolutionBotId: request.params.botId,
          agentId: request.params.id,
          organizationId: session.organization.id,
          ...request.body,
        })

        return response.success({ data: bot })
      },
    }),

    // Deletar bot da Evolution API
    deleteEvolutionBot: igniter.mutation({
      method: 'DELETE',
      path: '/:id/evolution-bot/:botId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
        botId: z.string().min(1, 'Bot ID is required'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        await context.aiAgent.deleteEvolutionBot({
          evolutionBotId: request.params.botId,
          agentId: request.params.id,
          organizationId: session.organization.id,
        })

        return response.success({
          message: 'Evolution bot deleted successfully',
        })
      },
    }),

    // Obter status do bot da Evolution API
    getEvolutionBotStatus: igniter.query({
      method: 'GET',
      path: '/:id/evolution-bot/:botId/status',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid agent ID'),
        botId: z.string().min(1, 'Bot ID is required'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const status = await context.aiAgent.getEvolutionBotStatus({
          evolutionBotId: request.params.botId,
          agentId: request.params.id,
          organizationId: session.organization.id,
        })

        return response.success({ data: status })
      },
    }),
  },
})
