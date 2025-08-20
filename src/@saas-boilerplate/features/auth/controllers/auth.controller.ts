import { z } from 'zod'
import { igniter } from '@/igniter'
import { AuthFeatureProcedure } from '../procedures/auth.procedure'
import { AccountProvider } from '@/@saas-boilerplate/features/account'

export const AuthController = igniter.controller({
  name: 'auth',
  path: '/auth',
  actions: {
    signInWithProvider: igniter.mutation({
      method: 'POST',
      path: '/sign-in',
      use: [AuthFeatureProcedure()],
      body: z.object({
        provider: z.nativeEnum(AccountProvider),
        callbackURL: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.auth.signInWithProvider(request.body)

        if (result.error) {
          return response.error({
            code: result.error.code,
            message: result.error.message,
            status: 400,
          })
        }

        return response.success(result.data)
      },
    }),

    signInWithOTP: igniter.mutation({
      method: 'POST',
      path: '/sign-in/otp',
      use: [AuthFeatureProcedure()],
      body: z.object({
        email: z.string(),
        otpCode: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.auth.signInWithOTP(request.body)

        if (result.error) {
          return response.error({
            code: result.error.code,
            message: result.error.message,
            status: 400,
          })
        }

        return response.success(result.data)
      },
    }),

    sendOTPVerificationCode: igniter.mutation({
      method: 'POST',
      path: '/send-otp-verification',
      use: [AuthFeatureProcedure()],
      body: z.object({
        email: z.string(),
        type: z.enum(['sign-in', 'email-verification', 'forget-password']),
      }),
      handler: async ({ request, response, context }) => {
        await context.auth.sendOTPVerificationCode(request.body)
        return response.success({ email: request.body.email })
      },
    }),

    signOut: igniter.mutation({
      method: 'POST',
      path: '/sign-out',
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        await context.auth.signOut()
        return response.success({ callbackURL: '/' })
      },
    }),

    getSession: igniter.query({
      method: 'GET',
      path: '/session',
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const result = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })
        if (!result) return response.success(null)
        return response.success(result)
      },
    }),

    setActiveOrganization: igniter.mutation({
      method: 'POST',

      path: '/set-active-organization',
      use: [AuthFeatureProcedure()],
      body: z.object({
        organizationId: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        await context.auth.setActiveOrganization(request.body)
        return response.success({ organizationId: request.body.organizationId })
      },
    }),
  },
})
