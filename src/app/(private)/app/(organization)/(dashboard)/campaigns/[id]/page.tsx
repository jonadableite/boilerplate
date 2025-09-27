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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Campaign, CampaignLead } from '@/features/campaign'
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Eye,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const organization = session?.organization
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [leads, setLeads] = useState<CampaignLead[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (organization?.id && params.id) {
      fetchCampaignDetails()
    }
  }, [organization?.id, params.id])

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true)
      // Mock data para demonstração
      setCampaign({
        id: params.id as string,
        name: 'Campanha de Boas-vindas',
        description: 'Mensagem de boas-vindas para novos clientes',
        status: 'COMPLETED',
        type: 'IMMEDIATE',
        progress: 100,
        totalLeads: 150,
        sentCount: 150,
        deliveredCount: 142,
        readCount: 89,
        failedCount: 8,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        organizationId: organization?.id || '',
        createdById: '',
        message:
          'Bem-vindo à nossa empresa! Estamos muito felizes em tê-lo conosco. Nossa equipe está sempre disponível para ajudar.',
        minDelay: 30,
        maxDelay: 120,
        useInstanceRotation: true,
        selectedInstances: ['instance1', 'instance2'],
        timezone: 'America/Sao_Paulo',
      })

      setLeads([
        {
          id: '1',
          name: 'João Silva',
          phone: '11999887766',
          email: 'joao@email.com',
          status: 'READ',
          sentAt: new Date('2024-01-15T10:00:00'),
          deliveredAt: new Date('2024-01-15T10:01:00'),
          readAt: new Date('2024-01-15T10:05:00'),
          retryCount: 0,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: 'Maria Santos',
          phone: '11988776655',
          email: 'maria@email.com',
          status: 'DELIVERED',
          sentAt: new Date('2024-01-15T10:30:00'),
          deliveredAt: new Date('2024-01-15T10:31:00'),
          retryCount: 0,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
      ])
    } catch (error) {
      console.error('Erro ao buscar detalhes da campanha:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartCampaign = async () => {
    try {
      setActionLoading(true)
      // Aqui você faria a chamada para a API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await fetchCampaignDetails() // Recarregar dados
    } catch (error) {
      console.error('Erro ao iniciar campanha:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStopCampaign = async () => {
    try {
      setActionLoading(true)
      // Aqui você faria a chamada para a API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await fetchCampaignDetails() // Recarregar dados
    } catch (error) {
      console.error('Erro ao parar campanha:', error)
    } finally {
      setActionLoading(false)
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

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  const getLeadStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'secondary', label: 'Pendente' },
      PROCESSING: { variant: 'default', label: 'Processando' },
      SENT: { variant: 'default', label: 'Enviada' },
      DELIVERED: { variant: 'default', label: 'Entregue' },
      READ: { variant: 'default', label: 'Lida' },
      FAILED: { variant: 'destructive', label: 'Falhou' },
      BLOCKED: { variant: 'destructive', label: 'Bloqueada' },
    }

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Campanha não encontrada</h2>
        <Link href="/app/campaigns">
          <Button>Voltar para Campanhas</Button>
        </Link>
      </div>
    )
  }

  const deliveryRate =
    campaign.totalLeads > 0
      ? (campaign.deliveredCount / campaign.totalLeads) * 100
      : 0
  const readRate =
    campaign.deliveredCount > 0
      ? (campaign.readCount / campaign.deliveredCount) * 100
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground">{campaign.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(campaign.status)}
          {campaign.status === 'DRAFT' && (
            <Button onClick={handleStartCampaign} disabled={actionLoading}>
              <Play className="mr-2 h-4 w-4" />
              {actionLoading ? 'Iniciando...' : 'Iniciar'}
            </Button>
          )}
          {campaign.status === 'RUNNING' && (
            <Button
              variant="destructive"
              onClick={handleStopCampaign}
              disabled={actionLoading}
            >
              <Pause className="mr-2 h-4 w-4" />
              {actionLoading ? 'Parando...' : 'Parar'}
            </Button>
          )}
          {campaign.status === 'PAUSED' && (
            <Button onClick={handleStartCampaign} disabled={actionLoading}>
              <Play className="mr-2 h-4 w-4" />
              {actionLoading ? 'Retomando...' : 'Retomar'}
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaign.sentCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaign.totalLeads > 0
                ? ((campaign.sentCount / campaign.totalLeads) * 100).toFixed(1)
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {campaign.deliveredCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de entrega: {deliveryRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {campaign.readCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de leitura: {readRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso e Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progresso da Campanha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso Geral</span>
                <span>{Math.round(campaign.progress)}%</span>
              </div>
              <Progress value={campaign.progress} className="h-2" />
            </div>

            {campaign.status === 'RUNNING' && (
              <div className="text-sm text-muted-foreground">
                <p>Campanha em execução...</p>
                <p>Processando leads automaticamente</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Delay entre mensagens:
              </span>
              <span className="text-sm font-medium">
                {campaign.minDelay}s - {campaign.maxDelay}s
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Rotação de instâncias:
              </span>
              <Badge
                variant={campaign.useInstanceRotation ? 'default' : 'secondary'}
              >
                {campaign.useInstanceRotation ? 'Ativada' : 'Desativada'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Instâncias selecionadas:
              </span>
              <span className="text-sm font-medium">
                {campaign.selectedInstances.length}
              </span>
            </div>

            {campaign.scheduledAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Agendada para:
                </span>
                <span className="text-sm font-medium">
                  {new Date(campaign.scheduledAt).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo da Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap">
              {campaign.message}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para Detalhes */}
      <Tabs defaultValue="leads" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="instances">Instâncias</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Tab Leads */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Leads da Campanha</CardTitle>
                  <CardDescription>
                    Lista de todos os leads e seus status
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{lead.name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.phone}
                        </p>
                        {lead.email && (
                          <p className="text-sm text-muted-foreground">
                            {lead.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getLeadStatusBadge(lead.status)}

                      <div className="text-right text-sm text-muted-foreground">
                        {lead.sentAt && (
                          <p>Enviada: {lead.sentAt.toLocaleString('pt-BR')}</p>
                        )}
                        {lead.deliveredAt && (
                          <p>
                            Entregue: {lead.deliveredAt.toLocaleString('pt-BR')}
                          </p>
                        )}
                        {lead.readAt && (
                          <p>Lida: {lead.readAt.toLocaleString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Instâncias */}
        <TabsContent value="instances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instâncias Utilizadas</CardTitle>
              <CardDescription>
                Status e performance das instâncias selecionadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaign.selectedInstances.map((instanceName) => (
                  <div key={instanceName} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{instanceName}</h4>
                      <Badge variant="default">Ativa</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Mensagens enviadas:
                        </span>
                        <p className="font-medium">45</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Taxa de entrega:
                        </span>
                        <p className="font-medium">96%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Última atividade:
                        </span>
                        <p className="font-medium">2 min atrás</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logs da Campanha</CardTitle>
                  <CardDescription>
                    Histórico de atividades e eventos
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Campanha iniciada</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.createdAt.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Primeira mensagem enviada</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.createdAt.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {campaign.status === 'COMPLETED' && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Campanha concluída</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.updatedAt.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
