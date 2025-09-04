import axios, { AxiosInstance } from 'axios'
import { LoggingService } from './logging.service'

// Tipos para a Evolution API
export interface EvolutionAPIConfig {
  baseURL: string
  apiKey: string
  timeout?: number
}

export interface SendMessageInput {
  instance: string
  remoteJid: string
  message: string
  options?: {
    delay?: number
    presence?: 'composing' | 'recording'
    linkPreview?: boolean
  }
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface CreateInstanceInput {
  instanceName: string
  token?: string
  qrcode?: boolean
  webhook?: string
  webhookByEvents?: boolean
  webhookBase64?: boolean
  events?: string[]
}

export interface CreateInstanceResult {
  success: boolean
  instance?: {
    instanceName: string
    status: string
    qrcode?: {
      code: string
      base64: string
    }
  }
  error?: string
}

export interface InstanceStatusResult {
  success: boolean
  instance?: {
    instanceName: string
    status: 'open' | 'close' | 'connecting'
    profileName?: string
    profilePictureUrl?: string
  }
  error?: string
}

export class EvolutionAPIService {
  private client: AxiosInstance
  private loggingService: LoggingService

  constructor(config: EvolutionAPIConfig, loggingService: LoggingService) {
    this.loggingService = loggingService
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
      },
    })

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        this.loggingService.logDebug({
          agentId: null,
          organizationId: null,
          message: 'Evolution API request',
          metadata: {
            method: config.method,
            url: config.url,
            data: config.data,
          },
        })
        return config
      },
      (error) => {
        this.loggingService.logError({
          agentId: null,
          organizationId: null,
          message: 'Evolution API request error',
          error: error as Error,
        })
        return Promise.reject(error)
      },
    )

    this.client.interceptors.response.use(
      (response) => {
        this.loggingService.logDebug({
          agentId: null,
          organizationId: null,
          message: 'Evolution API response',
          metadata: {
            status: response.status,
            data: response.data,
          },
        })
        return response
      },
      (error) => {
        this.loggingService.logError({
          agentId: null,
          organizationId: null,
          message: 'Evolution API response error',
          error: new Error(`${error.message} - Status: ${error.response?.status}`),
        })
        return Promise.reject(error)
      },
    )
  }

  // Enviar mensagem de texto
  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    try {
      const { instance, remoteJid, message, options = {} } = input

      // Simular presença se configurado
      if (options.presence) {
        await this.sendPresence(instance, remoteJid, options.presence)
      }

      // Delay antes de enviar se configurado
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay))
      }

      const response = await this.client.post(`/message/sendText/${instance}`, {
        number: remoteJid,
        text: message,
        linkPreview: options.linkPreview ?? true,
      })

      if (response.data && response.data.key) {
        return {
          success: true,
          messageId: response.data.key.id,
        }
      }

      return {
        success: false,
        error: 'Invalid response from Evolution API',
      }
    } catch (error) {
      await this.loggingService.logError({
        agentId: null,
        organizationId: null,
        message: 'Failed to send message via Evolution API',
        error: error as Error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Enviar presença (digitando, gravando áudio)
  async sendPresence(instance: string, remoteJid: string, presence: 'composing' | 'recording'): Promise<void> {
    try {
      await this.client.post(`/chat/presence/${instance}`, {
        number: remoteJid,
        presence,
      })
    } catch (error) {
      // Não falhar se presença não funcionar
      await this.loggingService.logWarning({
        agentId: null,
        organizationId: null,
        message: 'Failed to send presence',
        metadata: { instance, remoteJid, presence },
      })
    }
  }

  // Criar nova instância
  async createInstance(input: CreateInstanceInput): Promise<CreateInstanceResult> {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName: input.instanceName,
        token: input.token,
        qrcode: input.qrcode ?? true,
        webhook: input.webhook,
        webhook_by_events: input.webhookByEvents ?? true,
        webhook_base64: input.webhookBase64 ?? false,
        events: input.events ?? [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'SEND_MESSAGE',
          'CONTACTS_SET',
          'CONTACTS_UPSERT',
          'CONTACTS_UPDATE',
          'PRESENCE_UPDATE',
          'CHATS_SET',
          'CHATS_UPSERT',
          'CHATS_UPDATE',
          'CHATS_DELETE',
          'GROUPS_UPSERT',
          'GROUP_UPDATE',
          'GROUP_PARTICIPANTS_UPDATE',
          'CONNECTION_UPDATE',
        ],
      })

      return {
        success: true,
        instance: response.data,
      }
    } catch (error) {
      await this.loggingService.logError({
        agentId: null,
        organizationId: null,
        message: 'Failed to create Evolution API instance',
        error: error as Error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Conectar instância
  async connectInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.post(`/instance/connect/${instanceName}`)
      return { success: true }
    } catch (error) {
      await this.loggingService.logError({
        agentId: null,
        organizationId: null,
        message: 'Failed to connect Evolution API instance',
        error: error as Error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Desconectar instância
  async disconnectInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.delete(`/instance/logout/${instanceName}`)
      return { success: true }
    } catch (error) {
      await this.loggingService.logError({
        agentId: null,
        organizationId: null,
        message: 'Failed to disconnect Evolution API instance',
        error: error as Error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Obter status da instância
  async getInstanceStatus(instanceName: string): Promise<InstanceStatusResult> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`)
      
      return {
        success: true,
        instance: {
          instanceName,
          status: response.data.state,
          profileName: response.data.profileName,
          profilePictureUrl: response.data.profilePictureUrl,
        },
      }
    } catch (error) {
      await this.loggingService.logError({
        agentId: null,
        organizationId: null,
        message: 'Failed to get Evolution API instance status',
        error: error as Error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Obter QR Code da instância
  async getInstanceQRCode(instanceName: string): Promise<{ success: boolean; qrcode?: string; error?: string }> {
    try {
      const response = await this.client.get(`/instance/qrcode/${instanceName}`)
      
      return {
        success: true,
        qrcode: response.data.base64,
      }
    } catch (error) {
      await this.loggingService.logError({
        agentId: null,
        organizationId: null,
        message: 'Failed to get Evolution API QR Code',
        error: error as Error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Deletar instância
  async deleteInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.delete(`/instance/delete/${instanceName}`)
      return { success: true }
    } catch (error) {
      await this.loggingService.logError({
        agentId: null,
        organizationId: null,
        message: 'Failed to delete Evolution API instance',
        error: error as Error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Configurar webhook da instância
  async setInstanceWebhook(instanceName: string, webhookUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.put(`/webhook/set/${instanceName}`, {
        webhook: {
          url: webhookUrl,
          by_events: true,
          base64: false,
        },
      })
      return { success: true }
    } catch (error) {
      await this.loggingService.logError({
        agentId: null,
        organizationId: null,
        message: 'Failed to set Evolution API webhook',
        error: error as Error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Função helper para criar instância do serviço
export function createEvolutionAPIService(config: EvolutionAPIConfig, loggingService: LoggingService): EvolutionAPIService {
  return new EvolutionAPIService(config, loggingService)
}