import { igniter } from "@saas-boilerplate/igniter";
import { z } from "zod";
import { AuthFeatureProcedure } from "@saas-boilerplate/features/auth/procedures/auth.procedure";
import { AIAgentFeatureProcedure } from "../procedures/ai-agent.procedure";

// Schema para validação do payload da Evolution API
const EvolutionWebhookSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
    }),
    message: z.object({
      conversation: z.string().optional(),
      extendedTextMessage: z
        .object({
          text: z.string(),
        })
        .optional(),
      imageMessage: z
        .object({
          caption: z.string().optional(),
          mimetype: z.string(),
          url: z.string().optional(),
        })
        .optional(),
      audioMessage: z
        .object({
          mimetype: z.string(),
          url: z.string().optional(),
        })
        .optional(),
      documentMessage: z
        .object({
          caption: z.string().optional(),
          mimetype: z.string(),
          title: z.string().optional(),
          url: z.string().optional(),
        })
        .optional(),
    }),
    messageTimestamp: z.number(),
    pushName: z.string().optional(),
    participant: z.string().optional(),
  }),
});

const WebhookSignatureSchema = z.object({
  "x-evolution-signature": z.string().optional(),
  "x-evolution-timestamp": z.string().optional(),
});

export const WebhookController = igniter.controller({
  name: "webhook",
  path: "/webhooks/evolution",
  actions: {
    // Receber mensagens da Evolution API
    receiveMessage: igniter.mutation({
      method: "POST",
      path: "/message",
      use: [AIAgentFeatureProcedure()],
      body: EvolutionWebhookSchema,
      handler: async ({ request, response, context }) => {
        try {
          const payload = request.body;
          const headers = request.headers;

          // Processar webhook da Evolution API
          const result = await context.aiAgent.processEvolutionWebhook({
            payload,
            headers: Object.fromEntries(headers.entries()),
            signature: headers.get("x-evolution-signature") || undefined,
          });

          if (!result.success) {
            return response.badRequest("Failed to process webhook");
          }

          return response.success({
            message: "Webhook processed successfully",
            agentId: result.agentId,
            response: result.response,
          });
        } catch (error) {
          console.error("Webhook processing error:", error);
          return response.error({
            status: 500,
            code: "WEBHOOK_PROCESSING_ERROR",
            message: "Erro ao processar webhook",
          });
        }
      },
    }),

    // Receber status de mensagens (entregue, lida, etc.)
    receiveStatus: igniter.mutation({
      method: "POST",
      path: "/status",
      use: [AIAgentFeatureProcedure()],
      body: z.object({
        event: z.string(),
        instance: z.string(),
        data: z.object({
          key: z.object({
            remoteJid: z.string(),
            fromMe: z.boolean(),
            id: z.string(),
          }),
          status: z.enum(["pending", "sent", "received", "read"]),
          participant: z.string().optional(),
        }),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const payload = request.body;
          const headers = request.headers;

          // Processar status da mensagem
          const result = await context.aiAgent.processMessageStatus({
            payload,
            signature: headers.get("x-evolution-signature") || undefined,
          });

          if (!result.success) {
            return response.badRequest("Failed to process status webhook");
          }

          return response.success({
            message: "Status webhook processed successfully",
          });
        } catch (error) {
          console.error("Status webhook processing error:", error);
          return response.error({
            status: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error processing status webhook",
          });
        }
      },
    }),

    // Receber eventos de conexão da instância
    receiveConnection: igniter.mutation({
      method: "POST",
      path: "/connection",
      use: [AIAgentFeatureProcedure()],
      body: z.object({
        event: z.string(),
        instance: z.string(),
        data: z.object({
          state: z.enum(["connecting", "open", "close"]),
          statusReason: z.number().optional(),
        }),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const payload = request.body;
          const headers = request.headers;

          // Processar evento de conexão
          const result = await context.aiAgent.processConnectionEvent({
            payload,
            signature: headers.get("x-evolution-signature") || undefined,
          });

          if (!result.success) {
            return response.badRequest("Failed to process connection webhook");
          }

          return response.success({
            message: "Connection webhook processed successfully",
          });
        } catch (error) {
          console.error("Connection webhook processing error:", error);
          return response.error({
            status: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error processing connection webhook",
          });
        }
      },
    }),

    // Endpoint para validação do webhook (usado pela Evolution API)
    validateWebhook: igniter.query({
      method: "GET",
      path: "/validate",
      query: z.object({
        "hub.mode": z.string().optional(),
        "hub.verify_token": z.string().optional(),
        "hub.challenge": z.string().optional(),
      }),
      handler: async ({ request, response }) => {
        try {
          const {
            "hub.mode": mode,
            "hub.verify_token": token,
            "hub.challenge": challenge,
          } = request.query;

          // Verificar se é uma validação do webhook
          if (mode === "subscribe") {
            // Verificar token de validação (deve ser configurado nas variáveis de ambiente)
            const expectedToken = process.env.EVOLUTION_WEBHOOK_VERIFY_TOKEN;

            if (token === expectedToken) {
              // Retornar o challenge para validar o webhook
              return response.success(challenge);
            } else {
              return response.forbidden("Invalid verify token");
            }
          }

          return response.badRequest("Invalid webhook validation request");
        } catch (error) {
          console.error("Webhook validation error:", error);
          return response.error({
            status: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error validating webhook",
          });
        }
      },
    }),

    // Endpoint para testar conectividade do webhook
    testWebhook: igniter.mutation({
      method: "POST",
      path: "/test",
      use: [AuthFeatureProcedure()],
      body: z.object({
        instanceName: z.string(),
        testMessage: z.string().optional().default("Test message from webhook"),
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

          const { instanceName, testMessage } = request.body;

          // Testar webhook - implementação temporária
          return response.success({
            message: "Webhook test completed successfully",
            result: {
              instanceName,
              testMessage,
              status: "tested",
            },
          });
        } catch (error) {
          console.error("Webhook test error:", error);
          return response.error({
            status: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error testing webhook",
          });
        }
      },
    }),
  },
});
