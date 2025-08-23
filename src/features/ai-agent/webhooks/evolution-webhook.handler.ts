import { AIAgentService } from '../services/ai-agent.service'
import { MessageContext } from '../services/ai-agent.service'

export interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: {
    remoteJid: string
    type: 'text' | 'audio' | 'image' | 'video' | 'document'
    content?: string
    audioUrl?: string
    imageUrl?: string
    videoUrl?: string
    documentUrl?: string
    timestamp: number
    fromMe: boolean
    quotedMessage?: any
    metadata?: Record<string, any>
  }
}

export class EvolutionWebhookHandler {
  private agentService: AIAgentService

  constructor(
    evolutionBaseURL: string,
    evolutionApiKey: string,
    instanceName: string,
    openaiApiKey: string
  ) {
    this.agentService = new AIAgentService(
      evolutionBaseURL,
      evolutionApiKey,
      instanceName,
      openaiApiKey
    )
  }

  async handleWebhook(payload: EvolutionWebhookPayload): Promise<void> {
    try {
      console.log('[Evolution Webhook] Recebido webhook:', {
        event: payload.event,
        instance: payload.instance,
        remoteJid: payload.data.remoteJid,
        type: payload.data.type
      })

      // Processar apenas mensagens recebidas (não enviadas por nós)
      if (payload.data.fromMe) {
        console.log('[Evolution Webhook] Mensagem enviada por nós, ignorando')
        return
      }

      // Processar apenas eventos de mensagem
      if (payload.event !== 'message') {
        console.log('[Evolution Webhook] Evento não é mensagem, ignorando')
        return
      }

      // Determinar o tipo de conteúdo e extrair a mensagem
      let message = ''
      let type: 'text' | 'audio' | 'image' | 'video' = 'text'
      let audioUrl: string | undefined

      switch (payload.data.type) {
        case 'text':
          message = payload.data.content || ''
          type = 'text'
          break
        case 'audio':
          message = 'Mensagem de áudio recebida'
          type = 'audio'
          audioUrl = payload.data.audioUrl
          break
        case 'image':
          message = payload.data.content || 'Imagem recebida'
          type = 'image'
          break
        case 'video':
          message = payload.data.content || 'Vídeo recebido'
          type = 'video'
          break
        case 'document':
          message = payload.data.content || 'Documento recebido'
          type = 'text'
          break
        default:
          message = 'Tipo de mensagem não suportado'
          type = 'text'
      }

      if (!message && type === 'text') {
        console.log('[Evolution Webhook] Mensagem vazia, ignorando')
        return
      }

      // Aqui você precisaria determinar qual agente deve processar a mensagem
      // Por enquanto, usamos um ID mock
      const agentId = 'default_agent_id' // Implementar lógica para encontrar o agente correto

      // Criar contexto da mensagem
      const context: MessageContext = {
        remoteJid: payload.data.remoteJid,
        message,
        type,
        audioUrl,
        metadata: {
          ...payload.data.metadata,
          timestamp: payload.data.timestamp,
          quotedMessage: payload.data.quotedMessage,
          instance: payload.instance
        }
      }

      // Processar mensagem com o agente
      const response = await this.agentService.processMessage(agentId, context)

      if (response.success) {
        console.log('[Evolution Webhook] Mensagem processada com sucesso:', {
          agentId,
          remoteJid: payload.data.remoteJid,
          response: response.message.substring(0, 100) + '...'
        })

        // Aqui você enviaria a resposta de volta via Evolution API
        // Por exemplo, usando o endpoint de envio de mensagem
        await this.sendResponse(payload.data.remoteJid, response.message, response.audioUrl)
      } else {
        console.error('[Evolution Webhook] Erro ao processar mensagem:', response.error)
        
        // Enviar mensagem de erro para o usuário
        await this.sendResponse(
          payload.data.remoteJid, 
          'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
        )
      }
    } catch (error) {
      console.error('[Evolution Webhook] Erro ao processar webhook:', error)
    }
  }

  private async sendResponse(
    remoteJid: string, 
    message: string, 
    audioUrl?: string
  ): Promise<void> {
    try {
      // Aqui você implementaria o envio da resposta via Evolution API
      // Por exemplo, usando o endpoint de envio de mensagem de texto ou áudio
      
      if (audioUrl) {
        // Enviar áudio
        console.log('[Evolution Webhook] Enviando resposta em áudio para:', remoteJid)
        // await this.evolutionClient.sendAudio(remoteJid, audioUrl)
      } else {
        // Enviar texto
        console.log('[Evolution Webhook] Enviando resposta em texto para:', remoteJid)
        // await this.evolutionClient.sendText(remoteJid, message)
      }
    } catch (error) {
      console.error('[Evolution Webhook] Erro ao enviar resposta:', error)
    }
  }

  // Método para processar diferentes tipos de eventos
  async handleEvent(event: string, data: any): Promise<void> {
    switch (event) {
      case 'message':
        await this.handleMessageEvent(data)
        break
      case 'connection':
        await this.handleConnectionEvent(data)
        break
      case 'qr':
        await this.handleQREvent(data)
        break
      case 'ready':
        await this.handleReadyEvent(data)
        break
      default:
        console.log('[Evolution Webhook] Evento não tratado:', event)
    }
  }

  private async handleMessageEvent(data: any): Promise<void> {
    // Implementar lógica específica para eventos de mensagem
    console.log('[Evolution Webhook] Evento de mensagem:', data)
  }

  private async handleConnectionEvent(data: any): Promise<void> {
    // Implementar lógica para eventos de conexão
    console.log('[Evolution Webhook] Evento de conexão:', data)
  }

  private async handleQREvent(data: any): Promise<void> {
    // Implementar lógica para eventos de QR Code
    console.log('[Evolution Webhook] Evento de QR Code:', data)
  }

  private async handleReadyEvent(data: any): Promise<void> {
    // Implementar lógica para quando a instância estiver pronta
    console.log('[Evolution Webhook] Instância pronta:', data)
  }
}

// Factory para criar o handler
export function createEvolutionWebhookHandler(
  evolutionBaseURL: string,
  evolutionApiKey: string,
  instanceName: string,
  openaiApiKey: string
): EvolutionWebhookHandler {
  return new EvolutionWebhookHandler(
    evolutionBaseURL,
    evolutionApiKey,
    instanceName,
    openaiApiKey
  )
}
