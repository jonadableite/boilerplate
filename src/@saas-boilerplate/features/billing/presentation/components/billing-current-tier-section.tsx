'use client'

import { Annotated } from '@/components/ui/annotated'
import {
  Calendar1Icon,
  ArrowUpRightIcon,
  CrownIcon,
  HelpCircleIcon,
  RefreshCcwIcon,
} from 'lucide-react'
import { BillingUpgradeModal } from './billing-upgrade-modal'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'

export function CurrentTierSection() {
  const auth = useAuth()

  const orgBilling = auth.session.organization?.billing
  if (!orgBilling) return null

  const currentPlan = orgBilling.subscription?.plan
  const currentPrice = orgBilling.subscription?.plan.price

  // Calculate billing cycle dates
  const calculateBillingCycleDates = (createdAt: Date) => {
    const startDate = new Date(createdAt)
    const endDate = new Date(createdAt)

    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(endDate.getDate() - 1)

    return {
      start: startDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
      }),
      end: endDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
      }),
      nextBilling: endDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
      }),
    }
  }

  const billingDates = calculateBillingCycleDates(
    new Date(orgBilling.subscription?.createdAt || new Date()),
  )

  return (
    <Annotated>
      <Annotated.Sidebar>
        <Annotated.Icon>
          <CrownIcon className="w-4 h-4" />
        </Annotated.Icon>
        <Annotated.Title>Current Plan</Annotated.Title>
        <Annotated.Description>
          You are currently on the <u>{currentPlan?.name}</u> plan.
        </Annotated.Description>
      </Annotated.Sidebar>
      <Annotated.Content>
        <Annotated.Section>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Plan {currentPlan?.name}</CardTitle>
                <CardDescription>
                  {currentPrice?.amount === 0
                    ? 'Free'
                    : `${currentPrice?.amount} / ${currentPrice?.interval}`}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Billing</p>
                  <div className="merge-form-section">
                    <div className="!px-3 py-2 text-sm flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RefreshCcwIcon className="size-3 mr-1" />
                        <span>
                          Current cycle {billingDates.start} -{' '}
                          {billingDates.end}
                        </span>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="!ml-2 !size-6 rounded-full"
                      >
                        <HelpCircleIcon />
                      </Button>
                    </div>
                    <div className="!px-3 py-2 text-sm flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar1Icon className="size-3 mr-1" />
                        <span>Next charge on {billingDates.nextBilling}</span>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="!ml-2 !size-6 rounded-full"
                      >
                        <HelpCircleIcon />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <BillingUpgradeModal>
                <Button size="sm">
                  Upgrade Plan
                  <ArrowUpRightIcon />
                </Button>
              </BillingUpgradeModal>
            </CardFooter>
          </Card>
        </Annotated.Section>
      </Annotated.Content>
    </Annotated>
  )
}
