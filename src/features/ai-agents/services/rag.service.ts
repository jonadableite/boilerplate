import { prisma } from '@/providers/prisma'
import {
  RAGService as IRAGService,
  RAGRetrievalInput,
  RAGRetrievalResult,
  AddKnowledgeChunkInput,
  UpdateKnowledgeChunkInput,
} from '../types/services.types'
import { LoggingService } from './logging.service'
import { OpenAI } from 'openai'

export class RAGService implements IRAGService {
  private loggingService: LoggingService
  private openai: OpenAI

  constructor() {
    this.loggingService = new LoggingService()
    // Inicializar OpenAI com chave padrão (pode ser sobrescrita por agente)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async retrieveRelevantChunks(
    input: RAGRetrievalInput,
  ): Promise<RAGRetrievalResult> {
    try {
      const { agentId, query, limit = 5, threshold = 0.7 } = input

      // Buscar agente para obter credenciais OpenAI se necessário
      const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
        include: {
          openaiCreds: true,
        },
      })

      if (!agent) {
        throw new Error('Agent not found')
      }

      // Usar credenciais específicas do agente se disponível
      const openaiClient = agent.openaiCreds?.apiKey
        ? new OpenAI({ apiKey: agent.openaiCreds.apiKey })
        : this.openai

      // Gerar embedding da query
      const queryEmbedding = await this.generateEmbedding(query, openaiClient)

      // Buscar chunks de conhecimento do agente
      const knowledgeChunks = await prisma.knowledgeChunk.findMany({
        where: {
          agentId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Calcular similaridade e filtrar
      const chunksWithSimilarity = knowledgeChunks
        .map((chunk) => {
          const chunkEmbedding = chunk.embedding as number[] | null
          if (!chunkEmbedding) {
            return null
          }

          const similarity = this.calculateCosineSimilarity(
            queryEmbedding,
            chunkEmbedding,
          )

          return {
            id: chunk.id,
            content: chunk.content,
            score: similarity, // Usar score em vez de similarity
            sourceId: chunk.fileId, // Usar fileId como sourceId
            metadata: chunk.metadata as Record<string, any> | undefined, // metadata é opcional
          }
        })
        .filter((chunk) => chunk !== null && chunk.score >= threshold)
        .sort((a, b) => b!.score - a!.score)
        .slice(0, limit)
        .map((chunk) => chunk!)

      await this.loggingService.logInfo({
        organizationId: agent.organizationId,
        agentId,
        message: `Retrieved ${chunksWithSimilarity.length} relevant knowledge chunks`,
        metadata: {
          query,
          totalChunks: knowledgeChunks.length,
          retrievedChunks: chunksWithSimilarity.length,
          threshold,
        },
      })

      return {
        chunks: chunksWithSimilarity,
        totalFound: chunksWithSimilarity.length,
      }
    } catch (error) {
      await this.loggingService.logError({
        organizationId: '', // Será preenchido se possível
        agentId: input.agentId,
        message: 'Failed to retrieve relevant chunks',
        error: error as Error,
      })
      throw error
    }
  }

  async addKnowledgeChunk(input: AddKnowledgeChunkInput): Promise<string> {
    try {
      const { agentId, content, sourceId, metadata } = input

      // Buscar agente para obter credenciais
      const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
        include: {
          openaiCreds: true,
        },
      })

      if (!agent) {
        throw new Error('Agent not found')
      }

      // Usar credenciais específicas do agente se disponível
      const openaiClient = agent.openaiCreds?.apiKey
        ? new OpenAI({ apiKey: agent.openaiCreds.apiKey })
        : this.openai

      // Gerar embedding do conteúdo
      const embedding = await this.generateEmbedding(content, openaiClient)

      // Criar chunk de conhecimento
      const chunk = await prisma.knowledgeChunk.create({
        data: {
          agentId,
          content,
          fileId: sourceId, // Usar fileId em vez de sourceId
          embedding,
          metadata: metadata || {},
          organizationId: agent.organizationId, // Adicionar organizationId obrigatório
        },
      })

      await this.loggingService.logInfo({
        organizationId: agent.organizationId,
        agentId,
        message: 'Added new knowledge chunk',
        metadata: {
          chunkId: chunk.id,
          sourceId,
          contentLength: content.length,
        },
      })

      return chunk.id
    } catch (error) {
      await this.loggingService.logError({
        organizationId: '', // Será preenchido se possível
        agentId: input.agentId,
        message: 'Failed to add knowledge chunk',
        error: error as Error,
      })
      throw error
    }
  }

  async updateKnowledgeChunk(input: UpdateKnowledgeChunkInput): Promise<void> {
    try {
      const { id: chunkId, content, metadata } = input

      // Buscar chunk existente
      const existingChunk = await prisma.knowledgeChunk.findUnique({
        where: { id: chunkId },
        include: {
          agent: {
            include: {
              openaiCreds: true,
            },
          },
        },
      })

      if (!existingChunk) {
        throw new Error('Knowledge chunk not found')
      }

      const updateData: any = {}

      // Se o conteúdo mudou, regenerar embedding
      if (content && content !== existingChunk.content) {
        const openaiClient = existingChunk.agent.openaiCreds?.apiKey
          ? new OpenAI({ apiKey: existingChunk.agent.openaiCreds.apiKey })
          : this.openai

        updateData.content = content
        updateData.embedding = await this.generateEmbedding(
          content,
          openaiClient,
        )
      }

      // Atualizar metadata se fornecida
      if (metadata) {
        updateData.metadata = metadata
      }

      // Atualizar chunk
      await prisma.knowledgeChunk.update({
        where: { id: chunkId },
        data: updateData,
      })

      await this.loggingService.logInfo({
        organizationId: existingChunk.agent.organizationId,
        agentId: existingChunk.agentId,
        message: 'Updated knowledge chunk',
        metadata: {
          chunkId,
          contentUpdated: !!content,
          metadataUpdated: !!metadata,
        },
      })
    } catch (error) {
      await this.loggingService.logError({
        organizationId: '', // Será preenchido se possível
        message: 'Failed to update knowledge chunk',
        error: error as Error,
        metadata: {
          chunkId: input.id,
        },
      })
      throw error
    }
  }

  async deleteKnowledgeChunk(chunkId: string): Promise<void> {
    try {
      // Buscar chunk para logging
      const chunk = await prisma.knowledgeChunk.findUnique({
        where: { id: chunkId },
        include: {
          agent: true,
        },
      })

      if (!chunk) {
        throw new Error('Knowledge chunk not found')
      }

      // Deletar chunk
      await prisma.knowledgeChunk.delete({
        where: { id: chunkId },
      })

      await this.loggingService.logInfo({
        organizationId: chunk.agent.organizationId,
        agentId: chunk.agentId,
        message: 'Deleted knowledge chunk',
        metadata: {
          chunkId,
          sourceId: chunk.fileId, // Usar fileId como sourceId
        },
      })
    } catch (error) {
      await this.loggingService.logError({
        organizationId: '', // Será preenchido se possível
        message: 'Failed to delete knowledge chunk',
        error: error as Error,
        metadata: {
          chunkId,
        },
      })
      throw error
    }
  }

  async getKnowledgeChunks(input: {
    agentId: string
    sourceId?: string
    limit?: number
    offset?: number
  }): Promise<{
    chunks: Array<{
      id: string
      content: string
      sourceId: string
      metadata: Record<string, any> | null
      createdAt: Date
    }>
    total: number
  }> {
    try {
      const { agentId, sourceId, limit = 50, offset = 0 } = input

      const where: any = {
        agentId,
      }

      if (sourceId) {
        where.fileId = sourceId // Usar fileId em vez de sourceId
      }

      const [chunks, total] = await Promise.all([
        prisma.knowledgeChunk.findMany({
          where,
          select: {
            id: true,
            content: true,
            fileId: true, // Usar fileId em vez de sourceId
            metadata: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        prisma.knowledgeChunk.count({ where }),
      ])

      return {
        chunks: chunks.map((chunk) => ({
          ...chunk,
          sourceId: chunk.fileId, // Mapear fileId para sourceId na resposta
          metadata: chunk.metadata as Record<string, any> | null,
        })),
        total,
      }
    } catch (error) {
      await this.loggingService.logError({
        organizationId: '', // Será preenchido se possível
        agentId: input.agentId,
        message: 'Failed to get knowledge chunks',
        error: error as Error,
      })
      throw error
    }
  }

  // Métodos auxiliares privados
  private async generateEmbedding(
    text: string,
    openaiClient: OpenAI,
  ): Promise<number[]> {
    try {
      const response = await openaiClient.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      })

      return response.data[0].embedding
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error}`)
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }
}