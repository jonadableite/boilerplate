import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { 
  CreateAgentInput, 
  CreateOpenAICredsInput, 
  UpdateSessionStatusInput, 
  AgentSettingsInput,
  EvolutionAPIResponse 
} from '../ai-agent.types'

export class EvolutionAPIClient {
  private client: AxiosInstance
  private instanceName: string

  constructor(baseURL: string, apiKey: string, instanceName: string) {
    this.instanceName = instanceName
    this.client = axios.create({
      baseURL: `${baseURL}/openai`,
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    })
  }

  // OpenAI Credentials
  async setOpenAICreds(input: CreateOpenAICredsInput): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.post(
        `/creds/${this.instanceName}`,
        input
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao configurar credenciais OpenAI:', error.response?.data || error.message)
      throw new Error(`Falha ao configurar credenciais OpenAI: ${error.response?.data?.message || error.message}`)
    }
  }

  async getOpenAICreds(): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.get(
        `/creds/${this.instanceName}`
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao buscar credenciais OpenAI:', error.response?.data || error.message)
      throw new Error(`Falha ao buscar credenciais OpenAI: ${error.response?.data?.message || error.message}`)
    }
  }

  async deleteOpenAICreds(openaiCredsId: string): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.delete(
        `/creds/${openaiCredsId}/${this.instanceName}`
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao deletar credenciais OpenAI:', error.response?.data || error.message)
      throw new Error(`Falha ao deletar credenciais OpenAI: ${error.response?.data?.message || error.message}`)
    }
  }

  // OpenAI Bots
  async createBot(input: CreateAgentInput): Promise<EvolutionAPIResponse> {
    try {
      const payload = this.buildBotPayload(input)
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.post(
        `/create/${this.instanceName}`,
        payload
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao criar bot:', error.response?.data || error.message)
      throw new Error(`Falha ao criar bot: ${error.response?.data?.message || error.message}`)
    }
  }

  async findBots(): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.get(
        `/find/${this.instanceName}`
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao buscar bots:', error.response?.data || error.message)
      throw new Error(`Falha ao buscar bots: ${error.response?.data?.message || error.message}`)
    }
  }

  async fetchBot(openaiBotId: string): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.get(
        `/fetch/${openaiBotId}/${this.instanceName}`
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao buscar bot:', error.response?.data || error.message)
      throw new Error(`Falha ao buscar bot: ${error.response?.data?.message || error.message}`)
    }
  }

  async updateBot(openaiBotId: string, input: Partial<CreateAgentInput>): Promise<EvolutionAPIResponse> {
    try {
      const payload = this.buildBotPayload(input)
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.put(
        `/update/${openaiBotId}/${this.instanceName}`,
        payload
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao atualizar bot:', error.response?.data || error.message)
      throw new Error(`Falha ao atualizar bot: ${error.response?.data?.message || error.message}`)
    }
  }

  async deleteBot(openaiBotId: string): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.delete(
        `/delete/${openaiBotId}/${this.instanceName}`
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao deletar bot:', error.response?.data || error.message)
      throw new Error(`Falha ao deletar bot: ${error.response?.data?.message || error.message}`)
    }
  }

  // Bot Settings
  async setDefaultSettings(input: AgentSettingsInput): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.post(
        `/settings/${this.instanceName}`,
        input
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao configurar settings padrão:', error.response?.data || error.message)
      throw new Error(`Falha ao configurar settings padrão: ${error.response?.data?.message || error.message}`)
    }
  }

  async fetchDefaultSettings(): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.get(
        `/fetchSettings/${this.instanceName}`
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao buscar settings padrão:', error.response?.data || error.message)
      throw new Error(`Falha ao buscar settings padrão: ${error.response?.data?.message || error.message}`)
    }
  }

  // Sessions
  async changeSessionStatus(input: UpdateSessionStatusInput): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.post(
        `/changeStatus/${this.instanceName}`,
        input
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao alterar status da sessão:', error.response?.data || error.message)
      throw new Error(`Falha ao alterar status da sessão: ${error.response?.data?.message || error.message}`)
    }
  }

  async fetchSessions(openaiBotId: string): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.get(
        `/fetchSessions/${openaiBotId}/${this.instanceName}`
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao buscar sessões:', error.response?.data || error.message)
      throw new Error(`Falha ao buscar sessões: ${error.response?.data?.message || error.message}`)
    }
  }

  // Speech-to-Text (se disponível)
  async transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/ogg'): Promise<EvolutionAPIResponse> {
    try {
      const formData = new FormData()
      formData.append('audio', new Blob([audioBuffer], { type: mimeType }), 'audio.ogg')
      
      const response: AxiosResponse<EvolutionAPIResponse> = await this.client.post(
        `/speech-to-text/${this.instanceName}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return response.data
    } catch (error: any) {
      console.error('[Evolution API] Erro ao transcrever áudio:', error.response?.data || error.message)
      throw new Error(`Falha ao transcrever áudio: ${error.response?.data?.message || error.message}`)
    }
  }

  // Helper para construir payload do bot
  private buildBotPayload(input: Partial<CreateAgentInput>) {
    const payload: any = {
      enabled: true,
      openaiCredsId: input.openaiCredsId,
      botType: input.botType,
      triggerType: input.triggerType,
      triggerOperator: input.triggerOperator,
      expire: input.expire || 20,
      keywordFinish: input.keywordFinish || '#SAIR',
      delayMessage: input.delayMessage || 1000,
      unknownMessage: input.unknownMessage || 'Desculpe, não entendi sua mensagem.',
      listeningFromMe: input.listeningFromMe || false,
      stopBotFromMe: input.stopBotFromMe || false,
      keepOpen: input.keepOpen || false,
      debounceTime: input.debounceTime || 10,
      ignoreJids: input.ignoreJids || []
    }

    if (input.botType === 'assistant') {
      if (input.assistantId) payload.assistantId = input.assistantId
      if (input.functionUrl) payload.functionUrl = input.functionUrl
    } else if (input.botType === 'chatCompletion') {
      if (input.model) payload.model = input.model
      if (input.systemMessages) payload.systemMessages = input.systemMessages
      if (input.assistantMessages) payload.assistantMessages = input.assistantMessages
      if (input.userMessages) payload.userMessages = input.userMessages
      if (input.maxTokens) payload.maxTokens = input.maxTokens
    }

    if (input.triggerType === 'keyword' && input.triggerValue) {
      payload.triggerValue = input.triggerValue
    }

    return payload
  }

  // Método para testar conexão
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchDefaultSettings()
      return true
    } catch (error) {
      return false
    }
  }
}
