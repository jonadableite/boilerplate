import {
  AgentMemory,
  AgentPersona,
  AgentSettingsInput,
  AIAgent,
  CreateAgentInput,
  CreateOpenAICredsInput,
  MemoryType,
  UpdateAgentInput,
  UpdateSessionStatusInput
} from '../ai-agent.types'
import { EvolutionAPIClient } from './evolution-api.client'
import { KnowledgeBaseService } from './knowledge-base.service'
import { OpenAIService } from './openai.service'

export interface MessageContext {
  remoteJid: string
  message: string
  type: 'text' | 'audio' | 'image' | 'video'
  audioUrl?: string
  metadata?: Record<string, any>
}

export interface AgentResponse {
  success: boolean
  message: string
  audioUrl?: string
  metadata?: Record<string, any>
}

export class AIAgentService {
  private evolutionClient: EvolutionAPIClient
  private knowledgeBaseService: KnowledgeBaseService
  private openaiService: OpenAIService

  constructor(
    evolutionBaseURL: string,
    evolutionApiKey: string,
    instanceName: string,
    openaiApiKey: string
  ) {
    this.evolutionClient = new EvolutionAPIClient(evolutionBaseURL, evolutionApiKey, instanceName)
    this.knowledgeBaseService = new KnowledgeBaseService(openaiApiKey)
    this.openaiService = new OpenAIService(openaiApiKey)
  }

  // OpenAI Credentials
  async createOpenAICreds(input: CreateOpenAICredsInput) {
    try {
      // Primeiro, validar a API Key
      const isValid = await this.openaiService.validateAPIKey()
      if (!isValid) {
        throw new Error('API Key da OpenAI inválida')
      }

      // Configurar credenciais na Evolution API
      const result = await this.evolutionClient.setOpenAICreds(input)

      // Aqui você salvaria as credenciais no banco de dados
      // Por enquanto, retornamos o resultado da Evolution API
      return result
    } catch (error) {
      console.error('[AI Agent Service] Erro ao criar credenciais OpenAI:', error)
      throw error
    }
  }

  async getOpenAICreds() {
    try {
      const result = await this.evolutionClient.getOpenAICreds()
      return result
    } catch (error) {
      console.error('[AI Agent Service] Erro ao buscar credenciais OpenAI:', error)
      throw error
    }
  }

  async deleteOpenAICreds(openaiCredsId: string) {
    try {
      const result = await this.evolutionClient.deleteOpenAICreds(openaiCredsId)
      return result
    } catch (error) {
      console.error('[AI Agent Service] Erro ao deletar credenciais OpenAI:', error)
      throw error
    }
  }

  // AI Agents
  async createAgent(input: CreateAgentInput): Promise<AIAgent> {
    try {
      // Criar bot na Evolution API
      const evolutionResult = await this.evolutionClient.createBot(input)

      if (!evolutionResult.success) {
        throw new Error(`Falha ao criar bot na Evolution API: ${evolutionResult.message}`)
      }

      // Se for um assistant, criar na OpenAI
      let assistantId: string | undefined
      if (input.botType === 'assistant') {
        try {
          const systemPrompt = this.buildSystemPrompt(input)
          assistantId = await this.openaiService.createAssistant(
            input.name,
            systemPrompt,
            input.model || 'gpt-4o'
          )
        } catch (error) {
          console.warn('[AI Agent Service] Falha ao criar assistant na OpenAI:', error)
          // Continuar sem assistant ID se falhar
        }
      }

      // Aqui você salvaria o agente no banco de dados
      // Por enquanto, retornamos um mock
      const agent: AIAgent = {
        id: `agent_${Date.now()}`,
        name: input.name,
        description: input.description,
        instanceName: input.instanceName,
        evolutionBotId: evolutionResult.data?.id,
        openaiCredsId: input.openaiCredsId,
        botType: input.botType,
        assistantId,
        functionUrl: input.functionUrl,
        model: input.model,
        systemMessages: input.systemMessages,
        assistantMessages: input.assistantMessages,
        userMessages: input.userMessages,
        maxTokens: input.maxTokens,
        triggerType: input.triggerType,
        triggerOperator: input.triggerOperator,
        triggerValue: input.triggerValue,
        expire: input.expire,
        keywordFinish: input.keywordFinish,
        delayMessage: input.delayMessage,
        unknownMessage: input.unknownMessage,
        listeningFromMe: input.listeningFromMe,
        stopBotFromMe: input.stopBotFromMe,
        keepOpen: input.keepOpen,
        debounceTime: input.debounceTime,
        ignoreJids: input.ignoreJids,
        persona: input.persona,
        knowledgeBase: input.knowledgeBase,
        status: 'ACTIVE' as any,
        organizationId: 'org_id', // Deve vir do contexto
        createdById: 'user_id', // Deve vir do contexto
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return agent
    } catch (error) {
      console.error('[AI Agent Service] Erro ao criar agente:', error)
      throw error
    }
  }

  async updateAgent(agentId: string, input: UpdateAgentInput): Promise<AIAgent> {
    try {
      // Buscar agente no banco
      const agent = await this.getAgentById(agentId)
      if (!agent) {
        throw new Error('Agente não encontrado')
      }

      // Atualizar bot na Evolution API
      if (agent.evolutionBotId) {
        const evolutionResult = await this.evolutionClient.updateBot(agent.evolutionBotId, input)

        if (!evolutionResult.success) {
          throw new Error(`Falha ao atualizar bot na Evolution API: ${evolutionResult.message}`)
        }
      }

      // Se for um assistant e tiver mudanças relevantes, atualizar na OpenAI
      if (input.botType === 'assistant' && agent.assistantId) {
        try {
          if (input.name || input.description || input.model) {
            const systemPrompt = this.buildSystemPrompt({ ...agent, ...input })
            await this.openaiService.updateAssistant(agent.assistantId, {
              name: input.name || agent.name,
              instructions: systemPrompt,
              model: input.model || agent.model || 'gpt-4o'
            })
          }
        } catch (error) {
          console.warn('[AI Agent Service] Falha ao atualizar assistant na OpenAI:', error)
        }
      }

      // Aqui você atualizaria o agente no banco de dados
      // Por enquanto, retornamos o agente atualizado
      const updatedAgent: AIAgent = {
        ...agent,
        ...input,
        updatedAt: new Date()
      }

      return updatedAgent
    } catch (error) {
      console.error('[AI Agent Service] Erro ao atualizar agente:', error)
      throw error
    }
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      // Buscar agente no banco
      const agent = await this.getAgentById(agentId)
      if (!agent) {
        throw new Error('Agente não encontrado')
      }

      // Deletar bot na Evolution API
      if (agent.evolutionBotId) {
        const evolutionResult = await this.evolutionClient.deleteBot(agent.evolutionBotId)

        if (!evolutionResult.success) {
          throw new Error(`Falha ao deletar bot na Evolution API: ${evolutionResult.message}`)
        }
      }

      // Deletar assistant na OpenAI se existir
      if (agent.assistantId) {
        try {
          await this.openaiService.deleteAssistant(agent.assistantId)
        } catch (error) {
          console.warn('[AI Agent Service] Falha ao deletar assistant na OpenAI:', error)
        }
      }

      // Aqui você deletaria o agente do banco de dados
      return true
    } catch (error) {
      console.error('[AI Agent Service] Erro ao deletar agente:', error)
      throw error
    }
  }

  // Sessões
  async changeSessionStatus(input: UpdateSessionStatusInput): Promise<boolean> {
    try {
      const result = await this.evolutionClient.changeSessionStatus(input)
      return result.success
    } catch (error) {
      console.error('[AI Agent Service] Erro ao alterar status da sessão:', error)
      throw error
    }
  }

  async fetchSessions(openaiBotId: string) {
    try {
      const result = await this.evolutionClient.fetchSessions(openaiBotId)
      return result
    } catch (error) {
      console.error('[AI Agent Service] Erro ao buscar sessões:', error)
      throw error
    }
  }

  // Configurações
  async setDefaultSettings(input: AgentSettingsInput): Promise<boolean> {
    try {
      const result = await this.evolutionClient.setDefaultSettings(input)
      return result.success
    } catch (error) {
      console.error('[AI Agent Service] Erro ao configurar settings padrão:', error)
      throw error
    }
  }

  async fetchDefaultSettings() {
    try {
      const result = await this.evolutionClient.fetchDefaultSettings()
      return result
    } catch (error) {
      console.error('[AI Agent Service] Erro ao buscar settings padrão:', error)
      throw error
    }
  }

  // Processamento de mensagens
  async processMessage(agentId: string, context: MessageContext): Promise<AgentResponse> {
    try {
      // Buscar agente
      const agent = await this.getAgentById(agentId)
      if (!agent) {
        throw new Error('Agente não encontrado')
      }

      let userMessage = context.message

      // Processar áudio se necessário
      if (context.type === 'audio' && context.audioUrl) {
        try {
          // Aqui você implementaria o download do áudio e STT
          // Por enquanto, assumimos que já temos a transcrição
          userMessage = await this.transcribeAudio(context.audioUrl)
        } catch (error) {
          console.error('[AI Agent Service] Erro ao transcrever áudio:', error)
          return {
            success: false,
            message: 'Desculpe, não consegui entender o áudio. Pode enviar como texto?'
          }
        }
      }

      // Buscar contexto da base de conhecimento
      let relevantChunks: any[] = []
      if (agent.knowledgeBase?.enabled) {
        // Aqui você buscaria chunks relevantes do banco de dados
        // Por enquanto, usamos um array vazio
        relevantChunks = []
      }

      // Buscar memórias recentes da conversa
      const recentMemories = await this.getRecentMemories(agentId, context.remoteJid, 5)
      const contextMessages = recentMemories.map(memory => ({
        role: memory.role as 'user' | 'assistant',
        content: memory.content
      }))

      // Gerar resposta usando o OpenAI Service
      const response = await this.openaiService.generateContextualResponse(
        agent,
        userMessage,
        contextMessages,
        relevantChunks
      )

      // Salvar memória da conversa
      await this.saveMemory(agentId, context.remoteJid, 'user', userMessage)
      await this.saveMemory(agentId, context.remoteJid, 'assistant', response)

      // Gerar áudio de resposta se solicitado
      let audioUrl: string | undefined
      if (context.metadata?.generateAudio) {
        try {
          audioUrl = await this.generateAudioResponse(response)
        } catch (error) {
          console.error('[AI Agent Service] Erro ao gerar áudio:', error)
        }
      }

      return {
        success: true,
        message: response,
        audioUrl,
        metadata: {
          agentId,
          remoteJid: context.remoteJid,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('[AI Agent Service] Erro ao processar mensagem:', error)
      return {
        success: false,
        message: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        metadata: {
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }
  }

  // Memórias
  async saveMemory(
    agentId: string,
    remoteJid: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    type: MemoryType = MemoryType.SHORT_TERM
  ): Promise<AgentMemory> {
    try {
      // Aqui você salvaria a memória no banco de dados
      const memory: AgentMemory = {
        id: `memory_${Date.now()}`,
        agentId,
        remoteJid,
        type,
        role,
        content,
        createdAt: new Date()
      }

      // Se for memória de longo prazo, criar resumo
      if (type === MemoryType.LONG_TERM) {
        // Aqui você implementaria a lógica para resumir conversas antigas
        // e criar memórias de longo prazo
      }

      return memory
    } catch (error) {
      console.error('[AI Agent Service] Erro ao salvar memória:', error)
      throw error
    }
  }

  async getRecentMemories(
    agentId: string,
    remoteJid: string,
    limit: number = 10
  ): Promise<AgentMemory[]> {
    try {
      // Aqui você buscaria as memórias recentes do banco de dados
      // Por enquanto, retornamos um array vazio
      return []
    } catch (error) {
      console.error('[AI Agent Service] Erro ao buscar memórias:', error)
      throw error
    }
  }

  // Métodos auxiliares
  private async getAgentById(agentId: string): Promise<AIAgent | null> {
    // Aqui você buscaria o agente no banco de dados
    // Por enquanto, retornamos null
    return null
  }

  private async transcribeAudio(audioUrl: string): Promise<string> {
    // Aqui você implementaria o download do áudio e STT
    // Por enquanto, retornamos uma mensagem mock
    return 'Transcrição do áudio (implementar STT)'
  }

  private async generateAudioResponse(text: string): Promise<string> {
    // Aqui você implementaria TTS para gerar áudio
    // Por enquanto, retornamos uma URL mock
    return 'audio_response_url'
  }

  // Construir prompt do sistema baseado na persona
  private buildSystemPrompt(input: CreateAgentInput | AIAgent): string {
    if (input.persona) {
      const persona = input.persona as AgentPersona
      let prompt = `Você é ${persona.name}, ${persona.role}.\n\n`
      prompt += `Tom de comunicação: ${persona.tone}\n`
      prompt += `Expertise: ${persona.expertise?.join(', ') || 'Assistente geral'}\n`

      if (persona.limitations && persona.limitations.length > 0) {
        prompt += `Limitações: ${persona.limitations.join(', ')}\n`
      }

      if (persona.greeting) {
        prompt += `Saudação: ${persona.greeting}\n`
      }

      prompt += '\nResponda sempre de acordo com sua persona e expertise.'
      return prompt
    }

    return 'Você é um assistente de IA útil e amigável. Responda de forma clara e precisa.'
  }

  // Teste de conexão
  async testConnection(): Promise<boolean> {
    try {
      return await this.evolutionClient.testConnection()
    } catch (error) {
      return false
    }
  }
}
