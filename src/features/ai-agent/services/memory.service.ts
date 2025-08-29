import { OpenAIService, ChatMessage } from './openai.service'
import { KnowledgeBaseService } from './knowledge-base.service'
import { AgentMemory, MemoryType, KnowledgeChunk } from '../ai-agent.types'

export interface ThreadContext {
  threadId: string
  agentId: string
  remoteJid: string
  conversationId?: string
  lastActivity: Date
  messageCount: number
  summary?: string
  metadata?: Record<string, any>
}

export interface MemorySearchResult {
  memories: AgentMemory[]
  summary?: string
  relevantContext: string
}

export interface CreateMemoryInput {
  agentId: string
  remoteJid: string
  conversationId?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type: MemoryType
  metadata?: Record<string, any>
}

export interface SearchMemoryInput {
  agentId: string
  remoteJid?: string
  conversationId?: string
  query?: string
  type?: MemoryType
  limit?: number
  includeContext?: boolean
}

export interface ThreadSummaryInput {
  threadId: string
  maxMessages?: number
  includeSystemMessages?: boolean
}

/**
 * Serviço de memória persistente que integra threads da OpenAI
 * com o sistema de conversas e mensagens do WhatsApp
 */
export class MemoryService {
  private openaiService: OpenAIService
  private knowledgeBase: KnowledgeBaseService
  private threads: Map<string, ThreadContext> = new Map()
  private memoryCache: Map<string, AgentMemory[]> = new Map()
  private knowledgeChunksCache: Map<string, KnowledgeChunk[]> = new Map()
  private readonly MAX_THREAD_MESSAGES = 50
  private readonly MEMORY_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  constructor(
    openaiService: OpenAIService,
    knowledgeBase: KnowledgeBaseService,
  ) {
    this.openaiService = openaiService
    this.knowledgeBase = knowledgeBase
  }

  /**
   * Cria ou recupera um thread para uma conversa específica
   */
  async getOrCreateThread(
    agentId: string,
    remoteJid: string,
    conversationId?: string,
  ): Promise<string> {
    const threadKey = `${agentId}:${remoteJid}`
    let threadContext = this.threads.get(threadKey)

    if (!threadContext) {
      // Recuperar mensagens recentes da conversa
      const recentMemories = await this.searchMemory({
        agentId,
        remoteJid,
        conversationId,
        limit: 10,
        type: MemoryType.SHORT_TERM,
      })

      // Converter memórias para mensagens do thread
      const contextMessages: ChatMessage[] = recentMemories.memories.map(
        (memory) => ({
          role: memory.role as 'user' | 'assistant' | 'system',
          content: memory.content,
        }),
      )

      // Criar novo thread na OpenAI
      const threadId = await this.openaiService.createThread(contextMessages)

      threadContext = {
        threadId,
        agentId,
        remoteJid,
        conversationId,
        lastActivity: new Date(),
        messageCount: contextMessages.length,
        metadata: {},
      }

      this.threads.set(threadKey, threadContext)
    } else {
      // Atualizar última atividade
      threadContext.lastActivity = new Date()
    }

    return threadContext.threadId
  }

  /**
   * Adiciona uma mensagem ao thread e salva na memória
   */
  async addMessageToThread(
    agentId: string,
    remoteJid: string,
    role: 'user' | 'assistant',
    content: string,
    conversationId?: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    try {
      // Obter ou criar thread
      const threadId = await this.getOrCreateThread(
        agentId,
        remoteJid,
        conversationId,
      )

      // Adicionar mensagem ao thread da OpenAI
      const messageId = await this.openaiService.addMessageToThread(
        threadId,
        role,
        content,
      )

      // Salvar na memória local
      await this.createMemory({
        agentId,
        remoteJid,
        conversationId,
        role,
        content,
        type: MemoryType.SHORT_TERM,
        metadata: {
          ...metadata,
          threadId,
          messageId,
          timestamp: new Date().toISOString(),
        },
      })

      // Atualizar contexto do thread
      const threadKey = `${agentId}:${remoteJid}`
      const threadContext = this.threads.get(threadKey)
      if (threadContext) {
        threadContext.messageCount++
        threadContext.lastActivity = new Date()

        // Se o thread está ficando muito longo, criar resumo
        if (threadContext.messageCount > this.MAX_THREAD_MESSAGES) {
          await this.summarizeAndArchiveThread(threadContext)
        }
      }

      // Limpar cache de memória
      this.clearMemoryCache(agentId, remoteJid)

      return messageId
    } catch (error) {
      console.error(
        '[Memory Service] Erro ao adicionar mensagem ao thread:',
        error,
      )
      throw error
    }
  }

  /**
   * Cria uma nova memória
   */
  async createMemory(input: CreateMemoryInput): Promise<AgentMemory> {
    const memory: AgentMemory = {
      id: this.generateId(),
      agentId: input.agentId,
      remoteJid: input.remoteJid,
      type: input.type,
      role: input.role,
      content: input.content,
      metadata: {
        ...input.metadata,
        conversationId: input.conversationId,
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    }

    // Aqui você salvaria no banco de dados
    // Por enquanto, vamos simular o armazenamento
    console.log('[Memory Service] Memória criada:', memory.id)

    // Limpar cache
    this.clearMemoryCache(input.agentId, input.remoteJid)

    return memory
  }

  /**
   * Busca memórias com base nos critérios fornecidos
   */
  async searchMemory(input: SearchMemoryInput): Promise<MemorySearchResult> {
    const cacheKey = `${input.agentId}:${input.remoteJid || 'all'}:${
      input.type || 'all'
    }`

    // Verificar cache
    if (this.memoryCache.has(cacheKey)) {
      const cachedMemories = this.memoryCache.get(cacheKey)!
      return {
        memories: cachedMemories.slice(0, input.limit || 20),
        relevantContext: this.buildContextFromMemories(cachedMemories),
      }
    }

    // Simular busca no banco de dados
    // Aqui você implementaria a busca real no banco
    const mockMemories: AgentMemory[] = []

    // Se incluir contexto, buscar também na base de conhecimento
    let relevantContext = ''
    if (input.includeContext && input.query) {
      try {
        // Obter chunks de conhecimento do agente (simulado)
        const knowledgeChunks = this.getKnowledgeChunksForAgent(input.agentId)

        // Buscar chunks similares
        const similarChunks = await this.knowledgeBase.searchSimilarChunks(
          input.query,
          knowledgeChunks,
          5,
        )
        relevantContext = similarChunks
          .map((chunk) => chunk.content)
          .join('\n\n')
      } catch (error) {
        console.error('[Memory Service] Erro ao buscar contexto:', error)
      }
    }

    // Cache do resultado
    this.memoryCache.set(cacheKey, mockMemories)
    setTimeout(() => this.memoryCache.delete(cacheKey), this.MEMORY_CACHE_TTL)

    return {
      memories: mockMemories.slice(0, input.limit || 20),
      relevantContext:
        relevantContext || this.buildContextFromMemories(mockMemories),
    }
  }

  /**
   * Resume um thread e arquiva mensagens antigas
   */
  async summarizeAndArchiveThread(threadContext: ThreadContext): Promise<void> {
    try {
      // Obter mensagens do thread
      const messages = await this.openaiService.getThreadMessages(
        threadContext.threadId,
      )

      // Criar resumo
      const summary = await this.openaiService.summarizeConversation(messages)

      // Salvar resumo como memória de longo prazo
      await this.createMemory({
        agentId: threadContext.agentId,
        remoteJid: threadContext.remoteJid,
        conversationId: threadContext.conversationId,
        role: 'system',
        content: summary,
        type: MemoryType.LONG_TERM,
        metadata: {
          originalThreadId: threadContext.threadId,
          messageCount: threadContext.messageCount,
          timespan: {
            start: threadContext.metadata?.createdAt,
            end: new Date().toISOString(),
          },
        },
      })

      // Criar novo thread para continuar a conversa
      const newThreadId = await this.openaiService.createThread([
        {
          role: 'system',
          content: `Resumo da conversa anterior: ${summary}`,
        },
      ])

      // Atualizar contexto
      threadContext.threadId = newThreadId
      threadContext.messageCount = 1
      threadContext.summary = summary
      threadContext.lastActivity = new Date()

      console.log(
        '[Memory Service] Thread resumido e arquivado:',
        threadContext.threadId,
      )
    } catch (error) {
      console.error('[Memory Service] Erro ao resumir thread:', error)
      throw error
    }
  }

  /**
   * Obtém o contexto completo para um agente e conversa
   */
  async getContextualMemory(
    agentId: string,
    remoteJid: string,
    query?: string,
    conversationId?: string,
  ): Promise<MemorySearchResult> {
    // Buscar memórias de curto prazo (mensagens recentes)
    const shortTermMemories = await this.searchMemory({
      agentId,
      remoteJid,
      conversationId,
      type: MemoryType.SHORT_TERM,
      limit: 10,
    })

    // Buscar memórias de longo prazo (resumos)
    const longTermMemories = await this.searchMemory({
      agentId,
      remoteJid,
      conversationId,
      type: MemoryType.LONG_TERM,
      limit: 3,
    })

    // Buscar na base de conhecimento se houver query
    let knowledgeContext = ''
    if (query) {
      try {
        // Obter chunks de conhecimento do agente (simulado)
        const knowledgeChunks = this.getKnowledgeChunksForAgent(agentId)

        // Buscar chunks similares
        const similarChunks = await this.knowledgeBase.searchSimilarChunks(
          query,
          knowledgeChunks,
          5,
        )
        knowledgeContext = similarChunks
          .map((chunk) => chunk.content)
          .join('\n\n')
      } catch (error) {
        console.error(
          '[Memory Service] Erro ao buscar base de conhecimento:',
          error,
        )
      }
    }

    // Combinar todas as memórias
    const allMemories = [
      ...longTermMemories.memories,
      ...shortTermMemories.memories,
    ]
    const combinedContext = [
      longTermMemories.relevantContext,
      shortTermMemories.relevantContext,
      knowledgeContext,
    ]
      .filter(Boolean)
      .join('\n\n---\n\n')

    return {
      memories: allMemories,
      relevantContext: combinedContext,
    }
  }

  /**
   * Limpa threads inativos
   */
  async cleanupInactiveThreads(
    maxAge: number = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const now = new Date()
    const threadsToRemove: string[] = []

    for (const [key, context] of this.threads.entries()) {
      const age = now.getTime() - context.lastActivity.getTime()
      if (age > maxAge) {
        // Resumir thread antes de remover
        try {
          await this.summarizeAndArchiveThread(context)
          threadsToRemove.push(key)
        } catch (error) {
          console.error('[Memory Service] Erro ao limpar thread:', key, error)
        }
      }
    }

    // Remover threads processados
    threadsToRemove.forEach((key) => this.threads.delete(key))

    console.log(
      `[Memory Service] ${threadsToRemove.length} threads inativos limpos`,
    )
  }

  /**
   * Obtém estatísticas de memória
   */
  getMemoryStats(): {
    activeThreads: number
    cachedMemories: number
    oldestThread?: Date
    newestThread?: Date
  } {
    const threadContexts = Array.from(this.threads.values())
    const activities = threadContexts.map((ctx) => ctx.lastActivity)

    return {
      activeThreads: this.threads.size,
      cachedMemories: this.memoryCache.size,
      oldestThread:
        activities.length > 0
          ? new Date(Math.min(...activities.map((d) => d.getTime())))
          : undefined,
      newestThread:
        activities.length > 0
          ? new Date(Math.max(...activities.map((d) => d.getTime())))
          : undefined,
    }
  }

  // Métodos auxiliares privados
  private buildContextFromMemories(memories: AgentMemory[]): string {
    return memories
      .filter((memory) => memory.role !== 'system')
      .map((memory) => `${memory.role}: ${memory.content}`)
      .join('\n')
  }

  private clearMemoryCache(agentId: string, remoteJid: string): void {
    const keysToDelete = Array.from(this.memoryCache.keys()).filter(
      (key) =>
        key.startsWith(`${agentId}:${remoteJid}`) ||
        key.startsWith(`${agentId}:all`),
    )

    keysToDelete.forEach((key) => this.memoryCache.delete(key))
  }

  /**
   * Método auxiliar para simular a obtenção de chunks de conhecimento para um agente
   * Em uma implementação real, isso buscaria do banco de dados
   */
  private getKnowledgeChunksForAgent(agentId: string): KnowledgeChunk[] {
    // Verificar cache
    if (this.knowledgeChunksCache.has(agentId)) {
      return this.knowledgeChunksCache.get(agentId)!
    }

    // Simular chunks de conhecimento
    const mockChunks: KnowledgeChunk[] = [
      {
        id: `chunk_${this.generateId()}`,
        agentId,
        sourceId: 'source_1',
        content:
          'Informação sobre o produto X. Características principais incluem...',
        embedding: Array(1536)
          .fill(0)
          .map(() => Math.random() - 0.5),
        createdAt: new Date(),
      },
      {
        id: `chunk_${this.generateId()}`,
        agentId,
        sourceId: 'source_2',
        content: 'FAQ sobre o serviço Y. Perguntas frequentes incluem...',
        embedding: Array(1536)
          .fill(0)
          .map(() => Math.random() - 0.5),
        createdAt: new Date(),
      },
    ]

    // Salvar no cache
    this.knowledgeChunksCache.set(agentId, mockChunks)

    return mockChunks
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
