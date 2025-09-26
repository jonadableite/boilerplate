import { z } from 'zod'
import { igniter } from '@/igniter'
import { ApiKeyFeatureProcedure } from '../procedures/api-key.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'

export const ApiKeyController = igniter.controller({
  name: 'api-key',
  path: '/api-key',
  actions: {
    findManyByOrganization: igniter.query({
      method: 'GET',
      path: '/',
      use: [ApiKeyFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        const result = await context.apikey.findManyByOrganization(
          session.organization.id,
        )
        return response.success(result)
      },
    }),

    findOne: igniter.query({
      method: 'GET',
      path: '/:id',
      use: [ApiKeyFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        const result = await context.apikey.findOne({
          id: request.params.id,
          organizationId: session.organization.id,
        })
        return response.success(result)
      },
    }),

    update: igniter.mutation({
      method: 'PUT',
      path: '/:id',
      use: [ApiKeyFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        description: z.string().optional(),
        enabled: z.boolean().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        const result = await context.apikey.update({
          ...request.params,
          ...request.body,
          organizationId: session.organization.id,
        })
        return response.success(result)
      },
    }),
  },
})
