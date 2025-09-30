import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'
import { igniter } from '@/igniter'
import { z } from 'zod'
import {
  ContactStatus,
  ConversationStatus,
  createContactSchema,
  createConversationSchema,
  FunnelStage,
  MessageDirection,
  MessageType,
  sendMessageSchema,
  updateContactSchema,
  updateConversationSchema,
  updateFunnelStageSchema,
} from '../chat.types'
import { ChatProcedure } from '../procedures/chat.procedure'

export const ChatController = igniter.controller({
  path: '/chat',
  actions: {
    // ===== ENDPOINTS DE CONTATOS =====

    // Listar contatos
    listContacts: igniter.query({
      method: 'GET',
      path: '/contacts',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      query: z.object({
        search: z.string().optional(),
        status: z.union([z.literal('all'), z.nativeEnum(ContactStatus)]).optional(),
        funnelStage: z.union([z.literal('all'), z.nativeEnum(FunnelStage)]).optional(),
        assignedTo: z.union([z.literal('all'), z.string()]).optional(),
        tags: z.array(z.string()).optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        sortBy: z.enum(['name', 'createdAt', 'lastSeenAt', 'funnelStage']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const result = await context.chat.listContacts({
          organizationId: session.organization.id,
          ...request.query,
        })

        return response.success(result)
      },
    }),

    // Criar contato
    createContact: igniter.mutation({
      method: 'POST',
      path: '/contacts',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      body: createContactSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const contact = await context.chat.createContact({
          ...request.body,
          organizationId: session.organization.id,
          status: request.body.status ?? ContactStatus.LEAD,
          funnelStage: request.body.funnelStage ?? FunnelStage.NEW_LEAD,
          tags: request.body.tags ?? [],
        })

        return response.created(contact)
      },
    }),

    // Obter contato por ID
    getContact: igniter.query({
      method: 'GET',
      path: '/contacts/:id',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const contact = await context.chat.getContactById({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        if (!contact) {
          return response.notFound('Contato não encontrado')
        }

        return response.success(contact)
      },
    }),

    // Atualizar contato
    updateContact: igniter.mutation({
      method: 'PUT',
      path: '/contacts/:id',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      body: updateContactSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const contact = await context.chat.updateContact({
          id: request.params.id,
          organizationId: session.organization.id,
          userId: session.user.id,
          updates: request.body,
        })

        return response.success(contact)
      },
    }),

    // Atualizar estágio do funil
    updateFunnelStage: igniter.mutation({
      method: 'PUT',
      path: '/contacts/:id/funnel-stage',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      body: updateFunnelStageSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const contact = await context.chat.updateFunnelStage({
          contactId: request.params.id,
          organizationId: session.organization.id,
          userId: session.user.id,
          updates: request.body,
        })

        return response.success(contact)
      },
    }),

    // ===== ENDPOINTS DE CONVERSAS =====

    // Listar conversas
    listConversations: igniter.query({
      method: 'GET',
      path: '/conversations',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      query: z.object({
        search: z.string().optional(),
        status: z.union([z.literal('all'), z.nativeEnum(ConversationStatus)]).optional(),
        assignedTo: z.union([z.literal('all'), z.string()]).optional(),
        unreadOnly: z.coerce.boolean().optional(),
        instanceId: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        sortBy: z.enum(['lastMessageAt', 'createdAt']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const result = await context.chat.listConversations({
          organizationId: session.organization.id,
          ...request.query,
        })

        return response.success(result)
      },
    }),

    // Criar conversa
    createConversation: igniter.mutation({
      method: 'POST',
      path: '/conversations',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      body: createConversationSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const conversation = await context.chat.createConversation({
          ...request.body,
          organizationId: session.organization.id,
          isGroup: request.body.isGroup ?? false,
        })

        return response.created(conversation)
      },
    }),

    // Obter conversa por ID
    getConversation: igniter.query({
      method: 'GET',
      path: '/conversations/:id',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const conversation = await context.chat.getConversationById({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        if (!conversation) {
          return response.notFound('Conversa não encontrada')
        }

        return response.success(conversation)
      },
    }),

    // Atualizar conversa
    updateConversation: igniter.mutation({
      method: 'PUT',
      path: '/conversations/:id',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      body: updateConversationSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const conversation = await context.chat.updateConversation({
          id: request.params.id,
          organizationId: session.organization.id,
          updates: request.body,
        })

        return response.success(conversation)
      },
    }),

    // Marcar conversa como lida
    markConversationAsRead: igniter.mutation({
      method: 'POST',
      path: '/conversations/:id/mark-read',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const conversation = await context.chat.markConversationAsRead({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        return response.success(conversation)
      },
    }),

    // ===== ENDPOINTS DE MENSAGENS =====

    // Listar mensagens de uma conversa
    listMessages: igniter.query({
      method: 'GET',
      path: '/conversations/:conversationId/messages',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      query: z.object({
        type: z.union([z.literal('all'), z.nativeEnum(MessageType)]).optional(),
        direction: z.union([z.literal('all'), z.nativeEnum(MessageDirection)]).optional(),
        before: z.coerce.date().optional(),
        after: z.coerce.date().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const result = await context.chat.listMessages({
          organizationId: session.organization.id,
          conversationId: request.params.conversationId,
          ...request.query,
        })

        return response.success(result)
      },
    }),

    // Enviar mensagem
    sendMessage: igniter.mutation({
      method: 'POST',
      path: '/conversations/:conversationId/messages',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      body: sendMessageSchema.omit({ conversationId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const message = await context.chat.sendMessage({
          messageData: {
            ...request.body,
            conversationId: request.params.conversationId,
            type: request.body.type ?? MessageType.TEXT,
          },
          organizationId: session.organization.id,
          userId: session.user.id,
        })

        return response.created(message)
      },
    }),

    // ===== WEBHOOKS =====

    // Webhook da Evolution API
    evolutionWebhook: igniter.mutation({
      method: 'POST',
      path: '/webhooks/evolution',
      body: z.any(), // Payload da Evolution API pode variar
      handler: async ({ request, response, context }) => {
        // TODO: Implementar autenticação do webhook (verificar token/secret)
        const payload = request.body

        console.log('[Chat Controller] Webhook recebido:', payload)

        // Determinar a organização baseada na instância
        // Por enquanto, vamos assumir que temos apenas uma organização
        // Em produção, você precisaria implementar uma lógica para mapear
        // a instância para a organização correta
        const organizationId = payload.instance // Placeholder

        try {
          const result = await context.chat.processWebhook({
            payload,
            organizationId,
          })

          return response.success(result)
        } catch (error) {
          console.error('[Chat Controller] Erro no webhook:', error)
          return response.error({
            code: "WEBHOOK_PROCESSING_ERROR",
            message: "Erro ao processar webhook",
            status: 500,
          });
        }
      },
    }),

    // ===== ESTATÍSTICAS =====

    // Obter estatísticas do CRM
    getCRMStats: igniter.query({
      method: 'GET',
      path: '/stats',
      use: [AuthFeatureProcedure(), ChatProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const stats = await context.chat.getCRMStats(session.organization.id)

        return response.success(stats)
      },
    }),

    // ===== ENDPOINTS AUXILIARES =====

    // Buscar usuários da organização (para atribuição)
    getOrganizationUsers: igniter.query({
      method: 'GET',
      path: '/organization/users',
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        // Buscar membros da organização
        const members = await context.providers.database.member.findMany({
          where: { organizationId: session.organization.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        })

        const users = members.map((member: any) => member.user)

        return response.success(users)
      },
    }),

    // Buscar instâncias do WhatsApp ativas
    getActiveInstances: igniter.query({
      method: 'GET',
      path: '/whatsapp-instances',
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        const instances = await context.providers.database.whatsAppInstance.findMany({
          where: {
            organizationId: session.organization.id,
            status: 'open', // Apenas instâncias conectadas
          },
          select: {
            id: true,
            instanceName: true,
            profileName: true,
            profilePicUrl: true,
            status: true,
          },
        })

        return response.success(instances)
      },
    }),

    // Obter opções para filtros
    getFilterOptions: igniter.query({
      method: 'GET',
      path: '/filter-options',
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session?.organization) {
          return response.unauthorized('Organização não selecionada')
        }

        // Buscar tags únicas
        const contactsWithTags = await context.providers.database.contact.findMany({
          where: { organizationId: session.organization.id },
          select: { tags: true },
        })

        const allTags = contactsWithTags.flatMap((contact: any) => contact.tags)
        const uniqueTags = [...new Set(allTags)]

        // Buscar usuários para atribuição
        const members = await context.providers.database.member.findMany({
          where: { organizationId: session.organization.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        const users = members.map((member: any) => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
        }))

        return response.success({
          tags: uniqueTags.sort(),
          users,
          contactStatuses: Object.values(ContactStatus),
          funnelStages: Object.values(FunnelStage),
          conversationStatuses: Object.values(ConversationStatus),
          messageTypes: Object.values(MessageType),
          messageDirections: Object.values(MessageDirection),
        })
      },
    }),
  },
  name: 'ChatController',
})