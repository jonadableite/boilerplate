'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Annotated } from '@/components/ui/annotated'
import { RefreshCcwIcon } from 'lucide-react'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'

export function BillingCurrentUsageSection() {
  const auth = useAuth()

  const orgBilling = auth.session.organization?.billing
  if (!orgBilling) return null

  const currentPlan = orgBilling.subscription?.plan

  return (
    <Annotated>
      <Annotated.Sidebar>
        <Annotated.Icon>
          <RefreshCcwIcon className="w-4 h-4" />
        </Annotated.Icon>
        <Annotated.Title>Usage Cycle</Annotated.Title>
        <Annotated.Description>
          This is your current usage for the <u>{currentPlan?.name}</u> plan.
        </Annotated.Description>
      </Annotated.Sidebar>
      <Annotated.Content>
        <Annotated.Section>
          <Card>
            <CardContent className="p-0">
              {auth.session.organization?.billing.subscription?.usage.map(
                (item) => (
                  <div
                    key={item.slug}
                    className="p-4 gap-4 items-center border-b last:border-b-0"
                  >
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-between text-xs">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.usage} of {item.limit} used
                        </span>
                      </div>
                      <Progress
                        value={(item.usage / item.limit) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        </Annotated.Section>
      </Annotated.Content>
    </Annotated>
  )
}
