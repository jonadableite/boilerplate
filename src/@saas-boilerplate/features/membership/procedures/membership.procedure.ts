import { igniter } from '@/igniter'
import type {
  Membership,
  CreateMembershipDTO,
  UpdateMembershipDTO,
  MembershipQueryParams,
} from '../membership.interface'

export const MembershipFeatureProcedure = igniter.procedure({
  name: 'MembershipFeatureProcedure',
  handler: async (_, { context }) => {
    return {
      membership: {
        search: async (query: MembershipQueryParams): Promise<Membership[]> => {
          return context.providers.database.member.findMany({
            where: query.search
              ? {
                  OR: [
                    { userId: { contains: query.search } },
                    { role: { contains: query.search } },
                  ],
                  organizationId: query.organizationId,
                }
              : undefined,
            skip: query.page
              ? (query.page - 1) * (query.limit || 10)
              : undefined,
            take: query.limit,
            orderBy: query.sortBy
              ? { [query.sortBy]: query.sortOrder || 'asc' }
              : undefined,
          })
        },

        findOne: async (params: {
          id: string
          organizationId?: string
        }): Promise<Membership | null> => {
          return context.providers.database.member.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
          })
        },

        create: async (input: CreateMembershipDTO): Promise<Membership> => {
          return context.providers.database.member.create({
            data: {
              organizationId: input.organizationId,
              userId: input.userId,
              role: input.role,
            },
          })
        },

        update: async (
          params: { id: string; organizationId?: string } & UpdateMembershipDTO,
        ): Promise<Membership> => {
          const membership = await context.providers.database.member.findUnique(
            {
              where: {
                id: params.id,
                organizationId: params.organizationId,
              },
            },
          )

          if (!membership) throw new Error('Membership not found')

          return context.providers.database.member.update({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
            data: {
              organizationId: params.organizationId,
              userId: params.userId,
              role: params.role,
            },
          })
        },

        delete: async (params: {
          id: string
          organizationId?: string
        }): Promise<{ id: string }> => {
          const membership = await context.providers.database.member.findUnique(
            {
              where: {
                id: params.id,
                organizationId: params.organizationId,
              },
            },
          )

          if (!membership) throw new Error('Membership not found')
          if (membership.role === 'owner')
            throw new Error('Cannot delete organization owner')

          await context.providers.database.member.delete({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
          })

          return { id: params.id }
        },
      },
    }
  },
})
