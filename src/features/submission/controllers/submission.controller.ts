import { z } from 'zod'
import { igniter } from '@/igniter'
import { SubmissionFeatureProcedure } from '../procedures/submission.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'

export const SubmissionController = igniter.controller({
  name: 'submission',
  path: '/submissions',
  actions: {
    findMany: igniter.query({
      method: 'GET',
      path: '/',
      use: [SubmissionFeatureProcedure(), AuthFeatureProcedure()],
      query: z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        search: z.string().optional(),
        leadId: z.string().optional(),
      }),
      handler: async ({ response, request, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })
        const result = await context.submission.findMany({
          ...request.query,
          organizationId: auth.organization.id,
        })
        return response.success(result)
      },
    }),

    findOne: igniter.query({
      method: 'GET',
      path: '/:id' as const,
      use: [SubmissionFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })
        const result = await context.submission.findOne({
          ...request.params,
          organizationId: auth.organization.id,
        })
        return response.success(result)
      },
    }),

    create: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [SubmissionFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(), // added phone field to the body
        metadata: z.object({
          source: z.string(),
          data: z.record(z.any()),
        }),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        const result = await context.submission.create({
          name: request.body.name,
          email: request.body.email,
          phone: request.body.phone,
          organizationId: auth.organization.id,
          metadata: request.body.metadata,
        })

        return response.success(result)
      },
    }),

    update: igniter.mutation({
      method: 'PUT',
      path: '/:id' as const,
      use: [SubmissionFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        metadata: z.any().optional().nullable(),
        leadId: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        const result = await context.submission.update({
          id: request.params.id,
          metadata: request.body.metadata,
          organizationId: auth.organization.id,
        })

        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      method: 'DELETE',
      path: '/:id' as const,
      use: [SubmissionFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        await context.submission.delete(request.params)
        return response.success(null)
      },
    }),
  },
})
