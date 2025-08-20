import { igniter } from '@/igniter'
import type {
  ApiKey,
  CreateApiKeyDTO,
  UpdateApiKeyDTO,
} from '../api-key.interface'
import { randomUUID } from 'crypto'

export const ApiKeyFeatureProcedure = igniter.procedure({
  name: 'ApiKeyFeatureProcedure',
  handler: async (_, { context }) => {
    return {
      apikey: {
        findManyByOrganization: async (
          organizationId: string,
        ): Promise<ApiKey[]> => {
          return context.providers.database.apiKey.findMany({
            where: {
              organizationId,
            },
          })
        },

        findOne: async (params: {
          id: string
          organizationId?: string
        }): Promise<ApiKey | null> => {
          return context.providers.database.apiKey.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
          })
        },

        create: async (input: CreateApiKeyDTO): Promise<ApiKey> => {
          return context.providers.database.apiKey.create({
            data: {
              description: input.description,
              key: randomUUID(),
              enabled: true,
              neverExpires: input.neverExpires ?? true,
              expiresAt: input.expiresAt,
              organizationId: input.organizationId,
            },
          })
        },

        update: async (params: UpdateApiKeyDTO): Promise<ApiKey> => {
          const apikey = await context.providers.database.apiKey.findUnique({
            where: { id: params.id },
          })

          if (!apikey) throw new Error('ApiKey not found')

          return context.providers.database.apiKey.update({
            where: { id: params.id },
            data: {
              description: params.description,
              enabled: params.enabled,
            },
          })
        },

        delete: async (params: {
          id: string
          organizationId?: string
        }): Promise<void> => {
          await context.providers.database.apiKey.delete({
            where: { id: params.id, organizationId: params.organizationId },
          })
        },
      },
    }
  },
})
