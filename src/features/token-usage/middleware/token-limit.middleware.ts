import type { IgniterAppContext } from '@/igniter.context'
import { TokenUsageService } from '../services/token-usage.service'
import type { CheckTokenLimitResult } from '../token-usage.types'

export interface TokenLimitMiddlewareOptions {
  organizationId: string
  estimatedTokens: number
  operation: string
  model?: string
  agentId?: string
}

export class TokenLimitMiddleware {
  private tokenUsageService: TokenUsageService

  constructor(private context: IgniterAppContext) {
    this.tokenUsageService = new TokenUsageService(context.providers.database)
  }

  /**
   * Verifica se a organização pode usar os tokens estimados
   * Deve ser chamado ANTES de fazer a requisição para OpenAI
   */
  async checkTokenLimit(
    options: TokenLimitMiddlewareOptions,
  ): Promise<CheckTokenLimitResult> {
    const { organizationId, estimatedTokens } = options

    try {
      // Verifica os limites de token
      const limitCheck = await this.tokenUsageService.checkTokenLimit({
        organizationId,
        tokensToUse: estimatedTokens,
      })

      if (!limitCheck.canUseTokens) {
        console.warn(
          `[Token Limit Middleware] Limite de tokens excedido para organização ${organizationId}:`,
          limitCheck.reason,
        )
      }

      return limitCheck
    } catch (error) {
      console.error(
        '[Token Limit Middleware] Erro ao verificar limite de tokens:',
        error,
      )
      
      // Em caso de erro, permite o uso mas registra o problema
      return {
        canUseTokens: true,
        reason: 'Erro na verificação de limite - permitindo uso',
        currentUsage: {
          organizationId,
          currentMonthTokens: 0,
          currentDayTokens: 0,
          totalTokensUsed: 0,
        },
        limits: {},
      }
    }
  }

  /**
   * Registra o uso real de tokens APÓS a requisição para OpenAI
   */
  async recordTokenUsage(options: {
    organizationId: string
    tokensUsed: number
    operation: string
    model?: string
    agentId?: string
    metadata?: any
  }): Promise<void> {
    try {
      await this.tokenUsageService.recordTokenUsage(options)
      
      // Verifica se precisa enviar alertas
      await this.checkAndSendAlerts(options.organizationId)
    } catch (error) {
      console.error(
        '[Token Limit Middleware] Erro ao registrar uso de tokens:',
        error,
      )
    }
  }

  /**
   * Verifica se deve enviar alertas de limite
   */
  private async checkAndSendAlerts(organizationId: string): Promise<void> {
    try {
      const stats = await this.tokenUsageService.getTokenUsageStats({
        organizationId,
      })
      
      // Alerta para 80% do limite mensal
      if (stats.percentageUsed.monthly && stats.percentageUsed.monthly >= 80) {
        await this.sendTokenLimitAlert(
          organizationId,
          'monthly',
          stats.percentageUsed.monthly,
        )
      }
      
      // Alerta para 80% do limite diário
      if (stats.percentageUsed.daily && stats.percentageUsed.daily >= 80) {
        await this.sendTokenLimitAlert(
          organizationId,
          'daily',
          stats.percentageUsed.daily,
        )
      }
    } catch (error) {
      console.error(
        '[Token Limit Middleware] Erro ao verificar alertas:',
        error,
      )
    }
  }

  /**
   * Envia alerta de limite de tokens
   */
  private async sendTokenLimitAlert(
    organizationId: string,
    period: 'daily' | 'monthly',
    percentage: number,
  ): Promise<void> {
    try {
      // Buscar informações da organização
      const organization = await this.context.providers.database.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: {
            where: { role: 'owner' },
            include: { user: true },
          },
        },
      })

      if (!organization || !organization.members.length) {
        console.warn(`Organização ${organizationId} não encontrada para envio de alerta`)
        return
      }

      const ownerEmail = organization.members[0].user.email
      const message = `Atenção: Sua organização "${organization.name}" atingiu ${percentage.toFixed(1)}% do limite ${period === 'monthly' ? 'mensal' : 'diário'} de tokens da OpenAI.`

      // TODO: Implementar envio de email/WhatsApp
      console.log(`[Token Alert] ${message} - Email: ${ownerEmail}`)
      
      // Aqui você pode integrar com serviços de email/WhatsApp
      // Exemplo: await this.emailService.sendAlert(ownerEmail, message)
      // Exemplo: await this.whatsappService.sendAlert(organization.phone, message)
    } catch (error) {
      console.error(
        '[Token Limit Middleware] Erro ao enviar alerta:',
        error,
      )
    }
  }

  /**
   * Estima tokens baseado no texto de entrada
   * Aproximação: 1 token ≈ 4 caracteres para texto em português
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Estima tokens para diferentes operações
   */
  static estimateTokensForOperation(operation: string, inputText: string): number {
    const baseTokens = TokenLimitMiddleware.estimateTokens(inputText)
    
    switch (operation) {
      case 'chat_completion':
        // Chat completion geralmente usa mais tokens devido ao contexto
        return Math.ceil(baseTokens * 1.5)
      case 'text_generation':
        return baseTokens
      case 'embedding':
        return baseTokens
      case 'transcription':
        // Transcrição de áudio pode variar muito
        return Math.max(baseTokens, 100)
      default:
        return baseTokens
    }
  }
}