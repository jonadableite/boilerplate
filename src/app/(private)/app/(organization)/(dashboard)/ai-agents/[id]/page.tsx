'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  PageWrapper,
} from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { api } from '@/igniter.client'
import {
  Bot,
  Edit,
  MessageSquare,
  Activity,
  Brain,
  Shield,
  Zap,
  Clock,
  User,
  FileText,
  BarChart3,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'

export default function AgentDetailsPage() {
  const params = useParams()
  const agentId = params.id as string

  // Queries
  const {
    data: agent,
    isLoading,
    error,
  } = (api.aiAgents.getById as any).useQuery({
    params: { id: agentId },
  })

  const { data: stats } = (api.aiAgents.getStats as any).useQuery({
    agentId,
  })

  const { data: tokenUsage } = (api.tokenUsage.getTokenUsageHistory as any).useQuery({
    agentId,
    limit: 10,
  })

  // Mutations
  const toggleStatusMutation = (api.aiAgents.update as any).useMutation({
    onSuccess: () => {
      toast.success('Status do agente atualizado!')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message)
    },
  })

  const handleToggleStatus = () => {
    if (!agent) return
    
    toggleStatusMutation.mutate({
      id: agent.id,
      isActive: !agent.isActive,
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <PageBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

  if (error || !agent) {
    return (
      <PageWrapper>
        <PageBody>
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Agente não encontrado</h3>
            <p className="text-muted-foreground">
              O agente solicitado não existe ou você não tem permissão para visualizá-lo.
            </p>
            <Button asChild className="mt-4">
              <Link href="/app/ai-agents">Voltar para Agentes</Link>
            </Button>
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      LLM_AGENT: { label: 'LLM Agent', variant: 'default' as const },
      CREW_AI: { label: 'Crew AI', variant: 'secondary' as const },
      LANGGRAPH_WORKFLOW: { label: 'LangGraph', variant: 'outline' as const },
    }
    const typeInfo = typeMap[type as keyof typeof typeMap] || {
      label: type,
      variant: 'outline' as const,
    }
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
  }

  return (
    <PageWrapper>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/app/ai-agents">Agentes IA</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{agent.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageBody>
        <PageMainBar>
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
                    {getStatusBadge(agent.isActive)}
                    {getTypeBadge(agent.type)}
                  </div>
                  {agent.description && (
                    <p className="text-muted-foreground text-lg">{agent.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Criado em {new Date(agent.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    {agent.updatedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Atualizado em {new Date(agent.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={agent.isActive ? 'outline' : 'default'}
                  onClick={handleToggleStatus}
                  disabled={toggleStatusMutation.isPending}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  {agent.isActive ? 'Desativar' : 'Ativar'}
                </Button>
                <Button asChild>
                  <Link href={`/app/ai-agents/${agent.id}/chat`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Testar Chat
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/app/ai-agents/${agent.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversas Hoje</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.conversationsToday || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.conversationsGrowth || 0}% desde ontem
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tokens Usados</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.tokensUsed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Este mês
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
                  <Progress value={stats?.successRate || 0} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.avgResponseTime || 0}ms</div>
                  <p className="text-xs text-muted-foreground">
                    Tempo de resposta
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="configuration">Configuração</TabsTrigger>
                <TabsTrigger value="usage">Uso de Tokens</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Agent Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações do Agente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome</label>
                        <p className="text-sm">{agent.name}</p>
                      </div>
                      {agent.description && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                          <p className="text-sm">{agent.description}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                        <div className="mt-1">{getTypeBadge(agent.type)}</div>
                      </div>
                      {agent.role && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Papel</label>
                          <p className="text-sm">{agent.role}</p>
                        </div>
                      )}
                      {agent.goal && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Objetivo</label>
                          <p className="text-sm">{agent.goal}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Model Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Configuração do Modelo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                        <div className="mt-1">
                          <Badge variant="outline">{agent.model}</Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Temperatura</label>
                        <p className="text-sm">{agent.temperature}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Máximo de Tokens</label>
                        <p className="text-sm">{agent.maxTokens}</p>
                      </div>
                      {agent.topP && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Top P</label>
                          <p className="text-sm">{agent.topP}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Security Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Configurações de Segurança
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Filtro de Conteúdo</label>
                        <Badge variant={agent.enableContentFilter ? 'default' : 'secondary'}>
                          {agent.enableContentFilter ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Detecção PII</label>
                        <Badge variant={agent.enablePiiDetection ? 'default' : 'secondary'}>
                          {agent.enablePiiDetection ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {agent.maxResponseLength && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tamanho Máximo da Resposta</label>
                          <p className="text-sm">{agent.maxResponseLength} caracteres</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* System Prompt */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Prompt do Sistema
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap">{agent.systemPrompt}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="configuration" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuração Completa</CardTitle>
                    <CardDescription>
                      Visualize todas as configurações do agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm">
                        {JSON.stringify(
                          {
                            id: agent.id,
                            name: agent.name,
                            description: agent.description,
                            type: agent.type,
                            role: agent.role,
                            goal: agent.goal,
                            model: agent.model,
                            temperature: agent.temperature,
                            maxTokens: agent.maxTokens,
                            topP: agent.topP,
                            frequencyPenalty: agent.frequencyPenalty,
                            presencePenalty: agent.presencePenalty,
                            enableContentFilter: agent.enableContentFilter,
                            enablePiiDetection: agent.enablePiiDetection,
                            maxResponseLength: agent.maxResponseLength,
                            allowedTopics: agent.allowedTopics,
                            blockedTopics: agent.blockedTopics,
                            fallbackMessage: agent.fallbackMessage,
                            isActive: agent.isActive,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="usage" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Histórico de Uso de Tokens
                    </CardTitle>
                    <CardDescription>
                      Últimas 10 operações do agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tokenUsage && tokenUsage.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Operação</TableHead>
                            <TableHead>Tokens</TableHead>
                            <TableHead>Modelo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokenUsage.map((usage: any) => (
                            <TableRow key={usage.id}>
                              <TableCell>
                                {new Date(usage.createdAt).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{usage.operation}</Badge>
                              </TableCell>
                              <TableCell>{usage.tokensUsed}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{usage.model}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Nenhum uso registrado</h3>
                        <p className="text-muted-foreground">
                          Este agente ainda não foi utilizado.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Logs do Sistema</CardTitle>
                    <CardDescription>
                      Logs de atividade e erros do agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Logs não disponíveis</h3>
                      <p className="text-muted-foreground">
                        O sistema de logs será implementado em breve.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </PageMainBar>
      </PageBody>
    </PageWrapper>
  )
}