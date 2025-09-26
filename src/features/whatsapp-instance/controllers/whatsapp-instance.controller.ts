// src/features/whatsapp-instance/controllers/whatsapp-instance.controller.tsa
import { AuthFeatureProcedure } from "@/@saas-boilerplate/features/auth";
import { igniter } from "@/igniter";
import { z } from "zod";
import { WhatsAppInstanceProcedure } from "../procedures/whatsapp-instance.procedure";
import {
  createWhatsAppInstanceSchema,
  InstanceConnectionStatus,
  setProxySchema,
  type WhatsAppInstanceListResponse,
} from "../whatsapp-instance.types";

export const WhatsAppInstanceController = igniter.controller({
  name: "whatsapp-instances",
  path: "/whatsapp-instances",
  actions: {
    // Listar instâncias com paginação, filtros e stats
    list: igniter.query({
      method: "GET",
      path: "/",
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      query: z.object({
        status: z
          .union([z.literal("all"), z.nativeEnum(InstanceConnectionStatus)])
          .optional(),
        search: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
      }),
      handler: async ({ request, response, context }) => {
        // Valida sessão e requer organização ativa
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const result = await context.whatsAppInstance.list({
          organizationId: session.organization.id,
          ...request.query,
        });

        // Map status from Prisma enum to local InstanceConnectionStatus
        const mappedData = result.data.map(
          (instance: {
            status: InstanceConnectionStatus;
            metadata: string | Record<string, any> | null;
          }) => ({
            ...instance,
            status: instance.status as InstanceConnectionStatus,
            metadata:
              typeof instance.metadata === "string"
                ? (JSON.parse(instance.metadata) as Record<string, any>)
                : (instance.metadata as Record<string, any> | null),
          }),
        );

        return response.success<WhatsAppInstanceListResponse>({
          ...result,
          data: mappedData,
        });
      },
    }),

    // Criar nova instância
    create: igniter.mutation({
      method: "POST",
      path: "/",
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      body: createWhatsAppInstanceSchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const instance = await context.whatsAppInstance.create({
          ...request.body,
          organizationId: session.organization.id,
          userId: session.user.id,
          createdById: session.user.id,
        });

        return response.created(instance);
      },
    }),

    // Deletar instância
    delete: igniter.mutation({
      method: "DELETE",
      path: "/:id" as const,
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        await context.whatsAppInstance.delete({
          id: request.params.id,
          organizationId: session.organization.id,
        });

        return response.noContent();
      },
    }),

    // Atualizar status/reconectar
    update: igniter.mutation({
      method: "PATCH",
      path: "/:id" as const,
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      body: z.object({
        status: z.nativeEnum(InstanceConnectionStatus).optional(),
        metadata: z.record(z.any()).optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const instance = await context.whatsAppInstance.update({
          id: request.params.id,
          organizationId: session.organization.id,
          ...request.body,
        });

        return response.success(instance);
      },
    }),

    // Sincronizar status com Evolution API
    syncStatus: igniter.mutation({
      method: "POST",
      path: "/:id/sync" as const,
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const updatedInstance = await context.whatsAppInstance.syncStatus({
          id: request.params.id,
          organizationId: session.organization.id,
        });

        return response.success(updatedInstance);
      },
    }),

    // Sincronizar todas as instâncias com Evolution API
    syncAll: igniter.mutation({
      method: "POST",
      path: "/sync-all" as const,
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const updatedInstances =
          await context.whatsAppInstance.syncAllInstances(
            session.organization.id,
          );

        return response.success({
          message: `${updatedInstances.length} instâncias sincronizadas`,
          data: updatedInstances,
        });
      },
    }),

    // Obter contadores/stats
    stats: igniter.query({
      method: "GET",
      path: "/stats",
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const stats = await context.whatsAppInstance.getStats(
          session.organization.id,
        );

        return response.success(stats);
      },
    }),

    // Configurar proxy para instância
    setProxy: igniter.mutation({
      method: "POST",
      path: "/:id/proxy" as const,
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      body: setProxySchema,
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const result = await context.whatsAppInstance.setProxy({
          id: request.params.id,
          organizationId: session.organization.id,
          proxyConfig: request.body,
        });

        return response.success(result);
      },
    }),

    // Obter configuração de proxy da instância
    getProxy: igniter.query({
      method: "GET",
      path: "/:id/proxy" as const,
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const result = await context.whatsAppInstance.getProxy({
          id: request.params.id,
          organizationId: session.organization.id,
        });

        return response.success(result);
      },
    }),

    // Conectar instância e obter QR Code
    connect: igniter.mutation({
      method: "POST",
      path: "/:id/connect" as const,
      use: [AuthFeatureProcedure(), WhatsAppInstanceProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: "authenticated",
        });

        if (!session?.organization) {
          return response.unauthorized("Organização não selecionada");
        }

        const result = await context.whatsAppInstance.connectInstance({
          id: request.params.id,
          organizationId: session.organization.id,
        });

        return response.success(result);
      },
    }),
  },
  name: "",
});
