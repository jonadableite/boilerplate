'use client'

import { Activity, AlertCircle, CheckCircle, Minus, Zap } from 'lucide-react'
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'

interface WarmupSummary {
  totalInstances: number
  activeInstances: number
  pausedInstances: number
  completedInstances: number
  globalStatus: string
}

interface ChartRadialShapeProps {
  summary: WarmupSummary
}

const chartConfig = {
  health: {
    label: 'Saúde do Sistema',
  },
  active: {
    label: 'Ativo',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function ChartRadialShape({ summary }: ChartRadialShapeProps) {
  // Calcular a saúde geral do sistema
  const calculateHealthScore = () => {
    if (summary.totalInstances === 0) return 0

    const activeRatio = summary.activeInstances / summary.totalInstances
    const completedRatio = summary.completedInstances / summary.totalInstances
    const pausedRatio = summary.pausedInstances / summary.totalInstances

    // Fórmula de saúde melhorada: instâncias ativas (peso 70%) + completas (peso 25%) - pausadas (peso 5%)
    const healthScore = Math.round(
      (activeRatio * 70 + completedRatio * 25 - pausedRatio * 5)
    )

    return Math.max(0, Math.min(100, healthScore))
  }

  const healthScore = calculateHealthScore()

  // Determinar cor baseada na pontuação (sem backgrounds coloridos)
  const getHealthColor = () => {
    if (healthScore >= 80) return 'hsl(142, 76%, 36%)' // Verde vibrante
    if (healthScore >= 60) return 'hsl(220, 70%, 50%)' // Azul vibrante
    if (healthScore >= 40) return 'hsl(48, 96%, 53%)' // Amarelo vibrante
    if (healthScore >= 20) return 'hsl(25, 95%, 53%)' // Laranja vibrante
    return 'hsl(0, 84%, 60%)' // Vermelho vibrante
  }

  const healthColor = getHealthColor()

  const chartData = [
    {
      category: 'health',
      value: healthScore,
      fill: healthColor
    },
  ]

  // Determinar status e ícone baseado na pontuação
  const getHealthStatus = () => {
    if (healthScore >= 80) return {
      status: 'Excelente',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      icon: CheckCircle,
      variant: 'default' as const
    }
    if (healthScore >= 60) return {
      status: 'Boa',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      icon: Activity,
      variant: 'secondary' as const
    }
    if (healthScore >= 40) return {
      status: 'Regular',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      icon: Minus,
      variant: 'outline' as const
    }
    if (healthScore >= 20) return {
      status: 'Atenção',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      icon: AlertCircle,
      variant: 'destructive' as const
    }
    return {
      status: 'Crítico',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      icon: AlertCircle,
      variant: 'destructive' as const
    }
  }

  const healthStatus = getHealthStatus()
  const StatusIcon = healthStatus.icon

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-lg">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <span className={`p-2 rounded-full ${healthStatus.bgColor}`}>
            <StatusIcon className={`h-5 w-5 ${healthStatus.color}`} />
          </span>
          Saúde do Sistema
        </CardTitle>
        <CardDescription>
          Índice geral de saúde das instâncias de aquecimento
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={450}
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
              dataKey="value"
              background={{ fill: 'hsl(var(--muted))' }}
              cornerRadius={10}
              fill={healthColor}
              className="transition-all duration-500"
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
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
                          style={{ fill: healthColor }}
                        >
                          {healthScore}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Saúde Geral
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-3 text-sm">
        <div className="flex items-center justify-center">
          <Badge variant={healthStatus.variant} className="flex items-center gap-2 text-sm px-3 py-1">
            <StatusIcon className="h-4 w-4" />
            Sistema: {healthStatus.status}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full text-center">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-600" />
              <span className="font-bold text-green-600">{summary.activeInstances}</span>
            </div>
            <span className="text-xs text-muted-foreground">Ativas</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <Minus className="h-3 w-3 text-yellow-600" />
              <span className="font-bold text-yellow-600">{summary.pausedInstances}</span>
            </div>
            <span className="text-xs text-muted-foreground">Pausadas</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-blue-600" />
              <span className="font-bold text-blue-600">{summary.completedInstances}</span>
            </div>
            <span className="text-xs text-muted-foreground">Completas</span>
          </div>
        </div>

        {summary.totalInstances > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Total: {summary.totalInstances} instâncias configuradas</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}