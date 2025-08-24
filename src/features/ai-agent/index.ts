// ========================================
// Sistema de Agentes IA para WhatsApp
// ========================================

// Controllers
export { AIAgentController } from './controllers/ai-agent.controller'

// Services
export { AIAgentService } from './services/ai-agent.service'
export { EvolutionAPIClient } from './services/evolution-api.client'
export { KnowledgeBaseService } from './services/knowledge-base.service'
export { OpenAIService } from './services/openai.service'

// Hooks React
export { useAIAgents } from './presentation/hooks/use-ai-agents'
export { useOpenAICreds } from './presentation/hooks/use-openai-creds'

// Componentes React
export { AgentStats } from './presentation/components/agent-stats'
export { AIAgentCard } from './presentation/components/ai-agent-card'
export { AIAgentsDashboard } from './presentation/components/ai-agents-dashboard'
export { AIAgentsHeader } from './presentation/components/ai-agents-header'
export { CreateAgentModal } from './presentation/components/create-agent-modal'
export { EmptyState } from './presentation/components/empty-state'

// Configurações
export {
  getAIAgentConfig, isConfigValid, validateConfig, type AIAgentConfig
} from './config/ai-agent.config'

// Tipos
export type {
  AgentMemory,
  AgentPersona,
  AgentResponse,
  AgentSession,
  AgentSettingsInput,
  AIAgent,
  CreateAgentInput,
  CreateOpenAICredsInput,
  EvolutionAPIResponse,
  KnowledgeBaseConfig,
  KnowledgeChunk,
  KnowledgeSource,
  OpenAICreds,
  UpdateAgentInput,
  UpdateSessionStatusInput
} from './ai-agent.types'

// Enums
export {
  AgentStatus,
  AgentType,
  MemoryType,
  SessionStatus,
  TriggerOperator,
  TriggerType
} from './ai-agent.types'

// Schemas de validação
export {
  AgentSettingsSchema, CreateAgentSchema, CreateOpenAICredsSchema, UpdateAgentSchema, UpdateSessionStatusSchema
} from './ai-agent.types'

