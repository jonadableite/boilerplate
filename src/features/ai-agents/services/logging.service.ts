import { prisma } from '@/providers/prisma'
import {
  CreateLogEntryInput,
  GetLogsInput,
  GetLogsResult,
} from '../types/services.types'

// Define LogLevel inline to avoid import issues
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export class LoggingService {
  async createLogEntry(input: CreateLogEntryInput): Promise<void> {
    try {
      await prisma.aIAgentLog.create({
        data: {
          organizationId: input.organizationId,
          agentId: input.agentId,
          sessionId: input.sessionId,
          level: input.level,
          message: input.message,
          metadata: input.metadata || {},
          error: input.error
            ? {
                name: input.error.name,
                message: input.error.message,
                stack: input.error.stack,
              }
            : undefined,
        },
      })
    } catch (error) {
      // Falha silenciosa para evitar loops de erro
      console.error('Failed to create log entry:', error)
    }
  }

  async getLogs(input: GetLogsInput): Promise<GetLogsResult> {
    try {
      const {
        organizationId,
        agentId,
        sessionId,
        level,
        startDate,
        endDate,
        limit = 100,
        offset = 0,
      } = input

      const where: any = {
        organizationId,
      }

      if (agentId) {
        where.agentId = agentId
      }

      if (sessionId) {
        where.sessionId = sessionId
      }

      if (level) {
        where.level = level
      }

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) {
          where.createdAt.gte = startDate
        }
        if (endDate) {
          where.createdAt.lte = endDate
        }
      }

      const [logs, total] = await Promise.all([
        prisma.aIAgentLog.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        prisma.aIAgentLog.count({ where }),
      ])

      return {
        logs,
        total,
        hasMore: offset + logs.length < total,
      }
    } catch (error) {
      console.error('Failed to get logs:', error)
      return {
        logs: [],
        total: 0,
        hasMore: false,
      }
    }
  }

  // Métodos de conveniência para diferentes níveis de log
  async logInfo(input: {
    organizationId: string
    agentId?: string
    sessionId?: string
    message: string
    metadata?: Record<string, any>
  }): Promise<void> {
    await this.createLogEntry({
      ...input,
      level: LogLevel.INFO,
    })
  }

  async logWarning(input: {
    organizationId: string
    agentId?: string
    sessionId?: string
    message: string
    metadata?: Record<string, any>
  }): Promise<void> {
    await this.createLogEntry({
      ...input,
      level: LogLevel.WARNING,
    })
  }

  async logError(input: {
    organizationId: string
    agentId?: string
    sessionId?: string
    message: string
    error?: Error
    metadata?: Record<string, any>
  }): Promise<void> {
    await this.createLogEntry({
      ...input,
      level: LogLevel.ERROR,
    })
  }

  async logDebug(input: {
    organizationId: string
    agentId?: string
    sessionId?: string
    message: string
    metadata?: Record<string, any>
  }): Promise<void> {
    await this.createLogEntry({
      ...input,
      level: LogLevel.DEBUG,
    })
  }

  // Limpeza de logs antigos
  async pruneLogs(input: {
    organizationId: string
    olderThanDays: number
    level?: LogLevel
  }): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays)

      const where: any = {
        organizationId: input.organizationId,
        createdAt: {
          lt: cutoffDate,
        },
      }

      if (input.level) {
        where.level = input.level
      }

      const result = await prisma.aIAgentLog.deleteMany({ where })

      await this.logInfo({
        organizationId: input.organizationId,
        message: `Pruned ${result.count} log entries`,
        metadata: {
          deletedCount: result.count,
          olderThanDays: input.olderThanDays,
          level: input.level,
        },
      })

      return result.count
    } catch (error) {
      console.error('Failed to prune logs:', error)
      return 0
    }
  }

  // Estatísticas de logs
  async getLogStats(input: {
    organizationId: string
    agentId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<{
    totalLogs: number
    logsByLevel: Record<LogLevel, number>
    errorRate: number
  }> {
    try {
      const where: any = {
        organizationId: input.organizationId,
      }

      if (input.agentId) {
        where.agentId = input.agentId
      }

      if (input.startDate || input.endDate) {
        where.createdAt = {}
        if (input.startDate) {
          where.createdAt.gte = input.startDate
        }
        if (input.endDate) {
          where.createdAt.lte = input.endDate
        }
      }

      const [totalLogs, logsByLevel] = await Promise.all([
        prisma.aIAgentLog.count({ where }),
        prisma.aIAgentLog.groupBy({
          by: ['level'],
          where,
          _count: {
            id: true,
          },
        }),
      ])

      const levelCounts: Record<LogLevel, number> = {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARNING]: 0,
        [LogLevel.ERROR]: 0,
      }

      logsByLevel.forEach((item) => {
        levelCounts[item.level as LogLevel] = item._count.id
      })

      const errorCount = levelCounts[LogLevel.ERROR]
      const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0

      return {
        totalLogs,
        logsByLevel: levelCounts,
        errorRate,
      }
    } catch (error) {
      console.error('Failed to get log stats:', error)
      return {
        totalLogs: 0,
        logsByLevel: {
          [LogLevel.DEBUG]: 0,
          [LogLevel.INFO]: 0,
          [LogLevel.WARNING]: 0,
          [LogLevel.ERROR]: 0,
        },
        errorRate: 0,
      }
    }
  }
}