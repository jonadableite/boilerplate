// src/app/(private)/app/(organization)/(dashboard)/whatsapp-instances/page.tsx
'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  PageBody,
  PageHeader,
  PageMainBar,
  PageSecondaryHeader,
  PageWrapper,
} from '@/components/ui/page'
import { Skeleton } from '@/components/ui/skeleton'
import { WhatsAppInstanceCreate } from '@/features/whatsapp-instance/presentation/components/whatsapp-instance-create'
import { WhatsAppInstanceStats } from '@/features/whatsapp-instance/presentation/components/whatsapp-instance-stats'
import { WhatsAppInstanceTable } from '@/features/whatsapp-instance/presentation/components/whatsapp-instance-table'
import { WhatsAppInstanceToolbar } from '@/features/whatsapp-instance/presentation/components/whatsapp-instance-toolbar'
import { InstanceConnectionStatus } from '@/features/whatsapp-instance/whatsapp-instance.types'
import { api } from '@/igniter.client'
import { MessageCircle, Zap } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

export default function WhatsAppInstancesPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  // Validação robusta dos parâmetros
  const validStatus =
    status &&
      status.trim() &&
      Object.values(InstanceConnectionStatus).includes(
        status as InstanceConnectionStatus,
      )
      ? (status as InstanceConnectionStatus)
      : undefined

  const validPage =
    page && !isNaN(parseInt(page, 10)) && parseInt(page, 10) > 0
      ? parseInt(page, 10)
      : 1

  const validLimit =
    limit &&
      !isNaN(parseInt(limit, 10)) &&
      parseInt(limit, 10) > 0 &&
      parseInt(limit, 10) <= 100
      ? parseInt(limit, 10)
      : 20

  // Só envia a query se houver parâmetros válidos
  const queryParams = {
    page: validPage,
    limit: validLimit,
    ...(validStatus && { status: validStatus }),
    ...(search && search.trim() && { search: search.trim() }),
  }

  const { data } = api.whatsAppInstances.list.useQuery({
    params: {
      query: queryParams,
      params: undefined,
    },
  })

  return (
    <PageWrapper className="bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Header Principal */}
      <PageHeader className="border-0 bg-card/30 backdrop-blur-md">
        <PageMainBar>
          <div className="flex items-center justify-between w-full">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/app"
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2 font-semibold">
                    <MessageCircle className="h-4 w-4" />
                    Instâncias WhatsApp
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Botão Nova Instância - Posicionado à direita */}
            <div className="flex items-center">
              <WhatsAppInstanceCreate />
            </div>
          </div>
        </PageMainBar>
      </PageHeader>

      {/* Header Secundário - Toolbar de Busca e Filtros */}
      <PageSecondaryHeader className="bg-card/20 backdrop-blur-md border-border/30">
        <div className="flex items-center justify-center w-full">
          <div className="w-full max-w-4xl">
            <WhatsAppInstanceToolbar />
          </div>
        </div>
      </PageSecondaryHeader>

      {/* Corpo da Página */}
      <PageBody className="space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Cards de Estatísticas */}
        <div className="w-full">
          <Suspense
            fallback={
              <div className="grid gap-6 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-4 w-20 rounded-md bg-muted/50" />
                    <Skeleton className="h-12 w-full rounded-lg bg-muted/30" />
                    <Skeleton className="h-3 w-32 rounded-sm bg-muted/40" />
                  </div>
                ))}
              </div>
            }
          >
            {data?.stats && (
              <div className="animate-in slide-in-from-top-5 duration-500">
                <WhatsAppInstanceStats stats={data.stats} />
              </div>
            )}
          </Suspense>
        </div>

        {/* Tabela de Instâncias */}
        <div className="w-full">
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-40 rounded-md bg-muted/50" />
                      <Skeleton className="h-8 w-24 rounded-md bg-muted/40" />
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-full bg-muted/40" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-32 rounded-sm bg-muted/50" />
                            <Skeleton className="h-3 w-24 rounded-sm bg-muted/30" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full bg-muted/40" />
                          <Skeleton className="h-8 w-8 rounded-md bg-muted/30" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            {data?.data && (
              <div className="animate-in slide-in-from-bottom-5 duration-700">
                <WhatsAppInstanceTable data={data.data} />
              </div>
            )}
          </Suspense>
        </div>

        {/* Empty State */}
        {data?.data && data.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
            <div className="rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6 mb-4">
              <MessageCircle className="h-12 w-12 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma instância encontrada
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Crie sua primeira instância WhatsApp para começar a automatizar
              suas mensagens.
            </p>
            <WhatsAppInstanceCreate />
          </div>
        )}
      </PageBody>
    </PageWrapper>
  )
}
