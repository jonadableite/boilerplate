import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { emailOTP, organization, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mail } from "./mail";
import { Url } from "@/@saas-boilerplate/utils";
import { AppConfig } from "@/boilerplate.config";
import type { Prettify } from "@igniter-js/core";
import type { Organization } from "@/@saas-boilerplate/features/organization";
import type { Membership } from "@/@saas-boilerplate/features/membership";
import type { Invitation } from "@/@saas-boilerplate/features/invitation";

export const auth = betterAuth({
  appName: AppConfig.name,
  baseURL: AppConfig.url,

  secret: process.env.BETTER_AUTH_SECRET || AppConfig.providers.auth.secret,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },

  socialProviders: {
    github: {
      clientId: AppConfig.providers.auth.providers.github.clientId,
      clientSecret: AppConfig.providers.auth.providers.github.clientSecret,
    },
    google: {
      clientId: AppConfig.providers.auth.providers.google.clientId,
      clientSecret: AppConfig.providers.auth.providers.google.clientSecret,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
    },
  },

  plugins: [
    nextCookies(),
    twoFactor(),
    organization({
      sendInvitationEmail: async ({ email, organization, id }) => {
        await mail.send({
          to: email,
          template: "organization-invite",
          data: {
            email,
            organization: organization.name,
            url: Url.get(`/auth?invitation=${id}`),
          },
        });
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Define subject based on OTP type using object mapping
        const subjectMap = {
          "sign-in": "Your Access Code",
          "email-verification": "Verify Your Email",
          "forget-password": "Password Recovery",
          default: "Verification Code",
        };

        const subject = subjectMap[type] || subjectMap.default;

        // Send the email with the OTP code
        await mail.send({
          to: email,
          subject,
          template: "otp-code",
          data: {
            email,
            otpCode: otp,
            expiresInMinutes: 10, // Default expiration time
          },
        });
      },
    }),
  ],
});

/**
 * @description The session of the application
 */
export type AuthSession = typeof auth.$Infer.Session;
export type AuthOrganization = Prettify<
  Organization & {
    members: Prettify<
      Membership & {
        user: {
          id: string;
          name: string;
          email: string;
          image?: string | null;
        };
      }
    >[];
    invitations: Invitation[];
  }
>;
