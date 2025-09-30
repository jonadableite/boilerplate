import { igniter } from "@/igniter";
import { z } from "zod";
import { AuthFeatureProcedure } from "@/@saas-boilerplate/features/auth/procedures/auth.procedure";
import { AIServicesProvider } from "../../../providers/ai-services";
import { AIAgentFeatureProcedure } from "../procedures/ai-agent.procedure";
import multer from "multer";
import { Request } from "express";

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado"));
    }
  },
});

export const KnowledgeController = igniter.controller({
  name: "knowledge",
  path: "/knowledge",
  actions: {
    // Upload e processamento de arquivos de conhecimento
    uploadFiles: igniter.mutation({
      method: "POST",
      path: "/upload",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: z.object({
        agentId: z.string().uuid(),
      }),
      handler: async ({ request, response, context }) => {
        await new Promise<void>((resolve, reject) => {
          upload.array("files", 10)(
            request as any,
            response as any,
            (err: any) => {
              if (err) {
                return reject(err);
              }
              resolve();
            },
          );
        });

        const { agentId } = request.body;
        const files = (request as any).files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return response.badRequest("Nenhum arquivo enviado.");
        }

        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session || !session.organization) {
          return response.unauthorized("Autenticação necessária.");
        }

        const results = [];
        for (const file of files) {
          try {
            // Função temporariamente comentada
            // const result = await context.aiAgent.uploadKnowledgeBaseDocument({
            //   organizationId: session.organization.id,
            //   agentId,
            //   file: file.buffer,
            //   fileName: file.originalname,
            //   mimeType: file.mimetype,
            //   fileSize: file.size,
            //   metadata: {
            //     originalName: file.originalname,
            //     uploadedAt: new Date().toISOString(),
            //   },
            // });
            const result = { message: "Upload temporariamente desabilitado" };
            results.push(result);
          } catch (error) {
            console.error(
              "Erro ao processar arquivo:",
              file.originalname,
              error,
            );
            return response.error({
              code: "FILE_PROCESSING_ERROR",
              message: "Erro ao processar um ou mais arquivos.",
              status: 500,
            });
          }
        }

        return response.success({ success: true, data: results });
      },
    }),

    // Listar arquivos de conhecimento de um agente
    listByAgent: igniter.query({
      method: "GET",
      path: "/agent/:agentId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { agentId } = request.params;
        try {
          const session = await context.auth.getSession({
            requirements: "authenticated",
          });

          if (!session || !session.organization) {
            return response.unauthorized("Authentication required");
          }

          const knowledgeFiles = await context.aiAgent.listKnowledgeFiles({
            agentId,
            organizationId: session.organization.id,
          });

          return response.success(knowledgeFiles);
        } catch (error: any) {
          console.error("Error listing knowledge files:", error);
          return response.error({
            code: "LIST_FILES_ERROR",
            message: "Failed to list knowledge files",
            status: 500,
          });
        }
      },
    }),

    // Remover arquivo de conhecimento
    deleteFile: igniter.mutation({
      method: "DELETE",
      path: "/file/:fileId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const { fileId } = request.params;
        try {
          const session = await context.auth.getSession({
            requirements: "authenticated",
          });

          if (!session || !session.organization) {
            return response.unauthorized("Authentication required");
          }

          await context.aiAgent.deleteKnowledgeFile({
            fileId,
            organizationId: session.organization.id,
          });

          return response.success({ success: true });
        } catch (error: any) {
          console.error("Error deleting knowledge file:", error);
          return response.error({
            code: "DELETE_FILE_ERROR",
            message: "Failed to delete knowledge file",
            status: 500,
          });
        }
      },
    }),

    // Buscar na base de conhecimento
    search: igniter.query({
      method: "GET",
      path: "/search",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      query: z.object({
        agentId: z.string().uuid(),
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(5),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: "authenticated",
          });

          if (!session || !session.organization) {
            return response.unauthorized("Authentication required");
          }

          // Buscar chunks relevantes
          const chunks =
            await context.providers.database.knowledgeChunk.findMany({
              where: {
                agentId: request.query.agentId,
                organizationId: session.organization.id,
                content: {
                  contains: request.query.query,
                  mode: "insensitive",
                },
              },
              take: request.query.limit,
              include: {
                file: {
                  select: {
                    originalName: true,
                    type: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            });

          return response.success({
            query: request.query.query,
            results: chunks,
            count: chunks.length,
          });
        } catch (error: any) {
          console.error("Error searching knowledge base:", error);
          return response.error({
            code: "SEARCH_KNOWLEDGE_ERROR",
            message: "Failed to search knowledge base",
            status: 500,
          });
        }
      },
    }),
  },
});
