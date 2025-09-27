'use client'

import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Campaign } from '@/features/campaign'
import { api } from '@/igniter.client'
import {
  BarChart3,
  Calendar,
  Clock,
  Filter,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function CampaignsPage() {
  const { session } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Queries e mutations
  const campaignsQuery = (api.campaign.list as any).useQuery()
  const pauseCampaignMutation = (api.campaign.pause as any).useMutation()
  const resumeCampaignMutation = (api.campaign.resume as any).useMutation()
  const cancelCampaignMutation = (api.campaign.cancel as any).useMutation()

  useEffect(() => {
    if (session?.organization?.id) {
      fetchCampaigns()
    }
  }, [session?.organization?.id])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)

      // Usar a query do Igniter.js
      const result = await campaignsQuery.refetch()

      if (result.data) {
        setCampaigns(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error)
      toast.error('Erro ao buscar campanhas')
    } finally {
      setLoading(false)
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const result = await pauseCampaignMutation.mutateAsync({
        body: { campaignId },
      })

      if (result.error) {
        toast.error('Erro ao pausar campanha: ' + result.error.message)
        return
      }

      toast.success('Campanha pausada com sucesso!')
      fetchCampaigns() // Recarregar dados
    } catch (error) {
      console.error('Erro ao pausar campanha:', error)
      toast.error('Erro ao pausar campanha')
    }
  }

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const result = await resumeCampaignMutation.mutateAsync({
        body: { campaignId },
      })

      if (result.error) {
        toast.error('Erro ao retomar campanha: ' + result.error.message)
        return
      }

      toast.success('Campanha retomada com sucesso!')
      fetchCampaigns() // Recarregar dados
    } catch (error) {
      console.error('Erro ao retomar campanha:', error)
      toast.error('Erro ao retomar campanha')
    }
  }

  const handleCancelCampaign = async (campaignId: string) => {
    if (
      !confirm(
        'Tem certeza que deseja cancelar esta campanha? Esta ação não pode ser desfeita.',
      )
    ) {
      return
    }

    try {
      const result = await cancelCampaignMutation.mutateAsync({
        body: { campaignId },
      })

      if (result.error) {
        toast.error('Erro ao cancelar campanha: ' + result.error.message)
        return
      }

      toast.success('Campanha cancelada com sucesso!')
      fetchCampaigns() // Recarregar dados
    } catch (error) {
      console.error('Erro ao cancelar campanha:', error)
      toast.error('Erro ao cancelar campanha')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary', label: 'Rascunho' },
      SCHEDULED: { variant: 'default', label: 'Agendada' },
      RUNNING: { variant: 'default', label: 'Executando' },
      PAUSED: { variant: 'destructive', label: 'Pausada' },
      COMPLETED: { variant: 'default', label: 'Concluída' },
      CANCELLED: { variant: 'destructive', label: 'Cancelada' },
      ERROR: { variant: 'destructive', label: 'Erro' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      IMMEDIATE: { variant: 'default', label: 'Imediata' },
      SCHEDULED: { variant: 'secondary', label: 'Agendada' },
      RECURRING: { variant: 'outline', label: 'Recorrente' },
    }

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.IMMEDIATE
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground">
            Gerencie suas campanhas de disparo em massa no WhatsApp
          </p>
        </div>
        <Link href="/app/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="DRAFT">Rascunho</SelectItem>
                <SelectItem value="SCHEDULED">Agendada</SelectItem>
                <SelectItem value="RUNNING">Executando</SelectItem>
                <SelectItem value="PAUSED">Pausada</SelectItem>
                <SelectItem value="COMPLETED">Concluída</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
                <SelectItem value="ERROR">Erro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="IMMEDIATE">Imediata</SelectItem>
                <SelectItem value="SCHEDULED">Agendada</SelectItem>
                <SelectItem value="RECURRING">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Campanhas */}
      <div className="grid gap-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma campanha encontrada
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Tente ajustar os filtros ou criar uma nova campanha.'
                  : 'Crie sua primeira campanha para começar a enviar mensagens em massa.'}
              </p>
              <Link href="/app/campaigns/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Campanha
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(campaign.status)}
                    {getTypeBadge(campaign.type)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {campaign.totalLeads}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total de Leads
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {campaign.sentCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Enviadas
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {campaign.deliveredCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Entregues
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {campaign.readCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Lidas
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso */}
                {campaign.status === 'RUNNING' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progresso</span>
                      <span>{Math.round(campaign.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${campaign.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Informações Adicionais */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Delay: {campaign.minDelay}s - {campaign.maxDelay}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Instâncias: {campaign.selectedInstances.length}</span>
                  </div>
                  {campaign.scheduledAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Agendada:{' '}
                        {new Date(campaign.scheduledAt).toLocaleDateString(
                          'pt-BR',
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Link href={`/app/campaigns/${campaign.id}`}>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </Link>

                  {campaign.status === 'DRAFT' && (
                    <Link href={`/app/campaigns/${campaign.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                  )}

                  {campaign.status === 'SCHEDULED' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelCampaign(campaign.id)}
                      disabled={cancelCampaignMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  )}

                  {campaign.status === 'RUNNING' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePauseCampaign(campaign.id)}
                      disabled={pauseCampaignMutation.isPending}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pausar
                    </Button>
                  )}

                  {campaign.status === 'PAUSED' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleResumeCampaign(campaign.id)}
                      disabled={resumeCampaignMutation.isPending}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Retomar
                    </Button>
                  )}

                  {campaign.status === 'ERROR' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelCampaign(campaign.id)}
                      disabled={cancelCampaignMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}