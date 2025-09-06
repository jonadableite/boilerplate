'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/igniter.client'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Settings,
  Users,
  Video,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useChatSocket } from '@/hooks/use-socket'
import type { Contact, Conversation } from '../../chat.types'

interface ChatLayoutProps {
  children?: React.ReactNode
  selectedConversationId?: string
  onConversationSelect?: (conversationId: string) => void
}

export function ChatLayout({
  children,
  selectedConversationId,
  onConversationSelect,
}: ChatLayoutProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'conversations' | 'contacts'>(
    'conversations',
  )

  // Socket.IO para tempo real
  const { isConnected, joinInbox, on, off } = useChatSocket()

  // Buscar conversas
  const {
    data: conversationsData,
    isLoading: loadingConversations,
    refetch: refetchConversations,
  } = api.chat.listConversations.useQuery({
    search: searchTerm,
    page: 1,
    limit: 50,
    sortBy: 'lastMessageAt',
    sortOrder: 'desc',
  })

  // Buscar contatos
  const {
    data: contactsData,
    isLoading: loadingContacts,
    refetch: refetchContacts,
  } = api.chat.listContacts.useQuery({
    search: searchTerm,
    page: 1,
    limit: 50,
    sortBy: 'lastSeenAt',
    sortOrder: 'desc',
  })

  // Socket.IO: Entrar na inbox e escutar eventos
  useEffect(() => {
    if (isConnected) {
      joinInbox()

      // Listener para novas mensagens
      const handleNewMessage = (data: {
        conversationId: string
        message: {
          id: string
          content: string
          fromMe: boolean
          createdAt: string
        }
      }) => {
        // Refetch conversations to update the list
        refetchConversations()
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
        // Refetch conversations to update the list
        refetchConversations()
      }

      // Listener para novos contatos
      const handleNewContact = (data: {
        contactId: string
        contact: {
          id: string
          name?: string
          whatsappNumber: string
          profilePicUrl?: string
        }
      }) => {
        // Refetch contacts to update the list
        refetchContacts()
      }

      on('message:received', handleNewMessage)
      on('conversation:updated', handleConversationUpdate)
      on('contact:created', handleNewContact)

      return () => {
        off('message:received', handleNewMessage)
        off('conversation:updated', handleConversationUpdate)
        off('contact:created', handleNewContact)
      }
    }
  }, [isConnected, joinInbox, on, off, refetchConversations, refetchContacts])

  const conversations = conversationsData?.data || []
  const contacts = contactsData?.data || []

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Lista de conversas/contatos */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header da sidebar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">WhatsApp CRM</h1>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost">
                <Users className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Barra de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar conversas e contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs para alternar entre conversas e contatos */}
          <div className="flex mt-4 p-1 bg-muted rounded-lg">
            <Button
              variant={selectedTab === 'conversations' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('conversations')}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Conversas
              {conversationsData?.stats.unread > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {conversationsData.stats.unread}
                </Badge>
              )}
            </Button>
            <Button
              variant={selectedTab === 'contacts' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('contacts')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Contatos
            </Button>
          </div>
        </div>

        {/* Lista de conversas/contatos */}
        <ScrollArea className="flex-1">
          {selectedTab === 'conversations' && (
            <div className="p-2">
              {loadingConversations ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma conversa encontrada</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversationId === conversation.id}
                    onClick={() => onConversationSelect?.(conversation.id)}
                  />
                ))
              )}
            </div>
          )}

          {selectedTab === 'contacts' && (
            <div className="p-2">
              {loadingContacts ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum contato encontrado</p>
                </div>
              ) : (
                contacts.map((contact) => (
                  <ContactItem key={contact.id} contact={contact} />
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {/* Botão para nova conversa/contato */}
        <div className="p-4 border-t border-border">
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {selectedTab === 'conversations' ? 'Nova Conversa' : 'Novo Contato'}
          </Button>
        </div>
      </div>

      {/* Área principal - Chat ou conteúdo */}
      <div className="flex-1 flex flex-col">{children || <EmptyState />}</div>
    </div>
  )
}

// Componente para item de conversa
function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}) {
  const contactName =
    conversation.contact?.name ||
    conversation.contact?.whatsappNumber ||
    'Contato'
  const lastMessageTime = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), {
      addSuffix: true,
      locale: ptBR,
    })
    : ''

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted',
      )}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={conversation.contact?.profilePicUrl} />
        <AvatarFallback>{contactName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm truncate">{contactName}</p>
          <span className="text-xs text-muted-foreground">
            {lastMessageTime}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground truncate">
            {conversation.lastMessage || 'Sem mensagens'}
          </p>
          {conversation.unreadCount > 0 && (
            <Badge className="h-5 w-5 rounded-full p-0 text-xs">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente para item de contato
function ContactItem({ contact }: { contact: Contact }) {
  const contactName = contact.name || contact.whatsappNumber
  const lastSeenTime = contact.lastSeenAt
    ? formatDistanceToNow(new Date(contact.lastSeenAt), {
      addSuffix: true,
      locale: ptBR,
    })
    : 'Nunca visto'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LEAD':
        return 'bg-blue-500'
      case 'PROSPECT':
        return 'bg-yellow-500'
      case 'CUSTOMER':
        return 'bg-green-500'
      case 'INACTIVE':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={contact.profilePicUrl} />
          <AvatarFallback>{contactName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background',
            getStatusColor(contact.status),
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm truncate">{contactName}</p>
          <span className="text-xs text-muted-foreground">{lastSeenTime}</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground truncate">
            {contact.funnelStage.replace('_', ' ').toLowerCase()}
          </p>
          {contact.tags.length > 0 && (
            <div className="flex gap-1">
              {contact.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{contact.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Estado vazio quando nenhuma conversa está selecionada
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20">
      <div className="text-center">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">WhatsApp CRM</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          Selecione uma conversa para começar a enviar e receber mensagens.
          Gerencie seus leads e clientes de forma eficiente.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Ligar
          </Button>
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Videochamada
          </Button>
        </div>
      </div>
    </div>
  )
}
