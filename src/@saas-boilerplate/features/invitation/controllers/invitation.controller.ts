import { z } from 'zod'
import { igniter } from '@/igniter'
import { InvitationFeatureProcedure } from '../procedures/invitation.procedure'

export const InvitationController = igniter.controller({
  name: 'invitation',
  path: '/invitation',
  actions: {
    findOne: igniter.query({
      method: 'GET',
      path: '/:id' as const,
      use: [InvitationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const result = await context.invitation.findOne(request.params.id)
        return response.success(result)
      },
    }),

    create: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [InvitationFeatureProcedure()],
      body: z.object({
        email: z.string(),
        role: z.enum(['admin', 'member']),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.invitation.create(request.body)
        return response.success(result)
      },
    }),

    accept: igniter.mutation({
      method: 'POST',
      path: '/:id/accept',
      use: [InvitationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        await context.invitation.accept(request.params.id)
        return response.success()
      },
    }),

    reject: igniter.mutation({
      method: 'POST',
      path: '/:id/reject',
      use: [InvitationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        await context.invitation.reject(request.params.id)
        return response.success()
      },
    }),

    cancel: igniter.mutation({
      method: 'DELETE',
      path: '/:id/cancel',
      use: [InvitationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        await context.invitation.cancel(request.params.id)
        return response.success({ message: 'Invitation canceled' })
      },
    }),
  },
})
