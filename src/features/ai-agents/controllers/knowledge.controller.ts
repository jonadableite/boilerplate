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
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado"), false);
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
      // Middleware personalizado para upload de arquivos
      middleware: [upload.array("files", 10)],
      body: z.object({
        agentId: z.string().uuid(),
      }),
      handler: async ({ request, response, context }) => {
        try {
          // Verificar sessão autenticada
          const session = await context.auth.getSession({
            requirements: "authenticated",
          });

          if (!session || !session.organization) {
            return response.unauthorized("Authentication required");
          }

          // Verificar se há arquivos no upload
          const files = (request as any).files as Express.Multer.File[];
          if (!files || files.length === 0) {
            return response.badRequest("No files provided");
          }

          // Verificar se o agente pertence à organização
          const agent = await context.providers.database.aIAgent.findFirst({
            where: {
              id: request.body.agentId,
              organizationId: session.organization.id,
            },
          });

          if (!agent) {
            return response.notFound("Agent not found");
          }

          // Converter Multer files para File objects
          const fileObjects = files.map((file) => {
            const blob = new Blob([file.buffer], { type: file.mimetype });
            return new File([blob], file.originalname, {
              type: file.mimetype,
              lastModified: Date.now(),
            });
          });

          // Processar arquivos usando AIServicesProvider
          const knowledgeProcessor = AIServicesProvider.getKnowledgeProcessor();
          const processedFiles =
            await knowledgeProcessor.processMultipleFiles(fileObjects);

          // Salvar informações dos arquivos no banco de dados
          const knowledgeFiles = await Promise.all(
            processedFiles.map(async (processedFile) => {
              return await context.providers.database.knowledgeFile.create({
                data: {
                  id: processedFile.id,
                  filename: processedFile.originalName,
                  originalName: processedFile.originalName,
                  size: processedFile.size,
                  type: processedFile.type,
                  agentId: request.body.agentId,
                  organizationId: session.organization.id,
                  chunksCount: processedFile.chunks.length,
                  processedAt: processedFile.processedAt,
                  metadata: {
                    chunksCount: processedFile.chunks.length,
                    fileSize: processedFile.size,
                  },
                },
              });
            }),
          );

          // Salvar chunks no banco de dados
          for (const processedFile of processedFiles) {
            await Promise.all(
              processedFile.chunks.map(async (chunk) => {
                return await context.providers.database.knowledgeChunk.create({
                  data: {
                    id: chunk.id,
                    content: chunk.content,
                    metadata: chunk.metadata,
                    fileId: processedFile.id,
                    agentId: request.body.agentId,
                    organizationId: session.organization.id,
                  },
                });
              }),
            );
          }

          return response.success({
            message: "Files processed successfully",
            files: knowledgeFiles,
            totalChunks: processedFiles.reduce(
              (total, file) => total + file.chunks.length,
              0,
            ),
          });
        } catch (error: any) {
          console.error("Error processing knowledge files:", error);
          return response.internalServerError({
            message: "Failed to process files",
            error: error.message,
          });
        }
      },
    }),

    // Listar arquivos de conhecimento de um agente
    listFiles: igniter.query({
      method: "GET",
      path: "/agent/:agentId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        agentId: z.string().uuid(),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: "authenticated",
          });

          if (!session || !session.organization) {
            return response.unauthorized("Authentication required");
          }

          const files = await context.providers.database.knowledgeFile.findMany(
            {
              where: {
                agentId: request.params.agentId,
                organizationId: session.organization.id,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          );

          return response.success({ files });
        } catch (error: any) {
          console.error("Error listing knowledge files:", error);
          return response.internalServerError({
            message: "Failed to list files",
            error: error.message,
          });
        }
      },
    }),

    // Remover arquivo de conhecimento
    removeFile: igniter.mutation({
      method: "DELETE",
      path: "/file/:fileId",
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      params: z.object({
        fileId: z.string().uuid(),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const session = await context.auth.getSession({
            requirements: "authenticated",
          });

          if (!session || !session.organization) {
            return response.unauthorized("Authentication required");
          }

          // Verificar se o arquivo pertence à organização
          const file = await context.providers.database.knowledgeFile.findFirst(
            {
              where: {
                id: request.params.fileId,
                organizationId: session.organization.id,
              },
            },
          );

          if (!file) {
            return response.notFound("File not found");
          }

          // Remover chunks relacionados
          await context.providers.database.knowledgeChunk.deleteMany({
            where: {
              fileId: request.params.fileId,
            },
          });

          // Remover arquivo
          await context.providers.database.knowledgeFile.delete({
            where: {
              id: request.params.fileId,
            },
          });

          return response.success({
            message: "File removed successfully",
          });
        } catch (error: any) {
          console.error("Error removing knowledge file:", error);
          return response.internalServerError({
            message: "Failed to remove file",
            error: error.message,
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
          return response.internalServerError({
            message: "Failed to search knowledge base",
            error: error.message,
          });
        }
      },
    }),
  },
});
