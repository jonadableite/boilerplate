import { z } from 'zod'

// Enums para status e tipos seguindo padrões OpenAI v2
export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRAINING = 'TRAINING',
  ERROR = 'ERROR',
}

export enum AgentType {
  ASSISTANT = 'assistant',
  CHAT_COMPLETION = 'chatCompletion',
}

// Novos enums para OpenAI Assistants API v2
export enum OpenAIModel {
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
}

export enum SpeechModel {
  GPT_4O_TRANSCRIBE = 'gpt-4o-transcribe',
  GPT_4O_MINI_TRANSCRIBE = 'gpt-4o-mini-transcribe',
  WHISPER_1 = 'whisper-1',
}

export enum TTSModel {
  TTS_1 = 'tts-1',
  TTS_1_HD = 'tts-1-hd',
  GPT_4O_MINI_TTS = 'gpt-4o-mini-tts',
}

export enum TTSVoice {
  ALLOY = 'alloy',
  ECHO = 'echo',
  FABLE = 'fable',
  ONYX = 'onyx',
  NOVA = 'nova',
  SHIMMER = 'shimmer',
}

export enum ToolType {
  CODE_INTERPRETER = 'code_interpreter',
  FILE_SEARCH = 'file_search',
  FUNCTION = 'function',
}

export enum TriggerType {
  ALL = 'all',
  KEYWORD = 'keyword',
}

export enum TriggerOperator {
  CONTAINS = 'contains',
  EQUALS = 'equals',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  REGEX = 'regex',
  NONE = 'none',
}

export enum SessionStatus {
  OPENED = 'opened',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

export enum MemoryType {
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  KNOWLEDGE_BASE = 'knowledge_base',
}

// Novos enums para Vector Stores e File Search
export enum VectorStoreStatus {
  EXPIRED = 'expired',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum FileStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum RunStatus {
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  REQUIRES_ACTION = 'requires_action',
  CANCELLING = 'cancelling',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

// Schemas Zod para validação
export const CreateAgentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  openaiCredsId: z.string().min(1, 'ID das credenciais OpenAI é obrigatório'),
  botType: z.nativeEnum(AgentType),

  // Para assistants (OpenAI v2)
  assistantId: z.string().optional(),
  functionUrl: z.string().url().optional(),
  tools: z
    .array(
      z.object({
        type: z.nativeEnum(ToolType),
        function: z
          .object({
            name: z.string(),
            description: z.string(),
            parameters: z.record(z.any()),
          })
          .optional(),
      }),
    )
    .optional(),

  // Para chat completion
  model: z.nativeEnum(OpenAIModel).optional(),
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
  persona: z
    .object({
      name: z.string(),
      role: z.string(),
      tone: z.string(),
      expertise: z.array(z.string()),
      limitations: z.array(z.string()),
      greeting: z.string(),
      fallback: z.string(),
    })
    .optional(),

  // Base de conhecimento com Vector Stores (OpenAI v2)
  knowledgeBase: z
    .object({
      enabled: z.boolean(),
      vectorStoreId: z.string().optional(),
      sources: z
        .array(
          z.object({
            type: z.enum(['pdf', 'docx', 'txt', 'url', 'text']),
            content: z.string(),
            metadata: z.record(z.any()).optional(),
          }),
        )
        .optional(),
    })
    .optional(),

  // Configurações de voz (Speech-to-Text e Text-to-Speech)
  speechConfig: z
    .object({
      enabled: z.boolean(),
      transcriptionModel: z.nativeEnum(SpeechModel).optional(),
      ttsModel: z.nativeEnum(TTSModel).optional(),
      voice: z.nativeEnum(TTSVoice).optional(),
      language: z.string().optional(),
    })
    .optional(),
})

export const UpdateAgentSchema = CreateAgentSchema.partial()

export const CreateOpenAICredsSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  apiKey: z.string().min(1, 'API Key é obrigatória'),
})

export const UpdateSessionStatusSchema = z.object({
  remoteJid: z.string().min(1, 'Remote JID é obrigatório'),
  status: z.nativeEnum(SessionStatus),
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
  openaiIdFallback: z.string(),
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
