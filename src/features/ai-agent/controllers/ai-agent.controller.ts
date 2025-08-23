import { igniter } from '@/igniter'
import { z } from 'zod'
import { 
  CreateAgentSchema, 
  UpdateAgentSchema, 
  CreateOpenAICredsSchema,
  UpdateSessionStatusSchema,
  AgentSettingsSchema
} from '../ai-agent.types'
import { AIAgentService } from '../services/ai-agent.service'

// Schema para processamento de mensagens
const ProcessMessageSchema = z.object({
  agentId: z.string().min(1, 'ID do agente é obrigatório'),
  remoteJid: z.string().min(1, 'Remote JID é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.enum(['text', 'audio', 'image', 'video']).default('text'),
  audioUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional()
})

// Schema para upload de base de conhecimento
const UploadKnowledgeSchema = z.object({
  agentId: z.string().min(1, 'ID do agente é obrigatório'),
  type: z.enum(['pdf', 'docx', 'txt', 'url', 'text']),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  metadata: z.record(z.any()).optional()
})

export const AIAgentController = igniter.controller({
  path: '/ai-agents',
  actions: {
    // OpenAI Credentials
    createOpenAICreds: {
      method: 'POST',
      path: '/openai-creds',
      schema: CreateOpenAICredsSchema,
      handler: async ({ input, context }) => {
        try {
          // Aqui você obteria as configurações da Evolution API do contexto ou env
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = context.organization?.slug || 'default'
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.createOpenAICreds(input)
          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao criar credenciais OpenAI:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    getOpenAICreds: {
      method: 'GET',
      path: '/openai-creds',
      handler: async ({ context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = context.organization?.slug || 'default'
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.getOpenAICreds()
          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao buscar credenciais OpenAI:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    deleteOpenAICreds: {
      method: 'DELETE',
      path: '/openai-creds/:openaiCredsId',
      schema: z.object({
        openaiCredsId: z.string().min(1, 'ID das credenciais é obrigatório')
      }),
      handler: async ({ input, context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = context.organization?.slug || 'default'
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.deleteOpenAICreds(input.openaiCredsId)
          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao deletar credenciais OpenAI:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    // AI Agents
    createAgent: {
      method: 'POST',
      path: '/',
      schema: CreateAgentSchema,
      handler: async ({ input, context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = input.instanceName
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const agent = await service.createAgent(input)
          return { success: true, data: agent }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao criar agente:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    updateAgent: {
      method: 'PUT',
      path: '/:agentId',
      schema: z.object({
        agentId: z.string().min(1, 'ID do agente é obrigatório'),
        ...UpdateAgentSchema.shape
      }),
      handler: async ({ input, context }) => {
        try {
          const { agentId, ...updateData } = input
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = updateData.instanceName || 'default'
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const agent = await service.updateAgent(agentId, updateData)
          return { success: true, data: agent }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao atualizar agente:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    deleteAgent: {
      method: 'DELETE',
      path: '/:agentId',
      schema: z.object({
        agentId: z.string().min(1, 'ID do agente é obrigatório')
      }),
      handler: async ({ input, context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = 'default' // Você precisaria buscar a instância do agente
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.deleteAgent(input.agentId)
          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao deletar agente:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    // Sessões
    changeSessionStatus: {
      method: 'POST',
      path: '/sessions/status',
      schema: UpdateSessionStatusSchema,
      handler: async ({ input, context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = 'default' // Você precisaria buscar a instância do agente
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.changeSessionStatus(input)
          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao alterar status da sessão:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    fetchSessions: {
      method: 'GET',
      path: '/sessions/:openaiBotId',
      schema: z.object({
        openaiBotId: z.string().min(1, 'ID do bot é obrigatório')
      }),
      handler: async ({ input, context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = 'default' // Você precisaria buscar a instância do agente
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.fetchSessions(input.openaiBotId)
          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao buscar sessões:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    // Configurações
    setDefaultSettings: {
      method: 'POST',
      path: '/settings',
      schema: AgentSettingsSchema,
      handler: async ({ input, context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = 'default' // Você precisaria buscar a instância do agente
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.setDefaultSettings(input)
          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao configurar settings padrão:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    fetchDefaultSettings: {
      method: 'GET',
      path: '/settings',
      handler: async ({ context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = 'default' // Você precisaria buscar a instância do agente
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.fetchDefaultSettings()
          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao buscar settings padrão:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    // Processamento de mensagens
    processMessage: {
      method: 'POST',
      path: '/process-message',
      schema: ProcessMessageSchema,
      handler: async ({ input, context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = 'default' // Você precisaria buscar a instância do agente
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const result = await service.processMessage(input.agentId, {
            remoteJid: input.remoteJid,
            message: input.message,
            type: input.type,
            audioUrl: input.audioUrl,
            metadata: input.metadata
          })

          return { success: true, data: result }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao processar mensagem:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    // Upload de base de conhecimento
    uploadKnowledge: {
      method: 'POST',
      path: '/knowledge/upload',
      schema: UploadKnowledgeSchema,
      handler: async ({ input, context }) => {
        try {
          const openaiApiKey = process.env.OPENAI_API_KEY || ''
          if (!openaiApiKey) {
            throw new Error('API Key da OpenAI não encontrada')
          }

          // Aqui você implementaria o processamento da base de conhecimento
          // Por enquanto, retornamos um mock
          return { 
            success: true, 
            data: {
              message: 'Base de conhecimento processada com sucesso',
              chunks: 5,
              agentId: input.agentId
            }
          }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao fazer upload da base de conhecimento:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    },

    // Teste de conexão
    testConnection: {
      method: 'GET',
      path: '/test-connection',
      handler: async ({ context }) => {
        try {
          const evolutionBaseURL = process.env.EVOLUTION_API_URL || ''
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''
          const instanceName = 'default'
          const openaiApiKey = process.env.OPENAI_API_KEY || ''

          if (!evolutionBaseURL || !evolutionApiKey) {
            throw new Error('Configurações da Evolution API não encontradas')
          }

          const service = new AIAgentService(
            evolutionBaseURL,
            evolutionApiKey,
            instanceName,
            openaiApiKey
          )

          const isConnected = await service.testConnection()
          return { 
            success: true, 
            data: { 
              connected: isConnected,
              evolutionAPI: !!evolutionBaseURL && !!evolutionApiKey,
              openai: !!openaiApiKey
            }
          }
        } catch (error) {
          console.error('[AI Agent Controller] Erro ao testar conexão:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }
      }
    }
  }
})
