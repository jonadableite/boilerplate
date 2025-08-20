'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { ArrowUpRightIcon } from 'lucide-react'
import { BillingUpgradeModal } from './billing-upgrade-modal'

export function BillingTrialAlert() {
  const { session } = useAuth()

  if (session.organization?.billing.subscription?.status !== 'trialing')
    return null

  return (
    <div className="border-b py-2 bg-secondary/30">
      <div className="container max-w-screen-lg ">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm">
          <span>
            Your free trial ends in{' '}
            <span className="font-bold text-primary">
              {session.organization?.billing.subscription?.trialDays} days
            </span>
            .
          </span>
          <BillingUpgradeModal>
            <Button variant="ghost">
              Upgrade Now <ArrowUpRightIcon />
            </Button>
          </BillingUpgradeModal>
        </div>
      </div>
    </div>
  )
}
