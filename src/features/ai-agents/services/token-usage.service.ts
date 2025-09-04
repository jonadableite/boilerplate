import { prisma } from '@/providers/prisma'
import {
  CheckTokenLimitsInput,
  CheckTokenLimitsResult,
  TokenUsageRecord,
  TokenUsageStats,
  TokenLimits,
} from '../types/services.types'
import { LoggingService } from './logging.service'

export class TokenUsageService {
  private readonly loggingService: LoggingService

  constructor() {
    this.loggingService = new LoggingService()
  }

  /**
   * Verifica se uma organização pode usar tokens baseado nos limites
   */
  async checkTokenLimits(
    input: CheckTokenLimitsInput,
  ): Promise<CheckTokenLimitsResult> {
    try {
      const { organizationId, requestedTokens } = input

      // Buscar organização
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      })

      if (!organization) {
        const limits: TokenLimits = { monthlyLimit: 0 }
        const stats: TokenUsageStats = {
          dailyUsage: 0,
          monthlyUsage: 0,
          percentageUsed: { daily: 0, monthly: 0 },
        }
        return {
          allowed: false,
          reason: 'Organization not found',
        
          limits,
          currentUsage: stats,
        }
      }

      // Definir limites baseados no plano (usando um plano padrão por enquanto)
      const limits = this.getTokenLimitsForPlan('free')

      // Calcular uso atual
      const stats = await this.getTokenUsageStats({
        organizationId,
        startDate: this.getStartOfMonth(),
        endDate: new Date(),
      })

      // Verificar se pode processar a requisição
      const wouldExceedLimit = stats.monthlyUsage + requestedTokens > (limits.monthlyLimit || 0)

      return {
        allowed: !wouldExceedLimit,
        reason: wouldExceedLimit
          ? 'Monthly token limit would be exceeded'
          : undefined,
        limits,
        currentUsage: stats,
      }
    } catch (error) {
      await this.loggingService.logError({
        agentId: undefined,
        organizationId: input.organizationId,
        message: 'Failed to check token limits',
        error: error as Error,
        
      })

      // Em caso de erro, permitir o processamento (fail-safe)
      const limits: TokenLimits = { monthlyLimit: 0 }
      const stats: TokenUsageStats = {
        dailyUsage: 0,
        monthlyUsage: 0,
        percentageUsed: { daily: 0, monthly: 0 },
      }
      return {
        allowed: true,
        reason: 'Error checking limits - allowing request',
        limits,
        currentUsage: stats,
      }
    }
  }

  /**
   * Registra o uso de tokens
   */
  async recordTokenUsage(input: {
    organizationId: string
    agentId?: string
    promptTokens: number
    completionTokens: number
    totalTokens: number
    model: string
    operation?: string
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      await prisma.tokenUsageHistory.create({
        data: {
          organizationId: input.organizationId,
          agentId: input.agentId,
          tokensUsed: input.totalTokens,
          operation: input.operation || 'ai_agent_message',
          model: input.model,
          metadata: {
            promptTokens: input.promptTokens,
            completionTokens: input.completionTokens,
            ...input.metadata,
          },
        },
      })

      await this.loggingService.logInfo({
        agentId: input.agentId || undefined,
        organizationId: input.organizationId,
        message: `Recorded ${input.totalTokens} tokens usage`,
        metadata: {
          operation: input.operation,
          model: input.model,
        },
      })
    } catch (error) {
      await this.loggingService.logError({
        agentId: input.agentId || undefined,
        organizationId: input.organizationId,
        message: 'Failed to record token usage',
        error: error as Error,
        metadata: {
          tokensUsed: input.totalTokens,
          operation: input.operation,
        },
      })
      // Não re-throw para não quebrar o fluxo principal
    }
  }

  /**
   * Obtém estatísticas de uso de tokens
   */
  async getTokenUsageStats(input: {
    organizationId: string
    agentId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<TokenUsageStats> {
    try {
      const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const endDate = input.endDate || new Date()
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const where: any = {
        organizationId: input.organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }

      if (input.agentId) {
        where.agentId = input.agentId
      }

      const whereDaily = {
        ...where,
        createdAt: {
          gte: startOfDay,
          lte: endDate,
        },
      }

      // Estatísticas gerais
      const [monthlyUsage, dailyUsage] = await Promise.all([
        // Uso mensal
        prisma.tokenUsageHistory.aggregate({
          where,
          _sum: {
            tokensUsed: true,
          },
        }),
        // Uso diário
        prisma.tokenUsageHistory.aggregate({
          where: whereDaily,
          _sum: {
            tokensUsed: true,
          },
        }),
      ])

      const monthlyTokens = monthlyUsage._sum.tokensUsed || 0
      const dailyTokens = dailyUsage._sum.tokensUsed || 0

      // Calcular percentuais (assumindo limites padrão)
      const limits = this.getTokenLimitsForPlan('free')
      const monthlyPercentage = limits.monthlyLimit
        ? (monthlyTokens / limits.monthlyLimit) * 100
        : 0
      const dailyPercentage = limits.dailyLimit
        ? (dailyTokens / limits.dailyLimit) * 100
        : 0

      return {
        dailyUsage: dailyTokens,
        monthlyUsage: monthlyTokens,
        remainingDaily: limits.dailyLimit
          ? Math.max(0, limits.dailyLimit - dailyTokens)
          : undefined,
        remainingMonthly: limits.monthlyLimit
          ? Math.max(0, limits.monthlyLimit - monthlyTokens)
          : undefined,
        percentageUsed: {
          daily: Math.min(100, dailyPercentage),
          monthly: Math.min(100, monthlyPercentage),
        },
      }
    } catch (error) {
      await this.loggingService.logError({
        agentId: input.agentId || undefined,
        organizationId: input.organizationId,
        message: 'Failed to get token usage stats',
        error: error as Error,
      })
      throw error
    }
  }

  /**
   * Obtém os limites de token baseado no plano da organização
   */
  private getTokenLimitsForPlan(plan: string): TokenLimits {
    const limits: Record<string, TokenLimits> = {
      free: {
        dailyLimit: 1000,
        monthlyLimit: 10000,
        perRequestLimit: 500,
      },
      starter: {
        dailyLimit: 5000,
        monthlyLimit: 50000,
        perRequestLimit: 2000,
      },
      pro: {
        dailyLimit: 20000,
        monthlyLimit: 200000,
        perRequestLimit: 8000,
      },
      enterprise: {
        dailyLimit: 100000,
        monthlyLimit: 1000000,
        perRequestLimit: 32000,
      },
    }

    return limits[plan] || limits.free
  }

  /**
   * Obtém o início do mês atual
   */
  private getStartOfMonth(): Date {
    const date = new Date()
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
    return date
  }

  /**
   * Obtém histórico de uso de tokens
   */
  async getTokenUsageHistory(input: {
    organizationId: string
    agentId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }): Promise<TokenUsageRecord[]> {
    try {
      const whereClause: any = {
        organizationId: input.organizationId,
      }

      if (input.startDate || input.endDate) {
        whereClause.createdAt = {}
        if (input.startDate) {
          whereClause.createdAt.gte = input.startDate
        }
        if (input.endDate) {
          whereClause.createdAt.lte = input.endDate
        }
      }

      if (input.agentId) {
        whereClause.agentId = input.agentId
      }

      const records = await prisma.tokenUsageHistory.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: input.limit || 50,
        skip: input.offset || 0,
      })

      return records.map((record: any) => {
        const metadata = (record.metadata as Record<string, any>) || {}
        return {
          organizationId: record.organizationId,
          agentId: record.agentId ?? undefined,
          sessionId: undefined, // TokenUsageHistory não tem sessionId
          promptTokens: metadata.promptTokens || 0,
          completionTokens: metadata.completionTokens || 0,
          totalTokens: record.tokensUsed,
          model: record.model || 'unknown',
          operation: record.operation,
          metadata,
        }
      })
    } catch (error) {
      await this.loggingService.logError({
        agentId: input.agentId ?? undefined,
        organizationId: input.organizationId,
        message: 'Failed to get token usage history',
        error: error as Error,
      })
      throw error
    }
  }
}
