import OpenAI from 'openai'
import {
  AIAgent,
  AgentPersona,
  KnowledgeChunk,
  OpenAIModel,
  SpeechModel,
  TTSModel,
  TTSVoice,
  ToolType,
  VectorStoreStatus,
  FileStatus,
  RunStatus
} from '../ai-agent.types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
  file_ids?: string[]
}

export interface VectorStore {
  id: string
  name: string
  status: VectorStoreStatus
  file_counts: {
    in_progress: number
    completed: number
    failed: number
    cancelled: number
    total: number
  }
  created_at: number
  expires_after?: {
    anchor: 'last_active_at'
    days: number
  }
}

export interface FileObject {
  id: string
  filename: string
  purpose: string
  status: FileStatus
  bytes: number
  created_at: number
}

export interface SpeechRequest {
  model: TTSModel
  input: string
  voice: TTSVoice
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac'
  speed?: number
}

export interface TranscriptionRequest {
  file: File | Buffer
  model: SpeechModel
  language?: string
  prompt?: string
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
}

export interface ChatCompletionRequest {
  model: OpenAIModel
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  tools?: Array<{
    type: ToolType
    function?: {
      name: string
      description: string
      parameters: Record<string, any>
    }
  }>
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } }
}

export interface ChatCompletionResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface EmbeddingResponse {
  embedding: number[]
  usage: {
    promptTokens: number
    totalTokens: number
  }
}

export class OpenAIService {
  private openai: OpenAI
  private defaultModel = 'gpt-4o'
  private defaultMaxTokens = 1000
  private defaultTemperature = 0.7

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API Key da OpenAI é obrigatória')
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: false
    })
  }

  // Chat Completions
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: request.messages,
        max_tokens: request.maxTokens || this.defaultMaxTokens,
        temperature: request.temperature || this.defaultTemperature,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Resposta vazia da OpenAI')
      }

      return {
        content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('[OpenAI Service] Erro ao criar chat completion:', error)
      throw new Error(`Falha ao criar chat completion: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Embeddings
  async createEmbedding(text: string, model: string = 'text-embedding-3-small'): Promise<EmbeddingResponse> {
    try {
      const response = await this.openai.embeddings.create({
        model,
        input: text
      })

      const embedding = response.data[0]?.embedding
      if (!embedding) {
        throw new Error('Embedding vazio da OpenAI')
      }

      return {
        embedding,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('[OpenAI Service] Erro ao criar embedding:', error)
      throw new Error(`Falha ao criar embedding: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async createEmbeddings(texts: string[], model: string = 'text-embedding-3-small'): Promise<EmbeddingResponse[]> {
    try {
      const response = await this.openai.embeddings.create({
        model,
        input: texts
      })

      return response.data.map((item, index) => ({
        embedding: item.embedding,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      }))
    } catch (error) {
      console.error('[OpenAI Service] Erro ao criar embeddings em lote:', error)
      throw new Error(`Falha ao criar embeddings em lote: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Vector Stores (OpenAI v2)
  async createVectorStore(name: string, fileIds?: string[]): Promise<VectorStore> {
    try {
      const vectorStore = await this.openai.beta.vectorStores.create({
        name,
        file_ids: fileIds,
      })

      return {
        id: vectorStore.id,
        name: vectorStore.name,
        status: vectorStore.status as VectorStoreStatus,
        file_counts: vectorStore.file_counts,
        created_at: vectorStore.created_at,
        expires_after: vectorStore.expires_after,
      }
    } catch (error) {
      console.error('[OpenAI Service] Erro ao criar vector store:', error)
      throw new Error(`Falha ao criar vector store: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async uploadFile(file: Buffer | File, filename: string, purpose: string = 'assistants'): Promise<FileObject> {
    try {
      const uploadedFile = await this.openai.files.create({
        file: file,
        purpose: purpose as any,
      })

      return {
        id: uploadedFile.id,
        filename: filename,
        purpose: uploadedFile.purpose,
        status: uploadedFile.status as FileStatus,
        bytes: uploadedFile.bytes,
        created_at: uploadedFile.created_at,
      }
    } catch (error) {
      console.error('[OpenAI Service] Erro ao fazer upload do arquivo:', error)
      throw new Error(`Falha ao fazer upload do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async addFileToVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
    try {
      await this.openai.beta.vectorStores.files.create(vectorStoreId, {
        file_id: fileId,
      })
    } catch (error) {
      console.error('[OpenAI Service] Erro ao adicionar arquivo ao vector store:', error)
      throw new Error(`Falha ao adicionar arquivo ao vector store: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Speech-to-Text (Whisper)
  async transcribeAudio(request: TranscriptionRequest): Promise<string> {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: request.file as any,
        model: request.model,
        language: request.language,
        prompt: request.prompt,
        response_format: request.response_format || 'text',
        temperature: request.temperature,
      })

      return typeof transcription === 'string' ? transcription : transcription.text
    } catch (error) {
      console.error('[OpenAI Service] Erro ao transcrever áudio:', error)
      throw new Error(`Falha ao transcrever áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Text-to-Speech
  async generateSpeech(request: SpeechRequest): Promise<Buffer> {
    try {
      const response = await this.openai.audio.speech.create({
        model: request.model,
        input: request.input,
        voice: request.voice,
        response_format: request.response_format || 'mp3',
        speed: request.speed || 1.0,
      })

      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      console.error('[OpenAI Service] Erro ao gerar fala:', error)
      throw new Error(`Falha ao gerar fala: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Assistants (OpenAI Assistants API v2)
  async createAssistant(
    name: string,
    instructions: string,
    model: OpenAIModel = OpenAIModel.GPT_4O,
    tools?: Array<{ type: ToolType; function?: any }>,
    vectorStoreIds?: string[]
  ): Promise<string> {
    try {
      const assistant = await this.openai.beta.assistants.create({
        name,
        instructions,
        model,
        tools: tools as any,
        tool_resources: vectorStoreIds ? {
          file_search: {
            vector_store_ids: vectorStoreIds,
          },
        } : undefined,
      })

      return assistant.id
    } catch (error) {
      console.error('[OpenAI Service] Erro ao criar assistant:', error)
      throw new Error(`Falha ao criar assistant: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async updateAssistant(
    assistantId: string,
    updates: Partial<{
      name: string
      instructions: string
      model: OpenAIModel
      tools: Array<{ type: ToolType; function?: any }>
      vectorStoreIds: string[]
    }>
  ): Promise<void> {
    try {
      const updateData: any = {
        name: updates.name,
        instructions: updates.instructions,
        model: updates.model,
        tools: updates.tools,
      }

      if (updates.vectorStoreIds) {
        updateData.tool_resources = {
          file_search: {
            vector_store_ids: updates.vectorStoreIds,
          },
        }
      }

      await this.openai.beta.assistants.update(assistantId, updateData)
    } catch (error) {
      console.error('[OpenAI Service] Erro ao atualizar assistant:', error)
      throw new Error(`Falha ao atualizar assistant: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async deleteAssistant(assistantId: string): Promise<void> {
    try {
      await this.openai.beta.assistants.delete(assistantId)
    } catch (error) {
      console.error('[OpenAI Service] Erro ao deletar assistant:', error)
      throw new Error(`Falha ao deletar assistant: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Threads e mensagens para Assistants (OpenAI v2)
  async createThread(messages?: ChatMessage[], vectorStoreIds?: string[]): Promise<string> {
    try {
      const thread = await this.openai.beta.threads.create({
        messages: messages?.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          file_ids: msg.file_ids,
        })),
        tool_resources: vectorStoreIds ? {
          file_search: {
            vector_store_ids: vectorStoreIds,
          },
        } : undefined,
      })
      return thread.id
    } catch (error) {
      console.error('[OpenAI Service] Erro ao criar thread:', error)
      throw new Error(`Falha ao criar thread: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async addMessageToThread(threadId: string, role: 'user' | 'assistant', content: string): Promise<string> {
    try {
      const message = await this.openai.beta.threads.messages.create(threadId, {
        role,
        content
      })
      return message.id
    } catch (error) {
      console.error('[OpenAI Service] Erro ao adicionar mensagem ao thread:', error)
      throw new Error(`Falha ao adicionar mensagem ao thread: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async runAssistant(
    threadId: string,
    assistantId: string,
    instructions?: string,
    tools?: Array<{ type: ToolType; function?: any }>
  ): Promise<string> {
    try {
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        instructions,
        tools: tools as any,
      })
      return run.id
    } catch (error) {
      console.error('[OpenAI Service] Erro ao executar assistant:', error)
      throw new Error(`Falha ao executar assistant: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async getRunStatus(threadId: string, runId: string): Promise<RunStatus> {
    try {
      const run = await this.openai.beta.threads.runs.retrieve(threadId, runId)
      return run.status as RunStatus
    } catch (error) {
      console.error('[OpenAI Service] Erro ao buscar status do run:', error)
      throw new Error(`Falha ao buscar status do run: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async waitForRunCompletion(
    threadId: string,
    runId: string,
    maxWaitTime: number = 30000
  ): Promise<RunStatus> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getRunStatus(threadId, runId)
      
      if (status === RunStatus.COMPLETED || 
          status === RunStatus.FAILED || 
          status === RunStatus.CANCELLED || 
          status === RunStatus.EXPIRED) {
        return status
      }
      
      // Aguarda 1 segundo antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Timeout aguardando conclusão do run')
  }

  async getThreadMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const messages = await this.openai.beta.threads.messages.list(threadId)

      return messages.data.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content[0]?.type === 'text' ? msg.content[0].text.value : '',
        name: msg.assistant_id ? 'assistant' : undefined
      }))
    } catch (error) {
      console.error('[OpenAI Service] Erro ao buscar mensagens do thread:', error)
      throw new Error(`Falha ao buscar mensagens do thread: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Geração de respostas baseada em contexto (OpenAI v2)
  async generateContextualResponse(
    agent: AIAgent,
    userMessage: string,
    contextMessages: ChatMessage[] = [],
    knowledgeChunks: KnowledgeChunk[] = [],
    useAssistant: boolean = false
  ): Promise<string> {
    try {
      // Se o agente tem assistantId e useAssistant é true, usar Assistants API
      if (agent.assistantId && useAssistant) {
        return await this.generateAssistantResponse(
          agent.assistantId,
          userMessage,
          contextMessages
        )
      }

      // Caso contrário, usar Chat Completions
      let systemPrompt = this.buildSystemPrompt(agent)

      // Adicionar contexto da base de conhecimento
      if (knowledgeChunks.length > 0) {
        systemPrompt += '\n\nBase de conhecimento:\n'
        knowledgeChunks.forEach((chunk, index) => {
          systemPrompt += `${index + 1}. ${chunk.content}\n`
        })
        systemPrompt += '\nUse essas informações para responder de forma precisa e contextualizada.'
      }

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
        { role: 'user', content: userMessage }
      ]

      const response = await this.createChatCompletion({
        model: (agent.model as OpenAIModel) || OpenAIModel.GPT_4O,
        messages,
        maxTokens: agent.maxTokens || this.defaultMaxTokens,
        temperature: 0.7,
        tools: agent.tools as any,
      })

      return response.content
    } catch (error) {
      console.error('[OpenAI Service] Erro ao gerar resposta contextual:', error)
      throw error
    }
  }

  // Geração de resposta usando Assistants API
  private async generateAssistantResponse(
    assistantId: string,
    userMessage: string,
    contextMessages: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Criar thread com mensagens de contexto
      const threadId = await this.createThread(contextMessages)

      // Adicionar mensagem do usuário
      await this.addMessageToThread(threadId, 'user', userMessage)

      // Executar assistant
      const runId = await this.runAssistant(threadId, assistantId)

      // Aguardar conclusão
      const status = await this.waitForRunCompletion(threadId, runId)

      if (status !== RunStatus.COMPLETED) {
        throw new Error(`Run falhou com status: ${status}`)
      }

      // Obter mensagens do thread
      const messages = await this.getThreadMessages(threadId)
      const lastMessage = messages.find(msg => msg.role === 'assistant')

      return lastMessage?.content || 'Erro ao obter resposta do assistant'
    } catch (error) {
      console.error('[OpenAI Service] Erro ao gerar resposta do assistant:', error)
      throw error
    }
  }

  // Construir prompt do sistema baseado na persona do agente
  private buildSystemPrompt(agent: AIAgent): string {
    let prompt = ''

    if (agent.persona) {
      const persona = agent.persona as AgentPersona
      prompt = `Você é ${persona.name}, ${persona.role}.\n\n`
      prompt += `Tom de comunicação: ${persona.tone}\n`
      prompt += `Expertise: ${persona.expertise?.join(', ') || 'Assistente geral'}\n`

      if (persona.limitations && persona.limitations.length > 0) {
        prompt += `Limitações: ${persona.limitations.join(', ')}\n`
      }

      if (persona.greeting) {
        prompt += `Saudação: ${persona.greeting}\n`
      }

      prompt += '\nResponda sempre de acordo com sua persona e expertise.'
    } else {
      prompt = 'Você é um assistente de IA útil e amigável. Responda de forma clara e precisa.'
    }

    return prompt
  }

  // Resumir conversa para memória de longo prazo
  async summarizeConversation(messages: ChatMessage[]): Promise<string> {
    try {
      const conversationText = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      const response = await this.createChatCompletion({
        model: OpenAIModel.GPT_4O_MINI,
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
        maxTokens: 150,
        temperature: 0.3
      })

      return response.content
    } catch (error) {
      console.error('[OpenAI Service] Erro ao resumir conversa:', error)
      return 'Erro ao resumir conversa'
    }
  }

  // Validação de API Key
  async validateAPIKey(): Promise<boolean> {
    try {
      await this.openai.models.list()
      return true
    } catch (error) {
      return false
    }
  }
}