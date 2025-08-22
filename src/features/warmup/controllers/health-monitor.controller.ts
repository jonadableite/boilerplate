import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'
import { igniter } from '@/igniter'
import { z } from 'zod'
import { HealthAnalyzerProcedure } from '../procedures/health-analyzer.procedure'

export const healthMonitorController = igniter.controller({
  name: 'health-monitor',
  path: '/health',
  actions: {
    /**
     * Analisa a saúde de uma instância específica
     */
    analyzeInstanceHealth: igniter.mutation({
      method: 'POST',
      path: '/analyze/:instanceName',
      use: [AuthFeatureProcedure()],
      params: z.object({
        instanceName: z.string().min(1)
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!auth) {
          return response.error({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401,
          })
        }

        try {
          const { instanceName } = request.params
          const organizationId = auth.organization?.id

          if (!organizationId) {
            return response.error({
              code: 'BAD_REQUEST',
              message: 'Organization not found',
              status: 400,
            })
          }

          console.log(`[Health Monitor] Analisando saúde da instância ${instanceName}`)

          const analyzer = new HealthAnalyzerProcedure()
          const result = await analyzer.analyzeInstanceHealth(instanceName, organizationId)

          return response.success({
            success: true,
            message: 'Análise de saúde concluída com sucesso',
            data: result
          })
        } catch (error) {
          console.error('[Health Monitor] Erro na análise de saúde:', error)

          return response.error({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Erro na análise de saúde',
            status: 500,
          })
        }
      },
    }),

    /**
     * Obtém o histórico de saúde de uma instância
     */
    getHealthHistory: igniter.query({
      method: 'GET',
      path: '/history/:instanceName',
      use: [AuthFeatureProcedure()],
      params: z.object({
        instanceName: z.string().min(1)
      }),
      query: z.object({
        days: z.coerce.number().min(1).max(30).default(7),
        limit: z.coerce.number().min(1).max(100).default(20)
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!auth) {
          return response.error({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401,
          })
        }

        try {
          const { instanceName } = request.params
          const { days, limit } = request.query
          const organizationId = auth.organization?.id

          if (!organizationId) {
            return response.error({
              code: 'BAD_REQUEST',
              message: 'Organization not found',
              status: 400,
            })
          }

          const endDate = new Date()
          const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

          const history = await context.providers.database.healthMetrics.findMany({
            where: {
              instanceName,
              organizationId,
              analyzedAt: {
                gte: startDate,
                lte: endDate
              }
            },
            orderBy: { analyzedAt: 'desc' },
            take: limit
          })

          // Calcular estatísticas do período
          const stats = {
            totalAnalyses: history.length,
            averageHealthScore: history.length > 0
              ? history.reduce((sum, h) => sum + h.healthScore, 0) / history.length
              : 0,
            currentRiskLevel: history[0]?.riskLevel || 'UNKNOWN',
            trend: this.calculateTrend(history),
            bestScore: Math.max(...history.map(h => h.healthScore), 0),
            worstScore: Math.min(...history.map(h => h.healthScore), 100)
          }

          return response.success({
            success: true,
            data: {
              history,
              stats,
              period: { startDate, endDate, days }
            }
          })
        } catch (error) {
          console.error('[Health Monitor] Erro ao obter histórico:', error)

          return response.error({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao obter histórico de saúde',
            status: 500,
          })
        }
      },
    }),

    /**
     * Obtém resumo de saúde de todas as instâncias da organização
     */
    getOrganizationHealthSummary: igniter.query({
      method: 'GET',
      path: '/summary',
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!auth) {
          return response.error({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401,
          })
        }

        try {
          const organizationId = auth.organization?.id

          if (!organizationId) {
            return response.error({
              code: 'BAD_REQUEST',
              message: 'Organization not found',
              status: 400,
            })
          }

          // Buscar métricas mais recentes de cada instância
          const recentMetrics = await context.providers.database.healthMetrics.findMany({
            where: { organizationId },
            orderBy: { analyzedAt: 'desc' },
            distinct: ['instanceName']
          })

          // Calcular resumo geral
          const summary = {
            totalInstances: recentMetrics.length,
            averageHealthScore: recentMetrics.length > 0
              ? recentMetrics.reduce((sum, m) => sum + m.healthScore, 0) / recentMetrics.length
              : 0,
            riskDistribution: {
              LOW: recentMetrics.filter(m => m.riskLevel === 'LOW').length,
              MEDIUM: recentMetrics.filter(m => m.riskLevel === 'MEDIUM').length,
              HIGH: recentMetrics.filter(m => m.riskLevel === 'HIGH').length,
              CRITICAL: recentMetrics.filter(m => m.riskLevel === 'CRITICAL').length
            },
            healthyInstances: recentMetrics.filter(m => m.healthScore >= 80).length,
            criticalInstances: recentMetrics.filter(m => m.riskLevel === 'CRITICAL').length,
            lastAnalysis: recentMetrics[0]?.analyzedAt || null
          }

          // Buscar alertas ativos
          const activeAlerts = await context.providers.database.healthAlerts.findMany({
            where: {
              organizationId,
              isActive: true,
              isResolved: false
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          })

          return response.success({
            success: true,
            data: {
              summary,
              instances: recentMetrics.map(m => ({
                instanceName: m.instanceName,
                healthScore: m.healthScore,
                riskLevel: m.riskLevel,
                lastAnalysis: m.analyzedAt,
                mainIssues: m.riskFactors.slice(0, 3) // Top 3 problemas
              })),
              activeAlerts: activeAlerts.slice(0, 5) // Top 5 alertas
            }
          })
        } catch (error) {
          console.error('[Health Monitor] Erro ao obter resumo:', error)

          return response.error({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao obter resumo de saúde',
            status: 500,
          })
        }
      },
    }),

    /**
     * Obtém alertas ativos para uma instância
     */
    getInstanceAlerts: igniter.query({
      method: 'GET',
      path: '/alerts/:instanceName',
      use: [AuthFeatureProcedure()],
      params: z.object({
        instanceName: z.string().min(1)
      }),
      query: z.object({
        severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
        limit: z.coerce.number().min(1).max(50).default(20)
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!auth) {
          return response.error({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401,
          })
        }

        try {
          const { instanceName } = request.params
          const { severity, limit } = request.query
          const organizationId = auth.organization?.id

          if (!organizationId) {
            return response.error({
              code: 'BAD_REQUEST',
              message: 'Organization not found',
              status: 400,
            })
          }

          const whereClause: any = {
            instanceName,
            organizationId,
            isActive: true
          }

          if (severity) {
            whereClause.severity = severity
          }

          const alerts = await context.providers.database.healthAlerts.findMany({
            where: whereClause,
            orderBy: [
              { severity: 'desc' },
              { createdAt: 'desc' }
            ],
            take: limit
          })

          const alertStats = {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'CRITICAL').length,
            errors: alerts.filter(a => a.severity === 'ERROR').length,
            warnings: alerts.filter(a => a.severity === 'WARNING').length,
            info: alerts.filter(a => a.severity === 'INFO').length
          }

          return response.success({
            success: true,
            data: {
              alerts,
              stats: alertStats
            }
          })
        } catch (error) {
          console.error('[Health Monitor] Erro ao obter alertas:', error)

          return response.error({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao obter alertas',
            status: 500,
          })
        }
      },
    }),

    /**
     * Resolve um alerta específico
     */
    resolveAlert: igniter.mutation({
      method: 'POST',
      path: '/alerts/:alertId/resolve',
      use: [AuthFeatureProcedure()],
      params: z.object({
        alertId: z.string().min(1)
      }),
      body: z.object({
        resolution: z.string().min(1).max(500)
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!auth) {
          return response.error({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401,
          })
        }

        try {
          const { alertId } = request.params
          const { resolution } = request.body
          const organizationId = auth.organization?.id

          if (!organizationId) {
            return response.error({
              code: 'BAD_REQUEST',
              message: 'Organization not found',
              status: 400,
            })
          }

          // Verificar se o alerta pertence à organização
          const alert = await context.providers.database.healthAlerts.findFirst({
            where: {
              id: alertId,
              organizationId
            }
          })

          if (!alert) {
            return response.notFound('Alerta não encontrado')
          }

          // Resolver o alerta
          const resolvedAlert = await context.providers.database.healthAlerts.update({
            where: { id: alertId },
            data: {
              isResolved: true,
              resolvedAt: new Date(),
              resolvedBy: auth.user.id,
              details: {
                ...alert.details,
                resolution
              }
            }
          })

          return response.success({
            success: true,
            message: 'Alerta resolvido com sucesso',
            data: resolvedAlert
          })
        } catch (error) {
          console.error('[Health Monitor] Erro ao resolver alerta:', error)

          return response.error({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao resolver alerta',
            status: 500,
          })
        }
      },
    }),

    /**
     * Obtém recomendações para uma instância
     */
    getInstanceRecommendations: igniter.query({
      method: 'GET',
      path: '/recommendations/:instanceName',
      use: [AuthFeatureProcedure()],
      params: z.object({
        instanceName: z.string().min(1)
      }),
      query: z.object({
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        implemented: z.coerce.boolean().optional()
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!auth) {
          return response.error({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401,
          })
        }

        try {
          const { instanceName } = request.params
          const { priority, implemented } = request.query
          const organizationId = auth.organization?.id

          if (!organizationId) {
            return response.error({
              code: 'BAD_REQUEST',
              message: 'Organization not found',
              status: 400,
            })
          }

          const whereClause: any = {
            instanceName,
            organizationId
          }

          if (priority) {
            whereClause.priority = priority
          }

          if (implemented !== undefined) {
            whereClause.isImplemented = implemented
          }

          const recommendations = await context.providers.database.healthRecommendations.findMany({
            where: whereClause,
            orderBy: [
              { priority: 'desc' },
              { createdAt: 'desc' }
            ]
          })

          return response.success({
            success: true,
            data: recommendations
          })
        } catch (error) {
          console.error('[Health Monitor] Erro ao obter recomendações:', error)

          return response.error({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao obter recomendações',
            status: 500,
          })
        }
      },
    }),

    /**
     * Marca uma recomendação como implementada
     */
    markRecommendationImplemented: igniter.mutation({
      method: 'POST',
      path: '/recommendations/:recommendationId/implement',
      use: [AuthFeatureProcedure()],
      params: z.object({
        recommendationId: z.string().min(1)
      }),
      body: z.object({
        effectiveness: z.number().min(0).max(10).optional(),
        notes: z.string().max(500).optional()
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!auth) {
          return response.error({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401,
          })
        }

        try {
          const { recommendationId } = request.params
          const { effectiveness, notes } = request.body
          const organizationId = auth.organization?.id

          if (!organizationId) {
            return response.error({
              code: 'BAD_REQUEST',
              message: 'Organization not found',
              status: 400,
            })
          }

          // Verificar se a recomendação pertence à organização
          const recommendation = await context.providers.database.healthRecommendations.findFirst({
            where: {
              id: recommendationId,
              organizationId
            }
          })

          if (!recommendation) {
            return response.notFound('Recomendação não encontrada')
          }

          // Marcar como implementada
          const updatedRecommendation = await context.providers.database.healthRecommendations.update({
            where: { id: recommendationId },
            data: {
              isImplemented: true,
              implementedAt: new Date(),
              effectiveness,
              // Adicionar notas aos detalhes existentes se fornecidas
              ...(notes && {
                description: `${recommendation.description}\n\nNotas da implementação: ${notes}`
              })
            }
          })

          return response.success({
            success: true,
            message: 'Recomendação marcada como implementada',
            data: updatedRecommendation
          })
        } catch (error) {
          console.error('[Health Monitor] Erro ao marcar recomendação:', error)

          return response.error({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao marcar recomendação como implementada',
            status: 500,
          })
        }
      },
    })
  },

  // Método auxiliar para calcular tendência
  calculateTrend(history: any[]): 'IMPROVING' | 'DECLINING' | 'STABLE' {
    if (history.length < 2) return 'STABLE'

    const recent = history.slice(0, Math.ceil(history.length / 2))
    const older = history.slice(Math.ceil(history.length / 2))

    const recentAvg = recent.reduce((sum, h) => sum + h.healthScore, 0) / recent.length
    const olderAvg = older.reduce((sum, h) => sum + h.healthScore, 0) / older.length

    const diff = recentAvg - olderAvg

    if (diff > 5) return 'IMPROVING'
    if (diff < -5) return 'DECLINING'
    return 'STABLE'
  }
})