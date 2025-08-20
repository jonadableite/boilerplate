import { z } from 'zod'
import { igniter } from '@/igniter'
import { MembershipFeatureProcedure } from '../procedures/membership.procedure'
import { AuthFeatureProcedure } from '../../auth/procedures/auth.procedure'

export const MembershipController = igniter.controller({
  name: 'membership',
  path: '/membership',
  actions: {
    search: igniter.query({
      method: 'GET',
      path: '/',
      use: [MembershipFeatureProcedure(), AuthFeatureProcedure()],
      query: z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        search: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin', 'member'],
        })
        const result = await context.membership.search({
          ...request.query,
          organizationId: session.organization.id,
        })
        return response.success(result)
      },
    }),

    update: igniter.mutation({
      method: 'PUT',
      path: '/:id' as const,
      use: [MembershipFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        userId: z.string().optional(),
        role: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        const result = await context.membership.update({
          ...request.params,
          ...request.body,
          organizationId: session.organization.id,
        })
        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      method: 'DELETE',
      path: '/:id' as const,
      use: [MembershipFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        await context.membership.delete({
          id: request.params.id,
          organizationId: session.organization.id,
        })
        return response.success(null)
      },
    }),
  },
})
