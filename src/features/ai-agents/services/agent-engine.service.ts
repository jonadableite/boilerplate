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
import { AIServicesProvider } from "../../../providers/ai-services";

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
  private knowledgeProcessor: any;
  private ttsService: any;

  constructor() {
    this.tokenUsageService = new TokenUsageService();
    this.ragService = new RAGService();
    this.guardrailService = new GuardrailService();
    this.memoryService = new MemoryService();

    // Use AIServicesProvider for AI services following IgniterJS patterns
    this.knowledgeProcessor = AIServicesProvider.getKnowledgeProcessor();
    this.ttsService = AIServicesProvider.getTTSService();
  }

  /**
   * Processa uma mensagem do usuário através do agente
   */
  async processMessage({
    agentId,
    sessionId,
    organizationId,
    userMessage,
    context,
    agent,
  }: {
    agentId: string;
    sessionId: string;
    organizationId: string;
    userMessage: string;
    context?: any;
    agent?: any;
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

      // Usar agente passado como parâmetro ou buscar configuração
      let agentConfig = agent;
      if (!agentConfig) {
        agentConfig = await this.getAgentConfig(agentId);
        if (!agentConfig) {
          throw new Error(`Agent not found: ${agentId}`);
        }
      } else {
        // Converter agente do banco para formato AgentConfig
        agentConfig = {
          id: agent.id,
          name: agent.name,
          systemPrompt: agent.systemPrompt,
          modelConfig: {
            model: agent.model || "gpt-3.5-turbo",
            temperature: agent.temperature || 0.7,
            maxTokens: agent.maxTokens || 1000,
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
      }

      // Processar mensagem
      const result = await this.processAgentMessage(
        agentConfig,
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
   * Busca contexto relevante de conversas anteriores
   */
  private async getRelevantConversationContext(
    agentId: string,
    currentMessage: string,
    userId: string,
  ): Promise<string | null> {
    try {
      // Buscar conversas recentes do usuário com este agente
      const recentMemories = await prisma.aIAgentMemory.findMany({
        where: {
          agentId,
          remoteJid: userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      if (recentMemories.length === 0) {
        return null;
      }

      // Filtrar conversas relevantes baseadas em palavras-chave
      const keywords = this.extractKeywords(currentMessage);
      const relevantMemories = recentMemories.filter((memory) => {
        const memoryText = memory.content.toLowerCase();
        return keywords.some((keyword) =>
          memoryText.includes(keyword.toLowerCase()),
        );
      });

      if (relevantMemories.length === 0) {
        return null;
      }

      // Formatar contexto das conversas relevantes
      const contextParts = relevantMemories.slice(0, 3).map((memory, index) => {
        const date = memory.createdAt.toLocaleDateString("pt-BR");
        return `[Conversa ${index + 1} - ${date}]\n${memory.role}: ${memory.content}`;
      });

      return contextParts.join("\n\n---\n\n");
    } catch (error) {
      console.error("Error retrieving conversation context:", error);
      return null;
    }
  }

  /**
   * Busca contexto específico do usuário
   */
  private async getUserContext(
    userId: string,
    agentId: string,
  ): Promise<string | null> {
    try {
      // Buscar informações do usuário
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          createdAt: true,
        },
      });

      if (!user) {
        return null;
      }

      // Buscar estatísticas de interação com o agente
      const interactionStats = await prisma.aIAgentMemory.aggregate({
        where: {
          agentId,
          remoteJid: userId,
        },
        _count: {
          id: true,
        },
      });

      // Buscar tópicos mais discutidos
      const recentTopics = await this.getRecentTopics(userId, agentId);

      let context = `Nome do usuário: ${user.name}\n`;
      context += `Total de interações: ${interactionStats._count.id}\n`;

      if (recentTopics.length > 0) {
        context += `Tópicos recentes: ${recentTopics.join(", ")}\n`;
      }

      return context;
    } catch (error) {
      console.error("Error retrieving user context:", error);
      return null;
    }
  }

  /**
   * Extrai palavras-chave de uma mensagem
   */
  private extractKeywords(message: string): string[] {
    // Remover palavras comuns (stop words) e extrair palavras significativas
    const stopWords = new Set([
      "o",
      "a",
      "os",
      "as",
      "um",
      "uma",
      "de",
      "do",
      "da",
      "dos",
      "das",
      "em",
      "no",
      "na",
      "nos",
      "nas",
      "para",
      "por",
      "com",
      "sem",
      "sobre",
      "e",
      "ou",
      "mas",
      "que",
      "se",
      "quando",
      "onde",
      "como",
      "por que",
      "é",
      "são",
      "foi",
      "foram",
      "ser",
      "estar",
      "ter",
      "haver",
    ]);

    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Limitar a 5 palavras-chave
  }

  /**
   * Busca tópicos recentes discutidos pelo usuário
   */
  private async getRecentTopics(
    userId: string,
    agentId: string,
  ): Promise<string[]> {
    try {
      const recentMemories = await prisma.aIAgentMemory.findMany({
        where: {
          agentId,
          remoteJid: userId,
          createdAt: {
            gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Últimos 3 dias
          },
        },
        select: {
          content: true,
        },
        take: 20,
      });

      // Extrair e contar palavras-chave
      const keywordCounts = new Map<string, number>();

      recentMemories.forEach((memory) => {
        const keywords = this.extractKeywords(memory.content);
        keywords.forEach((keyword) => {
          keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        });
      });

      // Retornar os tópicos mais frequentes
      return Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([keyword]) => keyword);
    } catch (error) {
      console.error("Error retrieving recent topics:", error);
      return [];
    }
  }

  /**
   * Constrói um prompt de sistema especializado para o agente
   */
  private buildSpecializedSystemPrompt(
    agent: AgentConfig,
    contextData?: string,
  ): string {
    let systemPrompt = "";

    // Cabeçalho do agente especializado
    systemPrompt += `Você é ${agent.name}, um agente AI especializado.\n\n`;

    // TODO: Adicionar papel e objetivo quando os campos forem adicionados ao AgentConfig

    // Instruções principais do sistema
    systemPrompt += `INSTRUÇÕES PRINCIPAIS:\n${agent.systemPrompt}\n\n`;

    // Adicionar base de conhecimento se disponível
    if (contextData && contextData.trim()) {
      systemPrompt += `BASE DE CONHECIMENTO:\n`;
      systemPrompt += `Use as informações abaixo como sua base de conhecimento especializada. `;
      systemPrompt += `Priorize sempre essas informações ao responder perguntas relacionadas:\n\n`;
      systemPrompt += `${contextData}\n\n`;
    }

    // Diretrizes de comportamento
    systemPrompt += `DIRETRIZES DE COMPORTAMENTO:\n`;
    systemPrompt += `- Sempre responda como ${agent.name}, mantendo sua especialização\n`;
    systemPrompt += `- Use sua base de conhecimento quando relevante\n`;
    systemPrompt += `- Seja preciso e específico em suas respostas\n`;
    systemPrompt += `- Se não souber algo, admita e sugira onde o usuário pode encontrar a informação\n`;

    // Adicionar restrições de tópicos se definidas
    if (
      agent.guardrails?.allowedTopics &&
      agent.guardrails.allowedTopics.length > 0
    ) {
      systemPrompt += `- Foque apenas nos seguintes tópicos: ${agent.guardrails.allowedTopics.join(", ")}\n`;
    }

    if (
      agent.guardrails?.blockedTopics &&
      agent.guardrails.blockedTopics.length > 0
    ) {
      systemPrompt += `- Evite discutir os seguintes tópicos: ${agent.guardrails.blockedTopics.join(", ")}\n`;
    }

    return systemPrompt;
  }

  /**
   * Cria uma cadeia de processamento do agente
   */
  private async createAgentChain(agent: AgentConfig, contextData?: string) {
    // Criar o modelo LLM
    const llm = this.createLLM({
      model: agent.modelConfig.model,
      temperature: agent.modelConfig.temperature,
      maxTokens: agent.modelConfig.maxTokens,
      topP: agent.modelConfig.topP,
      frequencyPenalty: agent.modelConfig.frequencyPenalty,
      presencePenalty: agent.modelConfig.presencePenalty,
    });

    // Construir prompt do sistema especializado
    let systemPrompt = this.buildSpecializedSystemPrompt(agent, contextData);

    // Criar o template do prompt
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
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
          organizationId,
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

      // Buscar contexto RAG e contextos dinâmicos
      let contextData = "";

      // 1. Contexto da base de conhecimento
      if (agent.knowledgeBaseId) {
        const ragResults = await this.ragService.retrieveRelevantChunks({
          agentId,
          query: userMessage,
          limit: 5,
          threshold: 0.7,
        });

        if (ragResults.chunks.length > 0) {
          const knowledgeContext = ragResults.chunks
            .map((chunk: any, index: number) => {
              return `[Documento ${index + 1}]\n${chunk.content}`;
            })
            .join("\n\n---\n\n");

          contextData += `CONHECIMENTO ESPECIALIZADO:\n${knowledgeContext}\n\n`;

          console.log("RAG Context retrieved:", {
            chunksFound: ragResults.chunks.length,
            contextLength: knowledgeContext.length,
            query: userMessage.substring(0, 50),
          });
        }
      }

      // 2. Contexto de conversas anteriores relevantes
      const conversationContext = await this.getRelevantConversationContext(
        agentId,
        userMessage,
        sessionId,
      );
      if (conversationContext) {
        contextData += `CONTEXTO DE CONVERSAS ANTERIORES:\n${conversationContext}\n\n`;
      }

      // 3. Contexto do usuário (preferências, histórico)
      const userContext = await this.getUserContext(sessionId, agentId);
      if (userContext) {
        contextData += `CONTEXTO DO USUÁRIO:\n${userContext}\n\n`;
      }

      // Criar a cadeia do agente com contexto
      const chain = await this.createAgentChain(agent, contextData);

      // Executar a cadeia
      console.log("Invoking chain with:", {
        userMessage: userMessage.substring(0, 100),
        chatHistoryLength: chatHistory.length,
        hasContext: !!contextData,
      });

      const response = await chain.invoke({
        chat_history: chatHistory,
        input: userMessage,
      });

      console.log("Chain response received:", {
        responseLength: response?.length || 0,
        responsePreview: response?.substring(0, 100) || "empty",
      });

      // Estimar tokens (implementação simplificada)
      const estimatedTokens = this.estimateTokens(
        contextData + userMessage + response,
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
    const apiKey = process.env.OPENAI_API_KEY;

    console.log("OpenAI API Key check:", {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 10) || "undefined",
    });

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    return new ChatOpenAI({
      modelName: modelConfig.model,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      topP: modelConfig.topP,
      frequencyPenalty: modelConfig.frequencyPenalty,
      presencePenalty: modelConfig.presencePenalty,
      openAIApiKey: apiKey,
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
          createdAt: {
            gte: defaultStartDate,
            lte: defaultEndDate,
          },
        },
      });

      const errorLogs = await prisma.aIAgentLog.count({
        where: {
          agentId,
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

  /**
   * Gera áudio da resposta do agente usando TTS
   */
  async generateResponseAudio({
    text,
    voice = "alloy",
    enableTTS = false,
  }: {
    text: string;
    voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
    enableTTS?: boolean;
  }): Promise<Buffer | null> {
    if (!enableTTS) {
      return null;
    }

    try {
      // Verificar se o texto é adequado para TTS
      if (!this.ttsService.isTextSuitableForTTS(text)) {
        console.log("Text not suitable for TTS", {
          textLength: text.length,
          reason: "Contains code, tables, or inappropriate length",
        });
        return null;
      }

      // Limpar o texto para TTS
      const cleanText = this.ttsService.cleanTextForTTS(text);

      // Gerar áudio
      const audioBuffer = await this.ttsService.textToSpeech({
        text: cleanText,
        voice,
        model: "tts-1",
        speed: 1.0,
      });

      console.log("Audio generated successfully", {
        originalTextLength: text.length,
        cleanTextLength: cleanText.length,
        audioSize: audioBuffer.length,
      });

      return audioBuffer;
    } catch (error) {
      console.error("Error generating response audio", { error });
      return null;
    }
  }
}
