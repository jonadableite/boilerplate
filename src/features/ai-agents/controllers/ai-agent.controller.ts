import { z } from "zod";
import { igniter } from "@saas-boilerplate/igniter";
import { AuthFeatureProcedure } from "@saas-boilerplate/features/auth/procedures/auth.procedure";
import { AIAgentFeatureProcedure } from "../procedures/ai-agent.procedure";
import {
  processMessageSchema,
  conversationHistorySchema,
  ragRetrievalSchema,
  addKnowledgeChunkSchema,
  updateKnowledgeChunkSchema,
  createEvolutionBotSchema,
} from "../validation/ai-agent.validation";
import { AIAgentError } from "../types/services.types";
import {
  listAgentsSchema,
  createAIAgentSchema,
  updateAIAgentSchema,
  getAIAgentByIdSchema,
  deleteAIAgentSchema,
  uploadKnowledgeBaseDocumentSchema,
  updateEvolutionBotSchema,
} from "../validation/ai-agent.validation";

import multer from "multer";

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
});

export const AIAgentController = igniter.controller({
  name: "ai-agent",
  path: "/ai-agents",
  actions: {
    // Listar agentes da organização
    list: igniter.query({
      method: "GET",
      path: "/",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: listAgentsSchema.omit({ organizationId: true }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Authentication required");
        }

        const result = await context.aiAgent.listAgents({
          ...request.query,
          organizationId: session.organization.id,
        });

        return response.success(result);
      },
    }),

    // Obter agente por ID
    getById: igniter.query({
      method: "GET",
      path: "/:id",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({ id: z.string().uuid("Invalid agent ID") })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Authentication required");
        }

        const agent = await context.aiAgent.getAgentById({
          id,
          organizationId: session.organization.id,
        });

        if (!agent) {
          return response.notFound("Agent not found");
        }

        return response.success({ data: agent });
      },
    }),

    // Criar novo agente
    create: igniter.mutation({
      method: "POST",
      path: "/",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: createAIAgentSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        const agent = await context.aiAgent.createAgent({
          ...request.body,
          organizationId: session.organization.id,
          createdById: session.user.id,
        });

        return response.success({ data: agent });
      },
    }),

    // Atualizar agente
    update: igniter.mutation({
      method: "PUT",
      path: "/:id",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: updateAIAgentSchema.omit({ id: true }),
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({ id: z.string().uuid("Invalid agent ID") })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        const agent = await context.aiAgent.updateAgent({
          id,
          organizationId: session.organization.id,
          ...request.body,
        });

        return response.success({ data: agent });
      },
    }),

    // Deletar agente
    delete: igniter.mutation({
      method: "DELETE",
      path: "/:id",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({ id: z.string().uuid("Invalid agent ID") })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        await context.aiAgent.deleteAgent({
          id,
          organizationId: session.organization.id,
        });

        return response.success({ message: "Agent deleted successfully" });
      },
    }),

    // Processar mensagem com agente
    processMessage: igniter.mutation({
      method: "POST",
      path: "/:id/process",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: processMessageSchema.omit({
        agentId: true,
        organizationId: true,
      }),
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({ id: z.string().uuid("Invalid agent ID") })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Authentication required");
        }

        const result = await context.aiAgent.processMessage({
          agentId: id,
          organizationId: session.organization.id,
          sessionId: request.body.sessionId || "",
          userMessage: request.body.userMessage,
          context: request.body.context,
        });

        return response.success({ data: result });
      },
    }),

    // Obter histórico de conversa
    getConversationHistory: igniter.query({
      method: "GET",
      path: "/:id/conversations/:sessionId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: conversationHistorySchema.omit({ agentId: true, sessionId: true }),
      handler: async ({ request, response, context }) => {
        const { id, sessionId } = z
          .object({
            id: z.string().uuid("Invalid agent ID"),
            sessionId: z.string().min(1, "Session ID is required"),
          })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Authentication required");
        }

        const history = await context.aiAgent.getConversationHistory({
          agentId: id,
          sessionId,
          organizationId: session.organization.id,
          ...request.query,
        });

        return response.success({ data: history });
      },
    }),

    // Buscar na base de conhecimento (RAG)
    searchKnowledge: igniter.query({
      method: "GET",
      path: "/:id/knowledge/search",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: ragRetrievalSchema.omit({ knowledgeBaseId: true }),
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({ id: z.string().uuid("Invalid agent ID") })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Authentication required");
        }

        // Obter o agente para verificar se tem base de conhecimento
        const agent = await context.aiAgent.getAgentById({
          id,
          organizationId: session.organization.id,
        });

        if (!agent || !agent.knowledgeBaseId) {
          return response.badRequest("Agent does not have a knowledge base");
        }

        const results = await context.aiAgent.searchKnowledge({
          knowledgeBaseId: agent.knowledgeBaseId,
          ...request.query,
        });

        return response.success({ data: results });
      },
    }),

    // Adicionar chunk de conhecimento
    addKnowledgeChunk: igniter.mutation({
      method: "POST",
      path: "/:id/knowledge",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: addKnowledgeChunkSchema.omit({ agentId: true }),
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({ id: z.string().uuid("Invalid agent ID") })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        const chunk = await context.aiAgent.addKnowledgeChunk({
          agentId: id,
          organizationId: session.organization.id,
          ...request.body,
        });

        return response.success({ data: chunk });
      },
    }),

    // Atualizar chunk de conhecimento
    updateKnowledgeChunk: igniter.mutation({
      method: "PUT",
      path: "/:id/knowledge/:chunkId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: updateKnowledgeChunkSchema.omit({ id: true }),
      handler: async ({ request, response, context }) => {
        const { id, chunkId } = z
          .object({
            id: z.string().uuid("Invalid agent ID"),
            chunkId: z.string().uuid("Invalid chunk ID"),
          })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        const chunk = await context.aiAgent.updateKnowledgeChunk({
          id: chunkId,
          agentId: id,
          organizationId: session.organization.id,
          ...request.body,
        });

        return response.success({ data: chunk });
      },
    }),

    // Deletar chunk de conhecimento
    deleteKnowledgeChunk: igniter.mutation({
      method: "DELETE",
      path: "/:id/knowledge/:chunkId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { id, chunkId } = z
          .object({
            id: z.string().uuid("Invalid agent ID"),
            chunkId: z.string().uuid("Invalid chunk ID"),
          })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        await context.aiAgent.deleteKnowledgeChunk({
          id: chunkId,
          agentId: id,
          organizationId: session.organization.id,
        });

        return response.success({
          message: "Knowledge chunk deleted successfully",
        });
      },
    }),

    // Obter estatísticas do agente
    getStats: igniter.query({
      method: "GET",
      path: "/:id/stats",
      query: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({
            id: z.string().uuid("Invalid agent ID"),
          })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Authentication required");
        }

        const stats = await context.aiAgent.getAgentStats({
          agentId: id,
          organizationId: session.organization.id,
          startDate: request.query.startDate
            ? new Date(request.query.startDate)
            : undefined,
          endDate: request.query.endDate
            ? new Date(request.query.endDate)
            : undefined,
        });

        return response.success({ data: stats });
      },
    }),

    // Criar bot da Evolution API
    createEvolutionBot: igniter.mutation({
      method: "POST",
      path: "/:id/evolution-bot",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: createEvolutionBotSchema.omit({ agentId: true }),
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({ id: z.string().uuid("Invalid agent ID") })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        const bot = await context.aiAgent.createEvolutionBot({
          agentId: id,
          organizationId: session.organization.id,
          ...request.body,
        });

        return response.success({ data: bot });
      },
    }),

    // Atualizar bot da Evolution API
    updateEvolutionBot: igniter.mutation({
      method: "PUT",
      path: "/:id/evolution-bot/:botId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: updateEvolutionBotSchema.omit({ evolutionBotId: true }),
      handler: async ({ request, response, context }) => {
        const { id, botId } = z
          .object({
            id: z.string().uuid("Invalid agent ID"),
            botId: z.string().min(1, "Bot ID is required"),
          })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        const bot = await context.aiAgent.updateEvolutionBot({
          evolutionBotId: botId,
          agentId: id,
          organizationId: session.organization.id,
          ...request.body,
        });

        return response.success({ data: bot });
      },
    }),

    // Deletar bot da Evolution API
    deleteEvolutionBot: igniter.mutation({
      method: "DELETE",
      path: "/:id/evolution-bot/:botId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { id, botId } = z
          .object({
            id: z.string().uuid("Invalid agent ID"),
            botId: z.string().min(1, "Bot ID is required"),
          })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        await context.aiAgent.deleteEvolutionBot({
          evolutionBotId: botId,
          agentId: id,
          organizationId: session.organization.id,
        });

        return response.success({
          message: "Evolution bot deleted successfully",
        });
      },
    }),

    // Obter status do bot da Evolution API
    getEvolutionBotStatus: igniter.query({
      method: "GET",
      path: "/:id/evolution-bot/:botId/status",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { id, botId } = z
          .object({
            id: z.string().uuid("Invalid agent ID"),
            botId: z.string().min(1, "Bot ID is required"),
          })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Authentication required");
        }

        const status = await context.aiAgent.getEvolutionBotStatus({
          evolutionBotId: botId,
          agentId: id,
          organizationId: session.organization.id,
        });

        return response.success({ data: status });
      },
    }),

    // Deletar arquivo de conhecimento
    deleteKnowledgeFile: igniter.mutation({
      method: "DELETE",
      path: "/:id/knowledge/:fileId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { id, fileId } = z
          .object({ id: z.string().uuid(), fileId: z.string().uuid() })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        await context.aiAgent.deleteKnowledgeFile({
          organizationId: session.organization.id,
          fileId,
        });

        return response.success({ success: true });
      },
    }),

    // Listar documentos de um arquivo de conhecimento
    listKnowledgeFileDocuments: igniter.query({
      method: "GET",
      path: "/:knowledgeBaseId/documents",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        knowledgeBaseId: z.string(),
        limit: z.string().optional().transform(Number),
        offset: z.string().optional().transform(Number),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized(
            "Authentication required or organization not found",
          );
        }

        const {
          knowledgeBaseId,
          limit: limitStr,
          offset: offsetStr,
        } = request.query;
        const limit = limitStr ? Number(limitStr) : undefined;
        const offset = offsetStr ? Number(offsetStr) : undefined;
        const organizationId = session.organization.id;

        const result = await context.aiAgent.listKnowledgeFileDocuments({
          knowledgeBaseId,
          organizationId,
          limit,
          offset,
        });

        return response.success(result);
      },
    }),

    // Processar arquivo de conhecimento
    processKnowledgeFile: igniter.mutation({
      method: "POST",
      path: "/:id/knowledge",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: addKnowledgeChunkSchema.omit({ agentId: true }),
      handler: async ({ request, response, context }) => {
        const { id } = z
          .object({ id: z.string().uuid("Invalid agent ID") })
          .parse(request.params);
        const session = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!session || !session.organization) {
          return response.unauthorized("Admin privileges required");
        }

        const chunk = await context.aiAgent.addKnowledgeChunk({
          agentId: id,
          organizationId: session.organization.id,
          ...request.body,
        });

        return response.success({ data: chunk });
      },
    }),
    uploadKnowledgeBaseDocument: igniter.mutation({
      method: "POST",
      path: "/knowledge-base/documents/upload",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: z.object({
        agentId: z.string().optional(),
        file: z.any(), // File will be handled by the multipart/form-data parser
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
      }),
      handler: async ({ request, response, context }) => {
        const { agentId, fileName, mimeType, fileSize } = request.body;

        if (!agentId) {
          return response.badRequest("Agent ID is required");
        }
        const fileBuffer = (request as any).file.buffer; // Assuming file is available in request.file.buffer

        if (!fileBuffer) {
          return response.badRequest("File not provided");
        }

        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Authentication required");
        }

        try {
          // Função temporariamente comentada
          // const result = await context.aiAgent.uploadKnowledgeBaseDocument({
          //   organizationId: session.organization.id,
          //   agentId,
          //   file: fileBuffer,
          //   fileName,
          //   mimeType,
          //   fileSize,
          // });
          return response.success({
            message: "Upload temporariamente desabilitado",
          });
        } catch (error) {
          if (error instanceof AIAgentError) {
            return response.badRequest(error.message);
          }
          console.error(
            "[AI Agent] Erro ao fazer upload do documento da base de conhecimento:",
            error,
          );
          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao fazer upload do documento da base de conhecimento",
            status: 500,
          });
        }
      },
    }),
  },
});
