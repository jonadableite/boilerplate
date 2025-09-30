import { igniter } from '@/igniter'
import { Prisma } from '@prisma/client'
import {
  type CRMStats,
  type ContactFilters,
  type ContactListResponse,
  ContactStatus,
  type ConversationFilters,
  type ConversationListResponse,
  ConversationStatus,
  type CreateContactDTO,
  type CreateConversationDTO,
  FunnelStage,
  MessageDirection,
  type MessageFilters,
  type MessageListResponse,
  MessageStatus,
  MessageType,
  type SendMessageDTO,
  type UpdateContactDTO,
  type UpdateConversationDTO,
  type UpdateFunnelStageDTO,
} from '../chat.types'
import { socketService } from '@/services/socket.service'

// Interface para Evolution API Service
interface EvolutionApiService {
  sendText: (data: {
    instanceName: string
    number: string
    text: string
    quoted?: any
    delay?: number
  }) => Promise<any>
  sendMedia: (data: {
    instanceName: string
    number: string
    mediatype: 'image' | 'video' | 'document'
    media: string
    caption?: string
    mimetype?: string
    fileName?: string
  }) => Promise<any>
  sendAudio: (data: {
    instanceName: string
    number: string
    audio: string
  }) => Promise<any>
  sendSticker: (data: {
    instanceName: string
    number: string
    sticker: string
  }) => Promise<any>
  sendButton: (data: {
    instanceName: string
    number: string
    title: string
    description: string
    footer?: string
    buttons: any[]
  }) => Promise<any>
  sendList: (data: {
    instanceName: string
    number: string
    title: string
    description: string
    buttonText: string
    sections: any[]
  }) => Promise<any>
}

// Implementação do serviço Evolution API
const createEvolutionApiService = (): EvolutionApiService => {
  const isServer = typeof window === 'undefined'

  if (!isServer) {
    return {
      sendText: async () => { throw new Error('Só executável no servidor') },
      sendMedia: async () => { throw new Error('Só executável no servidor') },
      sendAudio: async () => { throw new Error('Só executável no servidor') },
      sendSticker: async () => { throw new Error('Só executável no servidor') },
      sendButton: async () => { throw new Error('Só executável no servidor') },
      sendList: async () => { throw new Error('Só executável no servidor') },
    }
  }

  return {
    sendText: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin')
      return await evolutionApi.actions.sendText.handler({
        config: {},
        input: data,
      })
    },
    sendMedia: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin')
      return await evolutionApi.actions.sendMedia.handler({
        config: {},
        input: data,
      })
    },
    sendAudio: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin')
      return await evolutionApi.actions.sendAudio.handler({
        config: {},
        input: data,
      })
    },
    sendSticker: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin')
      return await evolutionApi.actions.sendSticker.handler({
        config: {},
        input: data,
      })
    },
    sendButton: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin')
      return await evolutionApi.actions.sendButton.handler({
        config: {},
        input: data,
      })
    },
    sendList: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin')
      return await evolutionApi.actions.sendList.handler({
        config: {},
        input: data,
      })
    },
  }
}

export const ChatProcedure = igniter.procedure({
  name: 'ChatProcedure',
  handler: async (_, { context }) => {
    // Criar referência para os métodos do chat
    const chatMethods = {
      // Processar mensagem recebida
      processIncomingMessage: async (data: {
        payload: any
        organizationId: string
      }) => {
        const { payload, organizationId } = data
        const messageData = payload.data

        // Extrair informações da mensagem
        const whatsappMessageId = messageData.key.id
        const fromNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '')
        const isFromMe = messageData.key.fromMe
        const instanceName = payload.instance

        // Se a mensagem é nossa, ignorar (já foi processada no envio)
        if (isFromMe) {
          return { processed: false, reason: 'Message from me' }
        }

        // Buscar instância do WhatsApp
        const whatsappInstance = await context.providers.database.whatsAppInstance.findFirst({
          where: {
            instanceName,
            organizationId,
          },
        })

        if (!whatsappInstance) {
          console.error(`[Chat] Instância não encontrada: ${instanceName}`)
          return { processed: false, reason: 'Instance not found' }
        }

        // Implementação continua...
        return { processed: true }
      },

      // Processar atualização de conexão
      processConnectionUpdate: async (data: {
        payload: any
        organizationId: string
      }) => {
        console.log('[Chat] Processando atualização de conexão:', data.payload)
        return { processed: true }
      },

      // Processar atualização de QR Code
      processQRCodeUpdate: async (data: {
        payload: any
        organizationId: string
      }) => {
        console.log('[Chat] Processando atualização de QR Code:', data.payload)
        return { processed: true }
      },
    }

    return {
      chat: {
        // ===== CONTATOS =====

        // Listar contatos com filtros e paginação
        listContacts: async (
          filters: ContactFilters & { organizationId: string }
        ): Promise<ContactListResponse> => {
          const {
            organizationId,
            search,
            status,
            funnelStage,
            assignedTo,
            tags,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
          } = filters

          const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page
          const limitNumber = typeof limit === 'string' ? parseInt(limit, 10) : limit

          // Construir where clause
          const where: Prisma.ContactWhereInput = {
            organizationId,
            ...(search && {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { whatsappNumber: { contains: search } },
              ],
            }),
            ...(status && status !== 'all' && { status }),
            ...(funnelStage && funnelStage !== 'all' && { funnelStage }),
            ...(assignedTo && assignedTo !== 'all' && { assignedToId: assignedTo }),
            ...(tags && tags.length > 0 && {
              tags: { hasSome: tags },
            }),
          }

          // Executar consultas em paralelo
          const [contacts, total, statusStats, funnelStats] = await Promise.all([
            context.providers.database.contact.findMany({
              where,
              skip: (pageNumber - 1) * limitNumber,
              take: limitNumber,
              orderBy: { [sortBy]: sortOrder },
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            }),
            context.providers.database.contact.count({ where }),
            context.providers.database.contact.groupBy({
              by: ['status'],
              where: { organizationId },
              _count: true,
            }),
            context.providers.database.contact.groupBy({
              by: ['funnelStage'],
              where: { organizationId },
              _count: true,
            }),
          ])

          // Processar estatísticas
          const byStatus = statusStats.reduce(
            (acc: Record<ContactStatus, number>, curr: any) => {
              acc[curr.status as ContactStatus] = curr._count
              return acc
            },
            {} as Record<ContactStatus, number>
          )

          const byFunnelStage = funnelStats.reduce(
            (acc: Record<FunnelStage, number>, curr: any) => {
              acc[curr.funnelStage as FunnelStage] = curr._count
              return acc
            },
            {} as Record<FunnelStage, number>
          )

          return {
            data: contacts,
            pagination: {
              page: pageNumber,
              limit: limitNumber,
              total,
              pages: Math.ceil(total / limitNumber),
            },
            stats: {
              total,
              byStatus,
              byFunnelStage,
            },
          }
        },

        // Criar contato
        createContact: async (
          data: CreateContactDTO & { organizationId: string }
        ) => {
          const contact = await context.providers.database.contact.create({
            data: {
              ...data,
              organizationId: data.organizationId,
            },
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          })

          // Registrar histórico de funil
          await context.providers.database.funnelStageHistory.create({
            data: {
              fromStage: null,
              toStage: data.funnelStage || FunnelStage.NEW_LEAD,
              reason: 'Contato criado',
              contactId: contact.id,
              organizationId: data.organizationId,
              changedById: data.assignedToId || contact.id, // Fallback para o próprio contato
            },
          })

          return contact
        },

        // Atualizar contato
        updateContact: async (data: {
          id: string
          organizationId: string
          userId: string
          updates: UpdateContactDTO
        }) => {
          const { id, organizationId, userId, updates } = data

          // Verificar se o contato existe
          const existingContact = await context.providers.database.contact.findFirst({
            where: { id, organizationId },
          })

          if (!existingContact) {
            throw new Error('Contato não encontrado')
          }

          // Se está mudando o estágio do funil, registrar histórico
          if (updates.funnelStage && updates.funnelStage !== existingContact.funnelStage) {
            await context.providers.database.funnelStageHistory.create({
              data: {
                fromStage: existingContact.funnelStage,
                toStage: updates.funnelStage,
                contactId: id,
                organizationId,
                changedById: userId,
              },
            })
          }

          // Atualizar contato
          return await context.providers.database.contact.update({
            where: { id },
            data: updates,
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          })
        },

        // Obter contato por ID
        getContactById: async (data: { id: string; organizationId: string }) => {
          return await context.providers.database.contact.findFirst({
            where: {
              id: data.id,
              organizationId: data.organizationId,
            },
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              conversations: {
                include: {
                  whatsappInstance: {
                    select: {
                      id: true,
                      instanceName: true,
                      profileName: true,
                    },
                  },
                },
                orderBy: { lastMessageAt: 'desc' },
                take: 5,
              },
              funnelStageHistory: {
                include: {
                  changedBy: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          })
        },

        // ===== CONVERSAS =====

        // Listar conversas
        listConversations: async (
          filters: ConversationFilters & { organizationId: string }
        ): Promise<ConversationListResponse> => {
          const {
            organizationId,
            search,
            status,
            assignedTo,
            unreadOnly,
            instanceId,
            page = 1,
            limit = 20,
            sortBy = 'lastMessageAt',
            sortOrder = 'desc',
          } = filters

          const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page
          const limitNumber = typeof limit === 'string' ? parseInt(limit, 10) : limit

          // Construir where clause
          const where: Prisma.ConversationWhereInput = {
            organizationId,
            ...(search && {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { contact: { name: { contains: search, mode: 'insensitive' } } },
                { contact: { whatsappNumber: { contains: search } } },
              ],
            }),
            ...(status && status !== 'all' && { status }),
            ...(assignedTo && assignedTo !== 'all' && { assignedToId: assignedTo }),
            ...(unreadOnly && { unreadCount: { gt: 0 } }),
            ...(instanceId && { whatsappInstanceId: instanceId }),
          }

          // Executar consultas em paralelo
          const [conversations, total, statusStats, unreadCount] = await Promise.all([
            context.providers.database.conversation.findMany({
              where,
              skip: (pageNumber - 1) * limitNumber,
              take: limitNumber,
              orderBy: { [sortBy]: sortOrder },
              include: {
                contact: {
                  select: {
                    id: true,
                    name: true,
                    whatsappNumber: true,
                    profilePicUrl: true,
                    status: true,
                    funnelStage: true,
                  },
                },
                whatsappInstance: {
                  select: {
                    id: true,
                    instanceName: true,
                    profileName: true,
                  },
                },
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            }),
            context.providers.database.conversation.count({ where }),
            context.providers.database.conversation.groupBy({
              by: ['status'],
              where: { organizationId },
              _count: true,
            }),
            context.providers.database.conversation.count({
              where: { organizationId, unreadCount: { gt: 0 } },
            }),
          ])

          // Processar estatísticas
          const byStatus = statusStats.reduce(
            (acc: Record<ConversationStatus, number>, curr: any) => {
              acc[curr.status as ConversationStatus] = curr._count
              return acc
            },
            {} as Record<ConversationStatus, number>
          )

          return {
            data: conversations,
            pagination: {
              page: pageNumber,
              limit: limitNumber,
              total,
              pages: Math.ceil(total / limitNumber),
            },
            stats: {
              total,
              unread: unreadCount,
              byStatus,
            },
          }
        },

        // Criar conversa
        createConversation: async (
          data: CreateConversationDTO & { organizationId: string }
        ) => {
          return await context.providers.database.conversation.create({
            data: {
              ...data,
              organizationId: data.organizationId,
            },
            include: {
              contact: true,
              whatsappInstance: true,
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          })
        },

        // Obter conversa por ID
        getConversationById: async (data: { id: string; organizationId: string }) => {
          return await context.providers.database.conversation.findFirst({
            where: {
              id: data.id,
              organizationId: data.organizationId,
            },
            include: {
              contact: true,
              whatsappInstance: true,
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          })
        },

        // Atualizar conversa
        updateConversation: async (data: {
          id: string
          organizationId: string
          updates: UpdateConversationDTO
        }) => {
          return await context.providers.database.conversation.update({
            where: { id: data.id },
            data: data.updates,
            include: {
              contact: true,
              whatsappInstance: true,
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          })
        },

        // Marcar conversa como lida
        markConversationAsRead: async (data: { id: string; organizationId: string }) => {
          return await context.providers.database.conversation.update({
            where: { id: data.id },
            data: { unreadCount: 0 },
          })
        },

        // ===== MENSAGENS =====

        // Listar mensagens de uma conversa
        listMessages: async (
          filters: MessageFilters & { organizationId: string }
        ): Promise<MessageListResponse> => {
          const {
            organizationId,
            conversationId,
            type,
            direction,
            before,
            after,
            page = 1,
            limit = 50,
          } = filters

          const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page
          const limitNumber = typeof limit === 'string' ? parseInt(limit, 10) : limit

          // Construir where clause
          const where: Prisma.MessageWhereInput = {
            organizationId,
            conversationId,
            ...(type && type !== 'all' && { type }),
            ...(direction && direction !== 'all' && { direction }),
            ...(before && { timestamp: { lt: before } }),
            ...(after && { timestamp: { gt: after } }),
          }

          // Buscar mensagens
          const messages = await context.providers.database.message.findMany({
            where,
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber + 1, // +1 para verificar se há mais
            orderBy: { timestamp: 'desc' },
            include: {
              contact: {
                select: {
                  id: true,
                  name: true,
                  whatsappNumber: true,
                  profilePicUrl: true,
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              quotedMessage: {
                include: {
                  contact: {
                    select: {
                      id: true,
                      name: true,
                      whatsappNumber: true,
                    },
                  },
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          })

          const hasMore = messages.length > limitNumber
          const data = hasMore ? messages.slice(0, limitNumber) : messages

          return {
            data: data.reverse(), // Reverter para ordem cronológica
            pagination: {
              page: pageNumber,
              limit: limitNumber,
              total: data.length, // Aproximação, já que é difícil contar com cursor
              pages: hasMore ? pageNumber + 1 : pageNumber,
            },
            hasMore,
          }
        },

        // Enviar mensagem
        sendMessage: async (data: {
          messageData: SendMessageDTO
          organizationId: string
          userId: string
        }) => {
          const { messageData, organizationId, userId } = data

          // Buscar informações da conversa
          const conversation = await context.providers.database.conversation.findFirst({
            where: {
              id: messageData.conversationId,
              organizationId,
            },
            include: {
              contact: true,
              whatsappInstance: true,
            },
          })

          if (!conversation) {
            throw new Error('Conversa não encontrada')
          }

          if (!conversation.whatsappInstance) {
            throw new Error('Instância do WhatsApp não encontrada')
          }

          if (!conversation.contact) {
            throw new Error('Contato não encontrado')
          }

          // Criar mensagem no banco
          const message = await context.providers.database.message.create({
            data: {
              content: messageData.content,
              type: messageData.type,
              direction: MessageDirection.OUTBOUND,
              status: MessageStatus.PENDING,
              timestamp: new Date(),
              fromMe: true,
              mediaUrl: messageData.mediaUrl,
              mediaType: messageData.mediaType,
              fileName: messageData.fileName,
              quotedMessageId: messageData.quotedMessageId,
              organizationId,
              conversationId: messageData.conversationId,
              contactId: conversation.contactId,
              userId,
            },
            include: {
              contact: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              quotedMessage: {
                include: {
                  contact: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          })

          // Enviar via Evolution API
          try {
            const evolutionApi = createEvolutionApiService()
            let evolutionResponse

            switch (messageData.type) {
              case MessageType.TEXT:
                evolutionResponse = await evolutionApi.sendText({
                  instanceName: conversation.whatsappInstance.instanceName,
                  number: conversation.contact.whatsappNumber,
                  text: messageData.content,
                  quoted: messageData.quotedMessageId
                    ? {
                      key: { id: message.quotedMessage?.whatsappMessageId },
                      message: { conversation: message.quotedMessage?.content },
                    }
                    : undefined,
                })
                break

              case MessageType.IMAGE:
              case MessageType.VIDEO:
              case MessageType.DOCUMENT:
                if (!messageData.mediaUrl) {
                  throw new Error('URL da mídia é obrigatória para este tipo de mensagem')
                }
                evolutionResponse = await evolutionApi.sendMedia({
                  instanceName: conversation.whatsappInstance.instanceName,
                  number: conversation.contact.whatsappNumber,
                  mediatype: messageData.type.toLowerCase() as 'image' | 'video' | 'document',
                  media: messageData.mediaUrl,
                  caption: messageData.content,
                  mimetype: messageData.mediaType,
                  fileName: messageData.fileName,
                })
                break

              case MessageType.AUDIO:
                if (!messageData.mediaUrl) {
                  throw new Error('URL do áudio é obrigatória')
                }
                evolutionResponse = await evolutionApi.sendAudio({
                  instanceName: conversation.whatsappInstance.instanceName,
                  number: conversation.contact.whatsappNumber,
                  audio: messageData.mediaUrl,
                })
                break

              case MessageType.STICKER:
                if (!messageData.mediaUrl) {
                  throw new Error('URL do sticker é obrigatória')
                }
                evolutionResponse = await evolutionApi.sendSticker({
                  instanceName: conversation.whatsappInstance.instanceName,
                  number: conversation.contact.whatsappNumber,
                  sticker: messageData.mediaUrl,
                })
                break

              default:
                throw new Error(`Tipo de mensagem não suportado: ${messageData.type}`)
            }

            // Atualizar status da mensagem
            const updatedMessage = await context.providers.database.message.update({
              where: { id: message.id },
              data: {
                status: MessageStatus.SENT,
                whatsappMessageId: evolutionResponse?.key?.id,
                metadata: evolutionResponse,
              },
              include: {
                contact: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
                quotedMessage: {
                  include: {
                    contact: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            })

            // Atualizar conversa
            const updatedConversation = await context.providers.database.conversation.update({
              where: { id: messageData.conversationId },
              data: {
                lastMessageAt: new Date(),
                lastMessage: messageData.content,
                lastMessageType: messageData.type,
                status: ConversationStatus.OPEN,
              },
              include: {
                contact: true,
                whatsappInstance: true,
              },
            })

            // Emitir evento Socket.IO para nova mensagem enviada
            socketService.emitNewMessage(updatedConversation.id, {
              id: updatedMessage.id,
              content: updatedMessage.content,
              fromMe: updatedMessage.fromMe,
              createdAt: updatedMessage.createdAt.toISOString(),
              contentType: updatedMessage.type,
            })

            return updatedMessage
          } catch (error) {
            console.error('[Chat] Erro ao enviar mensagem:', error)

            // Atualizar status para falha
            await context.providers.database.message.update({
              where: { id: message.id },
              data: {
                status: MessageStatus.FAILED,
                metadata: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
              },
            })

            throw error
          }
        },

        // Processar webhook da Evolution API
        processWebhook: async (data: {
          payload: any
          organizationId: string
        }) => {
          const { payload, organizationId } = data

          console.log('[Chat] Processando webhook:', payload)

          try {
            // Determinar o tipo de evento
            const eventType = payload.event

            switch (eventType) {
              case 'messages.upsert':
                return await chatMethods.processIncomingMessage({ payload, organizationId })

              case 'connection.update':
                return await chatMethods.processConnectionUpdate({ payload, organizationId })

              case 'qrcode.updated':
                return await chatMethods.processQRCodeUpdate({ payload, organizationId })

              default:
                console.log('[Chat] Evento não tratado:', eventType)
                return { processed: false, event: eventType }
            }
          } catch (error) {
            console.error('[Chat] Erro ao processar webhook:', error)
            throw error
          }
        },

        // Processar mensagem recebida
        processIncomingMessage: async (data: {
          payload: any
          organizationId: string
        }) => {
          const { payload, organizationId } = data
          const messageData = payload.data

          // Extrair informações da mensagem
          const whatsappMessageId = messageData.key.id
          const fromNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '')
          const isFromMe = messageData.key.fromMe
          const instanceName = payload.instance

          // Se a mensagem é nossa, ignorar (já foi processada no envio)
          if (isFromMe) {
            return { processed: false, reason: 'Message from me' }
          }

          // Buscar instância do WhatsApp
          const whatsappInstance = await context.providers.database.whatsAppInstance.findFirst({
            where: {
              instanceName,
              organizationId,
            },
          })

          if (!whatsappInstance) {
            console.error(`[Chat] Instância não encontrada: ${instanceName}`)
            return { processed: false, reason: 'Instance not found' }
          }

          // Buscar ou criar contato
          let contact = await context.providers.database.contact.findFirst({
            where: {
              whatsappNumber: fromNumber,
              organizationId,
            },
          })

          if (!contact) {
            // Criar novo contato
            contact = await context.providers.database.contact.create({
              data: {
                whatsappNumber: fromNumber,
                name: messageData.pushName || fromNumber,
                status: ContactStatus.LEAD,
                funnelStage: FunnelStage.NEW_LEAD,
                organizationId,
              },
            })

            // Registrar histórico de funil
            await context.providers.database.funnelStageHistory.create({
              data: {
                fromStage: null,
                toStage: FunnelStage.NEW_LEAD,
                reason: 'Primeiro contato via WhatsApp',
                contactId: contact.id,
                organizationId,
                changedById: contact.id, // Fallback
              },
            })
          }

          // Buscar ou criar conversa
          const chatId = messageData.key.remoteJid
          let conversation = await context.providers.database.conversation.findFirst({
            where: {
              whatsappChatId: chatId,
              whatsappInstanceId: whatsappInstance.id,
              organizationId,
            },
          })

          if (!conversation) {
            conversation = await context.providers.database.conversation.create({
              data: {
                whatsappChatId: chatId,
                isGroup: chatId.includes('@g.us'),
                contactId: contact.id,
                whatsappInstanceId: whatsappInstance.id,
                organizationId,
              },
            })
          }

          // Extrair conteúdo da mensagem
          const message = messageData.message
          let content = ''
          let messageType = MessageType.TEXT
          let mediaUrl: string | undefined
          let mediaType: string | undefined
          let fileName: string | undefined

          if (message.conversation) {
            content = message.conversation
          } else if (message.extendedTextMessage) {
            content = message.extendedTextMessage.text
          } else if (message.imageMessage) {
            content = message.imageMessage.caption || '[Imagem]'
            messageType = MessageType.IMAGE
            mediaUrl = message.imageMessage.url
            mediaType = message.imageMessage.mimetype
          } else if (message.videoMessage) {
            content = message.videoMessage.caption || '[Vídeo]'
            messageType = MessageType.VIDEO
            mediaUrl = message.videoMessage.url
            mediaType = message.videoMessage.mimetype
          } else if (message.audioMessage) {
            content = '[Áudio]'
            messageType = MessageType.AUDIO
            mediaUrl = message.audioMessage.url
            mediaType = message.audioMessage.mimetype
          } else if (message.documentMessage) {
            content = message.documentMessage.title || '[Documento]'
            messageType = MessageType.DOCUMENT
            mediaUrl = message.documentMessage.url
            mediaType = message.documentMessage.mimetype
            fileName = message.documentMessage.fileName
          } else if (message.stickerMessage) {
            content = '[Figurinha]'
            messageType = MessageType.STICKER
            mediaUrl = message.stickerMessage.url
          } else {
            content = '[Mensagem não suportada]'
          }

          // Criar mensagem no banco
          const newMessage = await context.providers.database.message.create({
            data: {
              whatsappMessageId,
              content,
              type: messageType,
              direction: MessageDirection.INBOUND,
              status: MessageStatus.DELIVERED,
              timestamp: new Date(messageData.messageTimestamp * 1000),
              fromMe: false,
              fromName: messageData.pushName,
              fromNumber,
              mediaUrl,
              mediaType,
              fileName,
              organizationId,
              conversationId: conversation.id,
              contactId: contact.id,
            },
          })

          // Atualizar conversa
          await context.providers.database.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: newMessage.timestamp,
              lastMessage: content,
              lastMessageType: messageType,
              unreadCount: { increment: 1 },
              status: ConversationStatus.OPEN,
            },
          })

          // Atualizar último contato do lead
          const updatedContact = await context.providers.database.contact.update({
            where: { id: contact.id },
            data: { lastSeenAt: new Date() },
          })

          // Buscar conversa atualizada com dados completos
          const updatedConversation = await context.providers.database.conversation.findFirst({
            where: { id: conversation.id },
            include: {
              contact: true,
              whatsappInstance: true,
            },
          })

          // Emitir evento Socket.IO para nova mensagem recebida
          socketService.emitNewMessage(updatedConversation!.id, {
            id: newMessage.id,
            content: newMessage.content,
            fromMe: newMessage.fromMe,
            createdAt: newMessage.createdAt.toISOString(),
            contentType: newMessage.type,
          })

          // Emitir evento de atualização de conversa
          socketService.emitConversationUpdate(organizationId, updatedConversation!.id, {
            lastMessage: {
              id: newMessage.id,
              content: newMessage.content,
              fromMe: newMessage.fromMe,
              createdAt: newMessage.createdAt.toISOString(),
            },
            unreadCount: updatedConversation!.unreadCount,
          })

          // Se é um novo contato, emitir evento
          if (contact.createdAt.getTime() === updatedContact.updatedAt?.getTime()) {
            socketService.emitContactUpdate(organizationId, updatedContact.id, {
              name: updatedContact.name,
              lastSeen: updatedContact.lastSeen?.toISOString(),
            })
          }

          return {
            processed: true,
            message: newMessage,
            conversation: updatedConversation,
            contact: updatedContact,
          }
        },

        // Processar atualização de conexão
        processConnectionUpdate: async (data: {
          payload: any
          organizationId: string
        }) => {
          // Implementar lógica para atualizar status da instância
          console.log('[Chat] Connection update:', data.payload)
          return { processed: true }
        },

        // Processar atualização de QR Code
        processQRCodeUpdate: async (data: {
          payload: any
          organizationId: string
        }) => {
          // Implementar lógica para atualizar QR Code
          console.log('[Chat] QR Code update:', data.payload)
          return { processed: true }
        },

        // Atualizar estágio do funil
        updateFunnelStage: async (data: {
          contactId: string
          organizationId: string
          userId: string
          updates: UpdateFunnelStageDTO
        }) => {
          const { contactId, organizationId, userId, updates } = data

          // Buscar contato atual
          const contact = await context.providers.database.contact.findFirst({
            where: { id: contactId, organizationId },
          })

          if (!contact) {
            throw new Error('Contato não encontrado')
          }

          // Registrar histórico
          await context.providers.database.funnelStageHistory.create({
            data: {
              fromStage: contact.funnelStage,
              toStage: updates.funnelStage,
              reason: updates.reason,
              notes: updates.notes,
              contactId,
              organizationId,
              changedById: userId,
            },
          })

          // Atualizar contato
          return await context.providers.database.contact.update({
            where: { id: contactId },
            data: { funnelStage: updates.funnelStage },
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          })
        },

        // Obter estatísticas do CRM
        getCRMStats: async (organizationId: string): Promise<CRMStats> => {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const [
            contactStats,
            contactsByStatus,
            contactsByFunnel,
            newContactsThisMonth,
            conversationStats,
            conversationsByStatus,
            unreadConversations,
            todayMessages,
            inboundToday,
            outboundToday,
          ] = await Promise.all([
            // Total de contatos
            context.providers.database.contact.count({
              where: { organizationId },
            }),

            // Contatos por status
            context.providers.database.contact.groupBy({
              by: ['status'],
              where: { organizationId },
              _count: true,
            }),

            // Contatos por estágio do funil
            context.providers.database.contact.groupBy({
              by: ['funnelStage'],
              where: { organizationId },
              _count: true,
            }),

            // Novos contatos este mês
            context.providers.database.contact.count({
              where: {
                organizationId,
                createdAt: { gte: thirtyDaysAgo },
              },
            }),

            // Total de conversas
            context.providers.database.conversation.count({
              where: { organizationId },
            }),

            // Conversas por status
            context.providers.database.conversation.groupBy({
              by: ['status'],
              where: { organizationId },
              _count: true,
            }),

            // Conversas não lidas
            context.providers.database.conversation.count({
              where: {
                organizationId,
                unreadCount: { gt: 0 },
              },
            }),

            // Mensagens de hoje
            context.providers.database.message.count({
              where: {
                organizationId,
                createdAt: { gte: today },
              },
            }),

            // Mensagens recebidas hoje
            context.providers.database.message.count({
              where: {
                organizationId,
                direction: MessageDirection.INBOUND,
                createdAt: { gte: today },
              },
            }),

            // Mensagens enviadas hoje
            context.providers.database.message.count({
              where: {
                organizationId,
                direction: MessageDirection.OUTBOUND,
                createdAt: { gte: today },
              },
            }),
          ])

          // Processar estatísticas
          const byStatus = contactsByStatus.reduce(
            (acc: Record<ContactStatus, number>, curr: any) => {
              acc[curr.status as ContactStatus] = curr._count
              return acc
            },
            {} as Record<ContactStatus, number>
          )

          const byFunnelStage = contactsByFunnel.reduce(
            (acc: Record<FunnelStage, number>, curr: any) => {
              acc[curr.funnelStage as FunnelStage] = curr._count
              return acc
            },
            {} as Record<FunnelStage, number>
          )

          const convByStatus = conversationsByStatus.reduce(
            (acc: Record<ConversationStatus, number>, curr: any) => {
              acc[curr.status as ConversationStatus] = curr._count
              return acc
            },
            {} as Record<ConversationStatus, number>
          )

          // Calcular taxas de conversão
          const totalLeads = byFunnelStage[FunnelStage.NEW_LEAD] || 0
          const totalProspects = byFunnelStage[FunnelStage.QUALIFIED] || 0
          const totalCustomers = byStatus[ContactStatus.CUSTOMER] || 0

          const leadToProspect = totalLeads > 0 ? (totalProspects / totalLeads) * 100 : 0
          const prospectToCustomer = totalProspects > 0 ? (totalCustomers / totalProspects) * 100 : 0
          const overallConversion = totalLeads > 0 ? (totalCustomers / totalLeads) * 100 : 0

          return {
            contacts: {
              total: contactStats,
              newThisMonth: newContactsThisMonth,
              byStatus,
              byFunnelStage,
            },
            conversations: {
              total: conversationStats,
              unread: unreadConversations,
              activeToday: 0, // TODO: calcular conversas ativas hoje
              byStatus: convByStatus,
            },
            messages: {
              totalToday: todayMessages,
              inbound: inboundToday,
              outbound: outboundToday,
              avgResponseTime: 0, // TODO: calcular tempo médio de resposta
            },
            conversionRates: {
              leadToProspect: Math.round(leadToProspect * 100) / 100,
              prospectToCustomer: Math.round(prospectToCustomer * 100) / 100,
              overallConversion: Math.round(overallConversion * 100) / 100,
            },
          }
        },
      },
    }
  },
})