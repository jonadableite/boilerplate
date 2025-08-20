import { igniter } from '@/igniter'
import type {
  Account,
  LinkAccountDTO,
  LinkAccountResponse,
  UnlinkAccountDTO,
} from '../account.interface'

export const AccountFeatureProcedure = igniter.procedure({
  name: 'AccountFeatureProcedure',
  handler: async (_, { context, request }) => {
    return {
      account: {
        findManyByCurrentUser: async (): Promise<Account[]> => {
          const accounts = await context.providers.auth.api.listUserAccounts({
            headers: request.headers,
          })

          return accounts
        },

        link: async (input: LinkAccountDTO): Promise<LinkAccountResponse> => {
          const account = await context.providers.auth.api.linkSocialAccount({
            headers: request.headers,
            body: input,
          })

          return account
        },

        unlink: async (input: UnlinkAccountDTO): Promise<void> => {
          await context.providers.auth.api.unlinkAccount({
            headers: request.headers,
            body: {
              providerId: input.provider,
            },
          })
        },
      },
    }
  },
})
