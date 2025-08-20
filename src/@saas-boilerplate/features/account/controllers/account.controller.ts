import { z } from 'zod'
import { igniter } from '@/igniter'
import { AccountFeatureProcedure } from '../procedures/account.procedure'
import { AccountProvider } from '../account.interface'

export const AccountController = igniter.controller({
  name: 'account',
  path: '/account',
  actions: {
    findManyByCurrentUser: igniter.query({
      method: 'GET',
      path: '/',
      use: [AccountFeatureProcedure()],
      handler: async ({ response, context }) => {
        const result = await context.account.findManyByCurrentUser()
        return response.success(result)
      },
    }),

    link: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [AccountFeatureProcedure()],
      body: z.object({
        provider: z.nativeEnum(AccountProvider),
        callbackURL: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.account.link(request.body)
        return response.success(result)
      },
    }),

    unlink: igniter.mutation({
      method: 'DELETE',
      path: '/' as const,
      use: [AccountFeatureProcedure()],
      body: z.object({
        provider: z.nativeEnum(AccountProvider),
      }),
      handler: async ({ request, response, context }) => {
        await context.account.unlink(request.body)
        return response.success()
      },
    }),
  },
})
