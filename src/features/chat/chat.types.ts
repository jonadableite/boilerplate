import { z } from 'zod'

// Enums do Prisma
export enum ContactStatus {
  LEAD = 'LEAD',
  PROSPECT = 'PROSPECT',
  CUSTOMER = 'CUSTOMER',
  INACTIVE = 'INACTIVE',
}

export enum FunnelStage {
  NEW_LEAD = 'NEW_LEAD',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATING = 'NEGOTIATING',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  STICKER = 'STICKER',
  BUTTON_REPLY = 'BUTTON_REPLY',
  LIST_REPLY = 'LIST_REPLY',
  LOCATION = 'LOCATION',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum ConversationStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

// Tipos de dados principais
export type Contact = {
  id: string
  whatsappNumber: string
  name?: string
  email?: string
  profilePicUrl?: string
  status: ContactStatus
  funnelStage: FunnelStage
  tags: string[]
  notes?: string
  lastSeenAt?: Date
  isBlocked: boolean
  metadata?: Record<string, any>
  organizationId: string
  assignedToId?: string
  assignedTo?: {
    id: string
    name: string
    email: string
    image?: string
  }
  createdAt: Date
  updatedAt: Date
}

export type Conversation = {
  id: string
  whatsappChatId: string
  title?: string
  status: ConversationStatus
  isGroup: boolean
  unreadCount: number
  lastMessageAt?: Date
  lastMessage?: string
  lastMessageType?: MessageType
  organizationId: string
  whatsappInstanceId: string
  whatsappInstance?: {
    id: string
    instanceName: string
    profileName?: string
  }
  contactId?: string
  contact?: Contact
  assignedToId?: string
  assignedTo?: {
    id: string
    name: string
    email: string
    image?: string
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type Message = {
  id: string
  whatsappMessageId?: string
  content: string
  type: MessageType
  direction: MessageDirection
  status: MessageStatus
  mediaUrl?: string
  mediaType?: string
  fileName?: string
  fileSize?: number
  quotedMessageId?: string
  quotedMessage?: Message
  timestamp: Date
  fromMe: boolean
  fromName?: string
  fromNumber?: string
  organizationId: string
  conversationId: string
  contactId?: string
  contact?: Contact
  userId?: string
  user?: {
    id: string
    name: string
    email: string
    image?: string
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type FunnelStageHistory = {
  id: string
  fromStage?: FunnelStage
  toStage: FunnelStage
  reason?: string
  notes?: string
  contactId: string
  organizationId: string
  changedById: string
  changedBy: {
    id: string
    name: string
    email: string
  }
  createdAt: Date
}

// Esquemas de validação
export const createContactSchema = z.object({
  whatsappNumber: z.string().min(1, 'Número do WhatsApp é obrigatório'),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.nativeEnum(ContactStatus).default(ContactStatus.LEAD),
  funnelStage: z.nativeEnum(FunnelStage).default(FunnelStage.NEW_LEAD),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
})

export const updateContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.nativeEnum(ContactStatus).optional(),
  funnelStage: z.nativeEnum(FunnelStage).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
  isBlocked: z.boolean().optional(),
})

export const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, 'Conteúdo da mensagem é obrigatório'),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  quotedMessageId: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.string().optional(),
  fileName: z.string().optional(),
})

export const createConversationSchema = z.object({
  whatsappChatId: z.string(),
  title: z.string().optional(),
  isGroup: z.boolean().default(false),
  whatsappInstanceId: z.string(),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
})

export const updateConversationSchema = z.object({
  title: z.string().optional(),
  status: z.nativeEnum(ConversationStatus).optional(),
  assignedToId: z.string().optional(),
})

export const updateFunnelStageSchema = z.object({
  funnelStage: z.nativeEnum(FunnelStage),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

// DTOs de resposta
export type ContactListResponse = {
  data: Contact[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    total: number
    byStatus: Record<ContactStatus, number>
    byFunnelStage: Record<FunnelStage, number>
  }
}

export type ConversationListResponse = {
  data: Conversation[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    total: number
    unread: number
    byStatus: Record<ConversationStatus, number>
  }
}

export type MessageListResponse = {
  data: Message[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  hasMore: boolean
}

// Filtros e consultas
export type ContactFilters = {
  search?: string
  status?: ContactStatus | 'all'
  funnelStage?: FunnelStage | 'all'
  assignedTo?: string | 'all'
  tags?: string[]
  page?: number
  limit?: number
  sortBy?: 'name' | 'createdAt' | 'lastSeenAt' | 'funnelStage'
  sortOrder?: 'asc' | 'desc'
}

export type ConversationFilters = {
  search?: string
  status?: ConversationStatus | 'all'
  assignedTo?: string | 'all'
  unreadOnly?: boolean
  instanceId?: string
  page?: number
  limit?: number
  sortBy?: 'lastMessageAt' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export type MessageFilters = {
  conversationId: string
  type?: MessageType | 'all'
  direction?: MessageDirection | 'all'
  before?: Date
  after?: Date
  page?: number
  limit?: number
}

// Tipos para WebSocket/Real-time
export type ChatEvent = {
  type: 'NEW_MESSAGE' | 'MESSAGE_UPDATE' | 'CONVERSATION_UPDATE' | 'CONTACT_UPDATE'
  data: Message | Conversation | Contact
  organizationId: string
  conversationId?: string
  contactId?: string
}

// Estatísticas do CRM
export type CRMStats = {
  contacts: {
    total: number
    newThisMonth: number
    byStatus: Record<ContactStatus, number>
    byFunnelStage: Record<FunnelStage, number>
  }
  conversations: {
    total: number
    unread: number
    activeToday: number
    byStatus: Record<ConversationStatus, number>
  }
  messages: {
    totalToday: number
    inbound: number
    outbound: number
    avgResponseTime: number // em minutos
  }
  conversionRates: {
    leadToProspect: number
    prospectToCustomer: number
    overallConversion: number
  }
}

// Tipos para integração com Evolution API
export type EvolutionWebhookPayload = {
  event: string
  instance: string
  data: {
    key?: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    message?: any
    messageTimestamp?: number
    pushName?: string
    status?: string
    participant?: string
  }
}

export type WhatsAppMediaMessage = {
  mediaType: 'image' | 'video' | 'audio' | 'document'
  media: string // base64 ou URL
  fileName?: string
  caption?: string
  mimetype?: string
}

export type WhatsAppTextMessage = {
  text: string
  quoted?: {
    key: { id: string }
    message: { conversation: string }
  }
  mentions?: string[]
}

export type WhatsAppButtonMessage = {
  title: string
  description: string
  footer?: string
  buttons: Array<{
    type: 'reply' | 'url' | 'call' | 'copy' | 'pix'
    displayText: string
    id?: string
    url?: string
    phoneNumber?: string
    copyCode?: string
  }>
}

export type WhatsAppListMessage = {
  title: string
  description: string
  buttonText: string
  footerText?: string
  sections: Array<{
    title: string
    rows: Array<{
      title: string
      description?: string
      rowId: string
    }>
  }>
}

// Tipos de dados dos DTOs
export type CreateContactDTO = z.infer<typeof createContactSchema>
export type UpdateContactDTO = z.infer<typeof updateContactSchema>
export type SendMessageDTO = z.infer<typeof sendMessageSchema>
export type CreateConversationDTO = z.infer<typeof createConversationSchema>
export type UpdateConversationDTO = z.infer<typeof updateConversationSchema>
export type UpdateFunnelStageDTO = z.infer<typeof updateFunnelStageSchema>