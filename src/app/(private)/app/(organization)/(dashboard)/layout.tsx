import type { PropsWithChildren } from 'react'
import { api } from '@/igniter.client'
import { redirect } from 'next/navigation'
import { Onborda, OnbordaProvider } from 'onborda'
import { TourCard } from '@/components/ui/tour-card'
import { DashboardMainSidebar } from '@/components/layouts/dashboard/dashboard-main-sidebar'
import { WELCOME_TOUR } from '@/content/guides/welcome.tour'
import { DashboardMobileNavMenu } from '@/components/layouts/dashboard/dashboard-mobile-nav-menu'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'

export default async function Layout({ children }: PropsWithChildren) {
  // Business Rule: Get the current session
  const session = await (api.auth.getSession as any).query()

  // Business Rule: If the user is not authenticated, redirect to the login page
  if (session.error || !session.data) redirect('/auth')

  // Business Rule: If the user has not completed the onboarding process, redirect to the get started page
  if (!session.data.organization) redirect('/app/get-started')

  const subscription = session.data.organization.billing.subscription
  const isTrial = subscription?.status === 'trialing'
  const isTrialExpired = isTrial && subscription?.trialDays === 0
  const isPaymentOverdue = subscription?.status === 'past_due'
  const isCanceled = subscription?.status === 'canceled' || !subscription

  if (!subscription || isTrialExpired || isPaymentOverdue || isCanceled) {
    redirect('/app/upgrade')
  }

  return (
    <OnbordaProvider>
      <Onborda
        steps={[WELCOME_TOUR]}
        showOnborda={true}
        cardComponent={TourCard}
        cardTransition={{ duration: 0.6, type: 'tween' }}
      >
        <div className="grid md:grid-cols-[auto_1fr] relative dark:bg-background">
          <DashboardMainSidebar className="sticky top-0" />
          <main className="md:p-4 md:pl-0">{children}</main>
        </div>
        <DashboardMobileNavMenu />
      </Onborda>
    </OnbordaProvider>
  )
}
