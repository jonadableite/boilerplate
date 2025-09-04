import { z } from 'zod'
import { AIAgentType } from '../types/ai-agent.types'

// Schema para configuração do modelo
export const modelConfigSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(32000).default(1000),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
})

// Schema para configurações de guardrails
export const guardrailConfigSchema = z.object({
  enableContentFilter: z.boolean().default(true),
  enablePiiDetection: z.boolean().default(true),
  maxResponseLength: z.number().min(1).max(10000).optional(),
  allowedTopics: z.array(z.string()).default([]),
  blockedTopics: z.array(z.string()).default([]),
})

// Schema para criação de agente AI
export const createAIAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.nativeEnum(AIAgentType).default(AIAgentType.LLM_AGENT),
  role: z.string().max(200, 'Role too long').optional(),
  goal: z.string().max(500, 'Goal too long').optional(),
  systemPrompt: z
    .string()
    .min(1, 'System prompt is required')
    .max(5000, 'System prompt too long'),

  // Configurações do modelo
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(32000).default(1000),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),

  // Base de conhecimento
  knowledgeBaseId: z.string().uuid().optional(),

  // Configurações de segurança
  enableContentFilter: z.boolean().default(true),
  enablePiiDetection: z.boolean().default(true),
  maxResponseLength: z.number().min(1).max(10000).optional(),
  allowedTopics: z.array(z.string()).default([]),
  blockedTopics: z.array(z.string()).default([]),

  // Configurações gerais
  fallbackMessage: z.string().max(1000, 'Fallback message too long').optional(),
  isActive: z.boolean().default(true),

  // Credenciais OpenAI específicas
  openaiCredsId: z.string().uuid().optional(),

  // Metadados
  metadata: z.record(z.any()).optional(),
})

// Schema para atualização de agente AI
export const updateAIAgentSchema = createAIAgentSchema.partial().extend({
  id: z.string().uuid('Invalid agent ID'),
})

// Schema para processamento de mensagem
export const processMessageSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  sessionId: z.string().min(1, 'Session ID is required'),
  userMessage: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message too long'),
  context: z
    .object({
      remoteJid: z.string().optional(),
      instanceName: z.string().optional(),
      messageId: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    })
    .optional(),
})

// Schema para memória do agente
export const agentMemorySchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  sessionId: z.string().min(1, 'Session ID is required'),
  organizationId: z.string().uuid('Invalid organization ID'),
  userMessage: z.string().min(1, 'User message is required'),
  assistantMessage: z.string().min(1, 'Assistant message is required'),
  tokenUsage: z.object({
    promptTokens: z.number().min(0),
    completionTokens: z.number().min(0),
    totalTokens: z.number().min(0),
  }),
  metadata: z.record(z.any()).optional(),
})

// Schema para histórico de conversa
export const conversationHistorySchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  sessionId: z.string().min(1, 'Session ID is required'),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
})

// Schema para RAG retrieval
export const ragRetrievalSchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000, 'Query too long'),
  knowledgeBaseId: z.string().uuid('Invalid knowledge base ID'),
  limit: z.number().min(1).max(50).default(5),
  threshold: z.number().min(0).max(1).default(0.7),
})

// Schema para adicionar chunk de conhecimento
export const addKnowledgeChunkSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  sourceId: z.string().min(1, 'Source ID is required'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content too long'),
  metadata: z.record(z.any()).optional(),
})

// Schema para atualizar chunk de conhecimento
export const updateKnowledgeChunkSchema = z.object({
  id: z.string().uuid('Invalid chunk ID'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content too long')
    .optional(),
  metadata: z.record(z.any()).optional(),
})

// Schema para listagem de agentes
export const listAgentsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  type: z.nativeEnum(AIAgentType).optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  search: z.string().max(100).optional(),
})

// Schema para configuração do Evolution Bot
export const evolutionBotConfigSchema = z.object({
  instanceName: z.string().min(1, 'Instance name is required'),
  apiUrl: z.string().url('Invalid API URL'),
  apiKey: z.string().min(1, 'API key is required'),
  triggerType: z.enum(['all', 'keyword', 'mention']).default('all'),
  triggerValue: z.string().optional(),
  expire: z.number().min(0).optional(),
  keywordFinish: z.string().optional(),
  delayMessage: z.number().min(0).default(1000),
  unknownMessage: z.string().optional(),
  listeningFromMe: z.boolean().default(false),
  stopBotFromMe: z.boolean().default(false),
  keepOpen: z.boolean().default(true),
  debounceTime: z.number().min(0).default(3000),
})

// Schema para criar Evolution Bot
export const createEvolutionBotSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  instanceName: z.string().min(1, 'Instance name is required'),
  config: evolutionBotConfigSchema.partial(),
})

// Schema para atualizar Evolution Bot
export const updateEvolutionBotSchema = z.object({
  evolutionBotId: z.string().min(1, 'Evolution bot ID is required'),
  config: evolutionBotConfigSchema.partial(),
})

// Schema para webhook da Evolution API
export const evolutionWebhookSchema = z.object({
  instanceName: z.string().min(1, 'Instance name is required'),
  evolutionBotId: z.string().optional(),
  remoteJid: z.string().min(1, 'Remote JID is required'),
  message: z.object({
    id: z.string().min(1, 'Message ID is required'),
    content: z.string().min(1, 'Message content is required'),
    type: z.string().min(1, 'Message type is required'),
    timestamp: z.number().min(0),
  }),
  contact: z.object({
    name: z.string().optional(),
    pushName: z.string().optional(),
  }),
  metadata: z.record(z.any()).optional(),
})

// Schema para registro de uso de tokens
export const tokenUsageRecordSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  agentId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  promptTokens: z.number().min(0),
  completionTokens: z.number().min(0),
  totalTokens: z.number().min(0),
  model: z.string().min(1, 'Model is required'),
  operation: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// Schema para verificação de limites de tokens
export const checkTokenLimitsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  requestedTokens: z.number().min(1, 'Requested tokens must be positive'),
})

// Schema para logs
export const createLogEntrySchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  sessionId: z.string().optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string().min(1, 'Message is required'),
  data: z.record(z.any()).optional(),
})

export const getLogsSchema = z.object({
  agentId: z.string().uuid().optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
  sessionId: z.string().optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
})

// Tipos inferidos dos schemas
export type CreateAIAgentInput = z.infer<typeof createAIAgentSchema>
export type UpdateAIAgentInput = z.infer<typeof updateAIAgentSchema>
export type ProcessMessageInput = z.infer<typeof processMessageSchema>
export type AgentMemoryInput = z.infer<typeof agentMemorySchema>
export type ConversationHistoryInput = z.infer<typeof conversationHistorySchema>
export type RAGRetrievalInput = z.infer<typeof ragRetrievalSchema>
export type AddKnowledgeChunkInput = z.infer<typeof addKnowledgeChunkSchema>
export type UpdateKnowledgeChunkInput = z.infer<
  typeof updateKnowledgeChunkSchema
>
export type ListAgentsInput = z.infer<typeof listAgentsSchema>
export type EvolutionBotConfigInput = z.infer<typeof evolutionBotConfigSchema>
export type CreateEvolutionBotInput = z.infer<typeof createEvolutionBotSchema>
export type UpdateEvolutionBotInput = z.infer<typeof updateEvolutionBotSchema>
export type EvolutionWebhookInput = z.infer<typeof evolutionWebhookSchema>
export type TokenUsageRecordInput = z.infer<typeof tokenUsageRecordSchema>
export type CheckTokenLimitsInput = z.infer<typeof checkTokenLimitsSchema>
export type CreateLogEntryInput = z.infer<typeof createLogEntrySchema>
export type GetLogsInput = z.infer<typeof getLogsSchema>
