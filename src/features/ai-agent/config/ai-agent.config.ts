export interface AIAgentConfig {
  openai: {
    apiKey: string
    defaultModel: string
    defaultMaxTokens: number
    defaultTemperature: number
  }
  evolution: {
    baseURL: string
    apiKey: string
    defaultInstance: string
  }
  features: {
    knowledgeBase: boolean
    voiceGeneration: boolean
    speechToText: boolean
    memoryManagement: boolean
  }
  limits: {
    maxAgentsPerOrg: number
    maxKnowledgeChunks: number
    maxMemoryItems: number
    maxTokensPerResponse: number
  }
}

export const defaultAIAgentConfig: AIAgentConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-4o',
    defaultMaxTokens: 1000,
    defaultTemperature: 0.7
  },
  evolution: {
    baseURL: process.env.EVOLUTION_API_URL || '',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    defaultInstance: 'default'
  },
  features: {
    knowledgeBase: true,
    voiceGeneration: false,
    speechToText: false,
    memoryManagement: true
  },
  limits: {
    maxAgentsPerOrg: 10,
    maxKnowledgeChunks: 1000,
    maxMemoryItems: 100,
    maxTokensPerResponse: 2000
  }
}

export function getAIAgentConfig(): AIAgentConfig {
  return {
    ...defaultAIAgentConfig,
    openai: {
      ...defaultAIAgentConfig.openai,
      apiKey: process.env.OPENAI_API_KEY || defaultAIAgentConfig.openai.apiKey
    },
    evolution: {
      ...defaultAIAgentConfig.evolution,
      baseURL: process.env.EVOLUTION_API_URL || defaultAIAgentConfig.evolution.baseURL,
      apiKey: process.env.EVOLUTION_API_KEY || defaultAIAgentConfig.evolution.apiKey
    }
  }
}

export function validateConfig(config: AIAgentConfig): string[] {
  const errors: string[] = []

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY é obrigatória')
  }

  if (!config.evolution.baseURL) {
    errors.push('EVOLUTION_API_URL é obrigatória')
  }

  if (!config.evolution.apiKey) {
    errors.push('EVOLUTION_API_KEY é obrigatória')
  }

  return errors
}

export function isConfigValid(config: AIAgentConfig): boolean {
  return validateConfig(config).length === 0
}