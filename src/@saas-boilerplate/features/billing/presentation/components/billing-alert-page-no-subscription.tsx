'use client'

import { BillingAlertPage } from './billing-alert-page'
import { Ban } from 'lucide-react'
import { AppConfig } from '@/boilerplate.config'
import { BillingUpgradeModal } from './billing-upgrade-modal'

export function BillingAlertPageNoSubscription() {
  return (
    <BillingAlertPage>
      <BillingAlertPage.Header />
      <BillingAlertPage.Content>
        <BillingAlertPage.Icon>
          <Ban className="w-6 h-6 text-destructive" />
        </BillingAlertPage.Icon>
        <BillingAlertPage.Title>No Active Subscription</BillingAlertPage.Title>
        <BillingAlertPage.Description>
          You are not currently subscribed to any plan.
        </BillingAlertPage.Description>
        <BillingAlertPage.Actions>
          <BillingUpgradeModal>
            <BillingAlertPage.PrimaryAction>
              Subscribe Now
            </BillingAlertPage.PrimaryAction>
          </BillingUpgradeModal>
          <BillingAlertPage.SupportAction mail={AppConfig.links.mail} />
        </BillingAlertPage.Actions>
      </BillingAlertPage.Content>
      <BillingAlertPage.Footer />
    </BillingAlertPage>
  )
}
