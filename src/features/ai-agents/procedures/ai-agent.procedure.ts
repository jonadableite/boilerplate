import { igniter } from '@/igniter'
import { prisma } from '@/providers/prisma'
import {
  CreateAIAgentInput,
  UpdateAIAgentInput,
  ProcessMessageInput,
  ProcessMessageResult,
  ListAgentsInput,
  ListAgentsResult,
  ConversationHistoryInput,
  RAGRetrievalInput,
  RAGRetrievalResult,
  AddKnowledgeChunkInput,
  UpdateKnowledgeChunkInput,
  CreateEvolutionBotInput,
  UpdateEvolutionBotInput,
  AgentStats,
  AIAgentWithRelations,
} from '../types/ai-agent.types'
import {
  AIAgentError,
  AgentNotFoundError,
  InvalidConfigurationError,
  TokenLimitExceededError,
  GuardrailViolationError,
} from '../types/services.types'
import { AgentEngineService } from '../services/agent-engine.service'
import { TokenUsageService } from '../services/token-usage.service'
import { MemoryService } from '../services/memory.service'
import { RAGService } from '../services/rag.service'
import { GuardrailService } from '../services/guardrail.service'
// import { EvolutionAPIService } from '../services/evolution-api.service' // Comentado temporariamente
import { LoggingService } from '../services/logging.service'

export const AIAgentFeatureProcedure = igniter.procedure({
  name: 'AIAgentFeatureProcedure',
  handler: async () => {
    // Serviços serão inicializados sob demanda para evitar problemas de dependência
    const getAgentEngineService = () => new AgentEngineService()
    const getTokenUsageService = () => new TokenUsageService()
    const getMemoryService = () => new MemoryService()
    const getRagService = () => new RAGService()
    const getGuardrailService = () => new GuardrailService()
    const getLoggingService = () => new LoggingService()

    return {
      aiAgent: {
        // Listar agentes
        listAgents: async (
          input: ListAgentsInput,
        ): Promise<ListAgentsResult> => {
          try {
            const { organizationId, type, isActive, limit, offset, search } =
              input

            const where: any = {
              organizationId,
              ...(type && { type }),
              ...(isActive !== undefined && { isActive }),
              ...(search && {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                  { role: { contains: search, mode: 'insensitive' } },
                ],
              }),
            }

            const [agents, total] = await Promise.all([
              prisma.aIAgent.findMany({
                where,
                include: {
                  createdBy: {
                    select: { id: true, name: true, email: true },
                  },
                  organization: {
                    select: { id: true, name: true },
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
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
              }),
              prisma.aIAgent.count({ where }),
            ])

            return {
              data: agents as AIAgentWithRelations[],
              pagination: {
                total,
                limit,
                offset,
                pages: Math.ceil(total / limit),
              },
            }
          } catch (error) {
            console.error('Error in listAgents:', error)
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: 'Failed to list agents',
              error: error as Error,
            })
            // Throw the original error for debugging
            throw error
          }
        },

        // Obter agente por ID
        getAgentById: async (input: {
          id: string
          organizationId: string
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
                  select: { id: true, name: true },
                },
                openaiCreds: true,
                _count: {
                  select: {
                    memories: true,
                    knowledgeChunks: true,
                  },
                },
              },
            })

            return agent as AIAgentWithRelations | null
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.id,
              organizationId: input.organizationId,
              message: 'Failed to get agent by ID',
              error,
            })
            throw new AIAgentError('Failed to get agent')
          }
        },

        // Criar agente
        createAgent: async (
          input: CreateAIAgentInput & {
            organizationId: string
            createdById: string
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
            }

            const guardrailConfig = {
              enableContentFilter: input.enableContentFilter,
              enablePiiDetection: input.enablePiiDetection,
              maxResponseLength: input.maxResponseLength,
              allowedTopics: input.allowedTopics,
              blockedTopics: input.blockedTopics,
            }

            // Verificar se as credenciais OpenAI existem (se fornecidas)
            if (input.openaiCredsId) {
              const creds = await prisma.openAICreds.findFirst({
                where: {
                  id: input.openaiCredsId,
                  organizationId: input.organizationId,
                },
              })

              if (!creds) {
                throw new InvalidConfigurationError(
                  'OpenAI credentials not found',
                )
              }
            }

            const agent = await prisma.aIAgent.create({
              data: {
                name: input.name,
                description: input.description,
                type: input.type || 'LLM_AGENT',
                role: input.role,
                goal: input.goal,
                systemPrompt: input.systemPrompt,
                // Configurações do modelo (campos individuais)
                model: input.model || 'gpt-4',
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
                  select: { id: true, name: true },
                },
                openaiCreds: true,
                _count: {
                  select: {
                    memories: true,
                    knowledgeChunks: true,
                  },
                },
              },
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: agent.id,
              organizationId: input.organizationId,
              message: `Agent '${agent.name}' created successfully`,
            })

            return agent as AIAgentWithRelations
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: 'Failed to create agent',
              error,
            })

            if (error instanceof InvalidConfigurationError) {
              throw error
            }

            throw new AIAgentError('Failed to create agent')
          }
        },

        // Atualizar agente
        updateAgent: async (
          input: UpdateAIAgentInput & {
            organizationId: string
          },
        ): Promise<AIAgentWithRelations> => {
          try {
            const { id, organizationId, ...updateData } = input

            // Verificar se o agente existe
            const existingAgent = await prisma.aIAgent.findFirst({
              where: { id, organizationId },
            })

            if (!existingAgent) {
              throw new AgentNotFoundError('Agent not found')
            }

            // Preparar dados de atualização (usar campos individuais)
            const dataToUpdate: any = { ...updateData }

            // Verificar credenciais OpenAI se fornecidas
            if (updateData.openaiCredsId) {
              const creds = await prisma.openAICreds.findFirst({
                where: {
                  id: updateData.openaiCredsId,
                  organizationId,
                },
              })

              if (!creds) {
                throw new InvalidConfigurationError(
                  'OpenAI credentials not found',
                )
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
                  select: { id: true, name: true },
                },
                openaiCreds: true,
                _count: {
                  select: {
                    memories: true,
                    knowledgeChunks: true,
                  },
                },
              },
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: agent.id,
              organizationId,
              message: `Agent '${agent.name}' updated successfully`,
            })

            return agent as AIAgentWithRelations
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.id,
              organizationId: input.organizationId,
              message: 'Failed to update agent',
              error,
            })

            if (
              error instanceof AgentNotFoundError ||
              error instanceof InvalidConfigurationError
            ) {
              throw error
            }

            throw new AIAgentError('Failed to update agent')
          }
        },

        // Deletar agente
        deleteAgent: async (input: {
          id: string
          organizationId: string
        }): Promise<void> => {
          try {
            const agent = await prisma.aIAgent.findFirst({
              where: {
                id: input.id,
                organizationId: input.organizationId,
              },
            })

            if (!agent) {
              throw new AgentNotFoundError('Agent not found')
            }

            // Deletar em transação para manter consistência
            await prisma.$transaction(async (tx) => {
              // Deletar memórias do agente
              await tx.aIAgentMemory.deleteMany({
                where: { agentId: input.id },
              })

              // Deletar chunks de conhecimento
              await tx.knowledgeChunk.deleteMany({
                where: { agentId: input.id },
              })

              // Deletar logs
              await tx.messageLog.deleteMany({
                where: { agentId: input.id },
              })

              // Deletar histórico de uso de tokens
              await tx.tokenUsageHistory.deleteMany({
                where: { agentId: input.id },
              })

              // Deletar o agente
              await tx.aIAgent.delete({
                where: { id: input.id },
              })
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: input.id,
              organizationId: input.organizationId,
              message: `Agent '${agent.name}' deleted successfully`,
            })
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.id,
              organizationId: input.organizationId,
              message: 'Failed to delete agent',
              error,
            })

            if (error instanceof AgentNotFoundError) {
              throw error
            }

            throw new AIAgentError('Failed to delete agent')
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
            })

            if (!agent) {
              throw new AgentNotFoundError('Agent not found or inactive')
            }

            // Verificar limites de tokens
            const tokenUsageService = getTokenUsageService()
            const canProceed = await tokenUsageService.checkTokenLimits({
              organizationId: input.organizationId,
              requestedTokens: agent.maxTokens || 1000,
            })

            if (!canProceed.allowed) {
              throw new TokenLimitExceededError(
                canProceed.reason || 'Token limit exceeded',
              )
            }

            // Validar entrada com guardrails
            const guardrailService = getGuardrailService()
            const inputValidation = await guardrailService.validateInput({
              content: input.userMessage,
              config: {
                enableContentFilter: agent.enableContentFilter,
                enablePiiDetection: agent.enablePiiDetection,
                maxResponseLength: agent.maxResponseLength,
                allowedTopics: agent.allowedTopics || [],
                blockedTopics: agent.blockedTopics || [],
              },
            })

            if (!inputValidation.isValid) {
              throw new GuardrailViolationError(
                'Input validation failed',
                inputValidation.violations,
              )
            }

            // Processar mensagem com o engine
            console.log('Starting message processing with agent engine...')
            const agentEngineService = getAgentEngineService()
            
            console.log('Processing message with params:', {
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              userMessageLength: input.userMessage?.length || 0,
              hasAgent: !!agent,
              agentModel: agent?.model || 'unknown'
            })
            
            const result = await agentEngineService.processMessage({
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              userMessage: input.userMessage,
              context: input.context,
              agent,
            })

            console.log('Message processing completed successfully')
            return result
          } catch (error) {
            console.error('=== AI AGENT ERROR DETAILS ===')
            console.error('Error Type:', error?.name || 'Unknown')
            console.error('Error Message:', error?.message || 'No message')
            console.error('Full Error Object:', error)
            console.error('Agent ID:', input.agentId)
            console.error('Organization ID:', input.organizationId)
            console.error('Session ID:', input.sessionId)
            console.error('================================')
            
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              message: 'Failed to process message',
              error,
            })

            if (
              error instanceof AgentNotFoundError ||
              error instanceof TokenLimitExceededError ||
              error instanceof GuardrailViolationError
            ) {
              throw error
            }

            throw new AIAgentError('Failed to process message')
          }
        },

        // Obter histórico de conversa
        getConversationHistory: async (
          input: ConversationHistoryInput & { organizationId: string },
        ) => {
          try {
            const memoryService = getMemoryService()
            const memories = await memoryService.getConversationHistory(input)
            return memories
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              message: 'Failed to get conversation history',
              error,
            })
            throw new AIAgentError('Failed to get conversation history')
          }
        },

        // Buscar conhecimento (RAG)
        searchKnowledge: async (
          input: RAGRetrievalInput,
        ): Promise<RAGRetrievalResult> => {
          try {
            const ragService = getRagService()
            const results = await ragService.retrieveRelevantChunks(input)
            return results
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: undefined,
              message: 'Failed to search knowledge',
              error,
            })
            throw new AIAgentError('Failed to search knowledge')
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
            })

            if (!agent) {
              throw new AgentNotFoundError('Agent not found')
            }

            const ragService = getRagService()
            const chunk = await ragService.addKnowledgeChunk({
              agentId: input.agentId,
              sourceId: input.sourceId,
              content: input.content,
              metadata: input.metadata,
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Knowledge chunk added successfully',
            })

            return chunk
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to add knowledge chunk',
              error,
            })

            if (error instanceof AgentNotFoundError) {
              throw error
            }

            throw new AIAgentError('Failed to add knowledge chunk')
          }
        },

        // Atualizar chunk de conhecimento
        updateKnowledgeChunk: async (
          input: UpdateKnowledgeChunkInput & {
            agentId: string
            organizationId: string
          },
        ) => {
          try {
            const ragService = getRagService()
            const chunk = await ragService.updateKnowledgeChunk(input)

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Knowledge chunk updated successfully',
            })

            return chunk
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to update knowledge chunk',
              error,
            })
            throw new AIAgentError('Failed to update knowledge chunk')
          }
        },

        // Deletar chunk de conhecimento
        deleteKnowledgeChunk: async (input: {
          id: string
          agentId: string
          organizationId: string
        }) => {
          try {
            const ragService = getRagService()
            await ragService.deleteKnowledgeChunk({
              id: input.id,
              agentId: input.agentId,
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Knowledge chunk deleted successfully',
            })
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to delete knowledge chunk',
              error,
            })
            throw new AIAgentError('Failed to delete knowledge chunk')
          }
        },

        // Upload arquivo de conhecimento
        uploadKnowledgeFile: async (input: {
          agentId: string
          organizationId: string
          file: {
            name: string
            type: string
            size: number
            content: string
          }
        }) => {
          try {
            // Verificar se o agente existe e pertence à organização
            const agent = await prisma.aIAgent.findFirst({
              where: {
                id: input.agentId,
                organizationId: input.organizationId,
              },
            })

            if (!agent) {
              throw new AgentNotFoundError('Agent not found')
            }

            // Criar registro do arquivo
            const knowledgeFile = await prisma.knowledgeFile.create({
              data: {
                filename: `${Date.now()}-${input.file.name}`,
                originalName: input.file.name,
                mimeType: input.file.type,
                size: input.file.size,
                content: input.file.content,
                status: 'uploaded',
                agentId: input.agentId,
                organizationId: input.organizationId,
              },
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Knowledge file uploaded successfully',
            })

            return knowledgeFile
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to upload knowledge file',
              error,
            })

            if (error instanceof AgentNotFoundError) {
              throw error
            }

            throw new AIAgentError('Failed to upload knowledge file')
          }
        },

        // Listar arquivos de conhecimento
        listKnowledgeFiles: async (input: {
          agentId: string
          organizationId: string
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
                mimeType: true,
                size: true,
                status: true,
                createdAt: true,
                _count: {
                  select: {
                    chunks: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            })

            return files
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to list knowledge files',
              error,
            })

            throw new AIAgentError('Failed to list knowledge files')
          }
        },

        // Deletar arquivo de conhecimento
        deleteKnowledgeFile: async (input: {
          fileId: string
          organizationId: string
        }) => {
          try {
            // Verificar se o arquivo existe e pertence à organização
            const file = await prisma.knowledgeFile.findFirst({
              where: {
                id: input.fileId,
                organizationId: input.organizationId,
              },
            })

            if (!file) {
              throw new Error('Knowledge file not found')
            }

            // Deletar chunks relacionados e o arquivo
            await prisma.$transaction(async (tx) => {
              await tx.knowledgeChunk.deleteMany({
                where: { fileId: input.fileId },
              })

              await tx.knowledgeFile.delete({
                where: { id: input.fileId },
              })
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: file.agentId,
              organizationId: input.organizationId,
              message: 'Knowledge file deleted successfully',
            })

            return { success: true }
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: 'Failed to delete knowledge file',
              error,
            })

            throw new AIAgentError('Failed to delete knowledge file')
          }
        },

        // Processar arquivo de conhecimento
        processKnowledgeFile: async (input: {
          fileId: string
          organizationId: string
        }) => {
          try {
            const file = await prisma.knowledgeFile.findFirst({
              where: {
                id: input.fileId,
                organizationId: input.organizationId,
              },
            })

            if (!file) {
              throw new Error('Knowledge file not found')
            }

            // Atualizar status para processando
            await prisma.knowledgeFile.update({
              where: { id: input.fileId },
              data: { status: 'processing' },
            })

            // Aqui você pode adicionar a lógica de processamento do arquivo
            // Por exemplo, extrair texto, dividir em chunks, gerar embeddings, etc.
            // Por enquanto, vamos simular o processamento

            // Simular processamento
            const chunks = [
              {
                content: `Chunk 1 do arquivo ${file.originalName}`,
                metadata: { page: 1, section: 'introduction' },
              },
              {
                content: `Chunk 2 do arquivo ${file.originalName}`,
                metadata: { page: 2, section: 'content' },
              },
            ]

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
                })
              )
            )

            // Atualizar status para processado
            await prisma.knowledgeFile.update({
              where: { id: input.fileId },
              data: { status: 'processed' },
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: file.agentId,
              organizationId: input.organizationId,
              message: 'Knowledge file processed successfully',
            })

            return {
              success: true,
              chunksCreated: createdChunks.length,
              chunks: createdChunks,
            }
          } catch (error) {
            // Atualizar status para erro
            await prisma.knowledgeFile.update({
              where: { id: input.fileId },
              data: { status: 'error' },
            })

            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: 'Failed to process knowledge file',
              error,
            })

            throw new AIAgentError('Failed to process knowledge file')
          }
        },

        // Obter estatísticas do agente
        getAgentStats: async (input: {
          agentId: string
          organizationId: string
          startDate?: Date
          endDate?: Date
        }): Promise<AgentStats> => {
          try {
            const agentEngineService = getAgentEngineService()
            const stats = await agentEngineService.getAgentStats(input)
            return stats
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to get agent stats',
              error,
            })
            throw new AIAgentError('Failed to get agent stats')
          }
        },

        // Criar bot da Evolution API
        createEvolutionBot: async (
          input: CreateEvolutionBotInput & { organizationId: string },
        ) => {
          try {
            // const evolutionAPIService = getEvolutionAPIService()
            // const bot = await evolutionAPIService.createBot(input)
            throw new AIAgentError('Evolution API service temporarily disabled')

            // const loggingService = getLoggingService()
            // await loggingService.logInfo({
            //   agentId: input.agentId,
            //   organizationId: input.organizationId,
            //   message: 'Evolution bot created successfully',
            // })

            // return bot
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to create Evolution bot',
              error,
            })
            throw new AIAgentError('Failed to create Evolution bot')
          }
        },

        // Atualizar bot da Evolution API
        updateEvolutionBot: async (
          input: UpdateEvolutionBotInput & {
            agentId: string
            organizationId: string
          },
        ) => {
          try {
            // const evolutionAPIService = getEvolutionAPIService()
            // const bot = await evolutionAPIService.updateBot(input)
            throw new AIAgentError('Evolution API service temporarily disabled')

            // const loggingService = getLoggingService()
            // await loggingService.logInfo({
            //   agentId: input.agentId,
            //   organizationId: input.organizationId,
            //   message: 'Evolution bot updated successfully',
            // })

            // return bot
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to update Evolution bot',
              error,
            })
            throw new AIAgentError('Failed to update Evolution bot')
          }
        },

        // Deletar bot da Evolution API
        deleteEvolutionBot: async (input: {
          evolutionBotId: string
          agentId: string
          organizationId: string
        }) => {
          try {
            // const evolutionAPIService = getEvolutionAPIService()
            // await evolutionAPIService.deleteBot({
            //   evolutionBotId: input.evolutionBotId,
            // })
            throw new AIAgentError('Evolution API service temporarily disabled')

            // const loggingService = getLoggingService()
            // await loggingService.logInfo({
            //   agentId: input.agentId,
            //   organizationId: input.organizationId,
            //   message: 'Evolution bot deleted successfully',
            // })
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to delete Evolution bot',
              error,
            })
            throw new AIAgentError('Failed to delete Evolution bot')
          }
        },

        // Obter status do bot da Evolution API
        getEvolutionBotStatus: async (input: {
          evolutionBotId: string
          agentId: string
          organizationId: string
        }) => {
          try {
            // const evolutionAPIService = getEvolutionAPIService()
            // const status = await evolutionAPIService.getBotStatus({
            //   evolutionBotId: input.evolutionBotId,
            // })
            // return status
            throw new AIAgentError('Evolution API service temporarily disabled')
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: input.agentId,
              organizationId: input.organizationId,
              message: 'Failed to get Evolution bot status',
              error,
            })
            throw new AIAgentError('Failed to get Evolution bot status')
          }
        },

        // Processar webhook da Evolution API
        processEvolutionWebhook: async (input: {
          payload: any
          headers: Record<string, string>
          signature?: string
        }) => {
          try {
            // Verificar se é um evento de mensagem
            if (input.payload.event !== 'messages.upsert') {
              return {
                success: true,
                message: 'Event ignored - not a message event',
              }
            }

            // Buscar agente pela instância
            const agent = await prisma.aIAgent.findFirst({
              where: {
                metadata: {
                  path: ['evolutionInstance'],
                  equals: input.payload.instance,
                },
                isActive: true,
              },
              include: {
                openaiCreds: true,
                organization: true,
              },
            })

            if (!agent) {
              return {
                success: false,
                error: `No active agent found for instance: ${input.payload.instance}`,
              }
            }

            // Extrair mensagem do payload
            const messageData = input.payload.data
            const messageText = messageData.message?.conversation || 
                              messageData.message?.extendedTextMessage?.text ||
                              null

            if (!messageText) {
              return {
                success: true,
                message: 'No text message found in payload',
              }
            }

            // Verificar se não é mensagem própria
            if (messageData.key.fromMe) {
              return {
                success: true,
                message: 'Ignoring own message',
              }
            }

            // Processar mensagem com o agente
            const agentEngineService = getAgentEngineService()
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
                platform: 'whatsapp',
              },
              agent,
            })

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
              tokensUsed: result.tokensUsed,
            }
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: undefined,
              message: 'Failed to process Evolution webhook',
              error,
            })
            throw new AIAgentError('Failed to process Evolution webhook')
          }
        },

        // Processar status de mensagem
        processMessageStatus: async (input: {
          payload: any
          signature?: string
        }) => {
          try {
            // Registrar status da mensagem para analytics
            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: undefined,
              organizationId: undefined,
              message: 'Message status update received',
              metadata: {
                messageId: input.payload.data?.key?.id,
                status: input.payload.data?.status,
                remoteJid: input.payload.data?.key?.remoteJid,
              },
            })

            return {
              success: true,
              message: 'Status processed successfully',
            }
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: undefined,
              message: 'Failed to process message status',
              error,
            })
            throw new AIAgentError('Failed to process message status')
          }
        },

        // Processar evento de conexão
        processConnectionEvent: async (input: {
          payload: any
          signature?: string
        }) => {
          try {
            // Atualizar status da conexão do agente
            await prisma.aIAgent.updateMany({
              where: {
                metadata: {
                  path: ['evolutionInstance'],
                  equals: input.payload.instance,
                },
              },
              data: {
                metadata: {
                  ...input.payload.metadata,
                  connectionStatus: input.payload.data?.state === 'open' ? 'CONNECTED' : 'DISCONNECTED',
                  lastConnectionAt: new Date().toISOString(),
                },
                updatedAt: new Date(),
              },
            })

            const loggingService = getLoggingService()
            await loggingService.logInfo({
              agentId: undefined,
              organizationId: undefined,
              message: 'Connection event processed successfully',
              metadata: {
                instance: input.payload.instance,
                state: input.payload.data?.state,
              },
            })

            return {
              success: true,
              message: 'Connection event processed successfully',
            }
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: undefined,
              message: 'Failed to process connection event',
              error,
            })
            throw new AIAgentError('Failed to process connection event')
          }
        },

        // Testar webhook
        testWebhook: async (input: {
          organizationId: string
          instanceName: string
          testMessage: string
        }) => {
          try {
            // Buscar agente
            const agent = await prisma.aIAgent.findFirst({
              where: {
                organizationId: input.organizationId,
                metadata: {
                  path: ['evolutionInstance'],
                  equals: input.instanceName,
                },
                isActive: true,
              },
            })

            if (!agent) {
              return {
                success: false,
                error: 'Agent not found for this instance',
              }
            }

            // Simular payload de webhook
            const testPayload = {
              event: 'messages.upsert',
              instance: input.instanceName,
              data: {
                key: {
                  remoteJid: 'test@s.whatsapp.net',
                  fromMe: false,
                  id: `test-${Date.now()}`,
                },
                message: {
                  conversation: input.testMessage,
                },
                messageTimestamp: Math.floor(Date.now() / 1000),
                pushName: 'Test User',
              },
            }

            // Processar webhook de teste
            const agentEngineService = getAgentEngineService()
            const result = await agentEngineService.processMessage({
              agentId: agent.id,
              organizationId: input.organizationId,
              sessionId: 'test-session',
              userMessage: input.testMessage,
              context: {
                platform: 'whatsapp-test',
                testMode: true,
              },
              agent,
            })

            return {
              success: true,
              response: result.response,
              tokensUsed: result.tokensUsed,
            }
          } catch (error) {
            const loggingService = getLoggingService()
            await loggingService.logError({
              agentId: undefined,
              organizationId: input.organizationId,
              message: 'Failed to test webhook',
              error,
            })
            throw new AIAgentError('Failed to test webhook')
          }
        },
      },
    }
  },
})
