'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/igniter.client'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  MoreVertical,
  Paperclip,
  Phone,
  Play,
  Send,
  Smile,
  Video,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Message, MessageType } from '../../chat.types'
import { useChatSocket } from '@/hooks/use-socket'

interface ChatAreaProps {
  conversationId: string
}

export function ChatArea({ conversationId }: ChatAreaProps) {
  const [messageText, setMessageText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Socket.IO para tempo real
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    on,
    off,
  } = useChatSocket()

  // Buscar dados da conversa
  const { data: conversation } = api.chat.getConversation.useQuery(
    { id: conversationId },
    { enabled: !!conversationId },
  )

  // Buscar mensagens
  const {
    data: messagesData,
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = api.chat.listMessages.useQuery(
    {
      conversationId,
      page: 1,
      limit: 100,
    },
    { enabled: !!conversationId },
  )

  // Marcar conversa como lida
  const markAsReadMutation = api.chat.markConversationAsRead.useMutation()

  // Enviar mensagem
  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText('')
      refetchMessages()
      // Scroll para o final
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      }, 100)
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem')
      console.error('Erro ao enviar mensagem:', error)
    },
  })

  const messages = messagesData?.data || []

  // Marcar como lida quando a conversa é aberta
  useEffect(() => {
    if (conversationId && conversation?.unreadCount > 0) {
      markAsReadMutation.mutate({ id: conversationId })
    }
  }, [conversationId, conversation?.unreadCount])

  // Scroll automático para o final quando novas mensagens chegam
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages.length])

  // Focar no input quando a conversa muda
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [conversationId])

  // Socket.IO: Entrar na sala da conversa
  useEffect(() => {
    if (conversationId && isConnected) {
      joinConversation(conversationId)

      // Listener para novas mensagens
      const handleNewMessage = (data: {
        conversationId: string
        message: {
          id: string
          content: string
          fromMe: boolean
          createdAt: string
          contentType: string
        }
      }) => {
        if (data.conversationId === conversationId) {
          // Refetch messages to get the new message
          refetchMessages()
          
          // Scroll to bottom
          setTimeout(() => {
            if (scrollAreaRef.current) {
              scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
            }
          }, 100)
        }
      }

      // Listener para atualizações de conversa
      const handleConversationUpdate = (data: {
        conversationId: string
        lastMessage?: {
          id: string
          content: string
          fromMe: boolean
          createdAt: string
        }
        unreadCount?: number
      }) => {
        if (data.conversationId === conversationId) {
          // Refetch conversation data
          refetchMessages()
        }
      }

      on('message:received', handleNewMessage)
      on('conversation:updated', handleConversationUpdate)

      return () => {
        off('message:received', handleNewMessage)
        off('conversation:updated', handleConversationUpdate)
        leaveConversation(conversationId)
      }
    }
  }, [conversationId, isConnected, joinConversation, leaveConversation, on, off, refetchMessages])

  const handleSendMessage = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return

    sendMessageMutation.mutate({
      conversationId,
      content: messageText.trim(),
      type: 'TEXT' as MessageType,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessageText(value)

    // Send typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      startTyping(conversationId)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping(conversationId)
    }, 1000)
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando conversa...</p>
        </div>
      </div>
    )
  }

  const contactName =
    conversation.contact?.name ||
    conversation.contact?.whatsappNumber ||
    'Contato'

  return (
    <div className="flex-1 flex flex-col">
      {/* Header da conversa */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.contact?.profilePicUrl} />
              <AvatarFallback>
                {contactName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <h3 className="font-medium">{contactName}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{conversation.contact?.whatsappNumber}</span>
                {conversation.contact?.status && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {conversation.contact.status}
                    </Badge>
                  </>
                )}
                {conversation.contact?.funnelStage && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {conversation.contact.funnelStage
                        .replace('_', ' ')
                        .toLowerCase()}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <Video className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loadingMessages ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                  <div className="h-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="font-medium mb-2">Comece uma conversa</h3>
            <p className="text-sm text-center max-w-md">
              Esta é uma nova conversa. Envie uma mensagem para iniciar o
              atendimento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
                showAvatar={
                  index === 0 ||
                  messages[index - 1]?.direction !== message.direction
                }
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Indicador de digitação */}
      {isTyping && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <span>{contactName} está digitando...</span>
          </div>
        </div>
      )}

      {/* Input de mensagem */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end gap-3">
          <Button size="icon" variant="ghost">
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Digite uma mensagem..."
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              className="pr-12"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            size="icon"
          >
            {sendMessageMutation.isPending ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Componente para exibir uma mensagem
function MessageBubble({
  message,
  isLast,
  showAvatar,
}: {
  message: Message
  isLast: boolean
  showAvatar: boolean
}) {
  const isOutbound = message.direction === 'OUTBOUND'
  const senderName = isOutbound
    ? message.user?.name || 'Você'
    : message.contact?.name || message.fromName || 'Contato'

  const getStatusIcon = () => {
    switch (message.status) {
      case 'PENDING':
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case 'SENT':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'DELIVERED':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'READ':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'FAILED':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const getMediaContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <div className="relative group">
            <img
              src={message.mediaUrl}
              alt="Imagem"
              className="max-w-sm rounded-lg cursor-pointer"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button size="icon" variant="secondary">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case 'VIDEO':
        return (
          <div className="relative group max-w-sm">
            <video
              src={message.mediaUrl}
              className="rounded-lg w-full"
              controls
              poster={message.mediaUrl}
            />
          </div>
        )

      case 'AUDIO':
        return (
          <div className="flex items-center gap-3 bg-muted p-3 rounded-lg max-w-sm">
            <Button size="icon" variant="ghost">
              <Play className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="h-1 bg-muted-foreground/20 rounded-full">
                <div className="h-1 bg-primary rounded-full w-1/3" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">0:30</span>
          </div>
        )

      case 'DOCUMENT':
        return (
          <div className="flex items-center gap-3 bg-muted p-3 rounded-lg max-w-sm cursor-pointer hover:bg-muted/80 transition-colors">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium text-sm">
                {message.fileName || 'Documento'}
              </p>
              <p className="text-xs text-muted-foreground">
                {message.fileSize
                  ? `${(message.fileSize / 1024).toFixed(1)} KB`
                  : 'Arquivo'}
              </p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>
        )

      case 'STICKER':
        return (
          <img
            src={message.mediaUrl}
            alt="Figurinha"
            className="w-32 h-32 object-cover"
            loading="lazy"
          />
        )

      default:
        return null
    }
  }

  return (
    <div
      className={cn('flex gap-3', isOutbound ? 'flex-row-reverse' : 'flex-row')}
    >
      {showAvatar && !isOutbound && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.contact?.profilePicUrl} />
          <AvatarFallback className="text-xs">
            {senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'flex flex-col max-w-[70%]',
          isOutbound ? 'items-end' : 'items-start',
          !showAvatar && !isOutbound && 'ml-11',
        )}
      >
        {showAvatar && (
          <p className="text-xs text-muted-foreground mb-1 px-1">
            {senderName}
          </p>
        )}

        <div
          className={cn(
            'rounded-lg px-4 py-2 break-words',
            isOutbound
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {/* Mensagem citada */}
          {message.quotedMessage && (
            <div className="border-l-2 border-muted-foreground/20 pl-2 mb-2 text-xs opacity-70">
              <p className="font-medium">
                {message.quotedMessage.contact?.name ||
                  message.quotedMessage.user?.name ||
                  'Usuário'}
              </p>
              <p className="truncate">{message.quotedMessage.content}</p>
            </div>
          )}

          {/* Conteúdo da mídia */}
          {message.type !== 'TEXT' && getMediaContent()}

          {/* Texto da mensagem */}
          {message.content && message.type === 'TEXT' && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Caption para mídia */}
          {message.content && message.type !== 'TEXT' && (
            <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Timestamp e status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 px-1',
            isOutbound ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
          {isOutbound && getStatusIcon()}
        </div>
      </div>
    </div>
  )
}
