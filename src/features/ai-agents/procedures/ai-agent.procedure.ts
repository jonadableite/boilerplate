import { igniter } from "@saas-boilerplate/igniter";
import { prisma } from "@/providers/prisma";
import type { PrismaClient } from "@prisma/client";
import {
  CreateAIAgentInput,
  UpdateAIAgentInput,
  ProcessMessageInput,
  ProcessMessageResult,
  ListAgentsInput,
  ListAgentsResult,
  ConversationHistoryInput,
  AddKnowledgeChunkInput,
  UpdateKnowledgeChunkInput,
  CreateEvolutionBotInput,
  UpdateEvolutionBotInput,
  AgentStats,
  AIAgentWithRelations,
  UploadKnowledgeBaseDocumentInput,
  KnowledgeFileStatus,
} from "../types/ai-agent.types";
import {
  RAGRetrievalInput,
  RAGRetrievalResult,
  AIAgentError,
  AgentNotFoundError,
  InvalidConfigurationError,
  TokenLimitExceededError,
  GuardrailViolationError,
} from "../types/services.types";
import { AgentEngineService } from "../services/agent-engine.service";
import { TokenUsageService } from "../services/token-usage.service";
import { MemoryService } from "../services/memory.service";
import { RAGService } from "../services/rag.service";
import { GuardrailService } from "../services/guardrail.service";
// import { EvolutionAPIService } from '../services/evolution-api.service' // Comentado temporariamente
import { LoggingService } from "../services/logging.service";
import { KnowledgeProcessorService } from "../services/knowledge-processor.service";

export const AIAgentFeatureProcedure = igniter.procedure({
  name: "AIAgentFeatureProcedure",
  handler: async () => {
    // Serviços serão inicializados sob demanda para evitar problemas de dependência
    const getAgentEngineService = () => new AgentEngineService();
    const getTokenUsageService = () => new TokenUsageService();
    const getKnowledgeProcessorService = () => new KnowledgeProcessorService();
    const getRAGService = () => new RAGService();
    const getGuardrailService = () => new GuardrailService();
    const getLoggingService = () => new LoggingService();
    const getMemoryService = () => new MemoryService();

    return {
      aiAgent: {
        // Listar agentes
        listAgents: async (
          input: ListAgentsInput,
        ): Promise<ListAgentsResult> => {
          try {
            const { organizationId, type, isActive, limit, offset, search } =
              input;

            const where: any = {
              organizationId,
              ...(type && { type }),
              ...(isActive !== undefined && { isActive }),
              ...(search && {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                  { role: { contains: search, mode: "insensitive" } },
                ],
              }),
            };

            const [agents, total] = await Promise.all([
              prisma.aIAgent.findMany({
                where,
                include: {
                  createdBy: {
                    select: { id: true, name: true, email: true },
                  },
                  organization: {
                    select: { id: true, name: true, slug: true },
                  },
                  openaiCreds: {
                    select: { id: true, name: true },
                  },
                  _count: {
                    select: {
                      memories: true,
                      knowledgeChunks: true,
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
              }),
              prisma.aIAgent.count({ where }),
            ]);

            return {
              agents: agents as AIAgentWithRelations[],
              total,
              hasMore: (offset || 0) + (limit || 10) < total,
            };
          } catch (error) {
            console.error("Error in listAgents:", error);
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: "Failed to list agents",
              error: error as Error,
            });
            // Throw the original error for debugging
            throw error;
          }
        },

        // Obter agente por ID
        getAgentById: async (input: {
          id: string;
          organizationId: string;
        }): Promise<AIAgentWithRelations | null> => {
          try {
            const agent = await prisma.aIAgent.findFirst({
              where: {
                id: input.id,
                organizationId: input.organizationId,
              },
              include: {
                createdBy: {
                  select: { id: true, name: true, email: true },
                },
                organization: {
                  select: { id: true, name: true, slug: true },
                },
                openaiCreds: true,
                _count: {
                  select: {
                    memories: true,
                    knowledgeChunks: true,
                  },
                },
              },
            });

            return agent as AIAgentWithRelations | null;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.id,
              organizationId: input.organizationId,
              message: "Failed to get agent by ID",
              error: error as Error,
            });
            throw new AIAgentError("Failed to get agent", "GET_AGENT_ERROR");
          }
        },

        // Criar agente
        createAgent: async (
          input: CreateAIAgentInput & {
            organizationId: string;
            createdById: string;
          },
        ): Promise<AIAgentWithRelations> => {
          try {
            // Validar configurações
            const modelConfig = {
              model: input.model,
              temperature: input.temperature,
              maxTokens: input.maxTokens,
              topP: input.topP,
              frequencyPenalty: input.frequencyPenalty,
              presencePenalty: input.presencePenalty,
            };

            const guardrailConfig = {
              enableContentFilter: input.enableContentFilter,
              enablePiiDetection: input.enablePiiDetection,
              maxResponseLength: input.maxResponseLength,
              allowedTopics: input.allowedTopics,
              blockedTopics: input.blockedTopics,
            };

            // Verificar se as credenciais OpenAI existem (se fornecidas)
            if (input.openaiCredsId) {
              const creds = await prisma.openAICreds.findFirst({
                where: {
                  id: input.openaiCredsId,
                  organizationId: input.organizationId,
                },
              });

              if (!creds) {
                throw new InvalidConfigurationError(
                  "OpenAI credentials not found",
                );
              }
            }

            const agent = await prisma.aIAgent.create({
              data: {
                name: input.name,
                description: input.description,
                type: input.type || "LLM_AGENT",
                role: input.role,
                goal: input.goal,
                systemPrompt: input.systemPrompt,
                // Configurações do modelo (campos individuais)
                model: input.model || "gpt-4",
                temperature: input.temperature || 0.7,
                maxTokens: input.maxTokens || 1000,
                topP: input.topP,
                frequencyPenalty: input.frequencyPenalty,
                presencePenalty: input.presencePenalty,
                // Configurações de segurança (campos individuais)
                enableContentFilter: input.enableContentFilter ?? true,
                enablePiiDetection: input.enablePiiDetection ?? true,
                maxResponseLength: input.maxResponseLength,
                allowedTopics: input.allowedTopics || [],
                blockedTopics: input.blockedTopics || [],
                // Outros campos
                knowledgeBaseId: input.knowledgeBaseId,
                fallbackMessage: input.fallbackMessage,
                isActive: input.isActive ?? true,
                openaiCredsId: input.openaiCredsId,
                metadata: input.metadata || {},
                organizationId: input.organizationId,
                createdById: input.createdById,
              },
              include: {
                createdBy: {
                  select: { id: true, name: true, email: true },
                },
                organization: {
                  select: { id: true, name: true, slug: true },
                },
                openaiCreds: true,
                _count: {
                  select: {
                    memories: true,
                    knowledgeChunks: true,
                  },
                },
              },
            });

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: agent.id,
              organizationId: input.organizationId,
              message: `Agent '${agent.name}' created successfully`,
            });

            return agent as AIAgentWithRelations;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: "Failed to create agent",
              error: error as Error,
            });

            if (error instanceof InvalidConfigurationError) {
              throw error;
            }

            throw new AIAgentError(
              "Failed to create agent",
              "CREATE_AGENT_ERROR",
            );
          }
        },

        // Atualizar agente
        updateAgent: async (
          input: UpdateAIAgentInput & {
            organizationId: string;
          },
        ): Promise<AIAgentWithRelations> => {
          try {
            const { id, organizationId, ...updateData } = input;

            // Verificar se o agente existe
            const existingAgent = await prisma.aIAgent.findFirst({
              where: { id, organizationId },
            });

            if (!existingAgent) {
              throw new AgentNotFoundError("Agent not found");
            }

            // Preparar dados de atualização (usar campos individuais)
            const dataToUpdate: any = { ...updateData };

            // Verificar credenciais OpenAI se fornecidas
            if (updateData.openaiCredsId) {
              const creds = await prisma.openAICreds.findFirst({
                where: {
                  id: updateData.openaiCredsId,
                  organizationId,
                },
              });

              if (!creds) {
                throw new InvalidConfigurationError(
                  "OpenAI credentials not found",
                );
              }
            }

            const agent = await prisma.aIAgent.update({
              where: { id },
              data: {
                ...dataToUpdate,
                updatedAt: new Date(),
              },
              include: {
                createdBy: {
                  select: { id: true, name: true, email: true },
                },
                organization: {
                  select: { id: true, name: true, slug: true },
                },
                openaiCreds: true,
                _count: {
                  select: {
                    memories: true,
                    knowledgeChunks: true,
                  },
                },
              },
            });

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: agent.id,
              organizationId,
              message: `Agent '${agent.name}' updated successfully`,
            });

            return agent as AIAgentWithRelations;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.id,
              organizationId: input.organizationId,
              message: "Failed to update agent",
              error: error as Error,
            });

            if (
              error instanceof AgentNotFoundError ||
              error instanceof InvalidConfigurationError
            ) {
              throw error;
            }

            throw new AIAgentError(
              "Failed to update agent",
              "UPDATE_AGENT_ERROR",
            );
          }
        },

        // Deletar agente
        deleteAgent: async (input: {
          id: string;
          organizationId: string;
        }): Promise<void> => {
          try {
            const agent = await prisma.aIAgent.findFirst({
              where: {
                id: input.id,
                organizationId: input.organizationId,
              },
            });

            if (!agent) {
              throw new AgentNotFoundError("Agent not found");
            }

            // Deletar em transação para manter consistência
            await prisma.$transaction(
              async (tx: {
                aIAgentMemory: {
                  deleteMany: (arg0: { where: { agentId: string } }) => any;
                };
                knowledgeChunk: {
                  deleteMany: (arg0: { where: { agentId: string } }) => any;
                };
                tokenUsageHistory: {
                  deleteMany: (arg0: { where: { agentId: string } }) => any;
                };
                aIAgent: { delete: (arg0: { where: { id: string } }) => any };
              }) => {
                // Deletar memórias do agente
                await tx.aIAgentMemory.deleteMany({
                  where: { agentId: input.id },
                });

                // Deletar chunks de conhecimento
                await tx.knowledgeChunk.deleteMany({
                  where: { agentId: input.id },
                });

                // Deletar logs - comentado temporariamente (MessageLog não tem agentId)
                // await tx.messageLog.deleteMany({
                //   where: { agentId: input.id },
                // });

                // Deletar histórico de uso de tokens
                await tx.tokenUsageHistory.deleteMany({
                  where: { agentId: input.id },
                });

                // Deletar o agente
                await tx.aIAgent.delete({
                  where: { id: input.id },
                });
              },
            );

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: input.id,
              organizationId: input.organizationId,
              message: `Agent '${agent.name}' deleted successfully`,
            });
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.id,
              organizationId: input.organizationId,
              message: "Failed to delete agent",
              error: error as Error,
            });

            if (error instanceof AgentNotFoundError) {
              throw error;
            }

            throw new AIAgentError(
              "Failed to delete agent",
              "DELETE_AGENT_ERROR",
            );
          }
        },

        // Processar mensagem
        processMessage: async (
          input: ProcessMessageInput,
        ): Promise<ProcessMessageResult> => {
          try {
            // Obter configuração do agente
            const agent = await prisma.aIAgent.findFirst({
              where: {
                id: input.agentId,
                organizationId: input.organizationId,
                isActive: true,
              },
              include: {
                openaiCreds: true,
              },
            });

            if (!agent) {
              throw new AgentNotFoundError("Agent not found or inactive");
            }

            // Verificar limites de tokens
            const tokenUsageService = getTokenUsageService();
            const canProceed = await tokenUsageService.checkTokenLimits({
              organizationId: input.organizationId,
              requestedTokens: agent.maxTokens || 1000,
            });

            if (!canProceed.allowed) {
              throw new TokenLimitExceededError(
                canProceed.reason || "Token limit exceeded",
              );
            }

            // Validar entrada com guardrails
            const guardrailService = getGuardrailService();
            const inputValidation = await guardrailService.validateInput({
              content: input.userMessage,
              organizationId: input.organizationId,
              agentId: input.agentId,
              guardrails: {
                enableContentFilter: agent.enableContentFilter,
                enablePiiDetection: agent.enablePiiDetection,
                maxResponseLength: agent.maxResponseLength || undefined,
                allowedTopics: agent.allowedTopics || [],
                blockedTopics: agent.blockedTopics || [],
              },
            });

            if (!inputValidation.isValid) {
              throw new GuardrailViolationError(
                "Input validation failed",
                inputValidation.violations,
              );
            }

            // Processar mensagem com o engine
            console.log("Starting message processing with agent engine...");
            const agentEngineService = getAgentEngineService();

            console.log("Processing message with params:", {
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              userMessageLength: input.userMessage?.length || 0,
              hasAgent: !!agent,
              agentModel: agent?.model || "unknown",
            });

            const result = await agentEngineService.processMessage({
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              userMessage: input.userMessage,
              context: input.context,
              agent,
            });

            console.log("Message processing completed successfully");
            return result;
          } catch (error) {
            console.error("=== AI AGENT ERROR DETAILS ===");
            console.error("Error Type:", (error as any)?.name || "Unknown");
            console.error(
              "Error Message:",
              (error as any)?.message || "No message",
            );
            console.error("Full Error Object:", error);
            console.error("Agent ID:", input.agentId);
            console.error("Organization ID:", input.organizationId);
            console.error("Session ID:", input.sessionId);
            console.error("================================");

            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              message: "Failed to process message",
              error: error as Error,
            });

            if (
              error instanceof AgentNotFoundError ||
              error instanceof TokenLimitExceededError ||
              error instanceof GuardrailViolationError
            ) {
              throw error;
            }

            throw new AIAgentError(
              "Failed to process message",
              "PROCESS_MESSAGE_ERROR",
            );
          }
        },

        // Obter histórico de conversa
        getConversationHistory: async (
          input: ConversationHistoryInput & { organizationId: string },
        ) => {
          try {
            const memoryService = getMemoryService();
            const memories = await memoryService.getConversationHistory(input);
            return memories;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              message: "Failed to get conversation history",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to get conversation history",
              "AGENT_ERROR",
            );
          }
        },

        // Buscar conhecimento (RAG)
        searchKnowledge: async (input: {
          query: string;
          knowledgeBaseId: string;
          limit?: number;
          threshold?: number;
        }): Promise<RAGRetrievalResult> => {
          try {
            const ragService = getRAGService();

            // Buscar o agente pela knowledgeBaseId para obter o agentId
            const agent = await prisma.aIAgent.findFirst({
              where: { knowledgeBaseId: input.knowledgeBaseId },
            });

            if (!agent) {
              throw new AIAgentError(
                "Agent not found for knowledge base",
                "AGENT_NOT_FOUND",
              );
            }

            const ragInput: RAGRetrievalInput = {
              query: input.query,
              agentId: agent.id,
              limit: input.limit,
              threshold: input.threshold,
            };

            const results = await ragService.retrieveRelevantChunks(ragInput);
            return results;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: "unknown",
              organizationId: "unknown",
              message: "Failed to search knowledge",
              error: error instanceof Error ? error : undefined,
            });
            throw new AIAgentError("Failed to search knowledge", "AGENT_ERROR");
          }
        },

        // Adicionar chunk de conhecimento
        addKnowledgeChunk: async (
          input: AddKnowledgeChunkInput & { organizationId: string },
        ) => {
          try {
            // Verificar se o agente existe
            const agent = await prisma.aIAgent.findFirst({
              where: {
                id: input.agentId,
                organizationId: input.organizationId,
              },
            });

            if (!agent) {
              throw new AgentNotFoundError("Agent not found");
            }

            const ragService = getRAGService();
            const chunk = await ragService.addKnowledgeChunk({
              agentId: input.agentId,
              sourceId: input.source || "unknown",
              content: input.content,
              metadata: input.metadata,
            });

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Knowledge chunk added successfully",
            });

            return chunk;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to add knowledge chunk",
              error: error as Error,
            });

            if (error instanceof AgentNotFoundError) {
              throw error;
            }

            throw new AIAgentError(
              "Failed to add knowledge chunk",
              "AGENT_ERROR",
            );
          }
        },

        // Atualizar chunk de conhecimento
        updateKnowledgeChunk: async (
          input: UpdateKnowledgeChunkInput & {
            agentId: string;
            organizationId: string;
          },
        ) => {
          try {
            const ragService = getRAGService();
            const chunk = await ragService.updateKnowledgeChunk(input);

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Knowledge chunk updated successfully",
            });

            return chunk;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to update knowledge chunk",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to update knowledge chunk",
              "AGENT_ERROR",
            );
          }
        },

        // Deletar chunk de conhecimento
        deleteKnowledgeChunk: async (input: {
          id: string;
          agentId: string;
          organizationId: string;
        }) => {
          try {
            const ragService = getRAGService();
            await ragService.deleteKnowledgeChunk(input.id);

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Knowledge chunk deleted successfully",
            });
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to delete knowledge chunk",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to delete knowledge chunk",
              "AGENT_ERROR",
            );
          }
        },

        // Upload de documento para base de conhecimento - temporariamente comentado
        // uploadKnowledgeBaseDocument: async (
        //   input: UploadKnowledgeBaseDocumentInput,
        // ) => {
        //   const knowledgeProcessorService =
        //     getKnowledgeProcessorService();
        //   return knowledgeProcessorService.uploadKnowledgeBaseDocument(input);
        // },

        // Listar arquivos de conhecimento
        listKnowledgeFiles: async (input: {
          agentId: string;
          organizationId: string;
        }) => {
          try {
            const files = await prisma.knowledgeFile.findMany({
              where: {
                agentId: input.agentId,
                organizationId: input.organizationId,
              },
              select: {
                id: true,
                filename: true,
                originalName: true,
                type: true,
                size: true,
                createdAt: true,
                _count: {
                  select: {
                    chunks: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            });

            return files;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to list knowledge files",
              error: error as Error,
            });

            throw new AIAgentError(
              "Failed to list knowledge files",
              "AGENT_ERROR",
            );
          }
        },

        // Obter arquivo de conhecimento por ID
        getKnowledgeFileById: async (input: {
          id: string;
          organizationId: string;
        }) => {
          try {
            const file = await prisma.knowledgeFile.findUnique({
              where: {
                id: input.id,
                organizationId: input.organizationId,
              },
              select: {
                id: true,
                filename: true,
                originalName: true,
                type: true,
                size: true,
                createdAt: true,
                _count: {
                  select: {
                    chunks: true,
                  },
                },
              },
            });

            if (!file) {
              throw new AIAgentError("Knowledge file not found", "AGENT_ERROR");
            }

            return file;
          } catch (error) {
            console.error("Error getting knowledge file by ID:", error);
            throw new AIAgentError(
              "Failed to get knowledge file by ID",
              "AGENT_ERROR",
            );
          }
        },

        // Criar um novo arquivo de conhecimento
        createKnowledgeFile: async (input: {
          organizationId: string;
          agentId: string;
          filename: string;
        }) => {
          try {
            const knowledgeFile = await prisma.knowledgeFile.create({
              data: {
                organizationId: input.organizationId,
                agentId: input.agentId,
                filename: input.filename,
                originalName: input.filename,
                type: "application/octet-stream",
                size: 0,
              },
            });
            return knowledgeFile;
          } catch (error) {
            console.error("Error creating knowledge file:", error);
            throw new AIAgentError(
              "Failed to create knowledge file",
              "AGENT_ERROR",
            );
          }
        },

        // Atualizar um arquivo de conhecimento existente
        updateKnowledgeFile: async (input: {
          id: string;
          organizationId: string;
          filename?: string;
          originalName?: string;
          type?: string;
          size?: number;
        }) => {
          try {
            const knowledgeFile = await prisma.knowledgeFile.update({
              where: {
                id: input.id,
                organizationId: input.organizationId,
              },
              data: {
                filename: input.filename,
                originalName: input.originalName,
                type: input.type,
                size: input.size,
              },
            });
            return knowledgeFile;
          } catch (error) {
            console.error("Error updating knowledge file:", error);
            throw new AIAgentError(
              "Failed to update knowledge file",
              "AGENT_ERROR",
            );
          }
        },

        // Obter estatísticas de um arquivo de conhecimento
        getKnowledgeFileStats: async (input: {
          id: string;
          organizationId: string;
        }) => {
          try {
            const knowledgeFile = await prisma.knowledgeFile.findUnique({
              where: {
                id: input.id,
                organizationId: input.organizationId,
              },
              select: {
                _count: {
                  select: {
                    chunks: true,
                  },
                },
              },
            });

            if (!knowledgeFile) {
              throw new AIAgentError("Knowledge file not found", "AGENT_ERROR");
            }

            return {
              chunksCount: knowledgeFile._count.chunks,
            };
          } catch (error) {
            console.error("Error getting knowledge file stats:", error);
            throw new AIAgentError(
              "Failed to get knowledge file stats",
              "AGENT_ERROR",
            );
          }
        },

        // Listar todos os arquivos de conhecimento da organização
        listOrganizationKnowledgeFiles: async (input: {
          organizationId: string;
          limit?: number;
          offset?: number;
          search?: string;
        }) => {
          try {
            const where: any = {
              organizationId: input.organizationId,
            };

            if (input.search) {
              where.OR = [
                {
                  originalName: { contains: input.search, mode: "insensitive" },
                },
                { filename: { contains: input.search, mode: "insensitive" } },
              ];
            }

            const [files, total] = await Promise.all([
              prisma.knowledgeFile.findMany({
                where,
                select: {
                  id: true,
                  filename: true,
                  originalName: true,
                  type: true,
                  size: true,
                  createdAt: true,
                  agentId: true,
                  agent: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  _count: {
                    select: {
                      chunks: true,
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
                take: input.limit || 20,
                skip: input.offset || 0,
              }),
              prisma.knowledgeFile.count({ where }),
            ]);

            return {
              data: files,
              pagination: {
                total,
                limit: input.limit || 20,
                offset: input.offset || 0,
                pages: Math.ceil(total / (input.limit || 20)),
              },
            };
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: "Failed to list organization knowledge files",
              error: error as Error,
            });

            throw new AIAgentError(
              "Failed to list organization knowledge files",
              "AGENT_ERROR",
            );
          }
        },

        // Deletar arquivo de conhecimento
        deleteKnowledgeFile: async (input: {
          fileId: string;
          organizationId: string;
        }) => {
          try {
            const file = await prisma.knowledgeFile.findFirst({
              where: { id: input.fileId, organizationId: input.organizationId },
            });

            if (!file) {
              throw new AIAgentError("Knowledge file not found", "AGENT_ERROR");
            }

            await prisma.knowledgeFile.delete({
              where: { id: input.fileId },
            });

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: file.agentId,
              organizationId: input.organizationId,
              message: "Knowledge file deleted successfully",
            });

            return { success: true };
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: "Failed to delete knowledge file",
              error: error as Error,
            });

            throw new AIAgentError(
              "Failed to delete knowledge file",
              "AGENT_ERROR",
            );
          }
        },

        // Listar documentos de um arquivo de conhecimento - TEMPORARIAMENTE DESABILITADO
        listKnowledgeFileDocuments: async (input: {
          knowledgeBaseId: string;
          organizationId: string;
          limit?: number;
          offset?: number;
        }) => {
          // TODO: Implementar quando o modelo KnowledgeFileDocument for criado
          return {
            data: [],
            pagination: {
              total: 0,
              limit: input.limit || 20,
              offset: input.offset || 0,
              pages: 0,
            },
          };
        },

        processKnowledgeFile: async (input: {
          fileId: string;
          organizationId: string;
        }) => {
          try {
            const file = await prisma.knowledgeFile.findFirst({
              where: {
                id: input.fileId,
                organizationId: input.organizationId,
              },
            });

            if (!file) {
              throw new Error("Knowledge file not found");
            }

            // TODO: Atualizar status quando o campo for adicionado ao modelo

            // Aqui você pode adicionar a lógica de processamento do arquivo
            // Por exemplo, extrair texto, dividir em chunks, gerar embeddings, etc.
            // Por enquanto, vamos simular o processamento

            // Simular processamento
            const chunks = [
              {
                content: `Chunk 1 do arquivo ${file.originalName}`,
                metadata: { page: 1, section: "introduction" },
              },
              {
                content: `Chunk 2 do arquivo ${file.originalName}`,
                metadata: { page: 2, section: "content" },
              },
            ];

            // Criar chunks no banco
            const createdChunks = await Promise.all(
              chunks.map((chunk) =>
                prisma.knowledgeChunk.create({
                  data: {
                    content: chunk.content,
                    metadata: chunk.metadata,
                    fileId: input.fileId,
                    agentId: file.agentId,
                    organizationId: input.organizationId,
                  },
                }),
              ),
            );

            // TODO: Atualizar status para processado quando o campo for adicionado ao modelo

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: file.agentId,
              organizationId: input.organizationId,
              message: "Knowledge file processed successfully",
            });

            return {
              success: true,
              chunksCreated: createdChunks.length,
              chunks: createdChunks,
            };
          } catch (error) {
            // TODO: Atualizar status para erro quando o campo for adicionado ao modelo

            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: "Failed to process knowledge file",
              error: error as Error,
            });

            throw new AIAgentError(
              "Failed to process knowledge file",
              "AGENT_ERROR",
            );
          }
        },

        // Obter estatísticas do agente
        getAgentStats: async (input: {
          agentId: string;
          organizationId: string;
          startDate?: Date;
          endDate?: Date;
        }): Promise<AgentStats> => {
          try {
            const agentEngineService = getAgentEngineService();
            const stats = await agentEngineService.getAgentStats(input);
            return stats;
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to get agent stats",
              error: error as Error,
            });
            throw new AIAgentError("Failed to get agent stats", "AGENT_ERROR");
          }
        },

        // Criar bot da Evolution API
        createEvolutionBot: async (
          input: CreateEvolutionBotInput & { organizationId: string },
        ) => {
          try {
            // const evolutionAPIService = getEvolutionAPIService()
            // const bot = await evolutionAPIService.createBot(input)
            throw new AIAgentError(
              "Evolution API service temporarily disabled",
              "AGENT_ERROR",
            );

            // const loggingService = getLoggingService()
            // await loggingService.logInfo({
            //   agentId: input.agentId,
            //   organizationId: input.organizationId,
            //   message: 'Evolution bot created successfully',
            // })

            // return bot
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to create Evolution bot",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to create Evolution bot",
              "AGENT_ERROR",
            );
          }
        },

        // Atualizar bot da Evolution API
        updateEvolutionBot: async (
          input: UpdateEvolutionBotInput & {
            agentId: string;
            organizationId: string;
          },
        ) => {
          try {
            // const evolutionAPIService = getEvolutionAPIService()
            // const bot = await evolutionAPIService.updateBot(input)
            throw new AIAgentError(
              "Evolution API service temporarily disabled",
              "AGENT_ERROR",
            );

            // const loggingService = getLoggingService()
            // await loggingService.logInfo({
            //   agentId: input.agentId,
            //   organizationId: input.organizationId,
            //   message: 'Evolution bot updated successfully',
            // })

            // return bot
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to update Evolution bot",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to update Evolution bot",
              "AGENT_ERROR",
            );
          }
        },

        // Deletar bot da Evolution API
        deleteEvolutionBot: async (input: {
          evolutionBotId: string;
          agentId: string;
          organizationId: string;
        }) => {
          try {
            // const evolutionAPIService = getEvolutionAPIService()
            // await evolutionAPIService.deleteBot({
            //   evolutionBotId: input.evolutionBotId,
            // })
            throw new AIAgentError(
              "Evolution API service temporarily disabled",
              "AGENT_ERROR",
            );

            // const loggingService = getLoggingService()
            // await loggingService.logInfo({
            //   agentId: input.agentId,
            //   organizationId: input.organizationId,
            //   message: 'Evolution bot deleted successfully',
            // })
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to delete Evolution bot",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to delete Evolution bot",
              "AGENT_ERROR",
            );
          }
        },

        // Obter status do bot da Evolution API
        getEvolutionBotStatus: async (input: {
          evolutionBotId: string;
          agentId: string;
          organizationId: string;
        }) => {
          try {
            // const evolutionAPIService = getEvolutionAPIService()
            // const status = await evolutionAPIService.getBotStatus({
            //   evolutionBotId: input.evolutionBotId,
            // })
            // return status
            throw new AIAgentError(
              "Evolution API service temporarily disabled",
              "AGENT_ERROR",
            );
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: "Failed to get Evolution bot status",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to get Evolution bot status",
              "AGENT_ERROR",
            );
          }
        },

        // Processar webhook da Evolution API
        processEvolutionWebhook: async (input: {
          payload: any;
          headers: Record<string, string>;
          signature?: string;
        }) => {
          try {
            // Verificar se é um evento de mensagem
            if (input.payload.event !== "messages.upsert") {
              return {
                success: true,
                message: "Event ignored - not a message event",
              };
            }

            // Buscar agente pela instância
            const agent = await prisma.aIAgent.findFirst({
              where: {
                metadata: {
                  path: ["evolutionInstance"],
                  equals: input.payload.instance,
                },
                isActive: true,
              },
              include: {
                openaiCreds: true,
                organization: true,
              },
            });

            if (!agent) {
              return {
                success: false,
                error: `No active agent found for instance: ${input.payload.instance}`,
              };
            }

            // Extrair mensagem do payload
            const messageData = input.payload.data;
            const messageText =
              messageData.message?.conversation ||
              messageData.message?.extendedTextMessage?.text ||
              null;

            if (!messageText) {
              return {
                success: true,
                message: "No text message found in payload",
              };
            }

            // Verificar se não é mensagem própria
            if (messageData.key.fromMe) {
              return {
                success: true,
                message: "Ignoring own message",
              };
            }

            // Processar mensagem com o agente
            const agentEngineService = getAgentEngineService();
            const result = await agentEngineService.processMessage({
              agentId: agent.id,
              organizationId: agent.organizationId,
              sessionId: messageData.key.remoteJid,
              userMessage: messageText,
              context: {
                messageId: messageData.key.id,
                timestamp: messageData.messageTimestamp,
                pushName: messageData.pushName,
                participant: messageData.participant,
                platform: "whatsapp",
              },
              agent,
            });

            // Enviar resposta via Evolution API se houver
            if (result.response && result.response.trim()) {
              // const evolutionAPIService = getEvolutionAPIService()
              // await evolutionAPIService.sendMessage({
              //   instance: input.payload.instance,
              //   remoteJid: messageData.key.remoteJid,
              //   message: result.response,
              // })
            }

            return {
              success: true,
              agentId: agent.id,
              response: result.response,
              tokensUsed: result.tokenUsage.totalTokens,
            };
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: "",
              message: "Failed to process Evolution webhook",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to process Evolution webhook",
              "AGENT_ERROR",
            );
          }
        },

        // Processar status de mensagem
        processMessageStatus: async (input: {
          payload: any;
          signature?: string;
        }) => {
          try {
            // Registrar status da mensagem para analytics
            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: undefined,
              organizationId: "",
              message: "Message status update received",
              metadata: {
                messageId: input.payload.data?.key?.id,
                status: input.payload.data?.status,
                remoteJid: input.payload.data?.key?.remoteJid,
              },
            });

            return {
              success: true,
              message: "Status processed successfully",
            };
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: "",
              message: "Failed to process message status",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to process message status",
              "AGENT_ERROR",
            );
          }
        },

        // Processar evento de conexão
        processConnectionEvent: async (input: {
          payload: any;
          signature?: string;
        }) => {
          try {
            // Atualizar status da conexão do agente
            await prisma.aIAgent.updateMany({
              where: {
                metadata: {
                  path: ["evolutionInstance"],
                  equals: input.payload.instance,
                },
              },
              data: {
                metadata: {
                  ...input.payload.metadata,
                  connectionStatus:
                    input.payload.data?.state === "open"
                      ? "CONNECTED"
                      : "DISCONNECTED",
                  lastConnectionAt: new Date().toISOString(),
                },
                updatedAt: new Date(),
              },
            });

            const loggingService = getLoggingService();
            await loggingService.logInfo({
              agentId: undefined,
              organizationId: "",
              message: "Connection event processed successfully",
              metadata: {
                instance: input.payload.instance,
                state: input.payload.data?.state,
              },
            });

            return {
              success: true,
              message: "Connection event processed successfully",
            };
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: "",
              message: "Failed to process connection event",
              error: error as Error,
            });
            throw new AIAgentError(
              "Failed to process connection event",
              "AGENT_ERROR",
            );
          }
        },

        // Testar webhook
        testWebhook: async (input: {
          organizationId: string;
          instanceName: string;
          testMessage: string;
        }) => {
          try {
            // Buscar agente
            const agent = await prisma.aIAgent.findFirst({
              where: {
                organizationId: input.organizationId,
                metadata: {
                  path: ["evolutionInstance"],
                  equals: input.instanceName,
                },
                isActive: true,
              },
            });

            if (!agent) {
              return {
                success: false,
                error: "Agent not found for this instance",
              };
            }

            // Simular payload de webhook
            const testPayload = {
              event: "messages.upsert",
              instance: input.instanceName,
              data: {
                key: {
                  remoteJid: "test@s.whatsapp.net",
                  fromMe: false,
                  id: `test-${Date.now()}`,
                },
                message: {
                  conversation: input.testMessage,
                },
                messageTimestamp: Math.floor(Date.now() / 1000),
                pushName: "Test User",
              },
            };

            // Processar webhook de teste
            const agentEngineService = getAgentEngineService();
            const result = await agentEngineService.processMessage({
              agentId: agent.id,
              organizationId: input.organizationId,
              sessionId: "test-session",
              userMessage: input.testMessage,
              context: {
                platform: "whatsapp-test",
                testMode: true,
              },
              agent,
            });

            return {
              success: true,
              response: result.response,
              tokensUsed: result.tokenUsage.totalTokens,
            };
          } catch (error) {
            const loggingService = getLoggingService();
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: "Failed to test webhook",
              error: error as Error,
            });
            throw new AIAgentError("Failed to test webhook", "AGENT_ERROR");
          }
        },
      },
    };
  },
});
