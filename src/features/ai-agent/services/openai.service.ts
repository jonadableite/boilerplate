import OpenAI from 'openai'
import {
  AIAgent,
  AgentPersona,
  KnowledgeChunk
} from '../ai-agent.types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
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

  // Assistants (OpenAI Assistants API)
  async createAssistant(name: string, instructions: string, model: string = 'gpt-4o'): Promise<string> {
    try {
      const assistant = await this.openai.beta.assistants.create({
        name,
        instructions,
        model
      })

      return assistant.id
    } catch (error) {
      console.error('[OpenAI Service] Erro ao criar assistant:', error)
      throw new Error(`Falha ao criar assistant: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async updateAssistant(assistantId: string, updates: Partial<{
    name: string
    instructions: string
    model: string
  }>): Promise<void> {
    try {
      await this.openai.beta.assistants.update(assistantId, updates)
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

  // Threads e mensagens para Assistants
  async createThread(): Promise<string> {
    try {
      const thread = await this.openai.beta.threads.create()
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

  async runAssistant(threadId: string, assistantId: string): Promise<string> {
    try {
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
      })
      return run.id
    } catch (error) {
      console.error('[OpenAI Service] Erro ao executar assistant:', error)
      throw new Error(`Falha ao executar assistant: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  async getRunStatus(threadId: string, runId: string): Promise<string> {
    try {
      const run = await this.openai.beta.threads.runs.retrieve(threadId, runId)
      return run.status
    } catch (error) {
      console.error('[OpenAI Service] Erro ao buscar status do run:', error)
      throw new Error(`Falha ao buscar status do run: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
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

  // Geração de respostas baseada em contexto
  async generateContextualResponse(
    agent: AIAgent,
    userMessage: string,
    contextMessages: ChatMessage[] = [],
    knowledgeChunks: KnowledgeChunk[] = []
  ): Promise<string> {
    try {
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
        model: agent.model || this.defaultModel,
        messages,
        maxTokens: agent.maxTokens || this.defaultMaxTokens,
        temperature: 0.7
      })

      return response.content
    } catch (error) {
      console.error('[OpenAI Service] Erro ao gerar resposta contextual:', error)
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