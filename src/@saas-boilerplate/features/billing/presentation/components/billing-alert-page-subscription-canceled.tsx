'use client'

import { BillingAlertPage } from './billing-alert-page'
import { Ban } from 'lucide-react'

export function BillingAlertPageSubscriptionCanceledView() {
  return (
    <BillingAlertPage>
      <BillingAlertPage.Header />
      <BillingAlertPage.Content>
        <BillingAlertPage.Icon>
          <Ban className="w-6 h-6 text-destructive" />
        </BillingAlertPage.Icon>
        <BillingAlertPage.Title>Subscription Canceled</BillingAlertPage.Title>
        <BillingAlertPage.Description>
          Your subscription has been canceled. Contact us to reactivate or
          migrate your plan.
        </BillingAlertPage.Description>
        <BillingAlertPage.Actions>
          <BillingAlertPage.SupportAction />
        </BillingAlertPage.Actions>
      </BillingAlertPage.Content>
      <BillingAlertPage.Footer />
    </BillingAlertPage>
  )
}
