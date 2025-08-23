import { z } from 'zod'

// Tipos para Campanhas
export const CampaignStatusEnum = z.enum([
  'DRAFT',
  'SCHEDULED',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
  'ERROR',
])

export const CampaignTypeEnum = z.enum(['IMMEDIATE', 'SCHEDULED', 'RECURRING'])

export const LeadStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
  'BLOCKED',
])

// Schema para criação de campanha
export const CreateCampaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  mediaType: z.enum(['image', 'video', 'audio', 'sticker']).optional(),
  mediaUrl: z.string().url().optional(),
  mediaCaption: z.string().optional(),
  mediaBase64: z.string().optional(),
  minDelay: z
    .number()
    .min(5, 'Delay mínimo deve ser pelo menos 5 segundos')
    .max(300, 'Delay máximo deve ser no máximo 300 segundos'),
  maxDelay: z
    .number()
    .min(5, 'Delay máximo deve ser pelo menos 5 segundos')
    .max(600, 'Delay máximo deve ser no máximo 600 segundos'),
  useInstanceRotation: z.boolean().default(true),
  selectedInstances: z
    .array(z.string())
    .min(1, 'Selecione pelo menos uma instância'),
  scheduledAt: z.date().optional(),
  timezone: z.string().default('America/Sao_Paulo'),
  recurring: z
    .object({
      enabled: z.boolean(),
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      interval: z.number().min(1).optional(),
      endDate: z.date().optional(),
    })
    .optional(),
  type: CampaignTypeEnum.default('IMMEDIATE'),
})

// Schema para atualização de campanha
export const UpdateCampaignSchema = CreateCampaignSchema.partial()

// Schema para envio de leads
export const UploadLeadsSchema = z.object({
  campaignId: z.string().uuid(),
  leads: z
    .array(
      z.object({
        name: z.string().optional(),
        phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
        email: z.string().email().optional(),
      }),
    )
    .min(1, 'Adicione pelo menos um lead'),
})

// Schema para disparo imediato
export const StartDispatchSchema = z.object({
  campaignId: z.string().uuid(),
  instanceName: z.string().optional(), // Opcional se usar rotação
  message: z.string().min(1, 'Mensagem é obrigatória'),
  media: z
    .object({
      type: z.enum(['image', 'video', 'audio', 'sticker']),
      media: z.string(), // base64
      caption: z.string().optional(),
      fileName: z.string().optional(),
      mimetype: z.string().optional(),
    })
    .optional(),
  minDelay: z.number().min(5).max(300),
  maxDelay: z.number().min(5).max(600),
})

// Schema para agendamento
export const ScheduleCampaignSchema = z.object({
  campaignId: z.string().uuid(),
  scheduledAt: z.date(),
  timezone: z.string().default('America/Sao_Paulo'),
  recurring: z
    .object({
      enabled: z.boolean(),
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().min(1),
      endDate: z.date().optional(),
    })
    .optional(),
})

// Tipos de resposta
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>
export type UploadLeadsInput = z.infer<typeof UploadLeadsSchema>
export type StartDispatchInput = z.infer<typeof StartDispatchSchema>
export type ScheduleCampaignInput = z.infer<typeof ScheduleCampaignSchema>

// Tipos para instâncias com informações de saúde
export interface InstanceHealthInfo {
  instanceName: string
  status: 'open' | 'close' | 'connecting'
  warmupProgress: number // 0-100
  healthScore: number // 0-100
  isRecommended: boolean
  lastSeen: Date | null
  messagesSent24h: number
  messagesReceived24h: number
  responseRate: number
  deliveryRate: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// Tipos para estatísticas da campanha
export interface CampaignStats {
  totalLeads: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  blockedCount: number
  deliveryRate: number
  readRate: number
  averageDeliveryTime: number
  averageReadTime: number
  progress: number
}

// Tipos para leads da campanha
export interface CampaignLead {
  id: string
  name?: string
  phone: string
  email?: string
  status: string
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  failedAt?: Date
  failureReason?: string
  retryCount: number
  messageId?: string
  createdAt: Date
  updatedAt: Date
}

// Tipos para campanha
export interface Campaign {
  id: string
  name: string
  description?: string
  message: string
  mediaType?: string
  mediaUrl?: string
  mediaCaption?: string
  mediaBase64?: string
  minDelay: number
  maxDelay: number
  useInstanceRotation: boolean
  selectedInstances: string[]
  scheduledAt?: Date
  timezone: string
  recurring?: any
  status: string
  type: string
  progress: number
  totalLeads: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  organizationId: string
  createdById: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
  startedAt?: Date
  completedAt?: Date
}

// Tipos para resposta da Evolution API
export interface EvolutionApiResponse {
  key?: {
    id: string
    remoteJid?: string
    fromMe?: boolean
  }
  message?: {
    conversation?: string
    imageMessage?: {
      caption?: string
    }
    videoMessage?: {
      caption?: string
    }
  }
  messageTimestamp?: number
  messageType?: string
  status?: string
}

// Tipos para mídia
export interface MediaContent {
  type: 'image' | 'video' | 'audio' | 'sticker' | 'document'
  media: string // base64
  caption?: string
  fileName?: string
  mimetype?: string
}

// Tipos para serviço de rotação de instâncias
export interface InstanceRotationService {
  getNextAvailableInstance(
    campaignId: string,
  ): Promise<InstanceHealthInfo | null>
  getInstanceHealth(instanceName: string): Promise<InstanceHealthInfo>
  getAllInstancesHealth(): Promise<InstanceHealthInfo[]>
}

// Tipos para serviço de limpeza de metadados
export interface MetadataCleanerService {
  cleanMediaMetadata(
    media: string,
    fileName: string,
    mimetype: string,
  ): Promise<{
    success: boolean
    cleanedMedia?: {
      data: string
      fileName: string
      mimetype: string
    }
    originalSize: number
    cleanedSize: number
    error?: string
  }>

  checkDependencies(): Promise<{
    exifTool: boolean
    ffmpeg: boolean
  }>

  getMetadataInfo(
    media: string,
    fileName: string,
  ): Promise<{
    hasMetadata: boolean
    metadataTypes: string[]
    fileSize: number
  }>
}