import { Button } from '@/components/ui/button'
import { CardTitle, CardDescription } from '@/components/ui/card'
import {
  CheckCircle2Icon,
  CircleIcon,
  MoveRight,
  Wallet2Icon,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { api } from '@/igniter.client'
import { getPrice } from '@/@saas-boilerplate/features/plan/presentation/utils/get-price'
import { Currency } from '@/@saas-boilerplate/utils'
import Link from 'next/link'

export async function SitePricingSection() {
  const plans = await api.plan.findMany.query()

  return (
    <div className="w-full py-16">
      <div className="container max-w-screen-md mx-auto">
        <div className="flex text-center justify-center items-center gap-6 flex-col">
          <div className="flex flex-col max-w-2xl">
            <Wallet2Icon
              className="size-10 mb-4 stroke-2 mx-auto text-primary"
              fill="currentColor"
              fillOpacity={0.15}
            />

            <h2 className="mx-auto w-full max-w-xl mb-2 text-balance text-center text-2xl font-semibold !leading-[1.2] tracking-tight sm:text-3xl md:text-4xl">
              Start for free, upgrade when you're ready
            </h2>
          </div>

          <div className="grid text-left grid-cols-1 lg:grid-cols-2 divide-x w-full border rounded-md">
            {plans.data?.map((plan) => {
              const price = getPrice(plan.prices, 'month')
              if (!price) return null

              return (
                <div key={plan.id} className="">
                  <header className="space-y-4 mb-4 p-6">
                    <div>
                      <CardTitle className="text-base font-medium">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {plan.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-medium">
                        {Currency.formatCurrency(price.amount, {
                          currency: price.currency,
                        })}
                      </span>
                      <span className="text-muted-foreground">{`/${price.interval}`}</span>
                    </div>
                  </header>
                  <main className="divide-y">
                    {plan.metadata.features.map((feature, i) => (
                      <div
                        key={i}
                        className={cn([
                          'flex flex-row items-center gap-4 py-4 px-6 text-xs',
                          !feature.enabled && 'text-muted-foreground',
                        ])}
                      >
                        {feature.enabled && (
                          <CheckCircle2Icon
                            className="size-4 text-primary"
                            fill="currentColor"
                            fillOpacity={0.2}
                          />
                        )}
                        {!feature.enabled && (
                          <CircleIcon
                            className="size-4 text-primary/40"
                            fill="currentColor"
                            fillOpacity={0.2}
                          />
                        )}
                        <p className="font-medium">{feature.description}</p>
                      </div>
                    ))}
                  </main>
                  <footer className="p-6 border-t">
                    <Button
                      variant="outline"
                      size="lg"
                      className={cn(
                        'w-full justify-between gap-2 rounded-md',
                        price.amount === 0 &&
                          'bg-primary text-primary-foreground',
                      )}
                      asChild
                    >
                      <Link href="/auth">
                        {price.amount === 0
                          ? 'Start for free'
                          : 'Try for 14 days'}{' '}
                        <MoveRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </footer>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
