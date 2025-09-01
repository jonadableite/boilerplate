import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { EvolutionAPIResponse } from '../ai-agent.types'

export interface CreateEvolutionBotInput {
  enabled: boolean
  description?: string
  apiUrl: string
  apiKey?: string
  triggerType: 'all' | 'keyword'
  triggerOperator?:
    | 'contains'
    | 'equals'
    | 'startsWith'
    | 'endsWith'
    | 'regex'
    | 'none'
  triggerValue?: string
  expire?: number
  keywordFinish?: string
  delayMessage?: number
  unknownMessage?: string
  listeningFromMe?: boolean
  stopBotFromMe?: boolean
  keepOpen?: boolean
  debounceTime?: number
  ignoreJids?: string[]
}

export interface UpdateEvolutionBotInput
  extends Partial<CreateEvolutionBotInput> {}

export interface EvolutionBotSettingsInput {
  expire?: number
  keywordFinish?: string
  delayMessage?: number
  unknownMessage?: string
  listeningFromMe?: boolean
  stopBotFromMe?: boolean
  keepOpen?: boolean
  debounceTime?: number
  ignoreJids?: string[]
  botIdFallback?: string
}

export interface ChangeSessionStatusInput {
  remoteJid: string
  status: 'opened' | 'paused' | 'closed'
}

export class EvolutionBotAPIClient {
  private client: AxiosInstance
  private instanceName: string

  constructor(baseURL: string, apiKey: string, instanceName: string) {
    this.instanceName = instanceName
    this.client = axios.create({
      baseURL: `${baseURL}/evolutionBot`,
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
    })
  }

  async createBot(
    input: CreateEvolutionBotInput,
  ): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.post(`/create/${this.instanceName}`, input)
      return response.data
    } catch (error: any) {
      const errorDetails = error.response?.data || error.message
      console.error('[Evolution Bot API] Erro ao criar bot:', {
        status: error.response?.status,
        error: error.response?.statusText,
        response: errorDetails,
      })

      // Extrair mensagens de erro mais detalhadas
      let errorMessage = 'Erro desconhecido'
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ')
        } else {
          errorMessage = error.response.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      throw new Error(`Falha ao criar Evolution Bot: ${errorMessage}`)
    }
  }

  async findBots(): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.get(`/find/${this.instanceName}`)
      return response.data
    } catch (error: any) {
      console.error(
        '[Evolution Bot API] Erro ao buscar bots:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Falha ao buscar Evolution Bots: ${error.response?.data?.message || error.message}`,
      )
    }
  }

  async fetchBot(evolutionBotId: string): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.get(`/fetch/${evolutionBotId}/${this.instanceName}`)
      return response.data
    } catch (error: any) {
      console.error(
        '[Evolution Bot API] Erro ao buscar bot:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Falha ao buscar Evolution Bot: ${error.response?.data?.message || error.message}`,
      )
    }
  }

  async updateBot(
    evolutionBotId: string,
    input: UpdateEvolutionBotInput,
  ): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.put(
          `/update/${evolutionBotId}/${this.instanceName}`,
          input,
        )
      return response.data
    } catch (error: any) {
      console.error(
        '[Evolution Bot API] Erro ao atualizar bot:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Falha ao atualizar Evolution Bot: ${error.response?.data?.message || error.message}`,
      )
    }
  }

  async deleteBot(evolutionBotId: string): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.delete(
          `/delete/${evolutionBotId}/${this.instanceName}`,
        )
      return response.data
    } catch (error: any) {
      console.error(
        '[Evolution Bot API] Erro ao deletar bot:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Falha ao deletar Evolution Bot: ${error.response?.data?.message || error.message}`,
      )
    }
  }

  async setDefaultSettings(
    input: EvolutionBotSettingsInput,
  ): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.post(`/settings/${this.instanceName}`, input)
      return response.data
    } catch (error: any) {
      console.error(
        '[Evolution Bot API] Erro ao configurar settings padrão:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Falha ao configurar settings padrão: ${error.response?.data?.message || error.message}`,
      )
    }
  }

  async fetchDefaultSettings(): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.get(`/fetchSettings/${this.instanceName}`)
      return response.data
    } catch (error: any) {
      console.error(
        '[Evolution Bot API] Erro ao buscar settings padrão:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Falha ao buscar settings padrão: ${error.response?.data?.message || error.message}`,
      )
    }
  }

  async changeSessionStatus(
    input: ChangeSessionStatusInput,
  ): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.post(`/changeStatus/${this.instanceName}`, input)
      return response.data
    } catch (error: any) {
      console.error(
        '[Evolution Bot API] Erro ao alterar status da sessão:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Falha ao alterar status da sessão: ${error.response?.data?.message || error.message}`,
      )
    }
  }

  async fetchSessions(evolutionBotId: string): Promise<EvolutionAPIResponse> {
    try {
      const response: AxiosResponse<EvolutionAPIResponse> =
        await this.client.get(
          `/fetchSessions/${evolutionBotId}/${this.instanceName}`,
        )
      return response.data
    } catch (error: any) {
      console.error(
        '[Evolution Bot API] Erro ao buscar sessões:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Falha ao buscar sessões: ${error.response?.data?.message || error.message}`,
      )
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.fetchDefaultSettings()
      return true
    } catch (error) {
      return false
    }
  }
}
