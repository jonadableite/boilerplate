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
      },
    }
  },
})
