export interface TokenUsageRecord {
  id: string
  organizationId: string
  tokensUsed: number
  operation: string
  model?: string
  agentId?: string
  metadata?: any
  createdAt: Date
}

export interface OrganizationTokenUsage {
  organizationId: string
  currentMonthTokens: number
  currentDayTokens: number
  lastTokenReset?: Date
  totalTokensUsed: number
}

export interface TokenLimits {
  monthlyTokenLimit?: number
  dailyTokenLimit?: number
}

export interface TokenUsageStats {
  currentUsage: OrganizationTokenUsage
  limits: TokenLimits
  percentageUsed: {
    monthly?: number
    daily?: number
  }
  isOverLimit: {
    monthly: boolean
    daily: boolean
  }
}

export interface RecordTokenUsageInput {
  organizationId: string
  tokensUsed: number
  operation: string
  model?: string
  agentId?: string
  metadata?: any
}

export interface GetTokenUsageStatsInput {
  organizationId: string
}

export interface CheckTokenLimitInput {
  organizationId: string
  tokensToUse: number
}

export interface CheckTokenLimitResult {
  canUseTokens: boolean
  reason?: string
  currentUsage: OrganizationTokenUsage
  limits: TokenLimits
}
