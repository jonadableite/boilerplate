import { evolutionApi } from "@/plugins/evolution-api.plugin";
import { prisma } from "@/providers/prisma";
import { EventEmitter } from "events";
import { CreateWarmupInput, DEFAULT_PLAN_LIMITS } from "../warmup.types";

// Classe principal do serviço de aquecimento
export class WarmupService {
  private activeInstances: Map<string, NodeJS.Timeout>;
  private stop: boolean;
  private eventEmitter: EventEmitter;

  constructor() {
    this.activeInstances = new Map();
    this.stop = false;
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(50); // Para suportar 200+ instâncias
  }

  /**
   * Inicia o aquecimento para múltiplas instâncias
   */
  async startWarmup(
    config: CreateWarmupInput,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    this.stop = false;

    console.log(
      `[Warmup] Iniciando aquecimento para ${config.phoneInstances.length} instâncias`,
    );

    // Garantir que números externos padrão existam
    await this.ensureExternalNumbers(organizationId);

    // Verificar limites do plano
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          where: { organizationId },
          include: {
            organization: {
              include: { customer: { include: { subscriptions: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Determinar plano atual (simplificado)
    const currentPlan = "free"; // Implementar lógica real baseada na subscription

    // Usar os limites definidos no arquivo de tipos
    const planLimits = DEFAULT_PLAN_LIMITS[currentPlan];

    if (
      config.phoneInstances.length > planLimits.instancesLimit &&
      planLimits.instancesLimit !== -1
    ) {
      throw new Error(
        `Limite de instâncias excedido para o plano ${currentPlan}`,
      );
    }

    // Iniciar aquecimento para cada instância de forma assíncrona
    const warmupPromises = config.phoneInstances.map(async (instance) => {
      try {
        await this.startInstanceTimer(
          instance.instanceId,
          organizationId,
          userId,
        );
        // Executar o aquecimento em background sem aguardar
        this.startInstanceWarmup(
          instance,
          config,
          organizationId,
          userId,
        ).catch((error) => {
          console.error(
            `[Warmup] Erro no aquecimento da instância ${instance.instanceId}:`,
            error,
          );
        });
        console.log(
          `[Warmup] Aquecimento iniciado para instância ${instance.instanceId}`,
        );
      } catch (error) {
        console.error(
          `[Warmup] Erro ao iniciar timer para instância ${instance.instanceId}:`,
          error,
        );
        throw error;
      }
    });

    // Aguardar apenas a inicialização dos timers, não o loop infinito
    await Promise.all(warmupPromises);
    console.log(`[Warmup] Todos os aquecimentos foram iniciados com sucesso`);
  }

  /**
   * Inicia o timer de aquecimento para uma instância específica
   */
  private async startInstanceTimer(
    instanceName: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar ou criar estatísticas do dia atual
    let mediaStats = await prisma.mediaStats.findFirst({
      where: {
        instanceName,
        organizationId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!mediaStats) {
      mediaStats = await prisma.mediaStats.create({
        data: {
          instanceName,
          organizationId,
          date: today,
          text: 0,
          image: 0,
          video: 0,
          audio: 0,
          sticker: 0,
          reaction: 0,
          totalDaily: 0,
          totalAllTime: 0,
          totalSent: 0,
          totalReceived: 0,
        },
      });
    }

    // Buscar ou criar estatísticas de recebimento
    let mediaReceived = await prisma.mediaReceived.findFirst({
      where: {
        instanceName,
        organizationId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!mediaReceived) {
      mediaReceived = await prisma.mediaReceived.create({
        data: {
          instanceName,
          organizationId,
          date: today,
          text: 0,
          image: 0,
          video: 0,
          audio: 0,
          sticker: 0,
          reaction: 0,
          totalDaily: 0,
          totalAllTime: 0,
        },
      });
    }

    // Buscar ou criar estatísticas de aquecimento
    const warmupStats = await prisma.warmupStats.upsert({
      where: { instanceName },
      create: {
        instanceName,
        status: "ACTIVE",
        startTime: new Date(),
        organizationId,
        userId,
        mediaStatsId: mediaStats.id,
        mediaReceivedId: mediaReceived.id,
        warmupTime: 0,
        progress: 0.0,
        targetDuration: 2073600, // 24 dias
      },
      update: {
        status: "ACTIVE",
        startTime: new Date(),
        mediaStatsId: mediaStats.id,
        mediaReceivedId: mediaReceived.id,
      },
    });

    // Timer para atualizar progresso a cada segundo
    const timer = setInterval(async () => {
      if (this.stop) {
        clearInterval(timer);
        this.activeInstances.delete(instanceName);
        return;
      }

      try {
        const currentStats = await prisma.warmupStats.findUnique({
          where: { instanceName },
        });

        if (currentStats?.status === "ACTIVE") {
          const newWarmupTime = (currentStats.warmupTime || 0) + 1;
          const progress = Math.min(
            (newWarmupTime / (currentStats.targetDuration || 2073600)) * 100,
            100,
          );

          await prisma.warmupStats.update({
            where: { instanceName },
            data: {
              warmupTime: newWarmupTime,
              progress,
              lastActive: new Date(),
            },
          });
        }
      } catch (error) {
        console.error(
          `[Warmup] Erro ao atualizar timer para ${instanceName}:`,
          error,
        );
      }
    }, 1000);

    this.activeInstances.set(instanceName, timer as NodeJS.Timeout);
  }

  /**
   * Verifica limite diário de mensagens
   */
  private async checkDailyMessageLimit(
    instanceName: string,
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          members: {
            where: { organizationId },
            include: {
              organization: {
                include: { customer: { include: { subscriptions: true } } },
              },
            },
          },
        },
      });

      if (!user) {
        console.error(`Usuário ${userId} não encontrado`);
        return false;
      }

      // Determinar plano atual (simplificado)
      const currentPlan = "free"; // Implementar lógica real
      const planLimits = DEFAULT_PLAN_LIMITS[currentPlan];

      if (planLimits.messagesPerDay === -1) {
        return true; // Ilimitado
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stats = await prisma.mediaStats.findFirst({
        where: {
          instanceName,
          organizationId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: { totalDaily: true },
      });

      const totalMessages = stats?.totalDaily || 0;

      if (totalMessages >= planLimits.messagesPerDay) {
        console.log(
          `[Warmup] Limite diário atingido para ${instanceName}: ${totalMessages}/${planLimits.messagesPerDay}`,
        );

        await prisma.warmupStats.updateMany({
          where: {
            instanceName,
            status: "ACTIVE",
          },
          data: {
            status: "PAUSED",
            pauseTime: new Date(),
          },
        });

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        `[Warmup] Erro ao verificar limite diário para ${instanceName}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Atualiza estatísticas de mensagens
   */
  private async updateMediaStats(
    instanceName: string,
    organizationId: string,
    messageType: string,
    isSent: boolean,
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Buscar ou criar estatísticas do dia atual
      let mediaStats = await prisma.mediaStats.findFirst({
        where: {
          instanceName,
          organizationId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (!mediaStats) {
        mediaStats = await prisma.mediaStats.create({
          data: {
            instanceName,
            organizationId,
            date: today,
            text: 0,
            image: 0,
            video: 0,
            audio: 0,
            sticker: 0,
            reaction: 0,
            totalDaily: 0,
            totalAllTime: 0,
            totalSent: 0,
            totalReceived: 0,
          },
        });
      }

      // Preparar dados para atualização
      const updateData: any = {
        totalDaily: { increment: 1 },
        totalAllTime: { increment: 1 },
      };

      // Atualizar contadores de envio/recebimento
      if (isSent) {
        updateData.totalSent = { increment: 1 };
      } else {
        updateData.totalReceived = { increment: 1 };
      }

      // Atualizar contador específico do tipo de mensagem
      const messageTypeMap: Record<string, string> = {
        text: "text",
        image: "image",
        video: "video",
        audio: "audio",
        sticker: "sticker",
        reaction: "reaction",
      };

      const dbField = messageTypeMap[messageType.toLowerCase()];
      if (dbField) {
        updateData[dbField] = { increment: 1 };
      }

      // Atualizar estatísticas no banco
      await prisma.mediaStats.update({
        where: { id: mediaStats.id },
        data: updateData,
      });

      console.log(
        `[Warmup] Estatísticas atualizadas para ${instanceName}: ${messageType} (${isSent ? "enviada" : "recebida"})`,
      );
    } catch (error) {
      console.error(
        `[Warmup] Erro ao atualizar estatísticas para ${instanceName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Processa mensagem recebida via webhook
   */
  async processReceivedMessage(
    instanceName: string,
    organizationId: string,
    message: any, // EvolutionApiResponse
  ): Promise<void> {
    try {
      const messageType = this.getMessageType(message);
      await this.updateMediaStats(
        instanceName,
        organizationId,
        messageType,
        false,
      );
    } catch (error) {
      console.error(
        `[Warmup] Erro ao processar mensagem recebida para ${instanceName}:`,
        error,
      );
    }
  }

  /**
   * Determina o tipo de mensagem baseado no payload
   */
  private getMessageType(message: any): string {
    // EvolutionApiResponse
    if (message.message?.conversation) return "text";
    if (message.message?.imageMessage) return "image";
    if (message.message?.videoMessage) return "video";
    if (message.message?.audioMessage) return "audio";
    if (message.message?.stickerMessage) return "sticker";
    if (message.message?.reactionMessage) return "reaction";
    return "text"; // fallback
  }

  /**
   * Inicia o processo de aquecimento para uma instância
   */
  private async startInstanceWarmup(
    instance: any, // PhoneInstance
    config: CreateWarmupInput,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    console.log(
      `[Warmup] Iniciando aquecimento para instância ${instance.instanceId}`,
    );

    while (!this.stop) {
      try {
        // Verificar limite diário
        const canSendMessage = await this.checkDailyMessageLimit(
          instance.instanceId,
          organizationId,
          userId,
        );

        if (!canSendMessage) {
          console.log(
            `[Warmup] Limite diário atingido para ${instance.instanceId}`,
          );
          await this.stopWarmup(instance.instanceId);
          break;
        }

        // Verificar status do aquecimento
        const stats = await prisma.warmupStats.findUnique({
          where: { instanceName: instance.instanceId },
        });

        if (stats?.status !== "ACTIVE") {
          console.log(
            `[Warmup] Aquecimento pausado para ${instance.instanceId}`,
          );
          break;
        }

        // Determinar targets de mensagem
        const { isGroup, targets } = await this.getMessageDestination(
          config.config || {},
          config.phoneInstances,
          organizationId,
        );

        console.log(
          `[Warmup] Targets determinados para ${instance.instanceId}:`,
          { isGroup, targets: targets.length, targetList: targets },
        );

        for (const target of targets) {
          if (this.stop) break;

          try {
            // Decidir tipo de mensagem
            const messageType = this.decideMessageType(config.config || {});

            // Simular comportamento humano
            await this.simulateHumanBehavior(messageType);

            // Obter conteúdo para o tipo de mensagem
            const content = this.getContentForType(
              messageType,
              config.contents,
            );

            if (content) {
              console.log(`[Warmup] Enviando ${messageType} para ${target}`);

              const messageId = await this.sendMessage(
                instance.instanceId,
                target,
                content,
                messageType,
                organizationId,
              );

              if (messageId) {
                console.log(
                  `[Warmup] Mensagem ${messageType} enviada com sucesso`,
                );

                // Possibilidade de reagir à mensagem
                if (
                  messageType === "text" &&
                  Math.random() < (config.config?.reactionChance || 0.4)
                ) {
                  await this.delay(2000, 4000);
                  await this.sendReaction(
                    instance.instanceId,
                    target,
                    messageId,
                    config,
                    organizationId,
                  );
                }

                // Aguardar antes da próxima mensagem
                await this.delay(
                  config.config?.minDelay || 1000,
                  config.config?.maxDelay || 5000,
                );
              }
            }
          } catch (error) {
            console.error(
              `[Warmup] Erro ao enviar mensagem para ${target}:`,
              error,
            );
            await this.delay(2000, 5000);
          }
        }

        // Intervalo entre ciclos
        await this.delay(3000, 8000);
      } catch (error) {
        console.error(
          `[Warmup] Erro no loop principal para ${instance.instanceId}:`,
          error,
        );
        await this.delay(5000, 10000);
      }
    }
  }

  /**
   * Simula comportamento humano baseado no tipo de mensagem
   */
  private async simulateHumanBehavior(messageType: string): Promise<void> {
    const delays: Record<string, [number, number]> = {
      text: [2000, 5000],
      audio: [5000, 15000],
      image: [3000, 8000],
      video: [3000, 8000],
      sticker: [2000, 6000],
      reaction: [1000, 3000],
    };

    const [min, max] = delays[messageType] || [2000, 5000];
    await this.delay(min, max);
  }

  /**
   * Adiciona números externos padrão se não existirem
   */
  private async ensureExternalNumbers(organizationId: string): Promise<void> {
    try {
      // Verificar se já existem números externos para esta organização
      const existingNumbers = await prisma.warmupExternalNumber.count({
        where: { organizationId },
      });

      if (existingNumbers === 0) {
        console.log(
          `[Warmup] Adicionando números externos padrão para organização ${organizationId}`,
        );

        // Importar números padrão
        const { EXTERNAL_NUMBERS } = await import("../warmup.constants");

        // Adicionar os primeiros 10 números padrão
        const numbersToAdd = EXTERNAL_NUMBERS.slice(0, 10);

        const createPromises = numbersToAdd.map((phoneNumber, index) =>
          prisma.warmupExternalNumber.create({
            data: {
              phoneNumber,
              name: `Número Padrão ${index + 1}`,
              organizationId,
              active: true,
            },
          }),
        );

        await Promise.all(createPromises);
        console.log(
          `[Warmup] ${numbersToAdd.length} números externos padrão adicionados`,
        );
      }
    } catch (error) {
      console.error(
        "[Warmup] Erro ao adicionar números externos padrão:",
        error,
      );
      // Não interromper o warmup por causa deste erro
    }
  }

  /**
   * Determina destinos das mensagens (grupos ou números externos)
   */
  private async getMessageDestination(
    config: any, // WarmupConfig
    availableInstances: any[], // PhoneInstance[]
    organizationId: string,
  ): Promise<{ isGroup: boolean; targets: string[] }> {
    const isGroup = Math.random() < (config.groupChance || 0.3);
    console.log(
      `[Warmup] Decisão de destino - isGroup: ${isGroup}, groupChance: ${config.groupChance || 0.3}`,
    );

    if (isGroup && config.groupId) {
      console.log(`[Warmup] Enviando para grupo: ${config.groupId}`);
      return {
        isGroup: true,
        targets: [config.groupId],
      };
    }

    // Usar números externos configurados
    const useExternalNumbers =
      Math.random() < (config.externalNumbersChance || 0.4);
    console.log(
      `[Warmup] Usar números externos: ${useExternalNumbers}, chance: ${config.externalNumbersChance || 0.4}`,
    );

    if (useExternalNumbers) {
      // Buscar números externos da organização
      const externalNumbers = await prisma.warmupExternalNumber.findMany({
        where: {
          organizationId,
          active: true,
        },
        select: { phoneNumber: true },
      });

      console.log(
        `[Warmup] Números externos encontrados: ${externalNumbers.length}`,
      );

      if (externalNumbers.length > 0) {
        const selectedNumbers = externalNumbers
          .slice(0, Math.floor(Math.random() * 3) + 1)
          .map((n) => n.phoneNumber);

        console.log(`[Warmup] Números externos selecionados:`, selectedNumbers);
        return {
          isGroup: false,
          targets: selectedNumbers,
        };
      }
    }

    // Usar outras instâncias como fallback
    const instanceNumbers = availableInstances
      .filter((inst) => Math.random() > 0.5) // Selecionar aleatoriamente algumas
      .slice(0, Math.floor(Math.random() * 2) + 1)
      .map((inst) => inst.phoneNumber);

    console.log(`[Warmup] Usando instâncias como fallback:`, instanceNumbers);

    return {
      isGroup: false,
      targets:
        instanceNumbers.length > 0
          ? instanceNumbers
          : [availableInstances[0].phoneNumber],
    };
  }

  /**
   * Decide o tipo de mensagem baseado nas configurações
   */
  private decideMessageType(config: any): string {
    // WarmupConfig
    const random = Math.random();
    const chances = [
      { type: "TEXT" as string, chance: config.textChance || 0.35 },
      { type: "AUDIO" as string, chance: config.audioChance || 0.35 },
      { type: "STICKER" as string, chance: config.stickerChance || 0.2 },
      { type: "IMAGE" as string, chance: config.imageChance || 0.05 },
      { type: "VIDEO" as string, chance: config.videoChance || 0.05 },
    ];

    let accumulated = 0;
    for (const { type, chance } of chances) {
      accumulated += chance;
      if (random <= accumulated) {
        return type;
      }
    }

    return "TEXT"; // fallback
  }

  /**
   * Obtém conteúdo para um tipo específico de mensagem
   */
  private getContentForType(
    type: string, // WarmupMessageType
    contents: CreateWarmupInput["contents"],
  ): string | any | null {
    // MediaContent
    try {
      if (type === "TEXT") {
        if (contents.texts.length === 0) return null;
        return this.getRandomItem(contents.texts);
      }

      const contentArrays = {
        IMAGE: contents.images,
        VIDEO: contents.videos,
        AUDIO: contents.audios,
        STICKER: contents.stickers,
      };

      const contentArray = contentArrays[type as keyof typeof contentArrays];
      if (!contentArray || contentArray.length === 0) return null;

      return this.getRandomItem(contentArray);
    } catch (error) {
      console.error(`[Warmup] Erro ao obter conteúdo para ${type}:`, error);
      return null;
    }
  }

  /**
   * Envia mensagem via Evolution API
   */
  private async sendMessage(
    instanceName: string,
    target: string,
    content: string | any, // MediaContent
    messageType: string, // WarmupMessageType
    organizationId: string,
  ): Promise<string | false> {
    try {
      const formattedNumber = target.replace("@s.whatsapp.net", "");

      let result: any;

      switch (messageType) {
        case "TEXT":
          result = await evolutionApi.actions.sendText.handler({
            config: {},
            input: {
              instanceName,
              number: formattedNumber,
              text: content as string,
            },
          });
          break;

        case "IMAGE":
        case "VIDEO":
          const mediaContent = content as any; // MediaContent
          result = await evolutionApi.actions.sendMedia.handler({
            config: {},
            input: {
              instanceName,
              number: formattedNumber,
              mediatype: messageType.toLowerCase() as "image" | "video",
              media: mediaContent.content || "",
              mimetype: mediaContent.mimeType || "",
              caption: mediaContent.caption,
              fileName: mediaContent.fileName,
            },
          });
          break;

        case "AUDIO":
          const audioContent = content as any; // MediaContent
          result = await evolutionApi.actions.sendAudio.handler({
            config: {},
            input: {
              instanceName,
              number: formattedNumber,
              audio: audioContent.content || "",
              encoding: true,
            },
          });
          break;

        case "STICKER":
          const stickerContent = content as any; // MediaContent
          // Verificar se há conteúdo válido para sticker
          if (!stickerContent.content || stickerContent.content.trim() === "") {
            console.warn(
              `[Warmup] Conteúdo de sticker vazio para ${instanceName}`,
            );
            return false;
          }

          result = await evolutionApi.actions.sendSticker.handler({
            config: {},
            input: {
              instanceName,
              number: formattedNumber,
              sticker: stickerContent.content,
            },
          });
          break;

        default:
          console.warn(
            `[Warmup] Tipo de mensagem não suportado: ${messageType}`,
          );
          return false;
      }

      if (result?.key?.id) {
        await this.updateMediaStats(
          instanceName,
          organizationId,
          messageType,
          true,
        );
        return result.key.id;
      }

      return false;
    } catch (error) {
      console.error(`[Warmup] Erro ao enviar ${messageType}:`, error);
      return false;
    }
  }

  /**
   * Envia reação a uma mensagem
   */
  private async sendReaction(
    instanceName: string,
    target: string,
    messageId: string,
    config: CreateWarmupInput,
    organizationId: string,
  ): Promise<boolean> {
    try {
      const reaction = this.getRandomItem(
        config.contents.emojis || ["👍", "❤️", "😂"],
      );

      // Implementar envio de reação via Evolution API quando disponível
      console.log(
        `[Warmup] Enviando reação ${reaction} para mensagem ${messageId}`,
      );

      await this.updateMediaStats(
        instanceName,
        organizationId,
        "REACTION",
        true,
      );
      return true;
    } catch (error) {
      console.error(`[Warmup] Erro ao enviar reação:`, error);
      return false;
    }
  }

  /**
   * Para o aquecimento de uma instância específica
   */
  async stopWarmup(instanceName: string): Promise<void> {
    const timer = this.activeInstances.get(instanceName);
    if (timer) {
      clearInterval(timer);
      this.activeInstances.delete(instanceName);
    }

    await prisma.warmupStats.updateMany({
      where: { instanceName },
      data: {
        status: "PAUSED",
        pauseTime: new Date(),
      },
    });

    console.log(`[Warmup] Aquecimento parado para ${instanceName}`);
  }

  /**
   * Para todos os aquecimentos
   */
  async stopAll(): Promise<void> {
    this.stop = true;

    for (const [instanceName, timer] of this.activeInstances.entries()) {
      clearInterval(timer);
      try {
        await prisma.warmupStats.updateMany({
          where: { instanceName },
          data: {
            status: "PAUSED",
            pauseTime: new Date(),
          },
        });
      } catch (error) {
        console.error(`[Warmup] Erro ao pausar ${instanceName}:`, error);
      }
    }

    this.activeInstances.clear();
    console.log("[Warmup] Todos os aquecimentos foram parados");
  }

  /**
   * Obtém estatísticas de uma instância
   */
  async getInstanceStats(instanceName: string, organizationId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Estatísticas do dia atual
      const dailyStats = await prisma.mediaStats.findFirst({
        where: {
          instanceName,
          organizationId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Totais gerais
      const totalStats = await prisma.mediaStats.aggregate({
        where: {
          instanceName,
          organizationId,
        },
        _sum: {
          totalAllTime: true,
          text: true,
          image: true,
          video: true,
          audio: true,
          sticker: true,
          reaction: true,
        },
      });

      return {
        daily: dailyStats || {
          text: 0,
          image: 0,
          video: 0,
          audio: 0,
          sticker: 0,
          reaction: 0,
          totalDaily: 0,
        },
        total: totalStats._sum,
      };
    } catch (error) {
      console.error(
        `[Warmup] Erro ao obter estatísticas para ${instanceName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Utilitários
   */
  private getRandomItem<T>(items: T[]): T {
    if (!items || items.length === 0) {
      throw new Error("Array vazio ou indefinido");
    }
    return items[Math.floor(Math.random() * items.length)];
  }

  private async delay(min: number, max?: number): Promise<void> {
    const delay = max ? Math.floor(Math.random() * (max - min + 1)) + min : min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

// Instância singleton do serviço
export const warmupService = new WarmupService();
