import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { prisma } from "@/providers/prisma";
import { TokenUsageService } from "./token-usage.service";
import { RAGService } from "./rag.service";
import { GuardrailService } from "./guardrail.service";
import { MemoryService } from "./memory.service";

// Configuração do modelo
interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Configuração do agente
interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  modelConfig: ModelConfig;
  knowledgeBaseId?: string;
  guardrails?: any;
  organizationId: string;
}

export class AgentEngineService {
  private tokenUsageService: TokenUsageService;
  private ragService: RAGService;
  private guardrailService: GuardrailService;
  private memoryService: MemoryService;

  constructor() {
    this.tokenUsageService = new TokenUsageService();
    this.ragService = new RAGService();
    this.guardrailService = new GuardrailService();
    this.memoryService = new MemoryService();
  }

  /**
   * Processa uma mensagem do usuário através do agente
   */
  async processMessage({
    agentId,
    sessionId,
    organizationId,
    userMessage,
  }: {
    agentId: string;
    sessionId: string;
    organizationId: string;
    userMessage: string;
  }): Promise<{
    response: string;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    conversationId: string;
  }> {
    try {
      // Verificar limites de token
      const tokenCheck = await this.tokenUsageService.checkTokenLimits({
        organizationId,
        requestedTokens: 1000,
      });

      if (!tokenCheck.allowed) {
        throw new Error(`Token limit exceeded: ${tokenCheck.reason}`);
      }

      // Buscar configuração do agente
      const agent = await this.getAgentConfig(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Processar mensagem
      const result = await this.processAgentMessage(
        agent,
        userMessage,
        agentId,
        sessionId,
        organizationId,
      );

      return result;
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }

  /**
   * Cria uma cadeia de processamento do agente
   */
  private async createAgentChain(agent: AgentConfig) {
    // Criar o modelo LLM
    const llm = this.createLLM({
      model: agent.modelConfig.model,
      temperature: agent.modelConfig.temperature,
      maxTokens: agent.modelConfig.maxTokens,
      topP: agent.modelConfig.topP,
      frequencyPenalty: agent.modelConfig.frequencyPenalty,
      presencePenalty: agent.modelConfig.presencePenalty,
    });

    // Criar o template do prompt
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", agent.systemPrompt || "You are a helpful AI assistant."],
      ["placeholder", "{chat_history}"],
      ["human", "{input}"],
    ]);

    // Criar a cadeia de processamento
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    return chain;
  }

  /**
   * Processa uma mensagem através do agente
   */
  private async processAgentMessage(
    agent: AgentConfig,
    userMessage: string,
    agentId: string,
    sessionId: string,
    organizationId: string,
  ) {
    try {
      // Carregar histórico da conversa
      const conversationHistory =
        await this.memoryService.getConversationHistory({
          agentId,
          sessionId,
          limit: 10,
        });

      // Converter para formato do LangChain
      const chatHistory = conversationHistory.messages.map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else {
          return new AIMessage(msg.content);
        }
      });

      // Buscar contexto RAG se necessário
      let contextData = "";
      if (agent.knowledgeBaseId) {
        const ragResults = await this.ragService.retrieveRelevantChunks({
          query: userMessage,
          knowledgeBaseId: agent.knowledgeBaseId,
          limit: 5,
        });
        contextData = ragResults.chunks
          .map((chunk: any) => chunk.content)
          .join("\n\n");
      }

      // Criar a cadeia do agente
      const chain = await this.createAgentChain(agent);

      // Construir prompt do sistema com contexto
      let systemPrompt =
        agent.systemPrompt || "You are a helpful AI assistant.";
      if (contextData) {
        systemPrompt += `\n\nContexto relevante:\n${contextData}`;
      }

      // Executar a cadeia
      const response = await chain.invoke({
        chat_history: chatHistory,
        input: userMessage,
      });

      // Estimar tokens (implementação simplificada)
      const estimatedTokens = this.estimateTokens(
        systemPrompt + userMessage + response,
      );

      const tokenUsage = {
        promptTokens: Math.floor(estimatedTokens * 0.7),
        completionTokens: Math.floor(estimatedTokens * 0.3),
        totalTokens: estimatedTokens,
      };

      // Salvar conversa na memória
      await this.memoryService.saveConversation({
        agentId,
        sessionId,
        organizationId,
        messages: [
          {
            role: "user" as any,
            content: userMessage,
            timestamp: new Date(),
            tokens: tokenUsage.promptTokens,
          },
          {
            role: "assistant" as any,
            content: response,
            timestamp: new Date(),
            tokens: tokenUsage.completionTokens,
          },
        ],
      });

      // Registrar uso de tokens
      await this.tokenUsageService.recordTokenUsage({
        organizationId,
        agentId,
        promptTokens: tokenUsage.promptTokens,
        completionTokens: tokenUsage.completionTokens,
        totalTokens: tokenUsage.totalTokens,
        model: agent.modelConfig.model,
        operation: "chat_completion",
      });

      return {
        response,
        tokenUsage,
        conversationId: sessionId,
      };
    } catch (error) {
      console.error("Error processing agent message:", error);
      throw error;
    }
  }

  /**
   * Cria instância do LLM OpenAI
   */
  private createLLM(modelConfig: ModelConfig) {
    return new ChatOpenAI({
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      topP: modelConfig.topP,
      frequencyPenalty: modelConfig.frequencyPenalty,
      presencePenalty: modelConfig.presencePenalty,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Busca configuração do agente no banco de dados
   */
  private async getAgentConfig(agentId: string): Promise<AgentConfig | null> {
    try {
      const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
        include: {
          openaiCreds: true,
        },
      });

      if (!agent) {
        return null;
      }

      return {
        id: agent.id,
        name: agent.name,
        systemPrompt: agent.systemPrompt,
        modelConfig: {
          model: agent.model,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          topP: agent.topP || undefined,
          frequencyPenalty: agent.frequencyPenalty || undefined,
          presencePenalty: agent.presencePenalty || undefined,
        },
        knowledgeBaseId: agent.knowledgeBaseId || undefined,
        guardrails: {
          enableContentFilter: agent.enableContentFilter,
          enablePiiDetection: agent.enablePiiDetection,
          maxResponseLength: agent.maxResponseLength || undefined,
          allowedTopics: agent.allowedTopics,
          blockedTopics: agent.blockedTopics,
        },
        organizationId: agent.organizationId,
      };
    } catch (error) {
      console.error("Error fetching agent config:", error);
      return null;
    }
  }

  /**
   * Estima o número de tokens em um texto
   */
  private estimateTokens(text: string): number {
    // Estimativa simples: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  /**
   * Lista agentes de uma organização
   */
  async listAgents(organizationId: string) {
    return await prisma.aIAgent.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Cria um novo agente
   */
  async createAgent(config: Omit<AgentConfig, "id"> & { createdById: string }) {
    return await prisma.aIAgent.create({
      data: {
        name: config.name,
        systemPrompt: config.systemPrompt,
        model: config.modelConfig.model,
        temperature: config.modelConfig.temperature,
        maxTokens: config.modelConfig.maxTokens,
        topP: config.modelConfig.topP,
        frequencyPenalty: config.modelConfig.frequencyPenalty,
        presencePenalty: config.modelConfig.presencePenalty,
        knowledgeBaseId: config.knowledgeBaseId,
        enableContentFilter: config.guardrails?.enableContentFilter || true,
        enablePiiDetection: config.guardrails?.enablePiiDetection || true,
        maxResponseLength: config.guardrails?.maxResponseLength,
        allowedTopics: config.guardrails?.allowedTopics || [],
        blockedTopics: config.guardrails?.blockedTopics || [],
        organizationId: config.organizationId,
        createdById: config.createdById,
        isActive: true,
      },
    });
  }

  /**
   * Atualiza um agente existente
   */
  async updateAgent(agentId: string, config: Partial<AgentConfig>) {
    return await prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        name: config.name,
        systemPrompt: config.systemPrompt,
        model: config.modelConfig?.model,
        temperature: config.modelConfig?.temperature,
        maxTokens: config.modelConfig?.maxTokens,
        topP: config.modelConfig?.topP,
        frequencyPenalty: config.modelConfig?.frequencyPenalty,
        presencePenalty: config.modelConfig?.presencePenalty,
        knowledgeBaseId: config.knowledgeBaseId,
        enableContentFilter: config.guardrails?.enableContentFilter,
        enablePiiDetection: config.guardrails?.enablePiiDetection,
        maxResponseLength: config.guardrails?.maxResponseLength,
        allowedTopics: config.guardrails?.allowedTopics,
        blockedTopics: config.guardrails?.blockedTopics,
      },
    });
  }

  /**
   * Deleta um agente
   */
  async deleteAgent(agentId: string) {
    return await prisma.aIAgent.delete({
      where: { id: agentId },
    });
  }

  /**
   * Obtém estatísticas do agente
   */
  async getAgentStats(input: {
    agentId: string;
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalMessages: number;
    totalTokensUsed: number;
    averageResponseTime: number;
    successRate: number;
    lastActive?: Date;
  }> {
    try {
      const { agentId, organizationId, startDate, endDate } = input;

      // Definir período padrão se não fornecido (últimos 30 dias)
      const defaultStartDate =
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultEndDate = endDate || new Date();

      // Buscar estatísticas de uso de tokens
      const tokenStats = await this.tokenUsageService.getTokenUsageStats({
        organizationId,
        agentId,
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      });

      // Buscar memórias/conversas do agente para calcular total de mensagens
      const totalMessages = await prisma.aIAgentMemory.count({
        where: {
          agentId,
          organizationId,
          createdAt: {
            gte: defaultStartDate,
            lte: defaultEndDate,
          },
        },
      });

      // Buscar última atividade
      const lastActivity = await prisma.aIAgentMemory.findFirst({
        where: {
          agentId,
          organizationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
        },
      });

      // Buscar logs de erro para calcular taxa de sucesso
      const totalLogs = await prisma.aIAgentLog.count({
        where: {
          agentId,
          organizationId,
          createdAt: {
            gte: defaultStartDate,
            lte: defaultEndDate,
          },
        },
      });

      const errorLogs = await prisma.aIAgentLog.count({
        where: {
          agentId,
          organizationId,
          level: "ERROR",
          createdAt: {
            gte: defaultStartDate,
            lte: defaultEndDate,
          },
        },
      });

      // Calcular taxa de sucesso
      const successRate =
        totalLogs > 0 ? ((totalLogs - errorLogs) / totalLogs) * 100 : 100;

      // Tempo médio de resposta (estimativa baseada em dados disponíveis)
      const averageResponseTime = 1500; // ms - valor padrão estimado

      return {
        totalMessages,
        totalTokensUsed: tokenStats.monthlyUsage,
        averageResponseTime,
        successRate,
        lastActive: lastActivity?.createdAt,
      };
    } catch (error) {
      console.error("Error getting agent stats:", error);
      // Retornar estatísticas padrão em caso de erro
      return {
        totalMessages: 0,
        totalTokensUsed: 0,
        averageResponseTime: 0,
        successRate: 0,
        lastActive: undefined,
      };
    }
  }
}
