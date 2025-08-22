import { z } from 'zod'

// Tipos locais (serão gerados após migration)
export type WarmupStatus =
  | 'INACTIVE'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ERROR'

export type WarmupMessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'STICKER'
  | 'REACTION'

// Enums para validação
export const WarmupStatusEnum = z.enum([
  'INACTIVE',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ERROR',
])

export const WarmupMessageTypeEnum = z.enum([
  'TEXT',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'STICKER',
  'REACTION',
])

// Schemas de validação
export const MediaContentSchema = z.object({
  type: WarmupMessageTypeEnum,
  content: z.string().optional(), // Base64 ou texto
  caption: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const WarmupConfigSchema = z.object({
  // Percentuais de chance para cada tipo de mensagem
  textChance: z.number().min(0).max(1).default(0.35),
  audioChance: z.number().min(0).max(1).default(0.35),
  stickerChance: z.number().min(0).max(1).default(0.2),
  imageChance: z.number().min(0).max(1).default(0.05),
  videoChance: z.number().min(0).max(1).default(0.05),
  reactionChance: z.number().min(0).max(1).default(0.4),

  // Delays entre mensagens (em milissegundos)
  minDelay: z.number().min(1000).default(8000),
  maxDelay: z.number().min(1000).default(20000),

  // Configurações de grupos e números externos
  groupChance: z.number().min(0).max(1).default(0.3),
  externalNumbersChance: z.number().min(0).max(1).default(0.4),
  groupId: z.string().optional(),

  // Configurações avançadas
  dailyMessageLimit: z.number().min(1).default(20),
  targetDuration: z.number().min(3600).default(2073600), // 24 dias por padrão
  humanBehaviorEnabled: z.boolean().default(true),
  variationPercentage: z.number().min(0).max(0.5).default(0.2), // 20% de variação nos delays
})

export const PhoneInstanceSchema = z.object({
  instanceId: z.string().min(1),
  phoneNumber: z.string().min(1),
})

export const CreateWarmupSchema = z.object({
  phoneInstances: z.array(PhoneInstanceSchema).min(1),
  config: WarmupConfigSchema.optional().default({}),
  contents: z.object({
    texts: z.array(z.string()).min(1),
    images: z.array(MediaContentSchema).optional().default([]),
    audios: z.array(MediaContentSchema).optional().default([]),
    videos: z.array(MediaContentSchema).optional().default([]),
    stickers: z.array(MediaContentSchema).optional().default([]),
    emojis: z
      .array(z.string())
      .optional()
      .default(['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥']),
  }),
})

export const UpdateWarmupStatusSchema = z.object({
  instanceName: z.string().min(1),
  status: WarmupStatusEnum,
})

export const GetWarmupStatsSchema = z.object({
  instanceName: z.string().min(1).optional(),
  organizationId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export const ProcessWebhookMessageSchema = z.object({
  instanceName: z.string().min(1),
  messageData: z.object({
    key: z.object({
      id: z.string(),
      remoteJid: z.string(),
      fromMe: z.boolean(),
    }),
    message: z.record(z.any()),
    messageType: z.string(),
    pushName: z.string().optional(),
    messageTimestamp: z.number(),
  }),
})

// Tipos TypeScript derivados dos schemas
export type MediaContent = z.infer<typeof MediaContentSchema>
export type WarmupConfig = z.infer<typeof WarmupConfigSchema>
export type PhoneInstance = z.infer<typeof PhoneInstanceSchema>
export type CreateWarmupInput = z.infer<typeof CreateWarmupSchema>
export type UpdateWarmupStatusInput = z.infer<typeof UpdateWarmupStatusSchema>
export type GetWarmupStatsInput = z.infer<typeof GetWarmupStatsSchema>
export type ProcessWebhookMessageInput = z.infer<
  typeof ProcessWebhookMessageSchema
>

// Tipos de resposta auxiliares
export interface MediaStatsResponse {
  id: string
  instanceName: string
  text: number
  image: number
  video: number
  audio: number
  sticker: number
  reaction: number
  totalDaily: number
  totalAllTime: number
  totalSent: number
  totalReceived: number
  date: Date
  organizationId: string
}

export interface MediaReceivedResponse {
  id: string
  instanceName: string
  text: number
  image: number
  video: number
  audio: number
  sticker: number
  reaction: number
  totalDaily: number
  totalAllTime: number
  date: Date
  organizationId: string
}

// Tipos de resposta principais
export interface WarmupStatsResponse {
  id: string
  instanceName: string
  status: WarmupStatus
  startTime: Date
  pauseTime: Date | null
  warmupTime: number
  progress: number
  lastActive: Date | null
  targetDuration: number
  organizationId: string
  userId: string
  mediaStats: MediaStatsResponse
  mediaReceived: MediaReceivedResponse
  createdAt: Date
  updatedAt: Date
}

export interface WarmupContentResponse {
  id: string
  type: WarmupMessageType
  content: string | null
  caption: string | null
  fileName: string | null
  mimeType: string | null
  metadata: Record<string, any> | null
  organizationId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface WarmupExternalNumberResponse {
  id: string
  phoneNumber: string
  name: string | null
  active: boolean
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

// Tipos para o serviço
export interface SendMessageConfig {
  endpoint: string
  payload: Record<string, any>
  delay: number
}

export interface EvolutionApiResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
    participant?: string
  }
  pushName: string
  status: string
  message: Record<string, any>
  messageType: string
  messageTimestamp: number
  instanceId: string
  source: string
}

// Configurações de limite por plano
export interface PlanLimits {
  messagesPerDay: number
  features: WarmupMessageType[]
  instancesLimit: number
  externalNumbersLimit: number
}

// Tipos para o sistema de filas (futuro)
export interface WarmupMessageTask {
  id: string
  instanceName: string
  organizationId: string
  userId: string
  messageType: WarmupMessageType
  targetNumber: string
  content: MediaContent | string
  scheduledAt: Date
  priority: number
  retryCount: number
  maxRetries: number
}

export interface WarmupInstanceMetrics {
  instanceName: string
  organizationId: string
  status: WarmupStatus
  dailyMessages: number
  weeklyMessages: number
  monthlyMessages: number
  lastMessageAt: Date | null
  healthScore: number // 0-100
  errorRate: number
  avgResponseTime: number
}

// Constantes
export const DEFAULT_EXTERNAL_NUMBERS = [
  '5511999151515',
  '553123320005',
  '5511956860124',
  '551134748029',
  '551155728778',
  '5521993153062',
  '554832433664',
  '551128530702',
  '554791107025',
  '551128530762',
  '5511937577552',
  '5521994017240',
  '557532216114',
  '5511972146733',
  '5511915862328',
  '559230421437',
  '555133825500',
  '5511934505884',
  '5511975295195',
  '5511912609190',
  '5511994304972',
  '5511939036857',
  '551126265327',
  '551131552800',
  '555599897514',
  '554732373771',
  '551940421800',
  '558534866366',
  '555433176300',
  '558007274660',
  '5511976664900',
  '5511986293294',
  '5511934819317',
  '558881822574',
  '551156130202',
  '551132300363',
  '5511915828037',
  '551821018311',
  '551130422170',
  '555133143838',
  '558140043050',
  '558006661515',
  '551121098888',
  '552135909000',
  '551128530325',
  '551132301493',
  '555133343432',
  '558140043230',
  '5521993410670',
  '5511941836701',
  '5511940646175',
  '5511941536754',
  '558000207758',
  '558001040104',
  '552120423829',
  '551130048007',
  '5511944469719',
  '551133452288',
  '5519983630058',
  '552721247700',
  '553183386125',
  '5511963785460',
  '556135224521',
  '551131354148',
  '5521981281045',
  '558002320800',
  '5511955581462',
  '552134601746',
  '551140644106',
  '554195053843',
  '551151999851',
  '551142008293',
  '551142000252',
  '5511943323273',
  '5511973079915',
  '5511993428075',
  '551150621456',
  '555433270042',
  '558340629108',
  '553133849008',
  '552138121921',
  '5511943079112',
  '5511911875504',
  '551148390436',
  '558331422688',
  '5511988952656',
  '5521980090636',
  '551135223406',
  '551935006321',
  '557182197732',
  '551131985816',
  '551131360110',
  '5511972888604',
  '5511934687141',
  '5511943396419',
  '558007442110',
  '551142000355',
  '553432576000',
  '5511976216004',
  '555191490457',
  '5521991776152',
  '5511933505743',
  '5511988913555',
  '5511945382314',
  '553198780286',
  '551132322935',
  '5511942114304',
  '558001488000',
  '552139007070',
  '551151963400',
  '553132612801',
  '558000550073',
  '558007268010',
  '551150439404',
  '551130037242',
  '5521967446767',
  '5511976379870',
  '5521965247184',
  '551137249000',
  '5511944882022',
  '5511975691546',
  '5511964146890',
  '5511913185864',
  '5511999910621',
  '556140040001',
  '551140201955',
  '5521973015191',
]

export const DEFAULT_GROUP_ID = '120363419940617369@g.us'

export const DEFAULT_PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    messagesPerDay: 20,
    features: ['TEXT', 'AUDIO', 'STICKER', 'REACTION'], // Adicionando mais recursos
    instancesLimit: 2, // Aumentando para 2 instâncias (mínimo necessário para warmup)
    externalNumbersLimit: 5, // Permitindo alguns números externos
  },
  basic: {
    messagesPerDay: 100,
    features: ['TEXT', 'AUDIO', 'STICKER', 'REACTION'],
    instancesLimit: 5,
    externalNumbersLimit: 10,
  },
  pro: {
    messagesPerDay: 500,
    features: ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'STICKER', 'REACTION'],
    instancesLimit: 50,
    externalNumbersLimit: 100,
  },
  enterprise: {
    messagesPerDay: -1, // Ilimitado
    features: ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'STICKER', 'REACTION'],
    instancesLimit: -1, // Ilimitado
    externalNumbersLimit: -1, // Ilimitado
  },
}

// Eventos para o sistema de aquecimento
export interface WarmupEvents {
  'warmup:started': {
    instanceName: string
    organizationId: string
    userId: string
  }
  'warmup:paused': {
    instanceName: string
    organizationId: string
    reason?: string
  }
  'warmup:resumed': { instanceName: string; organizationId: string }
  'warmup:completed': {
    instanceName: string
    organizationId: string
    duration: number
  }
  'warmup:error': {
    instanceName: string
    organizationId: string
    error: string
  }
  'warmup:message:sent': {
    instanceName: string
    messageType: WarmupMessageType
    targetNumber: string
  }
  'warmup:message:received': {
    instanceName: string
    messageType: WarmupMessageType
    fromNumber: string
  }
  'warmup:daily:limit:reached': {
    instanceName: string
    organizationId: string
    limit: number
  }
}

// Tipos para análise de saúde
export type HealthRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type HealthAlertType =
  | 'SPAM_REPORTS'
  | 'HIGH_BLOCK_RATE'
  | 'LOW_RESPONSE_RATE'
  | 'MESSAGE_VOLUME'
  | 'DELIVERY_ISSUES'
  | 'POLICY_VIOLATION'
  | 'UNUSUAL_PATTERN'
  | 'ACCOUNT_WARNING'
  | 'ENGAGEMENT_DROP'
  | 'COMPLIANCE_ISSUE'

export type HealthAlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
export type HealthPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// Interfaces principais
export interface HealthBenchmarks {
  id: string
  optimalResponseRate: number
  maxDailyMessages: number
  maxMessagesPerHour: number
  minResponseTime: number
  maxResponseTime: number
  criticalSpamReports: number
  criticalBlockRate: number
  minDeliveryRate: number
  maxInactivityHours: number
  safeMessagingHours: number[]
  safeDaysOfWeek: number[]
  optimalMessageGap: number
  maxBulkSize: number
  humanBehaviorScore: number
  version: string
  isActive: boolean
}

export interface HealthMetrics {
  id: string
  instanceName: string
  organizationId: string

  // Métricas de atividade
  messagesSent24h: number
  messagesReceived24h: number
  responseRate: number
  averageResponseTime: number
  deliveryRate: number
  readRate: number

  // Métricas de risco
  spamReports: number
  blockRate: number
  policyViolations: number
  warningsReceived: number
  accountRestrictions: number

  // Métricas de comportamento
  messagingFrequency: number
  peakHours: number[]
  messagePatterns: Record<string, any>
  humanBehaviorScore: number

  // Métricas de engajamento
  clickThroughRate: number
  conversionRate: number
  userEngagementScore: number

  // Score geral
  healthScore: number
  riskLevel: HealthRiskLevel
  riskFactors: string[]

  // Compliance
  benchmarkCompliance: number
  deviationScore: number

  // Metadata
  dataQuality: number
  confidenceLevel: number
  samplingPeriod: number

  analyzedAt: Date
  nextAnalysisAt?: Date
}

export interface HealthAlert {
  id: string
  instanceName: string
  organizationId: string
  alertType: HealthAlertType
  severity: HealthAlertSeverity
  title: string
  message: string
  details: Record<string, any>
  actionRequired?: string
  isActive: boolean
  isResolved: boolean
  resolvedAt?: Date
  threshold?: number
  currentValue?: number
  trendDirection?: 'UP' | 'DOWN' | 'STABLE'
  createdAt: Date
}

export interface HealthRecommendation {
  id: string
  instanceName: string
  organizationId: string
  recommendationType: string
  priority: HealthPriority
  title: string
  description: string
  actions: string[]
  expectedImpact?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  estimatedTime?: string
  isImplemented: boolean
  implementedAt?: Date
  effectiveness?: number
  createdAt: Date
}

export interface HealthAnalysisResult {
  healthMetrics: HealthMetrics
  recommendations: HealthRecommendation[]
  alerts: HealthAlert[]
  trends: HealthTrend[]
  compliance: ComplianceReport
}

export interface HealthTrend {
  metric: string
  direction: 'UP' | 'DOWN' | 'STABLE'
  changePercent: number
  significance: 'LOW' | 'MEDIUM' | 'HIGH'
  prediction: {
    nextValue: number
    confidence: number
    timeframe: string
  }
}

export interface ComplianceReport {
  overallScore: number
  categories: {
    messaging: number
    engagement: number
    behavior: number
    policy: number
  }
  violations: {
    count: number
    severity: HealthAlertSeverity
    description: string
  }[]
  recommendations: string[]
}

// Dados brutos para análise
export interface RawInstanceData {
  messagesSent24h: number
  messagesReceived24h: number
  responseRate: number
  deliveryRate: number
  blockRate: number
  spamReports: number
  policyViolations: number
  warningsReceived: number
  averageResponseTime: number
  messagingFrequency: number
  peakHours: number[]
  messagePatterns: Record<string, any>
  userInteractions: {
    clicks: number
    responses: number
    blocks: number
    reports: number
  }
  accountStatus: {
    isVerified: boolean
    hasRestrictions: boolean
    warningCount: number
    lastActivity: Date
  }
  behaviorMetrics: {
    typingPatterns: number[]
    responseDelays: number[]
    messageVariability: number
    humanLikeScore: number
  }
}

// Configurações para análise
export interface AnalysisConfig {
  enableRealTimeAnalysis: boolean
  alertThresholds: Record<HealthAlertType, number>
  analysisFrequency: number // em horas
  retentionPeriod: number // em dias
  confidenceThreshold: number
  enablePredictiveAnalysis: boolean
  benchmarkVersion: string
}

// Constantes de benchmarks WhatsApp Business
export const WHATSAPP_BUSINESS_BENCHMARKS = {
  // Taxas de resposta ideais por categoria
  RESPONSE_RATES: {
    CUSTOMER_SERVICE: 0.85,
    MARKETING: 0.25,
    TRANSACTIONAL: 0.6,
    SUPPORT: 0.75,
  },

  // Limites de volume baseados no tipo de conta
  VOLUME_LIMITS: {
    UNVERIFIED: {
      daily: 250,
      hourly: 50,
    },
    VERIFIED: {
      daily: 1000,
      hourly: 100,
    },
    BUSINESS: {
      daily: 10000,
      hourly: 1000,
    },
  },

  // Métricas de qualidade do WhatsApp
  QUALITY_METRICS: {
    MIN_DELIVERY_RATE: 0.95,
    MAX_BLOCK_RATE: 0.02,
    MAX_SPAM_RATE: 0.01,
    MIN_ENGAGEMENT_RATE: 0.1,
  },

  // Padrões de comportamento humano
  HUMAN_BEHAVIOR: {
    MIN_RESPONSE_DELAY: 5, // segundos
    MAX_RESPONSE_DELAY: 300, // 5 minutos
    TYPING_SPEED_RANGE: [20, 60], // caracteres por minuto
    MESSAGE_VARIABILITY: 0.7, // variação no conteúdo
    ACTIVITY_HOURS: [7, 22], // horário ativo típico
  },

  // Horários seguros (evitar spam detection)
  SAFE_MESSAGING: {
    HOURS: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    DAYS: [1, 2, 3, 4, 5], // Segunda a sexta
    AVOID_HOLIDAYS: true,
    RESPECT_TIMEZONE: true,
  },
} as const

// Algoritmos de scoring
export interface ScoringWeights {
  responseRate: number
  deliveryRate: number
  spamReports: number
  blockRate: number
  humanBehavior: number
  policyCompliance: number
  engagement: number
  messageVolume: number
  timing: number
  variability: number
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  responseRate: 0.2, // 20% - Muito importante
  deliveryRate: 0.15, // 15% - Crítico para deliverabilidade
  spamReports: 0.25, // 25% - Maior peso, mais impacto
  blockRate: 0.15, // 15% - Indicador direto de problemas
  humanBehavior: 0.1, // 10% - Comportamento natural
  policyCompliance: 0.05, // 5% - Compliance básico
  engagement: 0.05, // 5% - Qualidade da interação
  messageVolume: 0.03, // 3% - Volume dentro dos limites
  timing: 0.01, // 1% - Horários apropriados
  variability: 0.01, // 1% - Variação no conteúdo
}
