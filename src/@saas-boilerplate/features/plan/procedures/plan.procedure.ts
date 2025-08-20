import { igniter } from '@/igniter'
import type { Plan } from '../plan.interface'

export const PlanFeatureProcedure = igniter.procedure({
  name: 'PlanFeatureProcedure',
  handler: async (_, { context }) => {
    return {
      plan: {
        findMany: async (): Promise<Plan[]> => {
          return context.providers.payment.listPlans()
        },
      },
    }
  },
})
