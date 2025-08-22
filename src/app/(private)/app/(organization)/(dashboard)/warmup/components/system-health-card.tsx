'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Heart,
  RefreshCw,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SystemHealthProps {
  instances: Array<{
    instanceName: string
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ERROR' | 'INACTIVE'
    progress: number
    lastActive?: Date
    warmupTime: number
    targetDuration: number
    startTime?: Date
    pauseTime?: Date
  }>
  onAnalyzeHealth?: (instanceName: string) => void
}

interface HealthSummary {
  overallScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: string
  description: string
  color: string
  bgColor: string
  details: {
    totalInstances: number
    activeInstances: number
    healthyInstances: number
    criticalInstances: number
    averageScore: number
    trends: {
      direction: 'UP' | 'DOWN' | 'STABLE'
      change: number
    }
  }
}

export function SystemHealthCard({ instances, onAnalyzeHealth }: SystemHealthProps) {
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Calcular saúde do sistema baseado em algoritmos avançados
  const calculateSystemHealth = (): HealthSummary => {
    if (instances.length === 0) {
      return {
        overallScore: 0,
        riskLevel: 'LOW',
        status: 'Sem instâncias',
        description: 'Configure instâncias para monitorar a saúde',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        details: {
          totalInstances: 0,
          activeInstances: 0,
          healthyInstances: 0,
          criticalInstances: 0,
          averageScore: 0,
          trends: { direction: 'STABLE', change: 0 }
        }
      }
    }

    const activeInstances = instances.filter(i => i.status === 'ACTIVE')

    if (activeInstances.length === 0) {
      return {
        overallScore: 0,
        riskLevel: 'MEDIUM',
        status: 'Inativo',
        description: 'Nenhuma instância ativa detectada',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        details: {
          totalInstances: instances.length,
          activeInstances: 0,
          healthyInstances: 0,
          criticalInstances: 0,
          averageScore: 0,
          trends: { direction: 'DOWN', change: -10 }
        }
      }
    }

    // Algoritmo avançado de saúde baseado em múltiplos fatores
    const healthScores = activeInstances.map(instance => {
      // 1. Fator de Progresso (30% do peso)
      const progressFactor = Math.min(instance.progress / 100, 1)

      // 2. Fator de Estabilidade (25% do peso)
      const stabilityFactor = calculateStabilityFactor(instance)

      // 3. Fator de Tempo (25% do peso)
      const timeFactor = calculateTimeFactor(instance)

      // 4. Fator de Consistência (20% do peso)
      const consistencyFactor = calculateConsistencyFactor(instance)

      // Score ponderado
      const score = (
        progressFactor * 0.3 +
        stabilityFactor * 0.25 +
        timeFactor * 0.25 +
        consistencyFactor * 0.2
      ) * 100

      return {
        instanceName: instance.instanceName,
        score: Math.min(Math.max(score, 0), 100),
        riskLevel: determineRiskLevel(score)
      }
    })

    const averageScore = healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length
    const healthyInstances = healthScores.filter(h => h.score >= 70).length
    const criticalInstances = healthScores.filter(h => h.riskLevel === 'CRITICAL').length
    const highRiskInstances = healthScores.filter(h => h.riskLevel === 'HIGH').length

    // Determinar status geral
    let status: string
    let description: string
    let color: string
    let bgColor: string
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

    if (criticalInstances > 0) {
      status = 'Crítico'
      description = `${criticalInstances} instância(s) em risco crítico`
      color = 'text-red-600'
      bgColor = 'bg-red-100'
      riskLevel = 'CRITICAL'
    } else if (highRiskInstances > 0) {
      status = 'Atenção'
      description = `${highRiskInstances} instância(s) requer atenção`
      color = 'text-orange-600'
      bgColor = 'bg-orange-100'
      riskLevel = 'HIGH'
    } else if (averageScore >= 85) {
      status = 'Excelente'
      description = 'Sistema operando com performance otimizada'
      color = 'text-green-600'
      bgColor = 'bg-green-100'
      riskLevel = 'LOW'
    } else if (averageScore >= 70) {
      status = 'Boa'
      description = 'Sistema funcionando adequadamente'
      color = 'text-blue-600'
      bgColor = 'bg-blue-100'
      riskLevel = 'LOW'
    } else if (averageScore >= 50) {
      status = 'Regular'
      description = 'Algumas otimizações recomendadas'
      color = 'text-yellow-600'
      bgColor = 'bg-yellow-100'
      riskLevel = 'MEDIUM'
    } else {
      status = 'Ruim'
      description = 'Ação corretiva necessária urgentemente'
      color = 'text-orange-600'
      bgColor = 'bg-orange-100'
      riskLevel = 'HIGH'
    }

    return {
      overallScore: Math.round(averageScore),
      riskLevel,
      status,
      description,
      color,
      bgColor,
      details: {
        totalInstances: instances.length,
        activeInstances: activeInstances.length,
        healthyInstances,
        criticalInstances,
        averageScore,
        trends: calculateTrends(healthScores)
      }
    }
  }

  // Fatores de cálculo de saúde
  const calculateStabilityFactor = (instance: any): number => {
    const statusMap = {
      'ACTIVE': 1.0,
      'PAUSED': 0.6,
      'ERROR': 0.2,
      'COMPLETED': 0.9,
      'INACTIVE': 0.1
    }

    let factor = statusMap[instance.status] || 0.5

    // Penalizar por pausas frequentes
    if (instance.pauseTime) {
      factor *= 0.8
    }

    return factor
  }

  const calculateTimeFactor = (instance: any): number => {
    if (!instance.startTime) return 0.5

    const now = new Date()
    const start = new Date(instance.startTime)
    const elapsed = (now.getTime() - start.getTime()) / 1000
    const target = instance.targetDuration || 2073600 // 24 dias

    const completion = Math.min(elapsed / target, 1)

    // Fator baseado na consistência temporal
    return Math.min(completion * 1.2, 1) // Bonus por consistência
  }

  const calculateConsistencyFactor = (instance: any): number => {
    // Baseado na atividade recente
    if (!instance.lastActive) return 0.7

    const now = new Date()
    const lastActive = new Date(instance.lastActive)
    const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)

    if (hoursSinceActive <= 1) return 1.0
    if (hoursSinceActive <= 4) return 0.9
    if (hoursSinceActive <= 12) return 0.7
    if (hoursSinceActive <= 24) return 0.5
    return 0.3
  }

  const determineRiskLevel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    if (score >= 80) return 'LOW'
    if (score >= 60) return 'MEDIUM'
    if (score >= 40) return 'HIGH'
    return 'CRITICAL'
  }

  const calculateTrends = (healthScores: any[]) => {
    // Simular tendências baseadas nos scores atuais
    const avgScore = healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length

    if (avgScore >= 80) {
      return { direction: 'UP' as const, change: 5 }
    } else if (avgScore >= 60) {
      return { direction: 'STABLE' as const, change: 0 }
    } else {
      return { direction: 'DOWN' as const, change: -10 }
    }
  }

  // Atualizar saúde automaticamente
  useEffect(() => {
    const updateHealth = () => {
      const health = calculateSystemHealth()
      setHealthSummary(health)
    }

    updateHealth()

    if (autoRefresh) {
      const interval = setInterval(updateHealth, 30000) // A cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [instances, autoRefresh])

  const analyzeSpecificInstance = async (instanceName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/health/analyze/${instanceName}`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success(`Análise detalhada de ${instanceName} concluída!`)
        onAnalyzeHealth?.(instanceName)
      } else {
        toast.error('Erro ao analisar instância')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'MEDIUM': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'HIGH': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'CRITICAL': return <Shield className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'UP': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'DOWN': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (!healthSummary) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Background gradient baseado no status */}
      <div className={`absolute inset-0 opacity-5 ${healthSummary.bgColor}`} />

      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${healthSummary.bgColor}`}>
              {getRiskIcon(healthSummary.riskLevel)}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Saúde do Sistema
              </CardTitle>
              <CardDescription>
                Índice geral de saúde das instâncias de aquecimento
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin text-green-600' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Principal */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`text-4xl font-bold ${healthSummary.color}`}>
              {healthSummary.overallScore}
            </div>
            <div className="text-sm text-muted-foreground">/ 100</div>
            <Badge className={`${healthSummary.bgColor} ${healthSummary.color} border-0`}>
              {healthSummary.status}
            </Badge>
          </div>

          <Progress
            value={healthSummary.overallScore}
            className="w-full h-3 mb-2"
          />

          <p className={`text-sm font-medium ${healthSummary.color}`}>
            {healthSummary.description}
          </p>
        </div>

        {/* Métricas de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-blue-600">
              {healthSummary.details.activeInstances}
            </div>
            <div className="text-xs text-muted-foreground">Ativas</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">
              {healthSummary.details.healthyInstances}
            </div>
            <div className="text-xs text-muted-foreground">Saudáveis</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-red-600">
              {healthSummary.details.criticalInstances}
            </div>
            <div className="text-xs text-muted-foreground">Críticas</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon(healthSummary.details.trends.direction)}
              <span className="text-sm font-medium">
                {healthSummary.details.trends.change > 0 ? '+' : ''}{healthSummary.details.trends.change}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Tendência</div>
          </div>
        </div>

        {/* Ações Rápidas */}
        {healthSummary.details.activeInstances > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const activeInstance = instances.find(i => i.status === 'ACTIVE')
                if (activeInstance) {
                  analyzeSpecificInstance(activeInstance.instanceName)
                }
              }}
              disabled={loading}
            >
              <Zap className="h-4 w-4 mr-2" />
              {loading ? 'Analisando...' : 'Análise Detalhada'}
            </Button>

            {healthSummary.riskLevel === 'CRITICAL' && (
              <Button size="sm" variant="destructive">
                <Target className="h-4 w-4 mr-2" />
                Ação Urgente
              </Button>
            )}
          </div>
        )}

        {/* Alertas para problemas críticos */}
        {healthSummary.details.criticalInstances > 0 && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Atenção Necessária</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              {healthSummary.details.criticalInstances} instância(s) com problemas críticos detectados.
              Recomendamos análise imediata para evitar suspensão da conta.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}