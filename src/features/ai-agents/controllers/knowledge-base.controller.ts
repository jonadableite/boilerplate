import { igniter } from "@/igniter";
import { z } from "zod";
import { AuthFeatureProcedure } from "@/@saas-boilerplate/features/auth/procedures/auth.procedure";
import { AIAgentFeatureProcedure } from "../procedures/ai-agent.procedure";

export const KnowledgeBaseController = igniter.controller({
  name: "knowledgeBase",
  path: "/knowledge-base",
  actions: {
    uploadKnowledgeBaseDocument: igniter.mutation({
      method: "POST",
      path: "/documents/upload",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: z.object({
        file: z.object({
          name: z.string(),
          type: z.string(),
          size: z.number(),
          content: z.string(), // Base64 encoded content
        }),
        options: z.object({
          agentId: z.string().optional(),
          knowledgeBaseId: z.string().optional(),
          organizationId: z.string(),
        }),
      }),
      handler: async ({ request, context }) => {
        const { file, options } = request.body;
        const { organizationId } = options;

        // Função temporariamente comentada
        // if (!context.aiAgent?.uploadKnowledgeBaseDocument) {
        //   throw new Error("Knowledge processor service not available");
        // }

        // const result = await context.aiAgent.uploadKnowledgeBaseDocument({
        //   file: Buffer.from(file.content, "base64"),
        //   fileName: file.name,
        //   mimeType: file.type,
        //   fileSize: file.size,
        //   agentId: options.agentId || "",
        //   organizationId,
        //   metadata: {
        //     originalName: file.name,
        //     uploadedAt: new Date().toISOString(),
        //   },
        // });

        return {
          success: true,
          data: { message: "Upload temporariamente desabilitado" },
        };
      },
    }),

    listOrganizationKnowledgeFiles: igniter.query({
      method: "GET",
      path: "/files",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        organizationId: z.string(),
        limit: z.string().optional().transform(Number),
        offset: z.string().optional().transform(Number),
        search: z.string().optional(),
      }),
      handler: async ({ request, context }) => {
        const { organizationId, limit, offset, search } = request.query;

        if (!context.aiAgent?.listOrganizationKnowledgeFiles) {
          throw new Error("AI Agent service not available");
        }

        const result = await context.aiAgent.listOrganizationKnowledgeFiles({
          organizationId,
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          search,
        });

        return { success: true, data: result };
      },
    }),

    getKnowledgeFileById: igniter.query({
      method: "GET",
      path: "/files/:id",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        organizationId: z.string(),
      }),
      handler: async ({ request, context }) => {
        const { id } = request.params;
        const { organizationId } = request.query;

        if (!context.aiAgent?.getKnowledgeFileById) {
          throw new Error("AI Agent service not available");
        }

        const result = await context.aiAgent.getKnowledgeFileById({
          id,
          organizationId,
        });

        return { success: true, data: result };
      },
    }),

    deleteKnowledgeFile: igniter.mutation({
      method: "DELETE",
      path: "/files/:fileId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, context }) => {
        const { fileId } = request.params;
        const organizationId = (
          request.query ?? ({} as { organizationId?: string })
        ).organizationId;

        if (!organizationId) {
          throw new Error("organizationId is required in query parameters.");
        }

        if (!context.aiAgent?.deleteKnowledgeFile) {
          throw new Error("AI Agent service not available");
        }

        const result = await context.aiAgent.deleteKnowledgeFile({
          fileId,
          organizationId,
        });

        return { success: true, data: result };
      },
    }),

    listKnowledgeFileDocuments: igniter.query({
      method: "GET",
      path: "/files/:knowledgeBaseId/documents",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        organizationId: z.string(),
        limit: z.string().optional().transform(Number),
        offset: z.string().optional().transform(Number),
      }),
      handler: async ({ request, context }) => {
        const { knowledgeBaseId } = request.params;
        const { organizationId, limit, offset } = request.query;

        if (!context.aiAgent?.listKnowledgeFileDocuments) {
          throw new Error("AI Agent service not available");
        }

        const result = await context.aiAgent.listKnowledgeFileDocuments({
          knowledgeBaseId,
          organizationId,
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
        });

        return { success: true, data: result };
      },
    }),

    deleteKnowledgeBaseDocument: igniter.mutation({
      method: "DELETE",
      path: "/documents/:documentId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, context }) => {
        const { documentId: fileId } = request.params;
        const organizationId = (
          request.query ?? ({} as { organizationId?: string })
        ).organizationId;

        if (!organizationId) {
          throw new Error("organizationId is required in query parameters.");
        }

        if (!context.aiAgent?.deleteKnowledgeFile) {
          throw new Error("AI Agent service not available");
        }

        const result = await context.aiAgent.deleteKnowledgeFile({
          fileId,
          organizationId,
        });

        return { success: true, data: result };
      },
    }),

    reprocessKnowledgeBaseDocument: igniter.mutation({
      method: "POST",
      path: "/documents/:documentId/reprocess",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, context }) => {
        const { documentId } = request.params;
        const organizationId = (
          request.query ?? ({} as { organizationId?: string })
        ).organizationId;

        if (!organizationId) {
          throw new Error("organizationId is required in query parameters.");
        }

        if (!context.aiAgent?.updateKnowledgeFile) {
          throw new Error("AI Agent service not available");
        }

        const result = await context.aiAgent.updateKnowledgeFile({
          id: documentId,
          organizationId,
        });

        return { success: true, data: result };
      },
    }),

    searchKnowledgeBase: igniter.query({
      method: "GET",
      path: "/search",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        organizationId: z.string(),
        query: z.string(),
        knowledgeBaseId: z.string(),
        limit: z.string().optional().transform(Number),
      }),
      handler: async ({ request, context }) => {
        const {
          organizationId,
          query: searchQuery,
          knowledgeBaseId,
          limit: limitStr,
        } = request.query;
        const limit = limitStr ? Number(limitStr) : undefined;

        if (!context.aiAgent?.searchKnowledge) {
          throw new Error("AI Agent service not available");
        }

        const result = await context.aiAgent.searchKnowledge({
          query: searchQuery,
          knowledgeBaseId,
          limit,
        });

        return { success: true, data: result };
      },
    }),
  },
});
