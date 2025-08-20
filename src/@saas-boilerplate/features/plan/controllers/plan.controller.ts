import { igniter } from '@/igniter'
import { PlanFeatureProcedure } from '../procedures/plan.procedure'

export const PlanController = igniter.controller({
  name: 'plan',
  path: '/plan',
  actions: {
    findMany: igniter.query({
      method: 'GET',
      path: '/',
      use: [PlanFeatureProcedure()],
      handler: async ({ response, context }) => {
        const result = await context.plan.findMany()
        return response.success(result)
      },
    }),
  },
})
