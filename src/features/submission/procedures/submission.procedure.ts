import { igniter } from '@/igniter'
import type {
  Submission,
  CreateSubmissionsDTO,
  UpdateSubmissionsDTO,
  SubmissionsQueryParams,
} from '../submission.interface'
import type { Prisma } from '@prisma/client'

export const SubmissionFeatureProcedure = igniter.procedure({
  name: 'SubmissionFeatureProcedure',
  handler: async (_, { context }) => {
    return {
      submission: {
        findMany: async (
          query: SubmissionsQueryParams,
        ): Promise<Submission[]> => {
          const result = await context.providers.database.submission.findMany({
            where: {
              organizationId: query.organizationId,
              leadId: query.leadId,
            },
            include: {
              lead: true,
              organization: true,
            },
            skip: query.page
              ? (Number(query.page) - 1) * (Number(query.limit) || 10)
              : undefined,
            take: query.limit ? Number(query.limit) : undefined,
            orderBy: query.sortBy
              ? { [query.sortBy]: query.sortOrder || 'asc' }
              : undefined,
          })

          return result as unknown[] as Submission[]
        },

        findOne: async (params: {
          id: string
          organizationId: string
        }): Promise<Submission | null> => {
          const result = await context.providers.database.submission.findUnique(
            {
              where: {
                id: params.id,
                organizationId: params.organizationId,
              },
            },
          )

          return result as Submission
        },

        create: async (input: CreateSubmissionsDTO): Promise<Submission> => {
          let lead = await context.providers.database.lead.findFirst({
            where: { email: input.email, organizationId: input.organizationId },
          })

          if (!lead) {
            lead = await context.providers.database.lead.create({
              data: {
                name: input.name,
                email: input.email,
                phone: input.phone,
                metadata: input.metadata as Prisma.InputJsonValue,
                organizationId: input.organizationId,
              },
            })
          }

          if (!lead) throw new Error('Lead not found')

          const result = await context.providers.database.submission.create({
            data: {
              metadata: input.metadata as Prisma.InputJsonValue,
              leadId: lead.id,
              organizationId: input.organizationId,
            },
          })

          return result as Submission
        },

        update: async (params: UpdateSubmissionsDTO): Promise<Submission> => {
          const submission =
            await context.providers.database.submission.findUnique({
              where: { id: params.id },
            })

          if (!submission) throw new Error('Submission not found')

          const result = await context.providers.database.submission.update({
            where: { id: params.id },
            data: {
              metadata: params.metadata as Prisma.InputJsonValue,
              leadId: params.leadId,
              organizationId: params.organizationId,
            },
          })

          return result as Submission
        },

        delete: async (params: { id: string }): Promise<{ id: string }> => {
          await context.providers.database.submission.delete({
            where: { id: params.id },
          })

          return { id: params.id }
        },
      },
    }
  },
})
