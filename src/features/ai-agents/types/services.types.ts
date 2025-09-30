// Tipos para os serviços de AI Agent

// Token Usage Service Types
export interface TokenUsageRecord {
  organizationId: string
  agentId?: string
  sessionId?: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model: string
  operation?: string
  metadata?: Record<string, any>
}

export interface TokenLimits {
  dailyLimit?: number
  monthlyLimit?: number
  perRequestLimit?: number
}

export interface TokenUsageStats {
  dailyUsage: number
  monthlyUsage: number
  remainingDaily?: number
  remainingMonthly?: number
  percentageUsed: {
    daily: number
    monthly: number
  }
}

export interface CheckTokenLimitsInput {
  organizationId: string
  requestedTokens: number
}

export interface CheckTokenLimitsResult {
  allowed: boolean
  reason?: string
  limits: TokenLimits
  currentUsage: TokenUsageStats
}

// Memory Service Types
export interface SaveConversationInput {
  agentId: string
  sessionId: string
  organizationId: string
  messages: {
    id?: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp?: Date
    tokens?: number
    metadata?: Record<string, any>
  }[]
}

export interface ClearConversationInput {
  agentId: string
  sessionId: string
  organizationId: string
  olderThan?: Date
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface GetConversationHistoryInput {
  agentId: string
  sessionId: string
  organizationId: string
  limit?: number
  offset?: number
  includeMetadata?: boolean
}

export interface GetConversationHistoryResult {
  messages: ConversationMessage[]
  total: number
  hasMore: boolean
}

// RAG Service Types
export interface RAGRetrievalInput {
  query: string
  agentId: string
  limit?: number
  threshold?: number
}

export interface RAGRetrievalResult {
  chunks: Array<{
    id: string
    content: string
    score: number
    sourceId: string
    metadata?: Record<string, any>
  }>
  totalFound: number
}

export interface AddKnowledgeChunkInput {
  agentId: string
  sourceId: string
  content: string
  metadata?: Record<string, any>
}

export interface UpdateKnowledgeChunkInput {
  id: string
  content?: string
  metadata?: Record<string, any>
}

export interface RAGService {
  retrieveRelevantChunks(input: RAGRetrievalInput): Promise<RAGRetrievalResult>
  addKnowledgeChunk(input: AddKnowledgeChunkInput): Promise<string>
  updateKnowledgeChunk(input: UpdateKnowledgeChunkInput): Promise<void>
  deleteKnowledgeChunk(chunkId: string): Promise<void>
  getKnowledgeChunks(input: {
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
  }>
}

// Guardrail Service Types
export interface GuardrailValidationInput {
  content: string
  guardrails: {
    enableContentFilter: boolean
    enablePiiDetection: boolean
    maxResponseLength?: number
    allowedTopics: string[]
    blockedTopics: string[]
  }
}

export interface GuardrailValidationResult {
  isValid: boolean
  violations: {
    type:
      | 'content_filter'
      | 'pii_detection'
      | 'length_limit'
      | 'topic_restriction'
    message: string
    severity: 'low' | 'medium' | 'high'
  }[]
  sanitizedContent?: string
}

export interface ValidateInputResult {
  isValid: boolean
  violations: string[]
  sanitizedInput?: string
}

export interface ValidateOutputResult {
  isValid: boolean
  violations: string[]
  sanitizedOutput?: string
}

// Agent Engine Service Types
export interface AgentState {
  messages: any[] // BaseMessage[] from LangChain
  agentId: string
  sessionId: string
  organizationId: string
  userInput: string
  context?: string
  toolResults: any[]
  shouldContinue: boolean
  tokenUsage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface WorkflowConfig {
  checkpointer?: any // MemorySaver from LangGraph
  maxIterations?: number
  timeout?: number
}

// Evolution API Integration Types
export interface EvolutionBotConfig {
  instanceName: string
  apiUrl: string // URL do webhook no nosso SaaS
  apiKey: string // Chave para autenticação
  triggerType: 'all' | 'keyword' | 'mention'
  triggerValue?: string
  expire?: number // Tempo de expiração em segundos
  keywordFinish?: string
  delayMessage?: number
  unknownMessage?: string
  listeningFromMe?: boolean
  stopBotFromMe?: boolean
  keepOpen?: boolean
  debounceTime?: number
}

export interface CreateEvolutionBotInput {
  agentId: string
  instanceName: string
  config: Partial<EvolutionBotConfig>
}

export interface UpdateEvolutionBotInput {
  evolutionBotId: string
  config: Partial<EvolutionBotConfig>
}

export interface EvolutionBotStatus {
  id: string
  instanceName: string
  status: 'active' | 'inactive' | 'error'
  lastActivity?: Date
  config: EvolutionBotConfig
}

// Webhook Processing Types
export interface WebhookProcessingInput {
  payload: any // Payload da Evolution API
  headers: Record<string, string>
  signature?: string
}

export interface WebhookProcessingResult {
  success: boolean
  agentId?: string
  response?: string
  error?: string
  metadata?: Record<string, any>
}

// Logging Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface AgentLogEntry {
  id: string
  agentId: string
  organizationId: string
  sessionId?: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: Record<string, any>
  timestamp: Date
}

export interface CreateLogEntryInput {
  agentId: string
  organizationId: string
  sessionId?: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: Record<string, any>
}

export interface GetLogsInput {
  agentId?: string
  organizationId: string
  sessionId?: string
  level?: 'debug' | 'info' | 'warn' | 'error'
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface GetLogsResult {
  logs: AgentLogEntry[]
  total: number
  hasMore: boolean
}

// Error Types
export class AIAgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, any>,
  ) {
    super(message)
    this.name = 'AIAgentError'
  }
}

export class TokenLimitExceededError extends AIAgentError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'TOKEN_LIMIT_EXCEEDED', 429, metadata)
    this.name = 'TokenLimitExceededError'
  }
}

export class GuardrailViolationError extends AIAgentError {
  constructor(
    message: string,
    violations: string[],
    metadata?: Record<string, any>,
  ) {
    super(message, 'GUARDRAIL_VIOLATION', 400, { violations, ...metadata })
    this.name = 'GuardrailViolationError'
  }
}

export class AgentNotFoundError extends AIAgentError {
  constructor(agentId: string) {
    super(`Agent with ID ${agentId} not found`, 'AGENT_NOT_FOUND', 404, {
      agentId,
    })
    this.name = 'AgentNotFoundError'
  }
}

export class InvalidConfigurationError extends AIAgentError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'INVALID_CONFIGURATION', 400, metadata)
    this.name = 'InvalidConfigurationError'
  }
}
