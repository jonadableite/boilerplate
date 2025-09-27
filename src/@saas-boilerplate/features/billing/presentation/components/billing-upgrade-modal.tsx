'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { api } from '@/igniter.client'
import { CheckIcon, ArrowRightIcon } from 'lucide-react'
import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { cn } from '@/utils/cn'
import { Currency } from '@/@saas-boilerplate/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Plan, Price } from '@/@saas-boilerplate/providers/payment/types'
import { toast } from 'sonner'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { Badge } from '@/components/ui/badge'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { AppConfig } from '@/boilerplate.config'

// Animation component for prices
type BillingUpgradeModalAnimatedPriceProps = {
  amount: number | undefined
  interval: 'month' | 'year'
}

function BillingUpgradeModalAnimatedPrice({
  amount = 0,
  interval,
}: BillingUpgradeModalAnimatedPriceProps) {
  return (
    <div className="flex items-center">
      <motion.div
        key={`${amount}-${interval}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center"
      >
        <strong>{Currency.formatCurrency(amount)}</strong>
        <span className="text-muted-foreground"> / {interval}</span>
      </motion.div>
    </div>
  )
}

// Animation component for feature limit numbers
type BillingUpgradeModalAnimatedNumberProps = {
  value: number
  duration?: number
}

function BillingUpgradeModalAnimatedNumber({
  value,
  duration = 0.5,
}: BillingUpgradeModalAnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  // Count animation
  return (
    <motion.strong
      className="mr-1"
      // @ts-expect-error value is not a valid prop
      initial={{ value: 0 }}
      // @ts-expect-error value is not a valid prop
      animate={{ value }}
      transition={{ duration }}
      onUpdate={({ value: v }) => {
        setDisplayValue(Math.round(v as number))
      }}
    >
      {Currency.formatNumber(displayValue)}
    </motion.strong>
  )
}

// Sub-component: Modal header
function BillingUpgradeModalHeader() {
  return (
    <SheetHeader className="space-y-4">
      <SheetTitle className="text-sm">Upgrade Plan</SheetTitle>
    </SheetHeader>
  )
}

// Sub-component: Plan selector
type BillingUpgradeModalPlanSelectorProps = {
  plans: Plan[]
  selectedPlan: Plan | null
  isYearlyBilling: boolean
  onSelectPlan: (plan: Plan) => void
}

function BillingUpgradeModalPlanSelector({
  plans,
  selectedPlan,
  isYearlyBilling,
  onSelectPlan,
}: BillingUpgradeModalPlanSelectorProps) {
  const auth = useAuth()
  const trialSettings = AppConfig.providers.billing.subscription.trial

  return (
    <div className="merge-form-section overflow-hidden text-sm">
      {plans?.map((plan) => {
        const isSelected = selectedPlan?.id === plan.id
        const isCurrentPlan =
          auth.session.organization?.billing.subscription?.plan.id === plan.id

        const monthlyPrice = plan.prices.find(
          (price) => price.interval === 'month',
        )
        const yearlyPrice = plan.prices.find(
          (price) => price.interval === 'year',
        )

        const isFreePlan =
          monthlyPrice?.amount === 0 && yearlyPrice?.amount === 0

        return (
          <motion.button
            key={plan.id}
            disabled={isCurrentPlan}
            className={cn(
              'p-4 w-full flex items-center justify-between rounded-sm border-l-4',
              isSelected && 'bg-secondary border-l-primary',
              !isSelected && 'border-l-transparent hover:bg-secondary/20',
              isCurrentPlan && 'opacity-50 pointer-events-none',
            )}
            onClick={() => onSelectPlan(plan)}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <span className={cn(isSelected && 'font-medium')}>
                {plan.name}
              </span>

              {!isCurrentPlan && !isFreePlan && trialSettings.enabled && (
                <Badge className="ml-2" variant="outline">
                  Try for {trialSettings.duration} days
                </Badge>
              )}

              {isCurrentPlan && (
                <Badge className="ml-2" variant="outline">
                  Current
                </Badge>
              )}
            </div>
            <AnimatePresence mode="wait">
              <div>
                {isYearlyBilling ? (
                  <BillingUpgradeModalAnimatedPrice
                    key="yearly"
                    amount={yearlyPrice?.amount}
                    interval="year"
                  />
                ) : (
                  <BillingUpgradeModalAnimatedPrice
                    key="monthly"
                    amount={monthlyPrice?.amount}
                    interval="month"
                  />
                )}
              </div>
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}

// Sub-component: Annual/monthly billing toggle
type BillingUpgradeModalBillingToggleProps = {
  isYearlyBilling: boolean
  onToggle: (isYearly: boolean) => void
}

function BillingUpgradeModalBillingToggle({
  isYearlyBilling,
  onToggle,
}: BillingUpgradeModalBillingToggleProps) {
  return (
    <div className="border border-dotted text-sm rounded-md p-4 space-y-1">
      <header className="flex items-center justify-between">
        <h3 className="font-bold">Get 2 months on your current plan.</h3>
        <Switch checked={isYearlyBilling} onCheckedChange={onToggle} />
      </header>
      <main>
        <p className="text-muted-foreground">
          Choose the annual plan and get two free months of your plan.
        </p>
      </main>
    </div>
  )
}

// Sub-component: Selected plan details
type BillingUpgradeModalPlanDetailsProps = {
  plan: Plan | null
  isFirstLoad: boolean
}

function BillingUpgradeModalPlanDetails({
  plan,
  isFirstLoad,
}: BillingUpgradeModalPlanDetailsProps) {
  if (!plan) return null

  return (
    <div className="space-y-8">
      <header className="space-y-4 flex flex-col text-center sm:text-left h-[5rem]">
        <motion.h2
          className="text-sm"
          key={plan.name}
          initial={isFirstLoad ? {} : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {plan.name}
        </motion.h2>
        <motion.p
          key={`${plan.id}-desc`}
          initial={isFirstLoad ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {plan.description}
        </motion.p>
      </header>

      <main>
        <motion.ul
          className="merge-form-section text-sm"
          initial={isFirstLoad ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {plan.metadata?.features?.map((feature, index) => (
            <motion.li
              key={feature.slug}
              className="p-2 flex items-center space-x-4"
              initial={isFirstLoad ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1 + index * 0.05,
                }}
              >
                <CheckIcon className="size-3 text-green-500" />
              </motion.span>
              <span>
                {feature.limit ? (
                  <BillingUpgradeModalAnimatedNumber value={feature.limit} />
                ) : null}
                {feature.name}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </main>
    </div>
  )
}

// Sub-component: Upgrade button
type BillingUpgradeModalUpgradeButtonProps = {
  selectedPlan: Plan | null
  activePrice: Price | null
}

function BillingUpgradeModalUpgradeButton({
  selectedPlan,
  activePrice,
}: BillingUpgradeModalUpgradeButtonProps) {
  const handleCreateCheckoutSession = async () => {
    const toastId = toast.loading('Creating checkout session...')

    if (!selectedPlan || !activePrice) {
      toast.error('Please select a plan and an active price', {
        id: toastId,
      })
      return
    }

    const response = await (api.billing.createCheckoutSession as any).mutate({
      body: {
        plan: selectedPlan.slug,
        cycle: activePrice.interval,
      },
    })

    if (response.data) {
      toast.success('Checkout session created successfully', { id: toastId })

      delay(1000)
      window.location.href = response.data
      return
    }

    toast.error('Failed to create checkout session', { id: toastId })
  }

  return (
    <Button
      onClick={handleCreateCheckoutSession}
      className="w-full justify-between overflow-hidden !mt-auto"
    >
      {selectedPlan ? (
        <>
          <div>
            Upgrade to <strong>{selectedPlan.name}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <AnimatePresence mode="wait">
              {activePrice?.amount && (
                <motion.span
                  key={`${activePrice.amount}-${activePrice.interval}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {Currency.formatCurrency(activePrice.amount)}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <ArrowRightIcon className="size-4" />
            </motion.div>
          </div>
        </>
      ) : (
        <>
          Select a plan
          <motion.div
            whileHover={{ x: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <ArrowRightIcon className="size-4" />
          </motion.div>
        </>
      )}
    </Button>
  )
}

// Main component
export function BillingUpgradeModal({ children }: PropsWithChildren) {
  const plans = (api.plan.findMany as any).query()
  const triggerRef = useRef<HTMLDivElement>(null)

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isYearlyBilling, setIsYearlyBilling] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const handleSelectPlan = (plan: Plan) => {
    setIsFirstLoad(false)
    setSelectedPlan(plan)
  }

  // Select first plan by default when data is loaded
  useEffect(() => {
    if (plans.data && plans.data[0] && !selectedPlan) {
      setSelectedPlan(plans.data[0])
    }
  }, [plans, selectedPlan])

  // Get active price based on selected billing interval
  const getActivePriceForPlan = (plan: Plan | null) => {
    if (!plan) return null

    const interval = isYearlyBilling ? 'year' : 'month'
    return (
      plan.prices.find((price) => price.interval === interval) || plan.prices[0]
    )
  }

  const activePrice = selectedPlan ? getActivePriceForPlan(selectedPlan) : null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div ref={triggerRef}>{children}</div>
      </SheetTrigger>
      <SheetContent className="max-w-full flex flex-col gap-0 p-0 overflow-y-auto">
        <motion.div
          className="space-y-8 p-8 flex flex-col h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <BillingUpgradeModalHeader />

          {plans.data && (
            <BillingUpgradeModalPlanSelector
              plans={plans.data}
              selectedPlan={selectedPlan}
              isYearlyBilling={isYearlyBilling}
              onSelectPlan={handleSelectPlan}
            />
          )}

          <BillingUpgradeModalBillingToggle
            isYearlyBilling={isYearlyBilling}
            onToggle={setIsYearlyBilling}
          />

          <Separator className="-ml-[2rem] w-[calc(100%_+_4rem)]" />

          <BillingUpgradeModalPlanDetails
            plan={selectedPlan}
            isFirstLoad={isFirstLoad}
          />

          <BillingUpgradeModalUpgradeButton
            selectedPlan={selectedPlan}
            activePrice={activePrice}
          />
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
