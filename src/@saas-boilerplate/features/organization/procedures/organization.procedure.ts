import { igniter } from "@/igniter";
import { randomUUID } from "crypto";

import {
  type Organization,
  type CreateOrganizationDTO,
  type UpdateOrganizationDTO,
  type OrganizationMetadata,
  OrganizationMetadataSchema,
} from "../organization.interface";
import { updateMetadataSafe } from "@/utils/update-metadata";
import { parseMetadata } from "@/utils/parse-metadata";
import { createDemoDataForOrganization } from "../presentation/utils/create-organization-demo-data";
import { tryCatch } from "@/@saas-boilerplate/utils";

// Helper: format date as MM/DD
const formatDate = (date: Date) => {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m.toString().padStart(2, "0")}/${d.toString().padStart(2, "0")}`;
};

export const OrganizationFeatureProcedure = igniter.procedure({
  name: "OrganizationFeatureProcedure",
  handler: async (_, { context, request }) => {
    return {
      organization: {
        getStats: async ({ organizationId }: { organizationId: string }) => {
          const orgId = organizationId;
          if (!orgId) throw new Error("Active organization ID not found");

          // --- Date Setup ---
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today

          const currentPeriodEnd = new Date(today);
          const currentPeriodStart = new Date(today);
          currentPeriodStart.setDate(currentPeriodStart.getDate() - 29); // Go back 29 days (total 30 days including today)
          currentPeriodStart.setHours(0, 0, 0, 0); // Start of that day

          const previousPeriodEnd = new Date(currentPeriodStart);
          previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1); // Day before current period starts
          previousPeriodEnd.setHours(23, 59, 59, 999); // End of that day

          const previousPeriodStart = new Date(previousPeriodEnd);
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 29); // Go back 29 days (total 30 days)
          previousPeriodStart.setHours(0, 0, 0, 0); // Start of that day

          // --- Data Fetching (Removed totalMembers) + para Onboarding ---
          // Fetch organization data (logo, id), members, integrations, subscription
          const [
            organization,
            members,
            integrations,
            subscriptions,
            currentLeads,
            previousLeads,
            currentSubs,
            previousSubs,
          ] = await Promise.all([
            context.providers.database.organization.findUnique({
              where: { id: orgId },
              select: { logo: true, id: true },
            }),
            context.providers.database.member.findMany({
              where: { organizationId: orgId },
            }),
            context.providers.database.integration.findMany({
              where: { organizationId: orgId, enabled: true },
            }),
            context.providers.database.subscription.findMany({
              where: { customer: { organizationId: orgId }, status: "active" },
            }),
            // Current Period Leads
            context.providers.database.lead.findMany({
              where: {
                organizationId: orgId,
                createdAt: { gte: currentPeriodStart, lte: currentPeriodEnd },
              },
              select: { createdAt: true },
            }),
            // Previous Period Leads
            context.providers.database.lead.findMany({
              where: {
                organizationId: orgId,
                createdAt: {
                  gte: previousPeriodStart,
                  lte: previousPeriodEnd,
                },
              },
              select: { createdAt: true },
            }),
            // Current Period Submissions
            context.providers.database.submission.findMany({
              where: {
                organizationId: orgId,
                createdAt: { gte: currentPeriodStart, lte: currentPeriodEnd },
              },
              select: { createdAt: true },
            }),
            // Previous Period Submissions
            context.providers.database.submission.findMany({
              where: {
                organizationId: orgId,
                createdAt: {
                  gte: previousPeriodStart,
                  lte: previousPeriodEnd,
                },
              },
              select: { createdAt: true },
            }),
            // Total Members Query Removed
            // context.providers.database.member.count({
            //   where: { organizationId: orgId },
            // }),
          ]);

          // --- Calculations ---
          const totalCurrentLeads = currentLeads.length;
          const totalPreviousLeads = previousLeads.length;
          const totalCurrentSubs = currentSubs.length;
          const totalPreviousSubs = previousSubs.length;

          const leadsComparison =
            totalPreviousLeads > 0
              ? ((totalCurrentLeads - totalPreviousLeads) /
                  totalPreviousLeads) *
                100
              : totalCurrentLeads > 0
                ? 100 // If previous was 0 and current is > 0, it's a 100% increase (or infinite, but 100% makes sense)
                : 0; // If both are 0, no change
          const submissionsComparison =
            totalPreviousSubs > 0
              ? ((totalCurrentSubs - totalPreviousSubs) / totalPreviousSubs) *
                100
              : totalCurrentSubs > 0
                ? 100 // If previous was 0 and current is > 0, it's a 100% increase
                : 0; // If both are 0, no change

          // --- Onboarding Logic ---
          const onboardingSteps = [
            {
              key: "createBrand",
              finished: !!organization?.logo,
            },
            {
              key: "inviteMembers",
              finished: (members?.length ?? 0) > 1,
            },
            {
              key: "configureIntegrations",
              finished: (integrations?.length ?? 0) > 0,
            },
            {
              key: "upgradePlan",
              finished: (subscriptions?.length ?? 0) > 0,
            },
          ];
          const onboardingCompleted = onboardingSteps.filter(
            (s) => s.finished,
          ).length;
          const onboarding = {
            completed: onboardingCompleted,
            total: onboardingSteps.length,
            steps: onboardingSteps,
          };

          // --- Chart Data Preparation ---
          const leadsChart: Array<{ date: string; totalLeads: number }> = [];
          const submissionsChart: Array<{
            date: string;
            generatedSubmissions: number;
          }> = [];

          // Create a map for quick lookup
          const dailyLeadsMap = new Map<string, number>();
          currentLeads.forEach((lead: any) => {
            const dayStr = formatDate(new Date(lead.createdAt));
            dailyLeadsMap.set(dayStr, (dailyLeadsMap.get(dayStr) || 0) + 1);
          });

          const dailySubsMap = new Map<string, number>();
          currentSubs.forEach((sub: { createdAt: string | number | Date }) => {
            const dayStr = formatDate(new Date(sub.createdAt));
            dailySubsMap.set(dayStr, (dailySubsMap.get(dayStr) || 0) + 1);
          });

          // Populate chart arrays for the last 30 days
          for (
            let iterDate = new Date(currentPeriodStart);
            // eslint-disable-next-line no-unmodified-loop-condition
            iterDate <= currentPeriodEnd;
            iterDate.setDate(iterDate.getDate() + 1)
          ) {
            const day = new Date(iterDate);
            const dayStr = formatDate(day);

            leadsChart.push({
              date: dayStr,
              totalLeads: dailyLeadsMap.get(dayStr) || 0,
            });
            submissionsChart.push({
              date: dayStr,
              generatedSubmissions: dailySubsMap.get(dayStr) || 0,
            });
          }

          // --- Return Structure ---
          return {
            totalLeads: totalCurrentLeads,
            totalSubmissions: totalCurrentSubs,
            chartData: {
              leads: leadsChart,
              submissions: submissionsChart,
            },
            comparison: {
              leads: leadsComparison,
              submissions: submissionsComparison,
            },
            onboarding,
          };
        },

        create: async (input: CreateOrganizationDTO): Promise<Organization> => {
          input.metadata.options = {};
          input.metadata.options.has_demo_data = !!input.withDemoData;

          const createdOrganization =
            await context.providers.database.organization.create({
              data: {
                id: randomUUID(),
                name: input.name,
                slug: input.slug,
                logo: input.logo,
                metadata: JSON.stringify(input.metadata),
                createdAt: new Date(),
                members: {
                  create: {
                    userId: input.userId,
                    role: "owner",
                  },
                },
              },
            });

          await context.providers.auth.api.setActiveOrganization({
            headers: request.headers,
            body: { organizationId: createdOrganization.id },
          });

          await tryCatch(
            Promise.all([
              context.providers.payment.createCustomer({
                name: createdOrganization.name,
                email: input.metadata?.contact?.email as string,
                referenceId: createdOrganization.id,
              }),
              input.withDemoData &&
                createDemoDataForOrganization(createdOrganization.id, context),
            ]),
          );

          return {
            id: createdOrganization.id,
            name: createdOrganization.name,
            slug: createdOrganization.slug as string,
            logo: createdOrganization.logo,
            metadata: parseMetadata<OrganizationMetadata>(
              createdOrganization.metadata,
            ),
          };
        },

        update: async (
          params: UpdateOrganizationDTO,
        ): Promise<Organization> => {
          const organization =
            await context.providers.database.organization.findUnique({
              where: { id: params.id },
            });

          if (!organization) throw new Error("Organization not found");

          if (params.metadata) {
            await updateMetadataSafe("organization", {
              field: "metadata",
              where: { id: organization.id },
              data: params.metadata,
              schema: OrganizationMetadataSchema,
            });
          }

          // Update other fields first
          await context.providers.database.organization.update({
            where: { id: params.id },
            data: {
              name: params.name,
              slug: params.slug,
              logo: params.logo,
            },
          });

          // Re-fetch the organization to get the final state including potentially updated metadata
          const finalOrganization =
            await context.providers.database.organization.findUnique({
              where: { id: params.id },
            });

          if (!finalOrganization)
            throw new Error("Organization disappeared after update"); // Should not happen

          return {
            id: finalOrganization.id,
            name: finalOrganization.name,
            slug: finalOrganization.slug as string,
            logo: finalOrganization.logo,
            metadata: parseMetadata<OrganizationMetadata>(
              finalOrganization.metadata,
            ), // Return parsed metadata from final state
          };
        },

        verify: async (params: { slug: string }): Promise<boolean> => {
          const organization =
            await context.providers.database.organization.findUnique({
              where: { slug: params.slug },
            });

          return organization === null;
        },

        delete: async (params: { id: string }): Promise<{ id: string }> => {
          await context.providers.database.organization.delete({
            where: { id: params.id },
          });

          return { id: params.id };
        },

        getBySlug: async (params: {
          slug: string;
        }): Promise<Organization | null> => {
          const organization =
            await context.providers.database.organization.findUnique({
              where: { slug: params.slug },
            });

          if (!organization) return null;

          return {
            id: organization.id,
            name: organization.name,
            slug: organization.slug as string,
            logo: organization.logo,
            metadata: parseMetadata<OrganizationMetadata>(
              organization.metadata,
            ),
          };
        },
      },
    };
  },
});
