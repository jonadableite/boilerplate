'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  HealthAlert,
  HealthAnalysisResult,
  HealthRiskLevel
} from '@/features/warmup/warmup.types'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  RefreshCw,
  Shield,
  Target,
  Users,
  XCircle,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface HealthDashboardProps {
  instanceName?: string
  showAllInstances?: boolean
}

interface OrganizationHealthSummary {
  summary: {
    totalInstances: number
    averageHealthScore: number
    riskDistribution: Record<HealthRiskLevel, number>
    healthyInstances: number
    criticalInstances: number
    lastAnalysis: Date | null
  }
  instances: Array<{
    instanceName: string
    healthScore: number
    riskLevel: HealthRiskLevel
    lastAnalysis: Date
    mainIssues: string[]
  }>
  activeAlerts: HealthAlert[]
}

export function HealthDashboard({ instanceName, showAllInstances = false }: HealthDashboardProps) {
  const [healthData, setHealthData] = useState<HealthAnalysisResult | null>(null)
  const [orgSummary, setOrgSummary] = useState<OrganizationHealthSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    if (showAllInstances) {
      loadOrganizationSummary()
    } else if (instanceName) {
      // Não carregar análise automaticamente para economizar recursos
      // loadInstanceHealth(instanceName)
    }
  }, [instanceName, showAllInstances])

  const loadOrganizationSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/health/summary')
      if (response.ok) {
        const data = await response.json()
        setOrgSummary(data.data)
      } else {
        toast.error('Erro ao carregar resumo de saúde')
      }
    } catch (error) {
      console.error('Erro ao carregar resumo:', error)
      toast.error('Erro ao carregar resumo de saúde')
    } finally {
      setLoading(false)
    }
  }

  const analyzeInstanceHealth = async (targetInstance: string) => {
    setAnalysisLoading(true)
    try {
      const response = await fetch(`/api/v1/health/analyze/${targetInstance}`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setHealthData(data.data)
        toast.success('Análise de saúde concluída com sucesso!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Erro ao analisar saúde')
      }
    } catch (error) {
      console.error('Erro ao analisar saúde:', error)
      toast.error('Erro ao analisar saúde da instância')
    } finally {
      setAnalysisLoading(false)
    }
  }

  const getRiskColor = (riskLevel: HealthRiskLevel) => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-500 text-white'
      case 'MEDIUM': return 'bg-yellow-500 text-white'
      case 'HIGH': return 'bg-orange-500 text-white'
      case 'CRITICAL': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRiskIcon = (riskLevel: HealthRiskLevel) => {
    switch (riskLevel) {
      case 'LOW': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'CRITICAL': return <XCircle className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  if (showAllInstances) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Saúde do Sistema</h2>
            <p className="text-muted-foreground">
              Índice geral de saúde das instâncias de aquecimento
            </p>
          </div>
          <Button onClick={loadOrganizationSummary} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Analisando saúde do sistema...</p>
            </div>
          </div>
        ) : orgSummary ? (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Score Geral"
                value={`${orgSummary.summary.averageHealthScore.toFixed(1)}/100`}
                description="Saúde média das instâncias"
                icon={<BarChart3 className="h-5 w-5" />}
                color={getHealthScoreColor(orgSummary.summary.averageHealthScore)}
              />
              <MetricCard
                title="Instâncias Ativas"
                value={`${orgSummary.summary.totalInstances}`}
                description="Total de instâncias"
                icon={<Users className="h-5 w-5" />}
                color="text-blue-600"
              />
              <MetricCard
                title="Instâncias Saudáveis"
                value={`${orgSummary.summary.healthyInstances}`}
                description="Score ≥ 80"
                icon={<Shield className="h-5 w-5" />}
                color="text-green-600"
              />
              <MetricCard
                title="Alertas Críticos"
                value={`${orgSummary.summary.criticalInstances}`}
                description="Requer atenção imediata"
                icon={<AlertTriangle className="h-5 w-5" />}
                color={orgSummary.summary.criticalInstances > 0 ? "text-red-600" : "text-green-600"}
              />
            </div>

            {/* Distribuição de Risco */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Distribuição de Risco
                </CardTitle>
                <CardDescription>
                  Classificação das instâncias por nível de risco
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(orgSummary.summary.riskDistribution).map(([level, count]) => (
                    <div key={level} className="text-center">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(level as HealthRiskLevel)}`}>
                        {getRiskIcon(level as HealthRiskLevel)}
                        {level}
                      </div>
                      <div className="text-2xl font-bold mt-2">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        {orgSummary.summary.totalInstances > 0
                          ? `${((count / orgSummary.summary.totalInstances) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Instâncias */}
            <Card>
              <CardHeader>
                <CardTitle>Instâncias</CardTitle>
                <CardDescription>
                  Status de saúde individual de cada instância
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orgSummary.instances.map((instance) => (
                    <div key={instance.instanceName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getRiskIcon(instance.riskLevel)}
                          <span className="font-medium">{instance.instanceName}</span>
                        </div>
                        <Badge className={getRiskColor(instance.riskLevel)}>
                          {instance.riskLevel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getHealthScoreColor(instance.healthScore)}`}>
                            {instance.healthScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(instance.lastAnalysis).toLocaleDateString()}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => analyzeInstanceHealth(instance.instanceName)}
                          disabled={analysisLoading}
                        >
                          {analysisLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                          Analisar
                        </Button>
                      </div>
                    </div>
                  ))}

                  {orgSummary.instances.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="mx-auto h-12 w-12 mb-4" />
                      <p>Nenhuma instância encontrada</p>
                      <p className="text-sm">Configure instâncias de aquecimento para começar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alertas Ativos */}
            {orgSummary.activeAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Alertas Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orgSummary.activeAlerts.map((alert) => (
                      <Alert key={alert.id} variant={alert.severity === 'CRITICAL' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div>
                              <strong>{alert.title}</strong>
                              <p className="text-sm mt-1">{alert.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Instância: {alert.instanceName}
                              </p>
                            </div>
                            <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                              {alert.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Dados não disponíveis</p>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em "Atualizar" para carregar os dados de saúde
            </p>
            <Button onClick={loadOrganizationSummary}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Carregar Dados
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Dashboard para instância específica
  if (!instanceName || !healthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Saúde</CardTitle>
          <CardDescription>
            {instanceName
              ? `Clique em "Analisar" para verificar a saúde da instância ${instanceName}`
              : 'Selecione uma instância para analisar sua saúde'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          {instanceName ? (
            <Button onClick={() => analyzeInstanceHealth(instanceName)} disabled={analysisLoading}>
              {analysisLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Analisar Saúde
            </Button>
          ) : (
            <p className="text-muted-foreground">Nenhuma instância selecionada</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Saúde</h2>
          <p className="text-muted-foreground">Instância: {instanceName}</p>
        </div>
        <Button onClick={() => analyzeInstanceHealth(instanceName)} disabled={analysisLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${analysisLoading ? 'animate-spin' : ''}`} />
          Analisar Novamente
        </Button>
      </div>

      {/* Score Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Score de Saúde
            {getRiskIcon(healthData.healthMetrics.riskLevel)}
          </CardTitle>
          <CardDescription>
            Baseado na análise das últimas 24 horas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold ${getHealthScoreColor(healthData.healthMetrics.healthScore)}`}>
                {healthData.healthMetrics.healthScore.toFixed(1)}/100
              </div>
              <Badge className={getRiskColor(healthData.healthMetrics.riskLevel)}>
                Risco {healthData.healthMetrics.riskLevel}
              </Badge>
            </div>
            <Progress value={healthData.healthMetrics.healthScore} className="w-full" />
            <div className="text-sm text-muted-foreground">
              Última análise: {new Date(healthData.healthMetrics.analyzedAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Taxa de Resposta"
              value={`${(healthData.healthMetrics.responseRate * 100).toFixed(1)}%`}
              description="Última 24h"
              status={healthData.healthMetrics.responseRate >= 0.75 ? 'good' : 'warning'}
            />
            <MetricCard
              title="Mensagens Enviadas"
              value={healthData.healthMetrics.messagesSent24h.toString()}
              description="Última 24h"
              status={healthData.healthMetrics.messagesSent24h <= 1000 ? 'good' : 'warning'}
            />
            <MetricCard
              title="Taxa de Entrega"
              value={`${(healthData.healthMetrics.deliveryRate * 100).toFixed(1)}%`}
              description="Última 24h"
              status={healthData.healthMetrics.deliveryRate >= 0.95 ? 'good' : 'warning'}
            />
            <MetricCard
              title="Relatórios de Spam"
              value={healthData.healthMetrics.spamReports.toString()}
              description="Esta semana"
              status={healthData.healthMetrics.spamReports === 0 ? 'good' : 'danger'}
            />
            <MetricCard
              title="Taxa de Bloqueios"
              value={`${(healthData.healthMetrics.blockRate * 100).toFixed(2)}%`}
              description="Esta semana"
              status={healthData.healthMetrics.blockRate <= 0.02 ? 'good' : 'danger'}
            />
            <MetricCard
              title="Comportamento Humano"
              value={`${(healthData.healthMetrics.humanBehaviorScore * 100).toFixed(1)}%`}
              description="Score de naturalidade"
              status={healthData.healthMetrics.humanBehaviorScore >= 0.8 ? 'good' : 'warning'}
            />
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {healthData.alerts.length > 0 ? (
            <div className="space-y-3">
              {healthData.alerts.map((alert) => (
                <Alert key={alert.id} variant={alert.severity === 'CRITICAL' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>{alert.title}</strong>
                        <p className="text-sm mt-1">{alert.message}</p>
                        {alert.actionRequired && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <strong>Ação necessária:</strong> {alert.actionRequired}
                          </div>
                        )}
                      </div>
                      <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum alerta ativo</p>
              <p className="text-sm text-muted-foreground">
                Sua instância está funcionando sem problemas detectados
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {healthData.recommendations.length > 0 ? (
            <div className="space-y-4">
              {healthData.recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={rec.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                    {rec.actions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Ações recomendadas:</p>
                        <ul className="text-sm space-y-1 ml-4">
                          {rec.actions.map((action, index) => (
                            <li key={index} className="list-disc">{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(rec.expectedImpact || rec.difficulty || rec.estimatedTime) && (
                      <div className="mt-3 pt-3 border-t flex gap-4 text-xs text-muted-foreground">
                        {rec.expectedImpact && <span>Impacto: {rec.expectedImpact}</span>}
                        {rec.difficulty && <span>Dificuldade: {rec.difficulty}</span>}
                        {rec.estimatedTime && <span>Tempo: {rec.estimatedTime}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma recomendação</p>
              <p className="text-sm text-muted-foreground">
                Sua instância está seguindo as melhores práticas
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Compliance</CardTitle>
              <CardDescription>
                Conformidade com políticas do WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Score Geral</span>
                    <span className="text-lg font-bold">{healthData.compliance.overallScore}%</span>
                  </div>
                  <Progress value={healthData.compliance.overallScore} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(healthData.compliance.categories).map(([category, score]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span>{score}%</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </div>

                {healthData.compliance.violations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Violações Detectadas</h4>
                    <div className="space-y-2">
                      {healthData.compliance.violations.map((violation, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{violation.description}</span>
                            <Badge variant="destructive">{violation.severity}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {violation.count} ocorrência(s)
                          </div>
                        </div>
                      ))}
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

function MetricCard({
  title,
  value,
  description,
  icon,
  color = 'text-gray-600',
  status
}: {
  title: string
  value: string
  description: string
  icon?: React.ReactNode
  color?: string
  status?: 'good' | 'warning' | 'danger'
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'border-green-200 bg-green-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'danger': return 'border-red-200 bg-red-50'
      default: return ''
    }
  }

  return (
    <Card className={getStatusColor()}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}