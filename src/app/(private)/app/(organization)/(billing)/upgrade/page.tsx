import { api } from '@/igniter.client'
import { BillingAlertPageNoSubscription } from '@/@saas-boilerplate/features/billing/presentation/components/billing-alert-page-no-subscription'
import { BillingAlertPagePaymentOverdue } from '@/@saas-boilerplate/features/billing/presentation/components/billing-alert-page-payment-overdue'
import { BillingAlertPageSubscriptionCanceledView } from '@/@saas-boilerplate/features/billing/presentation/components/billing-alert-page-subscription-canceled'
import { BillingAlertPageTrialExpiredView } from '@/@saas-boilerplate/features/billing/presentation/components/billing-alert-page-trial-expired-view'
import { redirect } from 'next/navigation'

export default async function UpgradePage() {
  const session = await (api.auth.getSession as any).query()

  if (!session.data) redirect('/auth')

  const subscription = session.data.organization.billing.subscription

  if (!subscription) return <BillingAlertPageNoSubscription />

  const isTrial = subscription?.status === 'trialing'
  const isTrialExpired = isTrial && subscription?.trialDays === 0
  const isPaymentOverdue = subscription?.status === 'past_due'
  const isCanceled = subscription?.status === 'canceled' || !subscription

  if (isTrialExpired) return <BillingAlertPageTrialExpiredView />
  if (isPaymentOverdue) return <BillingAlertPagePaymentOverdue />
  if (isCanceled) return <BillingAlertPageSubscriptionCanceledView />

  return redirect('/app')
}
