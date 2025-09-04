import { igniter } from '@/igniter'
import { z } from 'zod'
import { TokenUsageFeatureProcedure } from '../procedures/token-usage.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'

export const TokenUsageController = igniter.controller({
  name: 'token-usage',
  path: '/token-usage',
  actions: {
    // Obter estatísticas de uso de tokens da organização
    getStats: igniter.query({
      method: 'GET',
      path: '/stats',
      use: [TokenUsageFeatureProcedure(), AuthFeatureProcedure()],
      query: z.object({
        period: z
          .enum(['daily', 'monthly', 'yearly'])
          .optional()
          .default('monthly'),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        // Verificar autenticação e organização ativa
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        try {
          const stats = await context.tokenUsage.getTokenUsageStats({
            organizationId: session.organization.id,
            period: request.query.period,
            startDate: request.query.startDate,
            endDate: request.query.endDate,
          })

          return response.success({
            data: stats,
          })
        } catch (error) {
          console.error('[TokenUsage Controller] Error getting stats:', error)
          return response.internalServerError('Failed to get token usage stats')
        }
      },
    }),

    // Obter limites de tokens da organização
    getLimits: igniter.query({
      method: 'GET',
      path: '/limits',
      use: [TokenUsageFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        // Verificar autenticação e organização ativa
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        try {
          const limits = await context.tokenUsage.getOrganizationTokenLimits(
            session.organization.id,
          )

          return response.success({
            data: limits,
          })
        } catch (error) {
          console.error('[TokenUsage Controller] Error getting limits:', error)
          return response.internalServerError('Failed to get token limits')
        }
      },
    }),

    // Obter uso atual de tokens da organização
    getCurrentUsage: igniter.query({
      method: 'GET',
      path: '/current',
      use: [TokenUsageFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        // Verificar autenticação e organização ativa
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        try {
          const usage = await context.tokenUsage.getOrganizationTokenUsage(
            session.organization.id,
          )

          return response.success({
            data: usage,
          })
        } catch (error) {
          console.error(
            '[TokenUsage Controller] Error getting current usage:',
            error,
          )
          return response.internalServerError(
            'Failed to get current token usage',
          )
        }
      },
    }),

    // Obter histórico detalhado de uso de tokens
    getHistory: igniter.query({
      method: 'GET',
      path: '/history',
      use: [TokenUsageFeatureProcedure(), AuthFeatureProcedure()],
      query: z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(50),
        operation: z.string().optional(),
        model: z.string().optional(),
        agentId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        // Verificar autenticação e organização ativa
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        try {
          const history = await context.tokenUsage.getTokenUsageHistory({
            organizationId: session.organization.id,
            page: request.query.page,
            limit: request.query.limit,
            operation: request.query.operation,
            model: request.query.model,
            agentId: request.query.agentId,
            startDate: request.query.startDate,
            endDate: request.query.endDate,
          })

          return response.success({
            data: history.records,
            pagination: {
              page: request.query.page,
              limit: request.query.limit,
              total: history.total,
              pages: Math.ceil(history.total / request.query.limit),
            },
          })
        } catch (error) {
          console.error('[TokenUsage Controller] Error getting history:', error)
          return response.internalServerError(
            'Failed to get token usage history',
          )
        }
      },
    }),

    // Reset manual dos contadores de tokens (apenas para admins)
    resetCounters: igniter.mutation({
      method: 'POST',
      path: '/reset',
      use: [TokenUsageFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        // Verificar autenticação e permissões de admin
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        try {
          await context.tokenUsage.resetTokenCounters()

          return response.success({
            message: 'Token counters reset successfully',
          })
        } catch (error) {
          console.error(
            '[TokenUsage Controller] Error resetting counters:',
            error,
          )
          return response.internalServerError('Failed to reset token counters')
        }
      },
    }),
  },
})