import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/igniter.client'
import { ChevronRightIcon, RocketIcon, Smartphone } from 'lucide-react'
import { Link } from 'next-view-transitions'
import { useEffect, useState } from 'react'
import { BillingUpgradeModal } from './billing-upgrade-modal'

interface UsageCounts {
  whatsappInstances: number
  leads: number
}

export function BillingDashboardSidebarUpgradeCard() {
  const auth = useAuth()
  const billing = auth.session.organization?.billing
  const subscription = billing?.subscription
  const isOnTrial = subscription?.status === 'trialing'

  const [usageCounts, setUsageCounts] = useState<UsageCounts>({
    whatsappInstances: 0,
    leads: 0,
  })

  // Buscar contadores de uso
  const { data: whatsappInstancesData } = api.whatsAppInstances.list.useQuery({
    params: {
      query: { limit: 1000 }, // Buscar todas as instâncias para contar
      params: undefined,
    },
  })

  // Buscar contadores de leads
  const { data: leadsData } = api.lead.findMany.useQuery({
    params: {
      query: { limit: 1000 },
      params: undefined,
    },
  })

  useEffect(() => {
    if (whatsappInstancesData?.data) {
      setUsageCounts((prev) => ({
        ...prev,
        whatsappInstances: whatsappInstancesData.data.length,
      }))
    }
  }, [whatsappInstancesData])

  useEffect(() => {
    if (leadsData) {
      setUsageCounts((prev) => ({
        ...prev,
        leads: leadsData.length,
      }))
    }
  }, [leadsData])

  if (!billing) return null

  // Função para encontrar o limite de uma feature específica
  const getFeatureLimit = (slug: string) => {
    const feature = subscription?.plan?.metadata?.features?.find(
      (f) => f.slug === slug,
    )
    return feature?.limit || 0
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <Link
          href="/app/settings/organization/billing"
          className="text-xs uppercase text-muted-foreground flex items-center"
        >
          Usage
          <ChevronRightIcon className="size-3" />
        </Link>
        {isOnTrial && subscription?.trialDays && (
          <span className="text-xs text-muted-foreground">
            Trial ends in <strong>{subscription.trialDays} days</strong>
          </span>
        )}
      </header>
      <main className="space-y-4">
        {/* Uso do plano atual - filtrar apenas leads e submissions */}
        {auth.session.organization?.billing.subscription?.usage
          .filter(
            (item) =>
              item.slug === 'leads' || item.slug === 'submissions',
          )
          .map((item) => (
            <div key={item.slug} className="space-y-2 border-b last:border-b-0">
              <div className="flex items-center justify-between text-xs">
                <span>{item.name}</span>
                <span className="text-muted-foreground">
                  {item.usage} / {item.limit} used
                </span>
              </div>
              <Progress
                value={(item.usage / item.limit) * 100}
                className="h-1"
              />
            </div>
          ))}

        {/* Contador de instâncias WhatsApp - SEMPRE mostrar */}
        <div className="space-y-2 border-b last:border-b-0 pb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-3 h-3 text-blue-600" />
              <span>WhatsApp Instances</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {usageCounts.whatsappInstances} / {getFeatureLimit('whatsapp-instances')} used
            </span>
          </div>
          <Progress
            value={
              getFeatureLimit('whatsapp-instances') > 0
                ? (usageCounts.whatsappInstances /
                  getFeatureLimit('whatsapp-instances')) *
                100
                : 0
            }
            className="h-1"
          />
          {getFeatureLimit('whatsapp-instances') > 0 &&
            usageCounts.whatsappInstances >= getFeatureLimit('whatsapp-instances') && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Limite de instâncias atingido! Upgrade necessário.
              </div>
            )}
        </div>

        <BillingUpgradeModal>
          <Button className="w-full justify-between" variant="secondary">
            Upgrade plan
            <RocketIcon className="size-3" />
          </Button>
        </BillingUpgradeModal>
      </main>
    </section>
  )
}
