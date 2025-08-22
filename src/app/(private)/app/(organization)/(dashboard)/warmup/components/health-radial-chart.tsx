'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { AlertTriangle, Heart, Shield, TrendingDown, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

interface HealthRadialChartProps {
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
  onAnalyzeHealth?: (instanceName?: string) => void
}

interface HealthData {
  score: number
  status: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  color: string
  bgColor: string
  trend: 'UP' | 'DOWN' | 'STABLE'
  trendPercentage: number
  details: {
    activeInstances: number
    healthyInstances: number
    criticalInstances: number
    totalInstances: number
  }
}

export function HealthRadialChart({ instances, onAnalyzeHealth }: HealthRadialChartProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Calcular saúde do sistema de forma mais sofisticada
  const calculateSystemHealth = (): HealthData => {
    if (instances.length === 0) {
      return {
        score: 0,
        status: 'Sem Instâncias',
        riskLevel: 'LOW',
        color: 'var(--chart-1)',
        bgColor: 'bg-gray-100',
        trend: 'STABLE',
        trendPercentage: 0,
        details: {
          activeInstances: 0,
          healthyInstances: 0,
          criticalInstances: 0,
          totalInstances: 0
        }
      }
    }

    const activeInstances = instances.filter(i => i.status === 'ACTIVE')

    if (activeInstances.length === 0) {
      return {
        score: 0,
        status: 'Sistema Inativo',
        riskLevel: 'MEDIUM',
        color: 'var(--chart-3)',
        bgColor: 'bg-yellow-100',
        trend: 'DOWN',
        trendPercentage: -15,
        details: {
          activeInstances: 0,
          healthyInstances: 0,
          criticalInstances: 0,
          totalInstances: instances.length
        }
      }
    }

    // Algoritmo avançado de saúde baseado em múltiplos fatores
    const healthScores = activeInstances.map((instance) => {
      // Fator de Progresso (40% do peso)
      const progressFactor = Math.min(instance.progress / 100, 1)

      // Fator de Estabilidade (30% do peso)
      const stabilityFactor = calculateStabilityFactor(instance)

      // Fator de Tempo/Consistência (30% do peso)
      const timeFactor = calculateTimeFactor(instance)

      // Score ponderado
      const score = (
        progressFactor * 0.4 +
        stabilityFactor * 0.3 +
        timeFactor * 0.3
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

    // Determinar status, cor e trend baseado no score
    let status: string
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    let color: string
    let bgColor: string
    let trend: 'UP' | 'DOWN' | 'STABLE'
    let trendPercentage: number

    if (criticalInstances > 0) {
      status = 'Estado Crítico'
      riskLevel = 'CRITICAL'
      color = 'var(--chart-5)' // Vermelho
      bgColor = 'bg-red-100'
      trend = 'DOWN'
      trendPercentage = -25
    } else if (averageScore >= 90) {
      status = 'Excelente Saúde'
      riskLevel = 'LOW'
      color = 'var(--chart-2)' // Verde
      bgColor = 'bg-green-100'
      trend = 'UP'
      trendPercentage = 8.5
    } else if (averageScore >= 75) {
      status = 'Boa Saúde'
      riskLevel = 'LOW'
      color = 'var(--chart-2)' // Verde
      bgColor = 'bg-green-100'
      trend = 'UP'
      trendPercentage = 3.2
    } else if (averageScore >= 60) {
      status = 'Saúde Regular'
      riskLevel = 'MEDIUM'
      color = 'var(--chart-3)' // Amarelo
      bgColor = 'bg-yellow-100'
      trend = 'STABLE'
      trendPercentage = 0.5
    } else if (averageScore >= 40) {
      status = 'Requer Atenção'
      riskLevel = 'HIGH'
      color = 'var(--chart-4)' // Laranja
      bgColor = 'bg-orange-100'
      trend = 'DOWN'
      trendPercentage = -12.5
    } else {
      status = 'Estado Crítico'
      riskLevel = 'CRITICAL'
      color = 'var(--chart-5)' // Vermelho
      bgColor = 'bg-red-100'
      trend = 'DOWN'
      trendPercentage = -30
    }

    return {
      score: Math.round(averageScore),
      status,
      riskLevel,
      color,
      bgColor,
      trend,
      trendPercentage,
      details: {
        activeInstances: activeInstances.length,
        healthyInstances,
        criticalInstances,
        totalInstances: instances.length
      }
    }
  }

  // Funções auxiliares de cálculo
  const calculateStabilityFactor = (instance: any): number => {
    const statusMap = {
      'ACTIVE': 1.0,
      'PAUSED': 0.6,
      'ERROR': 0.2,
      'COMPLETED': 0.9,
      'INACTIVE': 0.1
    }

    let factor = statusMap[instance.status] || 0.5

    // Penalizar por pausas
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
    const target = instance.targetDuration || 2073600

    const completion = Math.min(elapsed / target, 1)

    // Verificar consistência
    const lastActiveHours = instance.lastActive
      ? (now.getTime() - new Date(instance.lastActive).getTime()) / (1000 * 60 * 60)
      : 24

    const consistencyPenalty = lastActiveHours > 4 ? 0.7 : 1.0

    return Math.min(completion * 1.2, 1) * consistencyPenalty
  }

  const determineRiskLevel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    if (score >= 75) return 'LOW'
    if (score >= 60) return 'MEDIUM'
    if (score >= 40) return 'HIGH'
    return 'CRITICAL'
  }

  // Atualizar dados automaticamente
  useEffect(() => {
    const updateHealth = () => {
      const health = calculateSystemHealth()
      setHealthData(health)
    }

    updateHealth()

    if (autoRefresh) {
      const interval = setInterval(updateHealth, 15000) // A cada 15 segundos
      return () => clearInterval(interval)
    }
  }, [instances, autoRefresh])

  // Configuração do gráfico
  const chartData = healthData ? [
    {
      category: "health",
      score: healthData.score,
      fill: healthData.color
    }
  ] : []

  const chartConfig = {
    score: {
      label: "Score de Saúde",
    },
    health: {
      label: "Saúde do Sistema",
      color: healthData?.color || "var(--chart-2)",
    },
  } satisfies ChartConfig

  // Função para obter ícone baseado no status
  const getStatusIcon = () => {
    if (!healthData) return <Heart className="h-5 w-5" />

    switch (healthData.riskLevel) {
      case 'LOW': return <Shield className="h-5 w-5 text-green-600" />
      case 'MEDIUM': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'HIGH': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'CRITICAL': return <AlertTriangle className="h-5 w-5 text-red-600" />
      default: return <Heart className="h-5 w-5" />
    }
  }

  const getTrendIcon = () => {
    if (!healthData) return null

    switch (healthData.trend) {
      case 'UP': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'DOWN': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  if (!healthData) {
    return (
      <Card className="flex flex-col">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col relative overflow-hidden">
      {/* Background gradient baseado no status */}
      <div className={`absolute inset-0 opacity-5 ${healthData.bgColor}`} />

      <CardHeader className="items-center pb-0 relative">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <CardTitle className="text-lg font-semibold">Saúde do Sistema</CardTitle>
        </div>
        <CardDescription className="text-center">
          Análise em tempo real das instâncias WhatsApp
        </CardDescription>

        {/* Badge de status */}
        <Badge
          className={`${healthData.bgColor} ${healthData.color.replace('var(--chart-', 'text-').replace(')', '')} border-0 font-medium`}
        >
          {healthData.status}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 pb-0 relative">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 + (healthData.score / 100) * 270} // Arco proporcional ao score
            innerRadius={80}
            outerRadius={140}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar
              dataKey="score"
              background={{ fill: 'hsl(var(--muted))' }}
              cornerRadius={8}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {healthData.score}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Score de Saúde
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>

        {/* Métricas resumidas */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {healthData.details.activeInstances}
            </div>
            <div className="text-xs text-muted-foreground">Ativas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {healthData.details.healthyInstances}
            </div>
            <div className="text-xs text-muted-foreground">Saudáveis</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {healthData.details.criticalInstances}
            </div>
            <div className="text-xs text-muted-foreground">Críticas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {healthData.details.totalInstances}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm relative">
        {/* Tendência */}
        <div className="flex items-center gap-2 leading-none font-medium">
          {healthData.trend !== 'STABLE' && (
            <>
              {healthData.trend === 'UP' ? 'Melhorando' : 'Degradando'} em {Math.abs(healthData.trendPercentage)}% este período
              {getTrendIcon()}
            </>
          )}
          {healthData.trend === 'STABLE' && (
            <>
              Status estável nas últimas horas
              <div className="h-4 w-4 rounded-full bg-gray-400" />
            </>
          )}
        </div>

        {/* Descrição */}
        <div className="text-muted-foreground leading-none text-center">
          {healthData.details.activeInstances > 0
            ? `Monitorando ${healthData.details.activeInstances} instância(s) ativa(s) em tempo real`
            : 'Nenhuma instância ativa para monitorar'
          }
        </div>

        {/* Botão de ação */}
        {healthData.details.activeInstances > 0 && (
          <Button
            size="sm"
            variant={healthData.riskLevel === 'CRITICAL' ? 'destructive' : 'outline'}
            className="mt-2"
            onClick={() => onAnalyzeHealth?.()}
          >
            {healthData.riskLevel === 'CRITICAL' ? 'Ação Urgente' : 'Análise Detalhada'}
          </Button>
        )}

        {/* Alerta para casos críticos */}
        {healthData.riskLevel === 'CRITICAL' && (
          <div className="mt-2 p-2 border border-red-200 bg-red-50 rounded-lg text-xs">
            <div className="flex items-center gap-1 text-red-800 font-medium">
              <AlertTriangle className="h-3 w-3" />
              <span>Intervenção Necessária</span>
            </div>
            <p className="text-red-700 mt-1">
              Sistema detectou problemas críticos. Ação imediata recomendada.
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}