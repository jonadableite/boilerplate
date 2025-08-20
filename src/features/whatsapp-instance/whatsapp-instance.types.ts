import type { Organization, User } from '@prisma/client'
import { z } from 'zod'

// Enum para status de conexão
export enum InstanceConnectionStatus {
  OPEN = 'open',
  CLOSE = 'close',
  CONNECTING = 'connecting',
}

// Interface principal
export interface WhatsAppInstance {
  id: string
  instanceName: string
  status: InstanceConnectionStatus
  ownerJid: string | null
  profileName: string | null
  profilePicUrl: string | null
  lastSeen: Date | null
  metadata: Record<string, any> | null
  organizationId: string
  userId: string
  createdById: string
  createdAt: Date
  updatedAt: Date

  // Relacionamentos
  organization?: Organization
  user?: User
  createdBy?: User
}

// Schema Zod para validação
export const createWhatsAppInstanceSchema = z.object({
  instanceName: z
    .string()
    .min(3, 'Nome da instância deve ter no mínimo 3 caracteres'),
  webhook: z
    .object({
      url: z.string().url('URL do webhook inválida').optional(),
      events: z.array(z.string()).optional(),
    })
    .optional(),
})

// DTOs
export type CreateWhatsAppInstanceDTO = z.infer<
  typeof createWhatsAppInstanceSchema
>

export interface UpdateWhatsAppInstanceDTO {
  instanceName?: string
  metadata?: Record<string, any>
}

// Tipos para listagem e filtros
export interface WhatsAppInstanceFilters {
  status?: InstanceConnectionStatus | 'all'
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface WhatsAppInstanceStats {
  total: number
  connected: number
  connecting: number
  disconnected: number
}

export interface WhatsAppInstanceListResponse {
  data: WhatsAppInstance[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: WhatsAppInstanceStats
}

// Tipos para eventos e websocket
export interface WhatsAppInstanceEvent {
  type: 'status_change' | 'message' | 'connection'
  instanceId: string
  data: any
}

// Tipos para Proxy
export interface ProxyConfig {
  enabled: boolean
  host: string
  port: string
  protocol: 'http' | 'https' | 'socks4' | 'socks5'
  username?: string
  password?: string
}

export const setProxySchema = z.object({
  enabled: z.boolean().describe('Habilitar ou desabilitar proxy'),
  host: z.string().min(1, 'Host é obrigatório').describe('Host do proxy'),
  port: z
    .string()
    .min(1, 'Porta é obrigatória')
    .regex(/^\d+$/, 'Porta deve ser um número')
    .describe('Porta do proxy'),
  protocol: z
    .enum(['http', 'https', 'socks4', 'socks5'])
    .describe('Protocolo do proxy'),
  username: z.string().optional().describe('Nome de usuário do proxy'),
  password: z.string().optional().describe('Senha do proxy'),
})

export type SetProxyDTO = z.infer<typeof setProxySchema>

// Tipos para conexão de instância
export interface ConnectInstanceResponse {
  success: boolean
  message: string
  data: WhatsAppInstance
  hasQrCode: boolean
  qrCode: {
    base64: string
    code?: string
  } | null
  evolutionResponse: any
}

// Adicionar hasProxy ao WhatsAppInstance interface
export interface WhatsAppInstanceWithProxy extends WhatsAppInstance {
  hasProxy?: boolean
  proxyConfig?: ProxyConfig | null
}
