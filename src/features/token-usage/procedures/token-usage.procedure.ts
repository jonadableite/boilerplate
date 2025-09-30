import { igniter } from '@/igniter'
import { TokenUsageService } from '../services/token-usage.service'
import {
  RecordTokenUsageInput,
  GetTokenUsageStatsInput,
  CheckTokenLimitInput,
} from '../token-usage.types'

export const TokenUsageFeatureProcedure = igniter.procedure({
  name: 'TokenUsageFeatureProcedure',
  handler: async (_, { context }) => {
    const tokenUsageService = new TokenUsageService(context.providers.database)

    return {
      tokenUsage: {
        // Registrar uso de tokens
        recordTokenUsage: async (input: RecordTokenUsageInput) => {
          return await tokenUsageService.recordTokenUsage(input)
        },

        // Verificar limite de tokens
        checkTokenLimit: async (input: CheckTokenLimitInput) => {
          return await tokenUsageService.checkTokenLimit(input)
        },

        // Obter estatísticas de uso
        getTokenUsageStats: async (input: GetTokenUsageStatsInput) => {
          return await tokenUsageService.getTokenUsageStats(input)
        },

        // Reset dos contadores
        resetTokenCounters: async () => {
          return await tokenUsageService.resetTokenCounters()
        },

        // Obter limites de tokens da organização
        getOrganizationTokenLimits: async (organizationId: string) => {
          return await (tokenUsageService as any).getOrganizationTokenLimits(organizationId)
        },

        // Obter uso atual de tokens da organização
        getOrganizationTokenUsage: async (organizationId: string) => {
          return await (tokenUsageService as any).getOrganizationTokenUsage(organizationId)
        },

        // Obter histórico de uso de tokens
        getTokenUsageHistory: async (input: {
          organizationId: string
          page?: number
          limit?: number
          operation?: string
          model?: string
          agentId?: string
          startDate?: string
          endDate?: string
        }) => {
          const history = await (tokenUsageService as any).getTokenUsageHistory({
            organizationId: input.organizationId,
            page: input.page,
            limit: input.limit,
            operation: input.operation,
            model: input.model,
            agentId: input.agentId,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
            endDate: input.endDate ? new Date(input.endDate) : undefined,
          })
          
          // Simular estrutura esperada pelo controller
          return {
            records: history,
            total: history.length,
          }
        },
      },
    }
  },
})
