import {
  AIAgent,
  AIAgentMemory,
  KnowledgeChunk,
  OpenAICreds,
} from '@prisma/client'

// Tipos base do Prisma estendidos
export type AIAgentWithRelations = AIAgent & {
  organization: {
    id: string
    name: string
    slug: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  openaiCreds?: OpenAICreds | null
  memories?: AIAgentMemory[]
  knowledgeChunks?: KnowledgeChunk[]
}

// Tipos para criação e atualização
export interface CreateAIAgentInput {
  name: string
  description?: string
  type?: string
  role?: string
  goal?: string
  systemPrompt: string

  // Configurações do modelo
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number

  // Base de conhecimento
  knowledgeBaseId?: string

  // Configurações de segurança
  enableContentFilter?: boolean
  enablePiiDetection?: boolean
  maxResponseLength?: number
  allowedTopics?: string[]
  blockedTopics?: string[]

  // Configurações gerais
  fallbackMessage?: string
  isActive?: boolean

  // Credenciais OpenAI específicas
  openaiCredsId?: string

  // Metadados
  metadata?: Record<string, any>
}

export interface UpdateAIAgentInput extends Partial<CreateAIAgentInput> {
  id: string
}

// Tipos para configuração do modelo
export interface ModelConfig {
  model: string
  temperature: number
  maxTokens: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

// Tipos para guardrails (segurança)
export interface GuardrailConfig {
  enableContentFilter: boolean
  enablePiiDetection: boolean
  maxResponseLength?: number
  allowedTopics: string[]
  blockedTopics: string[]
}

// Configuração completa do agente para o engine
export interface AgentConfig {
  id: string
  name: string
  description: string
  type: string
  systemPrompt: string
  model: ModelConfig
  knowledgeBaseId?: string
  guardrails: GuardrailConfig
  fallbackMessage?: string
  isActive: boolean
  organizationId: string
}

// Tipos para processamento de mensagens
export interface ProcessMessageInput {
  agentId: string
  organizationId: string
  sessionId: string
  userMessage: string
  context?: {
    remoteJid?: string
    instanceName?: string
    messageId?: string
    metadata?: Record<string, any>
  }
}

export interface ProcessMessageResult {
  response: string
  tokenUsage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  conversationId: string
  metadata?: Record<string, any>
}

// Tipos para memória do agente
export interface AgentMemoryInput {
  agentId: string
  sessionId: string
  organizationId: string
  userMessage: string
  assistantMessage: string
  tokenUsage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  metadata?: Record<string, any>
}

export interface ConversationHistoryInput {
  agentId: string
  sessionId: string
  limit?: number
  offset?: number
}

// Tipos para RAG (Retrieval-Augmented Generation)
export interface RAGRetrievalInput {
  query: string
  knowledgeBaseId: string
  limit?: number
  threshold?: number
}

export interface RAGRetrievalResult {
  id: string
  content: string
  score: number
  metadata?: Record<string, any>
}

// Tipos para validação de entrada
export interface ValidateAgentInputResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

// Tipos para estatísticas do agente
export interface AgentStats {
  totalMessages: number
  totalTokensUsed: number
  averageResponseTime: number
  successRate: number
  lastActive?: Date
}

// Tipos para listagem de agentes
export interface ListAgentsInput {
  organizationId: string
  type?: string
  isActive?: boolean
  limit?: number
  offset?: number
  search?: string
}

export interface ListAgentsResult {
  agents: AIAgentWithRelations[]
  total: number
  hasMore: boolean
}

// Enums para tipos de agente
export enum AIAgentType {
  LLM_AGENT = 'LLM_AGENT',
  CREW_AI = 'CREW_AI',
  LANGGRAPH_WORKFLOW = 'LANGGRAPH_WORKFLOW',
  GOOGLE_ADK = 'GOOGLE_ADK',
  A2A_PROTOCOL = 'A2A_PROTOCOL',
  MCP_SERVER = 'MCP_SERVER',
}

// Enums para tipos de memória
export enum MemoryType {
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  KNOWLEDGE_BASE = 'knowledge_base',
  CONVERSATION = 'conversation',
}

// Enums para roles de mensagem
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

// Tipos para Evolution API integration
export interface EvolutionAPIWebhookPayload {
  instanceName: string
  evolutionBotId?: string
  remoteJid: string
  message: {
    id: string
    content: string
    type: string
    timestamp: number
  }
  contact: {
    name?: string
    pushName?: string
  }
  metadata?: Record<string, any>
}

export interface EvolutionAPIResponse {
  success: boolean
  message: string
  data?: {
    messageId: string
    status: string
  }
}
