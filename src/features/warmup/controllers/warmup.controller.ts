import { AuthFeatureProcedure } from "@/@saas-boilerplate/features/auth";
import { igniter } from "@/igniter";
import { prisma } from "@/providers/prisma";
import { z } from "zod";
import { warmupService } from "../procedures/warmup.procedure";
import {
  CreateWarmupSchema,
  ProcessWebhookMessageSchema,
  UpdateWarmupStatusSchema,
} from "../warmup.types";

export const warmupController = igniter.controller({
  name: "warmup",
  path: "/warmup",
  actions: {
    /**
     * Configura e inicia o aquecimento para instâncias do WhatsApp
     */
    startWarmup: igniter.mutation({
      method: "POST",
      path: "/start",
      use: [AuthFeatureProcedure()],
      body: CreateWarmupSchema,
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          console.log(
            "[Warmup Controller] Iniciando configuração de aquecimento:",
            {
              userId: auth.user.id,
              organizationId: auth.organization?.id,
              instancesCount: request.body.phoneInstances.length,
              textsCount: request.body.contents.texts.length,
            },
          );

          // Validações básicas
          if (request.body.phoneInstances.length < 1) {
            return response.error({
              code: "BAD_REQUEST",
              message: "Necessário pelo menos uma instância",
              status: 400,
            });
          }

          if (request.body.contents.texts.length === 0) {
            return response.error({
              code: "BAD_REQUEST",
              message: "Necessário pelo menos um texto",
              status: 400,
            });
          }

          // Verificar se as instâncias existem
          const instanceNames = request.body.phoneInstances.map(
            (p) => p.instanceId,
          );
          const existingInstances = await prisma.whatsAppInstance.findMany({
            where: {
              instanceName: { in: instanceNames },
              organizationId: auth.organization?.id,
            },
          });

          if (existingInstances.length !== request.body.phoneInstances.length) {
            const missingInstances = instanceNames.filter(
              (name) =>
                !existingInstances.some((inst) => inst.instanceName === name),
            );
            return response.error({
              code: "BAD_REQUEST",
              message: `Instâncias não encontradas: ${missingInstances.join(", ")}`,
              status: 400,
            });
          }

          // Iniciar o warmup
          const warmupInput = {
            ...request.body,
            config: request.body.config || {
              textChance: 0.3,
              audioChance: 0.3,
              stickerChance: 0.4,
              imageChance: 0.1,
              videoChance: 0.1,
              reactionChance: 0.3,
              minDelay: 3000,
              maxDelay: 90000,
              groupChance: 0.3,
              externalNumbersChance: 0.4,
              dailyMessageLimit: 20,
              targetDuration: 2073600,
              humanBehaviorEnabled: true,
              variationPercentage: 0.2,
            },
            contents: {
              texts: request.body.contents.texts,
              images: request.body.contents.images || [],
              audios: request.body.contents.audios || [],
              videos: request.body.contents.videos || [],
              stickers: (request.body.contents.stickers || []).filter(
                (sticker: any) => {
                  // Validar se o sticker tem conteúdo válido
                  return sticker.content && sticker.content.trim() !== "";
                },
              ),
              emojis: request.body.contents.emojis || [
                "👍",
                "❤️",
                "😂",
                "😮",
                "😢",
                "🙏",
                "👏",
                "🔥",
              ],
            },
          };

          await warmupService.startWarmup(
            warmupInput as any,
            auth.organization?.id || "",
            auth.user.id,
          );

          // Aguardar um momento para garantir que o status foi atualizado
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Verificar o status atual
          const activeInstances = await prisma.warmupStats.findMany({
            where: {
              organizationId: auth.organization?.id,
              status: "ACTIVE",
            },
          });

          return response.success({
            success: true,
            message: "Aquecimento iniciado com sucesso",
            activeInstances: activeInstances.length,
            instanceNames: activeInstances.map((s) => s.instanceName),
          });
        } catch (error) {
          console.error(
            "[Warmup Controller] Erro ao configurar aquecimento:",
            error,
          );

          // Tratamento específico para erros de limite de plano
          if (error instanceof Error) {
            if (error.message.includes("Limite de instâncias excedido")) {
              return response.error({
                code: "PLAN_LIMIT_EXCEEDED",
                message:
                  "Você atingiu o limite de instâncias para o seu plano. Que tal fazer upgrade?",
                status: 403,
                data: {
                  error: error.message,
                  suggestion:
                    "Upgrade para um plano superior para usar mais instâncias",
                },
              });
            }

            if (error.message.includes("Limite de mensagens")) {
              return response.error({
                code: "MESSAGE_LIMIT_EXCEEDED",
                message:
                  "Você atingiu o limite de mensagens diárias para o seu plano.",
                status: 403,
                data: {
                  error: error.message,
                  suggestion:
                    "Upgrade para um plano superior para enviar mais mensagens",
                },
              });
            }
          }

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao configurar aquecimento",
            status: 500,
          });
        }
      },
    }),

    /**
     * Para o aquecimento de uma instância específica
     */
    stopWarmup: igniter.mutation({
      method: "POST",
      path: "/stop",
      use: [AuthFeatureProcedure()],
      body: z.object({ instanceName: z.string().min(1) }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          // Verificar se a instância pertence à organização
          const warmupStats = await prisma.warmupStats.findFirst({
            where: {
              instanceName: request.body.instanceName,
              organizationId: auth.organization?.id,
            },
          });

          if (!warmupStats) {
            return response.notFound("Instância de aquecimento não encontrada");
          }

          await warmupService.stopWarmup(request.body.instanceName);

          return response.success({
            success: true,
            message: "Aquecimento parado com sucesso",
            instanceName: request.body.instanceName,
          });
        } catch (error) {
          console.error(
            "[Warmup Controller] Erro ao parar aquecimento:",
            error,
          );

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao parar aquecimento",
            status: 500,
          });
        }
      },
    }),

    /**
     * Para todos os aquecimentos da organização
     */
    stopAllWarmups: igniter.mutation({
      method: "POST",
      path: "/stop-all",
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          // Parar o serviço de aquecimento
          await warmupService.stopAll();

          // Atualizar todas as instâncias da organização para status pausado
          const updatedCount = await prisma.warmupStats.updateMany({
            where: {
              organizationId: auth.organization?.id,
              status: "ACTIVE",
            },
            data: {
              status: "PAUSED",
              pauseTime: new Date(),
            },
          });

          return response.success({
            success: true,
            message: "Todos os aquecimentos foram parados",
            stoppedInstances: updatedCount.count,
          });
        } catch (error) {
          console.error(
            "[Warmup Controller] Erro ao parar aquecimentos:",
            error,
          );

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao parar aquecimentos",
            status: 500,
          });
        }
      },
    }),

    /**
     * Obtém estatísticas de uma instância específica
     */
    getWarmupStats: igniter.query({
      method: "GET",
      path: "/stats/:instanceName",
      use: [AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          const stats = await prisma.warmupStats.findFirst({
            where: {
              instanceName: request.params.instanceName,
              organizationId: auth.organization?.id,
            },
            include: {
              mediaStats: true,
              mediaReceived: true,
            },
          });

          if (!stats) {
            return response.notFound("Estatísticas não encontradas");
          }

          // Obter estatísticas detalhadas do serviço
          const detailedStats = await warmupService.getInstanceStats(
            request.params.instanceName,
            auth.organization?.id || "",
          );

          return response.success({
            success: true,
            stats: {
              ...stats,
              detailed: detailedStats,
            },
          });
        } catch (error) {
          console.error(
            "[Warmup Controller] Erro ao obter estatísticas:",
            error,
          );

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao obter estatísticas",
            status: 500,
          });
        }
      },
    }),

    /**
     * Obtém status de todas as instâncias de aquecimento da organização
     */
    getWarmupStatus: igniter.query({
      method: "GET",
      path: "/status",
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          // Buscar todas as instâncias da organização
          const instances = await prisma.warmupStats.findMany({
            where: {
              organizationId: auth.organization?.id,
            },
            select: {
              instanceName: true,
              status: true,
              lastActive: true,
              progress: true,
              warmupTime: true,
              targetDuration: true,
              startTime: true,
              pauseTime: true,
            },
            orderBy: {
              lastActive: "desc",
            },
          });

          // Mapear os status das instâncias
          const instanceStatuses = instances.reduce(
            (acc, instance) => {
              acc[instance.instanceName] = {
                status: instance.status,
                lastActive: instance.lastActive,
                progress: instance.progress || 0,
                warmupTime: instance.warmupTime || 0,
                targetDuration: instance.targetDuration || 0,
                startTime: instance.startTime,
                pauseTime: instance.pauseTime,
              };
              return acc;
            },
            {} as Record<string, any>,
          );

          // Calcular estatísticas gerais
          const totalInstances = instances.length;
          const activeInstances = instances.filter(
            (i) => i.status === "ACTIVE",
          ).length;
          const pausedInstances = instances.filter(
            (i) => i.status === "PAUSED",
          ).length;
          const completedInstances = instances.filter(
            (i) => i.status === "COMPLETED",
          ).length;

          return response.success({
            success: true,
            summary: {
              totalInstances,
              activeInstances,
              pausedInstances,
              completedInstances,
              globalStatus: activeInstances > 0 ? "ACTIVE" : "INACTIVE",
            },
            instances: instanceStatuses,
          });
        } catch (error) {
          console.error("[Warmup Controller] Erro ao obter status:", error);

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao obter status do aquecimento",
            status: 500,
          });
        }
      },
    }),

    /**
     * Atualiza o status de uma instância específica
     */
    updateWarmupStatus: igniter.mutation({
      method: "PUT",
      path: "/status",
      use: [AuthFeatureProcedure()],
      body: UpdateWarmupStatusSchema,
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          // Verificar se a instância pertence à organização
          const existingStats = await prisma.warmupStats.findFirst({
            where: {
              instanceName: request.body.instanceName,
              organizationId: auth.organization?.id,
            },
          });

          if (!existingStats) {
            return response.notFound("Instância de aquecimento não encontrada");
          }

          // Atualizar status
          const updateData: any = {
            status: request.body.status,
          };

          if (request.body.status === "PAUSED") {
            updateData.pauseTime = new Date();
            // Parar o aquecimento no serviço
            await warmupService.stopWarmup(request.body.instanceName);
          } else if (request.body.status === "ACTIVE") {
            updateData.pauseTime = null;
            // Reiniciar aquecimento seria necessário reimplementar a lógica
          }

          const updatedStats = await prisma.warmupStats.update({
            where: { id: existingStats.id },
            data: updateData,
          });

          return response.success({
            success: true,
            message: `Status atualizado para ${request.body.status}`,
            stats: updatedStats,
          });
        } catch (error) {
          console.error("[Warmup Controller] Erro ao atualizar status:", error);

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao atualizar status",
            status: 500,
          });
        }
      },
    }),

    /**
     * Processa webhook de mensagem recebida (para atualizar estatísticas)
     */
    processWebhookMessage: igniter.mutation({
      method: "POST",
      path: "/webhook",
      body: ProcessWebhookMessageSchema,
      handler: async ({ request, response }) => {
        // Este endpoint pode ser chamado sem autenticação pelos webhooks
        // Mas seria recomendado validar o webhook com assinatura

        try {
          // Verificar se a instância existe no sistema
          const instance = await prisma.whatsAppInstance.findFirst({
            where: {
              instanceName: request.body.instanceName,
            },
          });

          if (!instance) {
            return response.notFound("Instância não encontrada");
          }

          // Processar mensagem recebida se não foi enviada por nós
          if (!request.body.messageData.key.fromMe) {
            await warmupService.processReceivedMessage(
              request.body.instanceName,
              instance.organizationId,
              {
                key: request.body.messageData.key,
                pushName: request.body.messageData.pushName || "",
                status: "received",
                message: request.body.messageData.message,
                messageType: request.body.messageData.messageType,
                messageTimestamp: request.body.messageData.messageTimestamp,
                instanceId: request.body.instanceName,
                source: "webhook",
              },
            );
          }

          return response.success({
            success: true,
            message: "Webhook processado com sucesso",
          });
        } catch (error) {
          console.error(
            "[Warmup Controller] Erro ao processar webhook:",
            error,
          );

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao processar webhook",
            status: 500,
          });
        }
      },
    }),

    /**
     * Lista conteúdos de aquecimento da organização
     */
    listWarmupContents: igniter.query({
      method: "GET",
      path: "/contents",
      use: [AuthFeatureProcedure()],
      query: z.object({
        type: z.enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "STICKER"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          const where: any = {
            organizationId: auth.organization?.id,
          };

          if (request.query.type) {
            where.type = request.query.type;
          }

          const [contents, total] = await Promise.all([
            prisma.warmupContent.findMany({
              where,
              take: Number(request.query.limit) || 50,
              skip: Number(request.query.offset) || 0,
              orderBy: {
                createdAt: "desc",
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            }),
            prisma.warmupContent.count({ where }),
          ]);

          return response.success({
            success: true,
            contents,
            pagination: {
              total,
              limit: Number(request.query.limit) || 50,
              offset: Number(request.query.offset) || 0,
              hasMore:
                (Number(request.query.offset) || 0) +
                  (Number(request.query.limit) || 50) <
                total,
              nextOffset:
                (Number(request.query.offset) || 0) +
                (Number(request.query.limit) || 50),
            },
          });
        } catch (error) {
          console.error("[Warmup Controller] Erro ao listar conteúdos:", error);

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao listar conteúdos",
            status: 500,
          });
        }
      },
    }),

    /**
     * Gerencia números externos para aquecimento
     */
    manageExternalNumbers: igniter.mutation({
      method: "POST",
      path: "/external-numbers",
      use: [AuthFeatureProcedure()],
      body: z.object({
        action: z.enum(["list", "add", "remove", "toggle"]),
        phoneNumber: z.string().optional(),
        name: z.string().optional(),
        active: z.boolean().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          switch (request.body.action) {
            case "list": {
              const numbers = await prisma.warmupExternalNumber.findMany({
                where: {
                  organizationId: auth.organization?.id,
                },
                orderBy: {
                  createdAt: "desc",
                },
              });
              return response.success({ success: true, numbers });
            }

            case "add": {
              if (!request.body.phoneNumber) {
                return response.error({
                  code: "BAD_REQUEST",
                  message: "Número de telefone é obrigatório",
                  status: 400,
                });
              }

              const newNumber = await prisma.warmupExternalNumber.create({
                data: {
                  phoneNumber: request.body.phoneNumber,
                  name: request.body.name,
                  organizationId: auth.organization?.id || "",
                  active: true,
                },
              });
              return response.success({ success: true, number: newNumber });
            }

            case "remove": {
              if (!request.body.phoneNumber) {
                return response.error({
                  code: "BAD_REQUEST",
                  message: "Número de telefone é obrigatório",
                  status: 400,
                });
              }

              await prisma.warmupExternalNumber.deleteMany({
                where: {
                  phoneNumber: request.body.phoneNumber,
                  organizationId: auth.organization?.id,
                },
              });
              return response.success({
                success: true,
                message: "Número removido com sucesso",
              });
            }

            case "toggle": {
              if (!request.body.phoneNumber) {
                return response.error({
                  code: "BAD_REQUEST",
                  message: "Número de telefone é obrigatório",
                  status: 400,
                });
              }

              const updated = await prisma.warmupExternalNumber.updateMany({
                where: {
                  phoneNumber: request.body.phoneNumber,
                  organizationId: auth.organization?.id,
                },
                data: {
                  active:
                    request.body.active !== undefined
                      ? request.body.active
                      : undefined,
                },
              });

              return response.success({
                success: true,
                updated: updated.count,
              });
            }

            default:
              return response.error({
                code: "BAD_REQUEST",
                message: "Ação não suportada",
                status: 400,
              });
          }
        } catch (error) {
          console.error(
            "[Warmup Controller] Erro ao gerenciar números externos:",
            error,
          );

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao gerenciar números externos",
            status: 500,
          });
        }
      },
    }),

    /**
     * Lista instâncias do WhatsApp disponíveis para aquecimento
     */
    listWhatsAppInstances: igniter.query({
      method: "GET",
      path: "/whatsapp-instances",
      use: [AuthFeatureProcedure()],
      query: z.object({
        status: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
        offset: z.coerce.number().min(0).default(0),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          const where: any = {
            organizationId: auth.organization?.id,
          };

          if (request.query.status) {
            where.status = request.query.status;
          }

          const queryOptions: any = {
            where,
            take: Number(request.query.limit) || 50,
            select: {
              id: true,
              instanceName: true,
              profileName: true,
              status: true,
              ownerJid: true,
              profilePicUrl: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          };

          // Só adiciona skip se offset for um número válido
          if (request.query.offset && !isNaN(Number(request.query.offset))) {
            queryOptions.skip = Number(request.query.offset);
          }

          const instances =
            await prisma.whatsAppInstance.findMany(queryOptions);

          return response.success({
            success: true,
            data: instances,
            total: instances.length,
          });
        } catch (error) {
          console.error(
            "[Warmup Controller] Erro ao listar instâncias:",
            error,
          );

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao listar instâncias",
            status: 500,
          });
        }
      },
    }),

    /**
     * Obtém estatísticas de mensagens enviadas durante o aquecimento
     */
    getMessageStats: igniter.query({
      method: "GET",
      path: "/message-stats",
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth) {
          return response.error({
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          });
        }

        try {
          // Buscar todas as estatísticas de mídia da organização
          const mediaStats = await prisma.mediaStats.findMany({
            where: {
              organizationId: auth.organization?.id,
            },
          });

          // Agregar estatísticas totais
          const totalStats = mediaStats.reduce(
            (acc, stat) => ({
              text: acc.text + stat.text,
              image: acc.image + stat.image,
              video: acc.video + stat.video,
              audio: acc.audio + stat.audio,
              sticker: acc.sticker + stat.sticker,
              reaction: acc.reaction + stat.reaction,
              totalSent: acc.totalSent + stat.totalSent,
            }),
            {
              text: 0,
              image: 0,
              video: 0,
              audio: 0,
              sticker: 0,
              reaction: 0,
              totalSent: 0,
            },
          );

          return response.success({
            success: true,
            stats: totalStats,
          });
        } catch (error) {
          console.error(
            "[Warmup Controller] Erro ao obter estatísticas de mensagens:",
            error,
          );

          return response.error({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Erro ao obter estatísticas de mensagens",
            status: 500,
          });
        }
      },
    }),
  },
});
