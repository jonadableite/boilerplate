import { igniter } from '@/igniter'
import { z } from 'zod'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth/procedures/auth.procedure'
import { AIAgentFeatureProcedure } from '../procedures/ai-agent.procedure'

// Schemas de validação
const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  agentIds: z.array(z.string().uuid()).optional(),
})

const updateKnowledgeBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional(),
  description: z.string().optional(),
  agentIds: z.array(z.string().uuid()).optional(),
})

const searchDocumentsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['processing', 'completed', 'error', 'all']).default('all'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

export const KnowledgeBaseController = igniter.controller({
  name: 'knowledgeBase',
  path: '/knowledge-bases',
  actions: {
    // Listar bases de conhecimento
    list: igniter.query({
      method: 'GET',
      path: '/',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const knowledgeBases = await context.aiAgent.listKnowledgeBases({
          organizationId: session.organization.id,
          ...request.query,
        })

        return response.success({ data: knowledgeBases })
      },
    }),

    // Obter base de conhecimento por ID
    getById: igniter.query({
      method: 'GET',
      path: '/:id',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const knowledgeBase = await context.aiAgent.getKnowledgeBaseById({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        if (!knowledgeBase) {
          return response.notFound('Knowledge base not found')
        }

        return response.success({ data: knowledgeBase })
      },
    }),

    // Criar nova base de conhecimento
    create: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: createKnowledgeBaseSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const knowledgeBase = await context.aiAgent.createKnowledgeBase({
          organizationId: session.organization.id,
          ...request.body,
        })

        return response.success({ data: knowledgeBase }, 201)
      },
    }),

    // Atualizar base de conhecimento
    update: igniter.mutation({
      method: 'PUT',
      path: '/:id',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
      }),
      body: updateKnowledgeBaseSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const knowledgeBase = await context.aiAgent.updateKnowledgeBase({
          id: request.params.id,
          organizationId: session.organization.id,
          ...request.body,
        })

        return response.success({ data: knowledgeBase })
      },
    }),

    // Deletar base de conhecimento
    delete: igniter.mutation({
      method: 'DELETE',
      path: '/:id',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        await context.aiAgent.deleteKnowledgeBase({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        return response.success({
          message: 'Knowledge base deleted successfully',
        })
      },
    }),

    // Obter estatísticas da base de conhecimento
    stats: igniter.query({
      method: 'GET',
      path: '/:id/stats',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const stats = await context.aiAgent.getKnowledgeBaseStats({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        return response.success({ data: stats })
      },
    }),

    // Listar documentos da base de conhecimento
    listDocuments: igniter.query({
      method: 'GET',
      path: '/:id/documents',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
      }),
      query: searchDocumentsSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const documents = await context.aiAgent.listKnowledgeBaseDocuments({
          knowledgeBaseId: request.params.id,
          organizationId: session.organization.id,
          ...request.query,
        })

        return response.success({ data: documents })
      },
    }),

    // Upload de documento
    uploadDocument: igniter.mutation({
      method: 'POST',
      path: '/:id/documents/upload',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
      }),
      // Note: File upload handling will be implemented in the procedure
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const document = await context.aiAgent.uploadKnowledgeBaseDocument({
          knowledgeBaseId: request.params.id,
          organizationId: session.organization.id,
          file: request.body.file,
          options: {
            chunkSize: request.body.chunkSize || 1000,
            chunkOverlap: request.body.chunkOverlap || 200,
            enableOCR: request.body.enableOCR || false,
            language: request.body.language || 'pt',
            extractMetadata: request.body.extractMetadata !== false,
            autoProcess: request.body.autoProcess !== false,
          },
        })

        return response.success({ data: document }, 201)
      },
    }),

    // Deletar documento
    deleteDocument: igniter.mutation({
      method: 'DELETE',
      path: '/:id/documents/:documentId',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
        documentId: z.string().uuid('Invalid document ID'),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        await context.aiAgent.deleteKnowledgeBaseDocument({
          knowledgeBaseId: request.params.id,
          documentId: request.params.documentId,
          organizationId: session.organization.id,
        })

        return response.success({
          message: 'Document deleted successfully',
        })
      },
    }),

    // Reprocessar documento
    reprocessDocument: igniter.mutation({
      method: 'POST',
      path: '/:id/documents/:documentId/reprocess',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
        documentId: z.string().uuid('Invalid document ID'),
      }),
      body: z.object({
        chunkSize: z.number().min(100).max(5000).optional(),
        chunkOverlap: z.number().min(0).max(500).optional(),
        enableOCR: z.boolean().optional(),
        language: z.string().optional(),
        extractMetadata: z.boolean().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Admin privileges required')
        }

        const document = await context.aiAgent.reprocessKnowledgeBaseDocument({
          knowledgeBaseId: request.params.id,
          documentId: request.params.documentId,
          organizationId: session.organization.id,
          options: request.body,
        })

        return response.success({ data: document })
      },
    }),

    // Buscar na base de conhecimento
    search: igniter.query({
      method: 'GET',
      path: '/:id/search',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        id: z.string().uuid('Invalid knowledge base ID'),
      }),
      query: z.object({
        query: z.string().min(1, 'Search query is required'),
        limit: z.number().min(1).max(50).default(10),
        threshold: z.number().min(0).max(1).default(0.7),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        const results = await context.aiAgent.searchKnowledgeBase({
          knowledgeBaseId: request.params.id,
          organizationId: session.organization.id,
          ...request.query,
        })

        return response.success({ data: results })
      },
    }),
  },
})
