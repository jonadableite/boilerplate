import { igniter } from '@/igniter'
import type {
  Webhook,
  CreateWebhookDTO,
  UpdateWebhookDTO,
} from '../webhook.interface'

export const WebhookFeatureProcedure = igniter.procedure({
  name: 'WebhookFeatureProcedure',
  handler: async (_, { context }) => {
    return {
      webhook: {
        findManyByOrganizationId: async (
          organizationId: string,
        ): Promise<Webhook[]> => {
          return context.providers.database.webhook.findMany({
            where: {
              organizationId,
            },
          })
        },

        findOne: async (params: {
          id: string
          organizationId?: string
        }): Promise<Webhook | null> => {
          return context.providers.database.webhook.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
          })
        },

        create: async (input: CreateWebhookDTO): Promise<Webhook> => {
          return context.providers.database.webhook.create({
            data: {
              url: input.url,
              secret: input.secret,
              events: input.events,
              organizationId: input.organizationId,
            },
          })
        },

        update: async (params: UpdateWebhookDTO): Promise<Webhook> => {
          const webhook = await context.providers.database.webhook.findUnique({
            where: { id: params.id },
          })

          if (!webhook) throw new Error('Webhook not found')

          return context.providers.database.webhook.update({
            where: { id: params.id },
            data: {
              url: params.url,
              secret: params.secret,
              events: params.events,
            },
          })
        },

        delete: async (params: {
          id: string
          organizationId?: string
        }): Promise<{ id: string }> => {
          await context.providers.database.webhook.delete({
            where: { id: params.id, organizationId: params.organizationId },
          })

          return { id: params.id }
        },
      },
    }
  },
})
