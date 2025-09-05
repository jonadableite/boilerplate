import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/igniter.client'
import {
  ChevronRightIcon,
  RocketIcon,
  Send,
  Smartphone,
  Users,
} from 'lucide-react'
import { Link } from 'next-view-transitions'
import { useEffect, useState } from 'react'
import { BillingUpgradeModal } from './billing-upgrade-modal'

interface UsageCounts {
  whatsappInstances: number
  leads: number
  submissions: number
}

interface FeatureUsage {
  slug: string
  name: string
  current: number
  limit: number
  percentage: number
  isOverLimit: boolean
  isNearLimit: boolean
}

export function BillingDashboardSidebarUpgradeCard() {
  const auth = useAuth()
  const billing = auth.session.organization?.billing
  const subscription = billing?.subscription
  const isOnTrial = subscription?.status === 'trialing'

  const [usageCounts, setUsageCounts] = useState<UsageCounts>({
    whatsappInstances: 0,
    leads: 0,
    submissions: 0,
  })

  // Buscar contadores de uso
  const { data: whatsappInstancesData, isLoading: isLoadingWhatsApp } =
    api.whatsAppInstances.list.useQuery({
      limit: 100, // Limite máximo permitido
    })

  // Buscar contadores de leads
  const { data: leadsData, isLoading: isLoadingLeads } =
    api.lead.findMany.useQuery({
      limit: 100,
    })

  // Buscar contadores de submissions
  const { data: submissionsData, isLoading: isLoadingSubmissions } =
    api.submission.findMany.useQuery({
      limit: 100,
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

  useEffect(() => {
    if (submissionsData) {
      setUsageCounts((prev) => ({
        ...prev,
        submissions: submissionsData.length,
      }))
    }
  }, [submissionsData])

  if (!billing) return null

  // Função para encontrar o limite de uma feature específica
  const getFeatureLimit = (slug: string): number => {
    const feature = subscription?.plan?.metadata?.features?.find(
      (f) => f.slug === slug,
    )
    return feature?.limit || 0
  }

  // Função para calcular o uso de uma feature
  const calculateFeatureUsage = (slug: string): FeatureUsage => {
    const limit = getFeatureLimit(slug)
    let current = 0

    switch (slug) {
      case 'whatsapp-instances':
        current = usageCounts.whatsappInstances
        break
      case 'leads':
        current = usageCounts.leads
        break
      case 'submissions':
        current = usageCounts.submissions
        break
      default:
        current = 0
    }

    const percentage = limit > 0 ? (current / limit) * 100 : 0
    const isOverLimit = current > limit
    const isNearLimit = percentage >= 80 && percentage < 100

    return {
      slug,
      name: getFeatureName(slug),
      current,
      limit,
      percentage: Math.min(percentage, 100),
      isOverLimit,
      isNearLimit,
    }
  }

  // Função para obter o nome amigável da feature
  const getFeatureName = (slug: string): string => {
    const feature = subscription?.plan?.metadata?.features?.find(
      (f) => f.slug === slug,
    )
    return feature?.name || slug
  }

  // Features principais para mostrar na sidebar
  const mainFeatures = ['whatsapp-instances', 'leads', 'submissions']
  const featureUsages = mainFeatures.map(calculateFeatureUsage)

  // Verificar se há loading
  const isLoading = isLoadingWhatsApp || isLoadingLeads || isLoadingSubmissions

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
        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-1 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Features de uso */}
        {!isLoading && featureUsages.map((feature) => (
          <div key={feature.slug} className="space-y-2 border-b last:border-b-0 pb-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {feature.slug === 'whatsapp-instances' && (
                  <Smartphone className="w-3 h-3 text-blue-600" />
                )}
                {feature.slug === 'leads' && (
                  <Users className="w-3 h-3 text-green-600" />
                )}
                {feature.slug === 'submissions' && (
                  <Send className="w-3 h-3 text-purple-600" />
                )}
                <span>{feature.name}</span>
              </div>
              <span className={`text-xs ${feature.isOverLimit
                ? 'text-red-600 font-medium'
                : feature.isNearLimit
                  ? 'text-orange-600 font-medium'
                  : 'text-muted-foreground'
                }`}>
                {feature.current} / {feature.limit > 0 ? feature.limit : '∞'}
              </span>
            </div>

            <Progress
              value={feature.percentage}
              className={`h-1 ${feature.isOverLimit
                ? 'bg-red-200'
                : feature.isNearLimit
                  ? 'bg-orange-200'
                  : ''
                }`}
            />

            {/* Alertas de limite */}
            {feature.isOverLimit && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Limite de {feature.name.toLowerCase()} atingido! Upgrade necessário.
              </div>
            )}
            {feature.isNearLimit && !feature.isOverLimit && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                Você está próximo do limite de {feature.name.toLowerCase()}.
              </div>
            )}
          </div>
        ))}

        {/* Uso do plano atual - mostrar outras features se existirem */}
        {subscription?.usage && subscription.usage.length > 0 && (
          <>
            <div className="text-xs text-muted-foreground font-medium pt-2">
              Outros recursos
            </div>
            {subscription.usage
              .filter(
                (item) =>
                  !mainFeatures.includes(item.slug),
              )
              .map((item) => (
                <div key={item.slug} className="space-y-2 border-b last:border-b-0 pb-3">
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
          </>
        )}

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
