import { BillingAlertPage } from './billing-alert-page'
import { Clock } from 'lucide-react'
import { AppConfig } from '@/boilerplate.config'
import { toast } from 'sonner'
import { api } from '@/igniter.client'
import { Logo } from '@/components/ui/logo'

export function BillingAlertPagePaymentOverdue() {
  const onClick = async () => {
    const toastId = toast.loading('Redirecting to payment portal...')

    try {
      const response = await (api.billing.createSessionManager as any).mutate({
        body: { returnUrl: window.location.href },
      })

      if (response.data) {
        toast.success('Redirecting...', { id: toastId })
        window.location.href = response.data
        return
      }

      throw new Error('Error opening payment portal')
    } catch (error) {
      toast.error('Error opening payment portal. Please try again.', {
        id: toastId,
      })
    }
  }

  return (
    <BillingAlertPage>
      <BillingAlertPage.Header>
        <Logo />
      </BillingAlertPage.Header>
      <BillingAlertPage.Content>
        <BillingAlertPage.Icon>
          <Clock className="w-6 h-6 text-warning" />
        </BillingAlertPage.Icon>
        <BillingAlertPage.Title>Payment Overdue</BillingAlertPage.Title>
        <BillingAlertPage.Description>
          Your payment is overdue. Please regularize to avoid service
          suspension.
        </BillingAlertPage.Description>
        <BillingAlertPage.Actions>
          <BillingAlertPage.PrimaryAction onClick={onClick}>
            Fix Subscription
          </BillingAlertPage.PrimaryAction>
          <BillingAlertPage.SupportAction mail={AppConfig.links.mail} />
        </BillingAlertPage.Actions>
      </BillingAlertPage.Content>
      <BillingAlertPage.Footer />
    </BillingAlertPage>
  )
}
