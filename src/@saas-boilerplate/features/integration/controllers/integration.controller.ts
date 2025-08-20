import { z } from 'zod'
import { igniter } from '@/igniter'
import { IntegrationFeatureProcedure } from '../procedures/integration.procedure'
import { AuthFeatureProcedure } from '../../auth'

export const IntegrationController = igniter.controller({
  name: 'integration',
  path: '/integrations',
  actions: {
    findMany: igniter.query({
      method: 'GET',
      path: '/',
      use: [IntegrationFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin', 'member'],
        })

        const result = await context.integration.findMany({
          organizationId: session?.organization.id,
        })

        return response.success(result)
      },
    }),

    findOne: igniter.query({
      method: 'GET',
      path: '/:slug' as const,
      use: [IntegrationFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin', 'member'],
        })

        const result = await context.integration.findOne(
          request.params.slug,
          session.organization.id,
        )

        if (!result) return response.notFound('Integration not found')

        return response.success(result)
      },
    }),

    install: igniter.mutation({
      method: 'POST',
      path: '/:slug/install' as const,
      use: [IntegrationFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        metadata: z.record(z.any()),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin', 'member'],
        })

        const result = await context.integration.install({
          organizationId: session.organization.id,
          integrationSlug: request.params.slug,
          metadata: request.body.metadata,
        })

        return response.success(result)
      },
    }),

    update: igniter.mutation({
      method: 'PUT',
      path: '/:slug' as const,
      use: [IntegrationFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        metadata: z.record(z.any()),
        enabled: z.boolean().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin', 'member'],
        })

        const result = await context.integration.update({
          integrationSlug: request.params.slug,
          organizationId: session.organization.id,
          metadata: request.body.metadata,
          enabled: request.body.enabled,
        })

        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      method: 'DELETE',
      path: '/:slug/uninstall' as const,
      use: [IntegrationFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin', 'member'],
        })

        await context.integration.uninstall(
          session.organization.id,
          request.params.slug,
        )
        return response.success(null)
      },
    }),
  },
})
