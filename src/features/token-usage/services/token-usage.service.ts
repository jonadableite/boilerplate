import { PrismaClient } from '@prisma/client'
import {
  RecordTokenUsageInput,
  GetTokenUsageStatsInput,
  CheckTokenLimitInput,
  CheckTokenLimitResult,
  TokenUsageStats,
  OrganizationTokenUsage,
  TokenLimits,
} from '../token-usage.types'

export class TokenUsageService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Registra o uso de tokens por uma organização
   */
  async recordTokenUsage(input: RecordTokenUsageInput): Promise<void> {
    const {
      organizationId,
      tokensUsed,
      operation,
      model,
      agentId,
      metadata,
    } = input

    // Registra o histórico de uso
    await this.prisma.tokenUsageHistory.create({
      data: {
        organizationId,
        tokensUsed,
        operation,
        model,
        agentId,
        metadata,
      },
    })

    // Atualiza os contadores da organização
    await this.updateOrganizationTokenCounters(organizationId, tokensUsed)
  }

  /**
   * Verifica se a organização pode usar a quantidade de tokens solicitada
   */
  async checkTokenLimit(
    input: CheckTokenLimitInput,
  ): Promise<CheckTokenLimitResult> {
    const { organizationId, tokensToUse } = input

    const [organization, limits] = await Promise.all([
      this.getOrganizationTokenUsage(organizationId),
      this.getOrganizationTokenLimits(organizationId),
    ])

    // Verifica limite diário
    if (limits.dailyTokenLimit !== null && limits.dailyTokenLimit !== undefined) {
      const newDailyUsage = organization.currentDayTokens + tokensToUse
      if (newDailyUsage > limits.dailyTokenLimit) {
        return {
          canUseTokens: false,
          reason: 'daily_limit_exceeded',
          currentUsage: organization,
          limits,
        }
      }
    }

    // Verifica limite mensal
    if (limits.monthlyTokenLimit !== null && limits.monthlyTokenLimit !== undefined) {
      const newMonthlyUsage = organization.currentMonthTokens + tokensToUse
      if (newMonthlyUsage > limits.monthlyTokenLimit) {
        return {
          canUseTokens: false,
          reason: 'monthly_limit_exceeded',
          currentUsage: organization,
          limits,
        }
      }
    }

    return {
      canUseTokens: true,
      currentUsage: organization,
      limits,
    }
  }

  /**
   * Obtém estatísticas de uso de tokens de uma organização
   */
  async getTokenUsageStats(
    input: GetTokenUsageStatsInput,
  ): Promise<TokenUsageStats> {
    const { organizationId } = input

    const [organization, limits] = await Promise.all([
      this.getOrganizationTokenUsage(organizationId),
      this.getOrganizationTokenLimits(organizationId),
    ])

    const monthlyPercentage = limits.monthlyTokenLimit
      ? (organization.currentMonthTokens / limits.monthlyTokenLimit) * 100
      : undefined

    const dailyPercentage = limits.dailyTokenLimit
      ? (organization.currentDayTokens / limits.dailyTokenLimit) * 100
      : undefined

    return {
      currentUsage: organization,
      limits,
      percentageUsed: {
        monthly: monthlyPercentage,
        daily: dailyPercentage,
      },
      isOverLimit: {
        monthly: monthlyPercentage ? monthlyPercentage > 100 : false,
        daily: dailyPercentage ? dailyPercentage > 100 : false,
      },
    }
  }

  /**
   * Reseta os contadores de tokens das organizações (executado diariamente/mensalmente)
   */
  async resetTokenCounters(): Promise<void> {
    const now = new Date()
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Busca organizações que precisam de reset
    const organizations = await this.prisma.organization.findMany({
      where: {
        OR: [
          { lastTokenReset: { lt: startOfDay } },
          { lastTokenReset: null },
        ],
      },
      select: {
        id: true,
        currentDayTokens: true,
        currentMonthTokens: true,
        lastTokenReset: true,
      },
    })

    for (const org of organizations) {
      const resetDaily =
        !org.lastTokenReset || org.lastTokenReset < startOfDay
      const resetMonthly =
        !org.lastTokenReset || org.lastTokenReset < startOfMonth

      await this.prisma.organization.update({
        where: { id: org.id },
        data: {
          currentDayTokens: resetDaily ? 0 : org.currentDayTokens,
          currentMonthTokens: resetMonthly ? 0 : org.currentMonthTokens,
          lastTokenReset: now,
        },
      })
    }
  }

  /**
   * Obtém o uso atual de tokens de uma organização
   */
  private async getOrganizationTokenUsage(
    organizationId: string,
  ): Promise<OrganizationTokenUsage> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        currentDayTokens: true,
        currentMonthTokens: true,
        totalTokensUsed: true,
        lastTokenReset: true,
      },
    })

    if (!organization) {
      throw new Error(`Organization with id ${organizationId} not found`)
    }

    return {
      organizationId: organization.id,
      currentDayTokens: organization.currentDayTokens || 0,
      currentMonthTokens: organization.currentMonthTokens || 0,
      totalTokensUsed: organization.totalTokensUsed || 0,
      lastTokenReset: organization.lastTokenReset || undefined,
    }
  }

  /**
   * Obtém os limites de tokens do plano da organização
   */
  private async getOrganizationTokenLimits(
    organizationId: string,
  ): Promise<TokenLimits> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        customer: {
          include: {
            subscriptions: {
              include: {
                price: {
                  include: {
                    plan: {
                      select: {
                        dailyTokenLimit: true,
                        monthlyTokenLimit: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!organization) {
      throw new Error(`Organization with id ${organizationId} not found`)
    }

    const plan = organization.customer?.subscriptions?.[0]?.price?.plan

    return {
      dailyTokenLimit: plan?.dailyTokenLimit || undefined,
      monthlyTokenLimit: plan?.monthlyTokenLimit || undefined,
    }
  }

  /**
   * Atualiza os contadores de tokens da organização
   */
  private async updateOrganizationTokenCounters(
    organizationId: string,
    tokensUsed: number,
  ): Promise<void> {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        currentDayTokens: {
          increment: tokensUsed,
        },
        currentMonthTokens: {
          increment: tokensUsed,
        },
        totalTokensUsed: {
          increment: tokensUsed,
        },
      },
    })
  }
}
