import { VectorStoreStatus, FileStatus } from '../ai-agent.types'
import { KnowledgeBaseService } from './knowledge-base.service'

export interface VectorStoreFile {
  id: string
  vectorStoreId: string
  fileId: string
  filename: string
  status: FileStatus
  bytes: number
  createdAt: Date
  metadata?: Record<string, any>
}

export interface VectorStoreSearchResult {
  content: string
  score: number
  metadata: Record<string, any>
  fileId?: string
  filename?: string
}

export interface CreateVectorStoreInput {
  name: string
  organizationId: string
  agentId?: string
  description?: string
  expiresAfterDays?: number
}

export interface UploadFileToVectorStoreInput {
  vectorStoreId: string
  file: Buffer | File
  filename: string
  metadata?: Record<string, any>
}

export interface SearchVectorStoreInput {
  vectorStoreId: string
  query: string
  topK?: number
  filter?: Record<string, any>
}

export interface SimpleVectorStore {
  id: string
  name: string
  status: VectorStoreStatus
  organizationId: string
  agentId?: string
  description?: string
  fileCount: number
  createdAt: Date
  expiresAt?: Date
}

/**
 * Serviço para gerenciar Vector Stores integrado com KnowledgeBaseService
 * Combina funcionalidades locais de embeddings com armazenamento estruturado
 */
export class VectorStoreService {
  private knowledgeBase: KnowledgeBaseService
  private vectorStores: Map<string, SimpleVectorStore> = new Map()
  private vectorStoreFiles: Map<string, VectorStoreFile[]> = new Map()

  constructor(apiKey: string) {
    this.knowledgeBase = new KnowledgeBaseService(apiKey)
  }

  /**
   * Criar um novo vector store
   */
  async createVectorStore(
    input: CreateVectorStoreInput,
  ): Promise<SimpleVectorStore> {
    try {
      const vectorStoreId = `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const vectorStore: SimpleVectorStore = {
        id: vectorStoreId,
        name: input.name,
        status: VectorStoreStatus.COMPLETED,
        organizationId: input.organizationId,
        agentId: input.agentId,
        description: input.description,
        fileCount: 0,
        createdAt: new Date(),
        expiresAt: input.expiresAfterDays
          ? new Date(Date.now() + input.expiresAfterDays * 24 * 60 * 60 * 1000)
          : undefined,
      }

      this.vectorStores.set(vectorStoreId, vectorStore)
      this.vectorStoreFiles.set(vectorStoreId, [])

      return vectorStore
    } catch (error) {
      console.error('[Vector Store Service] Erro ao criar vector store:', error)
      throw new Error(
        `Falha ao criar vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Listar vector stores de uma organização
   */
  async listVectorStores(organizationId: string): Promise<SimpleVectorStore[]> {
    try {
      return Array.from(this.vectorStores.values()).filter(
        (vs) => vs.organizationId === organizationId,
      )
    } catch (error) {
      console.error(
        '[Vector Store Service] Erro ao listar vector stores:',
        error,
      )
      throw new Error(
        `Falha ao listar vector stores: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Obter detalhes de um vector store
   */
  async getVectorStore(vectorStoreId: string): Promise<SimpleVectorStore> {
    try {
      const vectorStore = this.vectorStores.get(vectorStoreId)

      if (!vectorStore) {
        throw new Error(`Vector store não encontrado: ${vectorStoreId}`)
      }

      return vectorStore
    } catch (error) {
      console.error('[Vector Store Service] Erro ao obter vector store:', error)
      throw new Error(
        `Falha ao obter vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Adicionar arquivo ao vector store
   */
  async addFileToVectorStore(
    input: UploadFileToVectorStoreInput,
  ): Promise<VectorStoreFile> {
    try {
      const vectorStore = this.vectorStores.get(input.vectorStoreId)
      if (!vectorStore) {
        throw new Error(`Vector store não encontrado: ${input.vectorStoreId}`)
      }

      // Processar arquivo com KnowledgeBaseService
      let content: string
      let fileSize: number

      if (input.file instanceof Buffer) {
        content = input.file.toString('utf-8')
        fileSize = input.file.length
      } else {
        // Assumir que é um File object
        content = await (input.file as File).text()
        fileSize = (input.file as File).size
      }

      // Processar documento e criar chunks com embeddings
      await this.knowledgeBase.processDocument(content, input.metadata || {})

      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const vectorStoreFile: VectorStoreFile = {
        id: fileId,
        vectorStoreId: input.vectorStoreId,
        fileId,
        filename: input.filename,
        status: FileStatus.COMPLETED,
        bytes: fileSize,
        createdAt: new Date(),
        metadata: input.metadata,
      }

      // Adicionar arquivo à lista do vector store
      const files = this.vectorStoreFiles.get(input.vectorStoreId) || []
      files.push(vectorStoreFile)
      this.vectorStoreFiles.set(input.vectorStoreId, files)

      // Atualizar contagem de arquivos
      vectorStore.fileCount = files.length
      this.vectorStores.set(input.vectorStoreId, vectorStore)

      return vectorStoreFile
    } catch (error) {
      console.error(
        '[Vector Store Service] Erro ao adicionar arquivo ao vector store:',
        error,
      )
      throw new Error(
        `Falha ao adicionar arquivo ao vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Listar arquivos de um vector store
   */
  async listVectorStoreFiles(
    vectorStoreId: string,
  ): Promise<VectorStoreFile[]> {
    try {
      return this.vectorStoreFiles.get(vectorStoreId) || []
    } catch (error) {
      console.error(
        '[Vector Store Service] Erro ao listar arquivos do vector store:',
        error,
      )
      throw new Error(
        `Falha ao listar arquivos do vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Buscar conteúdo similar no vector store
   */
  async searchVectorStore(
    input: SearchVectorStoreInput,
  ): Promise<VectorStoreSearchResult[]> {
    try {
      const vectorStore = this.vectorStores.get(input.vectorStoreId)
      if (!vectorStore) {
        throw new Error(`Vector store não encontrado: ${input.vectorStoreId}`)
      }

      // Para busca, precisamos de chunks existentes
      // Por simplicidade, vamos retornar resultados vazios por enquanto
      // Em uma implementação real, você armazenaria os chunks processados
      const mockResults: VectorStoreSearchResult[] = []

      return mockResults
    } catch (error) {
      console.error(
        '[Vector Store Service] Erro ao buscar no vector store:',
        error,
      )
      throw new Error(
        `Falha ao buscar no vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Remover arquivo do vector store
   */
  async removeFileFromVectorStore(
    vectorStoreId: string,
    fileId: string,
  ): Promise<void> {
    try {
      const files = this.vectorStoreFiles.get(vectorStoreId) || []
      const updatedFiles = files.filter((file) => file.fileId !== fileId)
      this.vectorStoreFiles.set(vectorStoreId, updatedFiles)

      // Atualizar contagem de arquivos
      const vectorStore = this.vectorStores.get(vectorStoreId)
      if (vectorStore) {
        vectorStore.fileCount = updatedFiles.length
        this.vectorStores.set(vectorStoreId, vectorStore)
      }
    } catch (error) {
      console.error(
        '[Vector Store Service] Erro ao remover arquivo do vector store:',
        error,
      )
      throw new Error(
        `Falha ao remover arquivo do vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Deletar vector store
   */
  async deleteVectorStore(vectorStoreId: string): Promise<void> {
    try {
      this.vectorStores.delete(vectorStoreId)
      this.vectorStoreFiles.delete(vectorStoreId)
    } catch (error) {
      console.error(
        '[Vector Store Service] Erro ao deletar vector store:',
        error,
      )
      throw new Error(
        `Falha ao deletar vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Processar texto e adicionar ao vector store
   */
  async addTextToVectorStore(
    vectorStoreId: string,
    text: string,
    filename: string,
    metadata?: Record<string, any>,
  ): Promise<VectorStoreFile> {
    try {
      const textBuffer = Buffer.from(text, 'utf-8')

      return await this.addFileToVectorStore({
        vectorStoreId,
        file: textBuffer,
        filename,
        metadata,
      })
    } catch (error) {
      console.error(
        '[Vector Store Service] Erro ao adicionar texto ao vector store:',
        error,
      )
      throw new Error(
        `Falha ao adicionar texto ao vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }

  /**
   * Obter estatísticas de uso de um vector store
   */
  async getVectorStoreStats(vectorStoreId: string): Promise<{
    totalFiles: number
    totalBytes: number
  }> {
    try {
      const files = this.vectorStoreFiles.get(vectorStoreId) || []
      const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0)

      return {
        totalFiles: files.length,
        totalBytes,
      }
    } catch (error) {
      console.error(
        '[Vector Store Service] Erro ao obter estatísticas do vector store:',
        error,
      )
      throw new Error(
        `Falha ao obter estatísticas do vector store: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      )
    }
  }
}
