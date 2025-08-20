'use client'

import { BillingAlertPage } from './billing-alert-page'
import { Clock } from 'lucide-react'
import { AppConfig } from '@/boilerplate.config'
import { BillingUpgradeModal } from './billing-upgrade-modal'

export function BillingAlertPageTrialExpiredView() {
  return (
    <BillingAlertPage>
      <BillingAlertPage.Header />
      <BillingAlertPage.Content>
        <BillingAlertPage.Icon>
          <Clock className="w-6 h-6 text-warning" />
        </BillingAlertPage.Icon>
        <BillingAlertPage.Title>Trial Expired</BillingAlertPage.Title>
        <BillingAlertPage.Description>
          Your account trial period has expired. Choose a plan to continue using
          the service.
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
