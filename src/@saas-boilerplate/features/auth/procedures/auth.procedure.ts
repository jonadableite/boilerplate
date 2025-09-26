import { igniter } from "@/igniter";
import { tryCatch, Url } from "@/@saas-boilerplate/utils";

import type {
  AppSession,
  AuthRequirements,
  GetSessionInput,
  OrganizationMembershipRole,
  SendVerificationOTPInput,
  SignInInput,
} from "../auth.interface";

export const AuthFeatureProcedure = igniter.procedure({
  name: "AuthFeatureProcedure",
  handler: async (options, { request, context }) => {
    return {
      auth: {
        setActiveOrganization: async (input: { organizationId: string }) => {
          await tryCatch(
            context.providers.auth.api.setActiveOrganization({
              body: input,
              headers: request.headers,
            }),
          );
        },

        listSession: async () => {
          return tryCatch(
            context.providers.auth.api.listSessions({
              headers: request.headers,
            }),
          );
        },

        signInWithProvider: async (input: SignInInput) => {
          const response = await tryCatch(
            context.providers.auth.api.signInSocial({
              headers: request.headers,
              body: {
                provider: input.provider,
                callbackURL: Url.get("/auth"),
                newUserCallbackURL: Url.get("/get-started"),
                errorCallbackURL: Url.get("/auth?error=true"),
              },
            }),
          );

          if (response.error) {
            return {
              error: {
                code: "ERR_BAD_REQUEST",
                message: response.error.message,
              },
            };
          }

          return {
            data: {
              redirect: true,
              url: (response.data as any).url,
            },
          };
        },

        signInWithOTP: async (input: { email: string; otpCode: string }) => {
          const response = await tryCatch(
            context.providers.auth.api.signInEmailOTP({
              headers: request.headers,
              body: {
                email: input.email,
                otp: input.otpCode,
              },
            }),
          );

          if (response.error) {
            return {
              error: {
                code: "ERR_BAD_REQUEST",
                message: response.error.message,
              },
            };
          }

          return {
            data: {
              success: true,
            },
          };
        },

        sendOTPVerificationCode: async (input: SendVerificationOTPInput) => {
          await tryCatch(
            context.providers.auth.api.sendVerificationOTP({
              headers: request.headers,
              body: input,
            }),
          );
        },

        signOut: async () => {
          await tryCatch(
            context.providers.auth.api.signOut({
              headers: request.headers,
            }),
          );
        },

        getSession: async <
          TRequirements extends AuthRequirements | undefined = undefined,
          TRoles extends OrganizationMembershipRole[] | undefined = undefined,
        >(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          options?: GetSessionInput<TRequirements, TRoles>,
        ): Promise<AppSession<TRequirements, TRoles>> => {
          const session = await context.providers.auth.api.getSession({
            headers: request.headers,
          });

          if (!session) {
            // @ts-expect-error - This is a hack to make TypeScript happy
            return null;
          }

          const user = await context.providers.database.user.findUnique({
            where: { id: session.user.id },
          });

          if (!user) {
            // @ts-expect-error - This is a hack to make TypeScript happy
            return null;
          }

          let organization =
            await context.providers.auth.api.getFullOrganization({
              headers: request.headers,
            });

          if (!organization) {
            const userOrganizations =
              await context.providers.auth.api.listOrganizations({
                headers: request.headers,
              });

            if (userOrganizations.length > 0) {
              await context.providers.auth.api.setActiveOrganization({
                body: { organizationId: userOrganizations[0].id },
                headers: request.headers,
              });

              organization =
                await context.providers.auth.api.getFullOrganization({
                  query: { organizationId: userOrganizations[0].id },
                  headers: request.headers,
                });
            }
          }

          if (!organization) {
            // @ts-expect-error - This is a hack to make TypeScript happy
            return {
              session: session.session,
              user,
              organization: null,
              membership: null,
            };
          }

          // Parse metadata
          organization.metadata = organization.metadata
            ? JSON.parse(organization.metadata)
            : {};

          // Get active membership
          const membership = await context.providers.auth.api.getActiveMember({
            headers: request.headers,
          });

          // Get current org billing
          const billing = await context.providers.payment.getCustomerById(
            organization.id,
          );

          // @ts-expect-error - This is a hack to make TypeScript happy
          return {
            session: session.session,
            user,
            organization: {
              ...organization,
              billing,
            },
            membership,
          };
        },
      },
    };
  },
});
