import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'
import { igniter } from '@/igniter'
import { z } from 'zod'
import {
  CreateAgentSchema,
  UpdateAgentSchema,
  CreateOpenAICredsSchema,
  AgentSettingsSchema,
} from '../ai-agent.types'
import { AIAgentFeatureProcedure } from '../procedures/ai-agent.procedure'

// Schema para processamento de mensagens
const ProcessMessageSchema = z.object({
  agentId: z.string().min(1, 'ID do agente é obrigatório'),
  remoteJid: z.string().min(1, 'Remote JID é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.enum(['text', 'audio', 'image', 'video']).default('text'),
  audioUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

// Schema para upload de base de conhecimento
const UploadKnowledgeSchema = z.object({
  agentId: z.string().min(1, 'ID do agente é obrigatório'),
  type: z.enum(['pdf', 'docx', 'txt', 'url', 'text']),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  metadata: z.record(z.any()).optional(),
})

export const AIAgentController = igniter.controller({
  name: 'ai-agent',
  path: '/ai-agents',
  actions: {
    // OpenAI Credentials
    createOpenAICreds: igniter.mutation({
      method: 'POST',
      path: '/openai-creds',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: CreateOpenAICredsSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.createOpenAICreds({
            ...request.body,
            organizationId: session.organization.id,
            createdById: session.user.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao criar credenciais OpenAI:', error)
          return response.error({
            code: 'OPENAI_CREDS_CREATION_FAILED',
            message: 'Erro ao criar credenciais OpenAI',
            status: 500,
          })
        }
      },
    }),

    getOpenAICreds: igniter.query({
      method: 'GET',
      path: '/openai-creds',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.getOpenAICreds({
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao buscar credenciais OpenAI:', error)
          return response.error({
            code: 'OPENAI_CREDS_FETCH_FAILED',
            message: 'Erro ao buscar credenciais OpenAI',
            status: 500,
          })
        }
      },
    }),

    deleteOpenAICreds: igniter.mutation({
      method: 'DELETE',
      path: '/openai-creds/:openaiCredsId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        openaiCredsId: z.string().min(1, 'ID das credenciais é obrigatório'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.deleteOpenAICreds({
            id: request.params.openaiCredsId,
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao deletar credenciais OpenAI:', error)
          return response.error({
            code: 'OPENAI_CREDS_DELETE_FAILED',
            message: 'Erro ao deletar credenciais OpenAI',
            status: 500,
          })
        }
      },
    }),

    // AI Agents
    createAgent: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: CreateAgentSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const agent = await context.aiAgent.createAgent({
            ...request.body,
            organizationId: session.organization.id,
            createdById: session.user.id,
          })

          return response.created(agent)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao criar agente:', error)
          return response.error({
            code: 'AGENT_CREATION_FAILED',
            message: 'Erro ao criar agente',
            status: 500,
          })
        }
      },
    }),

    updateAgent: igniter.mutation({
      method: 'PUT',
      path: '/:agentId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        agentId: z.string().min(1, 'ID do agente é obrigatório'),
      }),
      body: UpdateAgentSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const agent = await context.aiAgent.updateAgent({
            id: request.params.agentId,
            ...request.body,
            organizationId: session.organization.id,
            updatedById: session.user.id,
          })

          return response.success(agent)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao atualizar agente:', error)
          return response.error({
            code: 'AGENT_UPDATE_FAILED',
            message: 'Erro ao atualizar agente',
            status: 500,
          })
        }
      },
    }),

    deleteAgent: igniter.mutation({
      method: 'DELETE',
      path: '/:agentId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        agentId: z.string().min(1, 'ID do agente é obrigatório'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          await context.aiAgent.deleteAgent({
            id: request.params.agentId,
            organizationId: session.organization.id,
          })

          return response.success({ message: 'Agente deletado com sucesso' })
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao deletar agente:', error)
          return response.error({
            code: 'AGENT_DELETION_FAILED',
            message: 'Erro ao deletar agente',
            status: 500,
          })
        }
      },
    }),

    fetchAgents: igniter.query({
      method: 'GET',
      path: '/',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        search: z.string().optional(),
        status: z.enum(['active', 'inactive', 'paused']).optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.fetchAgents({
            ...request.query,
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao buscar agentes:', error)
          return response.error({
            code: 'AGENTS_FETCH_FAILED',
            message: 'Erro ao buscar agentes',
            status: 500,
          })
        }
      },
    }),

    getAgentById: igniter.query({
      method: 'GET',
      path: '/:agentId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        agentId: z.string().min(1, 'ID do agente é obrigatório'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const agent = await context.aiAgent.getAgentById(request.params.agentId)

          if (!agent) {
            return response.error({
              code: 'AGENT_NOT_FOUND',
              message: 'Agente não encontrado',
              status: 404,
            })
          }

          return response.success(agent)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao buscar agente:', error)
          return response.error({
            code: 'AGENT_FETCH_FAILED',
            message: 'Erro ao buscar agente',
            status: 500,
          })
        }
      },
    }),

    // Sessões
    changeSessionStatus: igniter.mutation({
      method: 'PUT',
      path: '/sessions/:sessionId/status',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        sessionId: z.string().min(1, 'ID da sessão é obrigatório'),
      }),
      body: z.object({
        status: z.enum(['active', 'inactive', 'paused']),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.changeSessionStatus({
            sessionId: request.params.sessionId,
            status: request.body.status,
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao alterar status da sessão:', error)
          return response.error({
            code: 'SESSION_STATUS_UPDATE_FAILED',
            message: 'Erro ao alterar status da sessão',
            status: 500,
          })
        }
      },
    }),

    fetchSessions: igniter.query({
      method: 'GET',
      path: '/sessions',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        agentId: z.string().optional(),
        status: z.enum(['active', 'inactive', 'paused']).optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.fetchSessions({
            ...request.query,
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao buscar sessões:', error)
          return response.error({
            code: 'SESSIONS_FETCH_FAILED',
            message: 'Erro ao buscar sessões',
            status: 500,
          })
        }
      },
    }),

    // Configurações
    setDefaultSettings: igniter.mutation({
      method: 'POST',
      path: '/settings/default',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: AgentSettingsSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.setDefaultSettings({
            ...request.body,
            organizationId: session.organization.id,
            updatedById: session.user.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao configurar settings padrão:', error)
          return response.error({
            code: 'DEFAULT_SETTINGS_UPDATE_FAILED',
            message: 'Erro ao configurar settings padrão',
            status: 500,
          })
        }
      },
    }),

    fetchDefaultSettings: igniter.query({
      method: 'GET',
      path: '/settings',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.fetchDefaultSettings({
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao buscar settings padrão:', error)
          return response.error({
            code: 'DEFAULT_SETTINGS_FETCH_FAILED',
            message: 'Erro ao buscar settings padrão',
            status: 500,
          })
        }
      },
    }),

    // Processamento de mensagens
    processMessage: igniter.mutation({
      method: 'POST',
      path: '/process-message',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: ProcessMessageSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.processMessage({
            ...request.body,
            organizationId: session.organization.id,
            userId: session.user.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao processar mensagem:', error)
          return response.error({
            code: 'MESSAGE_PROCESSING_FAILED',
            message: 'Erro ao processar mensagem',
            status: 500,
          })
        }
      },
    }),

    // Upload de base de conhecimento
    uploadKnowledge: igniter.mutation({
      method: 'POST',
      path: '/knowledge/upload',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: UploadKnowledgeSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.uploadKnowledge({
            ...request.body,
            organizationId: session.organization.id,
            uploadedById: session.user.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao fazer upload da base de conhecimento:', error)
          return response.error({
            code: 'KNOWLEDGE_UPLOAD_FAILED',
            message: 'Erro ao fazer upload da base de conhecimento',
            status: 500,
          })
        }
      },
    }),

    // Teste de conexão
    testConnection: igniter.query({
      method: 'GET',
      path: '/test-connection',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        try {
          const result = await context.aiAgent.testConnection({
            organizationId: session.organization.id,
          })

          return response.success(result)
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao testar conexão:', error)
          return response.error({
            code: 'CONNECTION_TEST_FAILED',
            message: 'Erro ao testar conexão',
            status: 500,
          })
        }
      },
    }),
  },
})
