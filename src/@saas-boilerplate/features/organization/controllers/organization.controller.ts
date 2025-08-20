import { z } from 'zod'
import { igniter } from '@/igniter'
import { OrganizationFeatureProcedure } from '../procedures/organization.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'
import { OrganizationMetadataSchema } from '../organization.interface'

export const OrganizationController = igniter.controller({
  name: 'organization',
  path: '/organization',
  actions: {
    create: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [OrganizationFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        name: z.string(),
        slug: z.string(),
        logo: z.string().optional(),
        metadata: OrganizationMetadataSchema.optional(),
        withDemoData: z.boolean().optional().default(false),
      }),
      handler: async ({ request, response, context }) => {
        const disponibility = await context.organization.verify({
          slug: request.body.slug,
        })

        if (!disponibility) {
          return response.error({
            code: 'ORGANIZATION_SLUG_NOT_AVAILABLE',
            message: 'Slug is not available',
            status: 400,
          })
        }

        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        const result = await context.organization.create({
          ...request.body,
          userId: session.user.id,
          withDemoData: request.body.withDemoData || false,
          metadata: {
            contact: {
              email: session.user.email,
            },
          },
        })

        return response.success(result)
      },
    }),

    stats: igniter.query({
      method: 'GET',
      path: '/stats',
      use: [OrganizationFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })
        const stats = await context.organization.getStats({
          organizationId: session.organization.id,
        })
        return response.success(stats)
      },
    }),

    verify: igniter.mutation({
      method: 'POST',
      path: '/verify' as const,
      use: [OrganizationFeatureProcedure()],
      body: z.object({
        slug: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.organization.verify({
          slug: request.body.slug,
        })
        return response.success({ available: result })
      },
    }),

    update: igniter.mutation({
      method: 'PUT',
      path: '/' as const,
      use: [OrganizationFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        name: z.string().optional(),
        slug: z.string().optional(),
        logo: z.string().optional().nullable(),
        metadata: z.any().optional().nullable(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })
        const result = await context.organization.update({
          id: session.organization.id,
          ...request.body,
        })
        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      method: 'DELETE',
      path: '/:id' as const,
      use: [OrganizationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        await context.organization.delete(request.params)
        return response.success(null)
      },
    }),

    getBySlug: igniter.query({
      method: 'GET',
      path: '/public/:slug',
      use: [OrganizationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const organization = await context.organization.getBySlug({
          slug: request.params.slug,
        })

        if (!organization) {
          return response.notFound('Organization not found')
        }

        return response.success(organization)
      },
    }),
  },
})
