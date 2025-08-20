import { igniter } from '@/igniter'

export const SessionFeatureProcedure = igniter.procedure({
  name: 'SessionFeatureProcedure',
  handler: async (_, { context, request }) => {
    return {
      session: {
        findMany: async () => {
          return context.providers.auth.api.listSessions({
            headers: request.headers,
          })
        },
        revoke: async (token: string) => {
          return context.providers.auth.api.revokeSession({
            headers: request.headers,
            body: {
              token,
            },
          })
        },
      },
    }
  },
})
