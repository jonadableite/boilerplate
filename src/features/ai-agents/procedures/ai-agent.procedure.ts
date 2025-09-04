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
                      memory: true,
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
                    memory: true,
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
                type: input.type,
                role: input.role,
                goal: input.goal,
                systemPrompt: input.systemPrompt,
                modelConfig,
                guardrailConfig,
                knowledgeBaseId: input.knowledgeBaseId,
                fallbackMessage: input.fallbackMessage,
                isActive: input.isActive,
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
                    memory: true,
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

            // Preparar dados de atualização
            const dataToUpdate: any = { ...updateData }

            // Atualizar configurações se fornecidas
            if (
              updateData.model ||
              updateData.temperature !== undefined ||
              updateData.maxTokens !== undefined ||
              updateData.topP !== undefined ||
              updateData.frequencyPenalty !== undefined ||
              updateData.presencePenalty !== undefined
            ) {
              dataToUpdate.modelConfig = {
                ...existingAgent.modelConfig,
                ...(updateData.model && { model: updateData.model }),
                ...(updateData.temperature !== undefined && {
                  temperature: updateData.temperature,
                }),
                ...(updateData.maxTokens !== undefined && {
                  maxTokens: updateData.maxTokens,
                }),
                ...(updateData.topP !== undefined && { topP: updateData.topP }),
                ...(updateData.frequencyPenalty !== undefined && {
                  frequencyPenalty: updateData.frequencyPenalty,
                }),
                ...(updateData.presencePenalty !== undefined && {
                  presencePenalty: updateData.presencePenalty,
                }),
              }

              // Remover campos individuais do modelo
              delete dataToUpdate.model
              delete dataToUpdate.temperature
              delete dataToUpdate.maxTokens
              delete dataToUpdate.topP
              delete dataToUpdate.frequencyPenalty
              delete dataToUpdate.presencePenalty
            }

            if (
              updateData.enableContentFilter !== undefined ||
              updateData.enablePiiDetection !== undefined ||
              updateData.maxResponseLength !== undefined ||
              updateData.allowedTopics ||
              updateData.blockedTopics
            ) {
              dataToUpdate.guardrailConfig = {
                ...existingAgent.guardrailConfig,
                ...(updateData.enableContentFilter !== undefined && {
                  enableContentFilter: updateData.enableContentFilter,
                }),
                ...(updateData.enablePiiDetection !== undefined && {
                  enablePiiDetection: updateData.enablePiiDetection,
                }),
                ...(updateData.maxResponseLength !== undefined && {
                  maxResponseLength: updateData.maxResponseLength,
                }),
                ...(updateData.allowedTopics && {
                  allowedTopics: updateData.allowedTopics,
                }),
                ...(updateData.blockedTopics && {
                  blockedTopics: updateData.blockedTopics,
                }),
              }

              // Remover campos individuais de guardrails
              delete dataToUpdate.enableContentFilter
              delete dataToUpdate.enablePiiDetection
              delete dataToUpdate.maxResponseLength
              delete dataToUpdate.allowedTopics
              delete dataToUpdate.blockedTopics
            }

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
                    memory: true,
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
              requestedTokens: agent.modelConfig.maxTokens || 1000,
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
              config: agent.guardrailConfig,
            })

            if (!inputValidation.isValid) {
              throw new GuardrailViolationError(
                'Input validation failed',
                inputValidation.violations,
              )
            }

            // Processar mensagem com o engine
            const agentEngineService = getAgentEngineService()
            const result = await agentEngineService.processMessage({
              agentId: input.agentId,
              organizationId: input.organizationId,
              sessionId: input.sessionId,
              userMessage: input.userMessage,
              context: input.context,
              agent,
            })

            return result
          } catch (error) {
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
