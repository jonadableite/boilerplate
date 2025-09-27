import { PageBody, PageWrapper } from '@/components/ui/page'
import { SummarySection } from './(components)/summary-section'
import { WelcomeSection } from './(components)/welcome-section'
import { WelcomeDialog } from './(components)/welcome-dialog'
import { api } from '@/igniter.client'
import { GetStartedSection } from './(components)/get-started-card'
import { QuickActionsSection } from './(components)/quick-actions-section'
import { BillingTrialAlert } from '@/@saas-boilerplate/features/billing/presentation/components/billing-trial-alert'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Dashboard',
}

// Updated Loading Skeleton component - Removed third mobile column
function SummarySectionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Mobile Skeleton (2 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-4">
        <Skeleton className="h-12 w-1/3" />{' '}
        {/* Header Skel (Might reduce width slightly) */}
        <Skeleton className="h-[350px] w-full" /> {/* Chart Skel */}
      </div>
    </div>
  )
}

export default async function Page() {
  const stats = await (api.organization.stats as any).query()

  if (stats.error || !stats.data) {
    return (
      <PageWrapper>
        <PageBody className="pt-4 pb-28 md:py-8">
          <BillingTrialAlert />
          <div className="container max-w-screen-lg space-y-8">
            <div className="space-y-6 lg:space-y-0 flex lg:flex-row flex-col lg:justify-between lg:items-center">
              <WelcomeSection />
              <QuickActionsSection />
            </div>
            <SummarySectionSkeleton />
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageBody className="pt-16 pb-28 md:py-8">
        <BillingTrialAlert />
        <div className="container max-w-screen-lg space-y-8">
          <WelcomeDialog />
          <div className="space-y-6 lg:space-y-0 flex lg:flex-row flex-col lg:justify-between lg:items-center">
            <WelcomeSection />
            <QuickActionsSection />
          </div>
          {/* Updated props passed to SummarySection - Removed totalMembers */}
          <SummarySection
            // totalMembers={stats.data.totalMembers} // Removed
            totalLeads={stats.data.totalLeads}
            totalSubmissions={stats.data.totalSubmissions}
            chartData={stats.data.chartData}
            comparison={stats.data.comparison}
          />
          <GetStartedSection data={stats.data.onboarding} />
        </div>
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
