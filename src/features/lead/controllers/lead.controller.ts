import { z } from "zod";
import { igniter } from "@/igniter";
import { LeadFeatureProcedure } from "../procedures/lead.procedure";
import { AuthFeatureProcedure } from "@/@saas-boilerplate/features/auth";

export const LeadController = igniter.controller({
  name: "lead",
  path: "/lead",
  actions: {
    findMany: igniter.query({
      method: "GET",
      path: "/",
      use: [LeadFeatureProcedure(), AuthFeatureProcedure()],
      query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(1000).default(20),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        search: z.string().optional(),
      }),
      handler: async ({ response, request, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth || !auth.organization) {
          return response.unauthorized(
            "Authentication required or no active organization",
          );
        }

        const result = await context.lead.findMany({
          ...request.query,
          organizationId: auth.organization.id,
        });
        return response.success(result);
      },
    }),

    findOne: igniter.query({
      method: "GET",
      path: "/:id" as const,
      use: [LeadFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth || !auth.organization) {
          return response.unauthorized(
            "Authentication required or no active organization",
          );
        }

        const result = await context.lead.findOne({
          ...request.params,
          organizationId: auth.organization.id,
        });

        return response.success(result);
      },
    }),

    create: igniter.mutation({
      method: "POST",
      path: "/",
      use: [LeadFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        email: z.string(),
        name: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        metadata: z.any().optional().nullable(),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });
        const result = await context.lead.create({
          ...request.body,
          organizationId: auth.organization.id,
        });
        return response.success(result);
      },
    }),

    update: igniter.mutation({
      method: "PUT",
      path: "/:id" as const,
      use: [LeadFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        email: z.string().optional(),
        name: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        metadata: z.any().optional().nullable(),
        createdAt: z.date().optional().nullable(),
        updatedAt: z.date().optional(),
        organizationId: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });
        const result = await context.lead.update({
          ...request.params,
          ...request.body,
        });
        return response.success(result);
      },
    }),

    delete: igniter.mutation({
      method: "DELETE",
      path: "/:id" as const,
      use: [LeadFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });
        await context.lead.delete({
          ...request.params,
          organizationId: auth.organization.id,
        });
        return response.success({});
      },
    }),

    bulkImport: igniter.mutation({
      method: "POST",
      path: "/bulk-import",
      use: [LeadFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        file: z.string(), // Base64 encoded file
        filename: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: "authenticated",
          roles: ["admin", "owner", "member"],
        });

        if (!auth || !auth.organization) {
          return response.unauthorized(
            "Authentication required or no active organization",
          );
        }

        try {
          const result = await context.lead.bulkImport({
            file: request.body.file,
            filename: request.body.filename,
            organizationId: auth.organization.id,
          });

          return response.success(result);
        } catch (error) {
          return response.badRequest(
            error.message || "Erro ao processar arquivo",
          );
        }
      },
    }),
  },
});
