import { igniter } from '@/igniter'
import type {
  Lead,
  CreateLeadDTO,
  UpdateLeadDTO,
  LeadQueryParams,
} from '../lead.interface'
import type { Prisma } from '@prisma/client'
import { OrganizationMetadata } from '@/@saas-boilerplate/features/organization'
import { parseMetadata } from '@/utils/parse-metadata'

export const LeadFeatureProcedure = igniter.procedure({
  name: 'LeadFeatureProcedure',
  handler: async (_, { context }) => {
    return {
      lead: {
        findMany: async (query: LeadQueryParams): Promise<Lead[]> => {
          const result = await context.providers.database.lead.findMany({
            where: {
              OR: query.search
                ? [
                    { email: { contains: query.search } },
                    { name: { contains: query.search } },
                    { phone: { contains: query.search } },
                  ]
                : undefined,
              organizationId: query.organizationId,
            },
            include: {
              submissions: true,
            },
            skip: query.page
              ? (query.page - 1) * (query.limit || 10)
              : undefined,
            take: query.limit,
            orderBy: query.sortBy
              ? { [query.sortBy]: query.sortOrder || 'asc' }
              : undefined,
          })

          return result as Lead[]
        },

        findOne: async (params: {
          id: string
          organizationId: string
        }): Promise<Lead | null> => {
          const result = await context.providers.database.lead.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
            include: {
              submissions: true,
            },
          })

          return result as Lead
        },

        create: async (input: CreateLeadDTO): Promise<Lead> => {
          const result = await context.providers.database.lead.create({
            data: {
              email: input.email,
              name: input.name,
              phone: input.phone,
              metadata: input.metadata as Prisma.InputJsonValue,
              organizationId: input.organizationId,
            },
            include: {
              organization: true,
            },
          })

          const orgMetadata = parseMetadata<OrganizationMetadata>(
            result.organization.metadata,
          )

          await context.providers.mail.send({
            template: 'notification',
            to: orgMetadata.contact?.email as string,
            data: {
              email: orgMetadata.contact?.email as string,
              details: `You have received a new lead from ${input.name} (${input.email})`,
              organization: result.organization.name,
            },
          })

          return result as Lead
        },

        update: async (
          params: { id: string } & UpdateLeadDTO,
        ): Promise<Lead> => {
          const lead = await context.providers.database.lead.findUnique({
            where: { id: params.id },
          })

          if (!lead) throw new Error('Lead not found')

          const result = await context.providers.database.lead.update({
            where: { id: params.id },
            data: {
              email: params.email,
              name: params.name,
              phone: params.phone,
              metadata: params.metadata as Prisma.InputJsonValue,
            },
          })

          return result as Lead
        },

        delete: async (params: {
          id: string
          organizationId: string
        }): Promise<{ id: string }> => {
          await context.providers.database.lead.delete({
            where: { id: params.id, organizationId: params.organizationId },
          })

          return { id: params.id }
        },
      },
    }
  },
})
