import OpenAI from 'openai'
import { AgentPersona, KnowledgeSource, KnowledgeChunk } from '../ai-agent.types'

export interface EmbeddingResult {
  id: string
  content: string
  embedding: number[]
  metadata: Record<string, any>
}

export interface SearchResult {
  id: string
  content: string
  score: number
  metadata: Record<string, any>
}

export class KnowledgeBaseService {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: false
    })
  }

  // Chunking de texto para embeddings
  async chunkText(text: string, chunkSize: number = 500, overlap: number = 50): Promise<string[]> {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ')
      if (chunk.trim()) {
        chunks.push(chunk.trim())
      }
    }
    
    return chunks
  }

  // Criar embeddings para um texto
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('[Knowledge Base] Erro ao criar embedding:', error)
      throw new Error('Falha ao criar embedding para o texto')
    }
  }

  // Criar embeddings para múltiplos chunks
  async createEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts
      })
      
      return texts.map((text, index) => ({
        id: `chunk_${Date.now()}_${index}`,
        content: text,
        embedding: response.data[index].embedding,
        metadata: {
          timestamp: new Date().toISOString(),
          chunkIndex: index
        }
      }))
    } catch (error) {
      console.error('[Knowledge Base] Erro ao criar embeddings em lote:', error)
      throw new Error('Falha ao criar embeddings em lote')
    }
  }

  // Processar documento e criar chunks com embeddings
  async processDocument(
    content: string, 
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeChunk[]> {
    try {
      // Chunking do texto
      const chunks = await this.chunkText(content)
      
      // Criar embeddings para todos os chunks
      const embeddingResults = await this.createEmbeddings(chunks)
      
      // Converter para KnowledgeChunk
      return embeddingResults.map(result => ({
        id: result.id,
        agentId: metadata.agentId || '',
        sourceId: metadata.sourceId || '',
        content: result.content,
        embedding: result.embedding,
        metadata: {
          ...metadata,
          chunkIndex: result.metadata.chunkIndex,
          timestamp: result.metadata.timestamp
        },
        createdAt: new Date()
      }))
    } catch (error) {
      console.error('[Knowledge Base] Erro ao processar documento:', error)
      throw new Error('Falha ao processar documento')
    }
  }

  // Buscar chunks similares usando embeddings
  async searchSimilarChunks(
    query: string,
    chunks: KnowledgeChunk[],
    topK: number = 5
  ): Promise<SearchResult[]> {
    try {
      // Criar embedding para a query
      const queryEmbedding = await this.createEmbedding(query)
      
      // Calcular similaridade de cosseno
      const similarities = chunks.map(chunk => {
        if (!chunk.embedding) return { chunk, score: 0 }
        
        const score = this.cosineSimilarity(queryEmbedding, chunk.embedding)
        return { chunk, score }
      })
      
      // Ordenar por score e retornar top K
      return similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(({ chunk, score }) => ({
          id: chunk.id,
          content: chunk.content,
          score,
          metadata: chunk.metadata || {}
        }))
    } catch (error) {
      console.error('[Knowledge Base] Erro ao buscar chunks similares:', error)
      throw new Error('Falha ao buscar chunks similares')
    }
  }

  // Calcular similaridade de cosseno entre dois vetores
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }
    
    if (normA === 0 || normB === 0) return 0
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  // Construir prompt com contexto da base de conhecimento
  buildContextPrompt(
    persona: AgentPersona,
    relevantChunks: SearchResult[],
    userMessage: string
  ): string {
    let prompt = `Você é ${persona.name}, ${persona.role}.\n\n`
    prompt += `Tom: ${persona.tone}\n`
    prompt += `Expertise: ${persona.expertise.join(', ')}\n`
    prompt += `Limitações: ${persona.limitations.join(', ')}\n\n`
    
    if (relevantChunks.length > 0) {
      prompt += `Base de conhecimento relevante:\n`
      relevantChunks.forEach((chunk, index) => {
        prompt += `${index + 1}. ${chunk.content}\n`
      })
      prompt += '\n'
    }
    
    prompt += `Mensagem do usuário: ${userMessage}\n\n`
    prompt += `Responda de acordo com sua persona e a base de conhecimento fornecida.`
    
    return prompt
  }

  // Processar diferentes tipos de conteúdo
  async processContent(
    content: string,
    type: 'pdf' | 'docx' | 'txt' | 'url' | 'text',
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeChunk[]> {
    let processedContent = content
    
    // Aqui você pode adicionar processamento específico para cada tipo
    switch (type) {
      case 'pdf':
        // Processamento específico para PDF (se necessário)
        break
      case 'docx':
        // Processamento específico para DOCX (se necessário)
        break
      case 'url':
        // Aqui você poderia fazer web scraping da URL
        // Por enquanto, assumimos que o conteúdo já foi extraído
        break
      default:
        // Para txt e text, usar o conteúdo como está
        break
    }
    
    return this.processDocument(processedContent, metadata)
  }

  // Resumir conversa para memória de longo prazo
  async summarizeConversation(messages: string[]): Promise<string> {
    try {
      const conversationText = messages.join('\n')
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Resuma esta conversa em 2-3 frases, destacando os pontos principais e o contexto da interação.'
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      })
      
      return response.choices[0]?.message?.content || 'Conversa resumida'
    } catch (error) {
      console.error('[Knowledge Base] Erro ao resumir conversa:', error)
      return 'Erro ao resumir conversa'
    }
  }
}
