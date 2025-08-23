import { z } from 'zod'

// Enums para status e tipos
export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRAINING = 'TRAINING',
  ERROR = 'ERROR'
}

export enum AgentType {
  ASSISTANT = 'assistant',
  CHAT_COMPLETION = 'chatCompletion'
}

export enum TriggerType {
  ALL = 'all',
  KEYWORD = 'keyword'
}

export enum TriggerOperator {
  CONTAINS = 'contains',
  EQUALS = 'equals',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  REGEX = 'regex',
  NONE = 'none'
}

export enum SessionStatus {
  OPENED = 'opened',
  PAUSED = 'paused',
  CLOSED = 'closed'
}

export enum MemoryType {
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  KNOWLEDGE_BASE = 'knowledge_base'
}

// Schemas Zod para validação
export const CreateAgentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  openaiCredsId: z.string().min(1, 'ID das credenciais OpenAI é obrigatório'),
  botType: z.nativeEnum(AgentType),
  
  // Para assistants
  assistantId: z.string().optional(),
  functionUrl: z.string().url().optional(),
  
  // Para chat completion
  model: z.string().optional(),
  systemMessages: z.array(z.string()).optional(),
  assistantMessages: z.array(z.string()).optional(),
  userMessages: z.array(z.string()).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  
  // Configurações de trigger
  triggerType: z.nativeEnum(TriggerType),
  triggerOperator: z.nativeEnum(TriggerOperator),
  triggerValue: z.string().optional(),
  
  // Configurações de comportamento
  expire: z.number().min(1).max(1440).optional(), // minutos
  keywordFinish: z.string().optional(),
  delayMessage: z.number().min(0).max(10000).optional(), // ms
  unknownMessage: z.string().optional(),
  listeningFromMe: z.boolean().optional(),
  stopBotFromMe: z.boolean().optional(),
  keepOpen: z.boolean().optional(),
  debounceTime: z.number().min(0).max(10000).optional(), // ms
  ignoreJids: z.array(z.string()).optional(),
  
  // Persona e configurações
  persona: z.object({
    name: z.string(),
    role: z.string(),
    tone: z.string(),
    expertise: z.array(z.string()),
    limitations: z.array(z.string()),
    greeting: z.string(),
    fallback: z.string()
  }).optional(),
  
  // Base de conhecimento
  knowledgeBase: z.object({
    enabled: z.boolean(),
    sources: z.array(z.object({
      type: z.enum(['pdf', 'docx', 'txt', 'url', 'text']),
      content: z.string(),
      metadata: z.record(z.any()).optional()
    })).optional()
  }).optional()
})

export const UpdateAgentSchema = CreateAgentSchema.partial()

export const CreateOpenAICredsSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  apiKey: z.string().min(1, 'API Key é obrigatória')
})

export const UpdateSessionStatusSchema = z.object({
  remoteJid: z.string().min(1, 'Remote JID é obrigatório'),
  status: z.nativeEnum(SessionStatus)
})

export const AgentSettingsSchema = z.object({
  openaiCredsId: z.string(),
  expire: z.number().min(1).max(1440),
  keywordFinish: z.string(),
  delayMessage: z.number().min(0).max(10000),
  unknownMessage: z.string(),
  listeningFromMe: z.boolean(),
  stopBotFromMe: z.boolean(),
  keepOpen: z.boolean(),
  debounceTime: z.number().min(0).max(10000),
  ignoreJids: z.array(z.string()),
  openaiIdFallback: z.string()
})

// Tipos TypeScript
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>
export type CreateOpenAICredsInput = z.infer<typeof CreateOpenAICredsSchema>
export type UpdateSessionStatusInput = z.infer<typeof UpdateSessionStatusSchema>
export type AgentSettingsInput = z.infer<typeof AgentSettingsSchema>

// Interfaces para entidades
export interface AIAgent {
  id: string
  name: string
  description?: string
  instanceName: string
  evolutionBotId?: string
  openaiCredsId: string
  botType: AgentType
  assistantId?: string
  functionUrl?: string
  model?: string
  systemMessages?: string[]
  assistantMessages?: string[]
  userMessages?: string[]
  maxTokens?: number
  triggerType: TriggerType
  triggerOperator: TriggerOperator
  triggerValue?: string
  expire?: number
  keywordFinish?: string
  delayMessage?: number
  unknownMessage?: string
  listeningFromMe?: boolean
  stopBotFromMe?: boolean
  keepOpen?: boolean
  debounceTime?: number
  ignoreJids?: string[]
  persona?: AgentPersona
  knowledgeBase?: KnowledgeBaseConfig
  status: AgentStatus
  organizationId: string
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export interface AgentPersona {
  name: string
  role: string
  tone: string
  expertise: string[]
  limitations: string[]
  greeting: string
  fallback: string
}

export interface KnowledgeBaseConfig {
  enabled: boolean
  sources?: KnowledgeSource[]
}

export interface KnowledgeSource {
  id: string
  type: 'pdf' | 'docx' | 'txt' | 'url' | 'text'
  content: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface OpenAICreds {
  id: string
  name: string
  apiKey: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface AgentSession {
  id: string
  agentId: string
  openaiBotId: string
  remoteJid: string
  status: SessionStatus
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface AgentMemory {
  id: string
  agentId: string
  remoteJid: string
  type: MemoryType
  role: 'user' | 'assistant' | 'system'
  content: string
  summary?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface KnowledgeChunk {
  id: string
  agentId: string
  sourceId: string
  content: string
  embedding?: number[]
  metadata?: Record<string, any>
  createdAt: Date
}

// Tipos para respostas da API
export interface AgentResponse {
  success: boolean
  data?: any
  error?: string
}

export interface EvolutionAPIResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}
