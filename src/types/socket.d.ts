import { Server as SocketIOServer } from 'socket.io'

declare global {
  var io: SocketIOServer | undefined
}

export interface ServerToClientEvents {
  // Chat events
  'message:received': (data: {
    conversationId: string
    message: {
      id: string
      content: string
      fromMe: boolean
      createdAt: string
      contentType: string
    }
  }) => void

  'conversation:updated': (data: {
    conversationId: string
    lastMessage?: {
      id: string
      content: string
      fromMe: boolean
      createdAt: string
    }
    unreadCount?: number
  }) => void

  'contact:updated': (data: {
    contactId: string
    name?: string
    lastSeen?: string
  }) => void

  // Connection events
  'whatsapp:status': (data: {
    instanceId: string
    status: string
    qrCode?: string
  }) => void
}

export interface ClientToServerEvents {
  // Room management
  'join_conversation': (data: { conversationId: string }) => void
  'leave_conversation': (data: { conversationId: string }) => void
  'join_inbox': (data: { organizationId: string }) => void
  'leave_inbox': (data: { organizationId: string }) => void

  // Message events
  'send_message': (data: {
    conversationId: string
    content: string
    contentType?: string
  }) => void

  // Typing indicators
  'typing_start': (data: { conversationId: string }) => void
  'typing_stop': (data: { conversationId: string }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId?: string
  organizationId?: string
}