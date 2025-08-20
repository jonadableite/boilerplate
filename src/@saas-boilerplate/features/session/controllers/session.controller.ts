import { z } from 'zod'
import { igniter } from '@/igniter'
import { SessionFeatureProcedure } from '../procedures/session.procedure'

export const SessionController = igniter.controller({
  name: 'session',
  path: '/session',
  actions: {
    findManyByCurrentUser: igniter.query({
      method: 'GET',
      path: '/',
      use: [SessionFeatureProcedure()],
      handler: async ({ response, context }) => {
        const result = await context.session.findMany()
        return response.success(result)
      },
    }),

    revoke: igniter.mutation({
      method: 'DELETE',
      path: '/revoke' as const,
      use: [SessionFeatureProcedure()],
      body: z.object({
        token: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.session.revoke(request.body.token)
        return response.success(result)
      },
    }),
  },
})
