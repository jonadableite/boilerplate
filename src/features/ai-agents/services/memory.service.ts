import { prisma } from "@/providers/prisma";
import {
  SaveConversationInput,
  GetConversationHistoryInput,
  GetConversationHistoryResult,
  ClearConversationInput,
  ConversationMessage,
} from "../types/services.types";
import { MessageRole, MemoryType } from "../types/ai-agent.types";
import { LoggingService } from "./logging.service";

export class MemoryService {
  private loggingService: LoggingService;

  constructor() {
    this.loggingService = new LoggingService();
  }

  async saveConversation(input: SaveConversationInput): Promise<void> {
    try {
      const { agentId, sessionId, messages, organizationId } = input;

      // Salvar cada mensagem no histórico usando o schema atual
      for (const message of messages) {
        await prisma.aIAgentMemory.create({
          data: {
            agentId,
            remoteJid: sessionId, // Usando remoteJid como sessionId
            type: "conversation",
            role: message.role,
            content: message.content,
            metadata: {
              messageId: message.id,
              tokens: message.tokens,
              timestamp: message.timestamp || new Date(),
              organizationId,
              ...message.metadata,
            },
          },
        });
      }

      await this.loggingService.logInfo({
        organizationId,
        agentId,
        sessionId,
        message: `Saved ${messages.length} messages to conversation history`,
        metadata: {
          messageCount: messages.length,
        },
      });
    } catch (error) {
      await this.loggingService.logError({
        organizationId: input.organizationId,
        agentId: input.agentId,
        sessionId: input.sessionId,
        message: "Failed to save conversation",
        error: error instanceof Error ? error : undefined,
      });
      throw error;
    }
  }

  async getConversationHistory(
    input: GetConversationHistoryInput,
  ): Promise<GetConversationHistoryResult> {
    try {
      const {
        agentId,
        sessionId,
        organizationId,
        limit = 50,
        offset = 0,
        includeMetadata = false,
      } = input;

      const where: any = {
        agentId,
        organizationId,
        type: "conversation",
      };

      if (sessionId) {
        where.remoteJid = sessionId;
      }

      // Buscar mensagens ordenadas por data de criação
      const memories = await prisma.aIAgentMemory.findMany({
        where: {
          remoteJid: sessionId,
          agent: {
            organizationId: input.organizationId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit || 50,
      });

      // Contar total de mensagens
      const total = await prisma.aIAgentMemory.count({ where });

      // Converter para formato de mensagens
      const messages: ConversationMessage[] = memories
        .reverse() // Reverter para ordem cronológica
        .map((memory) => {
          const metadata = memory.metadata as Record<string, any> | null;
          return {
            id: (metadata?.messageId as string) || memory.id,
            role: memory.role as MessageRole,
            content: memory.content as string,
            timestamp: metadata?.timestamp
              ? new Date(metadata.timestamp as string)
              : memory.createdAt,
            tokens: (metadata?.tokens as number) || 0,
            metadata: includeMetadata 
              ? (metadata as Record<string, any> | undefined) 
              : undefined,
          };
        });

      return {
        messages,
        total,
        hasMore: offset + messages.length < total,
      };
    } catch (error) {
      await this.loggingService.logError({
        organizationId: input.organizationId,
        agentId: input.agentId,
        sessionId: input.sessionId,
        message: "Failed to get conversation history",
        error: error instanceof Error ? error : undefined,
      });
      throw error;
    }
  }

  async clearConversation(input: ClearConversationInput): Promise<void> {
    try {
      const { agentId, sessionId, organizationId, olderThan } = input;

      const where: any = {
        agentId,
        organizationId,
        type: "conversation",
      };

      if (sessionId) {
        where.remoteJid = sessionId;
      }

      if (olderThan) {
        where.createdAt = {
          lt: olderThan,
        };
      }

      const deletedCount = await prisma.aIAgentMemory.deleteMany({ where });

      await this.loggingService.logInfo({
        organizationId,
        agentId,
        sessionId,
        message: `Cleared ${deletedCount.count} conversation messages`,
        metadata: {
          deletedCount: deletedCount.count,
          olderThan: olderThan?.toISOString(),
        },
      });
    } catch (error) {
      await this.loggingService.logError({
        organizationId: input.organizationId,
        agentId: input.agentId,
        sessionId: input.sessionId,
        message: "Failed to clear conversation",
        error: error instanceof Error ? error : undefined,
      });
      throw error;
    }
  }

  async getSessionSummary(input: {
    agentId: string;
    sessionId: string;
    organizationId: string;
  }): Promise<{
    messageCount: number;
    firstMessage?: Date;
    lastMessage?: Date;
    totalTokens: number;
  }> {
    try {
      const { agentId, sessionId, organizationId } = input;

      const [stats, firstMessage, lastMessage] = await Promise.all([
        // Contagem de mensagens
        prisma.aIAgentMemory.count({
          where: {
            agentId,
            remoteJid: sessionId,
            agent: {
              organizationId,
            },
            type: MemoryType.CONVERSATION,
          },
        }),

        // Primeira mensagem
        prisma.aIAgentMemory.findFirst({
          where: {
            agentId,
            remoteJid: sessionId,
            agent: {
              organizationId,
            },
            type: MemoryType.CONVERSATION,
          },
          orderBy: {
            createdAt: "asc",
          },
        }),

        // Última mensagem
        prisma.aIAgentMemory.findFirst({
          where: {
            agentId,
            remoteJid: sessionId,
            agent: {
              organizationId,
            },
            type: MemoryType.CONVERSATION,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
      ]);

      // Calcular total de tokens
      const memories = await prisma.aIAgentMemory.findMany({
        where: {
          agentId,
          remoteJid: sessionId,
          agent: {
            organizationId,
          },
          type: MemoryType.CONVERSATION,
        },
        select: {
          metadata: true,
        },
      });

      const totalTokens = memories.reduce((sum, memory) => {
        const metadata = memory.metadata as Record<string, any> | null;
        const tokens = (metadata?.tokens as number) || 0;
        return sum + tokens;
      }, 0);

      return {
        messageCount: stats || 0,
        firstMessage: firstMessage?.createdAt,
        lastMessage: lastMessage?.createdAt,
        totalTokens,
      };
    } catch (error) {
      await this.loggingService.logError({
        organizationId: input.organizationId,
        agentId: input.agentId,
        sessionId: input.sessionId,
        message: "Failed to get session summary",
        error: error instanceof Error ? error : undefined,
      });
      throw error;
    }
  }

  async getRecentSessions(input: {
    agentId: string;
    organizationId: string;
    limit?: number;
  }): Promise<
    Array<{
      sessionId: string;
      messageCount: number;
      lastActivity: Date;
      totalTokens: number;
    }>
  > {
    try {
      const { agentId, organizationId, limit = 10 } = input;

      // Buscar sessões recentes
      const sessions = await prisma.$queryRaw<
        Array<{
          session_id: string;
          message_count: number;
          last_activity: Date;
          total_tokens: number;
        }>
      >`
        SELECT
          session_id,
          COUNT(*) as message_count,
          MAX(created_at) as last_activity,
          COALESCE(SUM(CAST(metadata->>'tokens' AS INTEGER)), 0) as total_tokens
        FROM ai_agent_memory
        WHERE agent_id = ${agentId}
          AND organization_id = ${organizationId}
          AND type = ${MemoryType.CONVERSATION}
          AND session_id IS NOT NULL
        GROUP BY session_id
        ORDER BY last_activity DESC
        LIMIT ${limit}
      `;

      return sessions.map((session) => ({
        sessionId: session.session_id,
        messageCount: Number(session.message_count),
        lastActivity: session.last_activity,
        totalTokens: Number(session.total_tokens),
      }));
    } catch (error) {
      await this.loggingService.logError({
        organizationId: input.organizationId,
        agentId: input.agentId,
        message: "Failed to get recent sessions",
        error: error instanceof Error ? error : undefined,
      });
      throw error;
    }
  }

  async pruneOldConversations(input: {
    agentId?: string;
    organizationId: string;
    olderThanDays: number;
  }): Promise<number> {
    try {
      const { agentId, organizationId, olderThanDays } = input;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const where: any = {
        organizationId,
        type: MemoryType.CONVERSATION,
        createdAt: {
          lt: cutoffDate,
        },
      };

      if (agentId) {
        where.agentId = agentId;
      }

      const result = await prisma.aIAgentMemory.deleteMany({ where });

      await this.loggingService.logInfo({
        organizationId,
        agentId,
        message: `Pruned ${result.count} old conversation messages`,
        metadata: {
          deletedCount: result.count,
          olderThanDays,
          cutoffDate: cutoffDate.toISOString(),
        },
      });

      return result.count;
    } catch (error) {
      await this.loggingService.logError({
        organizationId: input.organizationId,
        agentId: input.agentId,
        message: "Failed to prune old conversations",
        error: error instanceof Error ? error : undefined,
      });
      throw error;
    }
  }
}
