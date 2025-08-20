import { igniter } from '@/igniter'
import { BillingFeatureProcedure } from '../procedures/billing.procedure'
import { AuthFeatureProcedure } from '../../auth'
import { z } from 'zod'

export const BillingController = igniter.controller({
  name: 'billing',
  path: '/billing',
  actions: {
    getSessionCustomer: igniter.query({
      method: 'GET',
      path: '/subscription',
      use: [BillingFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })
        const billingInfo = await context.billing.getBilling({
          id: session.organization.id,
        })
        return response.success(billingInfo)
      },
    }),

    createCheckoutSession: igniter.mutation({
      method: 'POST',
      path: '/subscription',
      use: [BillingFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        plan: z.string(),
        cycle: z.enum(['month', 'year', 'week', 'day']),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })

        const result = await context.billing.createBillingCheckoutSession({
          id: session.organization.id,
          plan: request.body.plan,
          cycle: request.body.cycle,
        })

        return response.success(result)
      },
    }),

    createSessionManager: igniter.mutation({
      method: 'POST',
      path: '/subscription/open',
      use: [BillingFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        returnUrl: z.string(),
      }),
      handler: async ({ response, request, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })

        const result = await context.billing.createBillingSessionManager({
          id: session.organization.id,
          returnUrl: request.body.returnUrl,
        })

        return response.success(result)
      },
    }),
  },
})
