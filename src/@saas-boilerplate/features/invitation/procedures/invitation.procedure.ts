import { igniter } from '@/igniter'
import type { Invitation, CreateInvitationDTO } from '../invitation.interface'
import { tryCatch, Url } from '@/@saas-boilerplate/utils'

export const InvitationFeatureProcedure = igniter.procedure({
  name: 'InvitationFeatureProcedure',
  handler: async (_, { context, request }) => {
    return {
      invitation: {
        create: async (input: CreateInvitationDTO): Promise<Invitation> => {
          const createdInvite =
            await context.providers.auth.api.createInvitation({
              headers: request.headers,
              body: {
                email: input.email,
                role: input.role,
              },
            })

          const organization =
            await context.providers.database.organization.findUnique({
              where: {
                id: createdInvite.organizationId,
              },
            })

          if (!organization) {
            throw new Error('Organization not found')
          }

          await context.providers.mail.send({
            to: input.email,
            template: 'organization-invite',
            data: {
              email: input.email,
              organization: organization.name,
              url: Url.get(`/app/organization/${organization.id}`),
            },
          })

          return createdInvite
        },

        cancel: async (invitationId: string): Promise<void> => {
          await context.providers.auth.api.cancelInvitation({
            headers: request.headers,
            body: {
              invitationId,
            },
          })
        },

        findOne: async (invitationId: string) => {
          const invite = await tryCatch(
            context.providers.auth.api.getInvitation({
              headers: request.headers,
              query: {
                id: invitationId,
              },
            }),
          )

          console.log(invite)

          if (!invite) {
            return null
          }

          return invite.data
        },

        accept: async (invitationId: string): Promise<void> => {
          await context.providers.auth.api.acceptInvitation({
            headers: request.headers,
            body: {
              invitationId,
            },
          })
        },

        reject: async (invitationId: string): Promise<void> => {
          await context.providers.auth.api.rejectInvitation({
            headers: request.headers,
            body: {
              invitationId,
            },
          })
        },
      },
    }
  },
})
