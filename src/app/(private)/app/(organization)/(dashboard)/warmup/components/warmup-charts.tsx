'use client'

import { Activity, AlertCircle, Clock, Pause, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface MessageStats {
  text: number
  image: number
  video: number
  audio: number
  sticker: number
  reaction: number
  totalSent: number
}

interface ChartRadarDotsProps {
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
}

const chartConfig = {
  messages: {
    label: 'Mensagens',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function ChartRadarDots({ instances }: ChartRadarDotsProps) {
  const [messageStats, setMessageStats] = useState<MessageStats>({
    text: 0,
    image: 0,
    video: 0,
    audio: 0,
    sticker: 0,
    reaction: 0,
    totalSent: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  // Buscar estatísticas reais da API com debounce
  const fetchMessageStats = useCallback(async () => {
    const now = Date.now()

    // Evitar múltiplas chamadas em um curto período
    if (now - lastFetchTime < 5000) { // 5 segundos de debounce
      return
    }

    try {
      setIsLoading(true)
      setLastFetchTime(now)

      const response = await fetch('/api/v1/warmup/message-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas')
      }

      const data = await response.json()
      if (data.success) {
        setMessageStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de mensagens:', error)
      // Manter valores padrão em caso de erro
    } finally {
      setIsLoading(false)
    }
  }, [lastFetchTime])

  useEffect(() => {
    // Só buscar se há mudança significativa nas instâncias ativas
    const activeCount = instances.filter((i) => i.status === 'ACTIVE').length
    const shouldFetch = activeCount > 0 || messageStats.totalSent === 0

    if (shouldFetch) {
      fetchMessageStats()
    } else {
      setIsLoading(false)
    }
  }, [instances.length, instances.filter(i => i.status === 'ACTIVE').length]) // Dependências mais específicas

  const chartData = [
    {
      type: 'Texto',
      messages: messageStats.text,
      fill: 'hsl(220, 70%, 50%)', // Azul
    },
    {
      type: 'Imagem',
      messages: messageStats.image,
      fill: 'hsl(142, 76%, 36%)', // Verde
    },
    {
      type: 'Vídeo',
      messages: messageStats.video,
      fill: 'hsl(48, 96%, 53%)', // Amarelo
    },
    {
      type: 'Áudio',
      messages: messageStats.audio,
      fill: 'hsl(262, 83%, 58%)', // Roxo
    },
    {
      type: 'Sticker',
      messages: messageStats.sticker,
      fill: 'hsl(346, 87%, 43%)', // Rosa
    },
    {
      type: 'Reação',
      messages: messageStats.reaction,
      fill: 'hsl(25, 95%, 53%)', // Laranja
    },
  ]

  const activeInstances = instances.filter((i) => i.status === 'ACTIVE').length
  const totalInstances = instances.length

  // Determinar cor e ícone baseado no status
  const getStatusDisplay = () => {
    if (activeInstances === 0) {
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: <Clock className="h-4 w-4" />,
        status: 'Inativo'
      }
    }

    const ratio = activeInstances / totalInstances
    if (ratio >= 0.8) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: <Activity className="h-4 w-4" />,
        status: 'Excelente'
      }
    } else if (ratio >= 0.5) {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: <Activity className="h-4 w-4" />,
        status: 'Boa'
      }
    } else {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        icon: <AlertCircle className="h-4 w-4" />,
        status: 'Atenção'
      }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader className="items-center pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className={`p-2 rounded-full ${statusDisplay.bgColor}`}>
            <span className={statusDisplay.color}>
              {statusDisplay.icon}
            </span>
          </span>
          Tipos de Mensagens Enviadas
        </CardTitle>
        <CardDescription>
          Distribuição por tipo de conteúdo durante o aquecimento
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Carregando estatísticas...</p>
            </div>
          </div>
        ) : messageStats.totalSent === 0 ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Aguardando início do aquecimento</p>
              <p className="text-sm text-muted-foreground">
                Configure e inicie o aquecimento para ver as estatísticas
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[280px]"
          >
            <RadarChart data={chartData}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <PolarAngleAxis
                dataKey="type"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => {
                  // Truncar textos longos
                  if (value.length > 8) {
                    return value.substring(0, 7) + '...'
                  }
                  return value
                }}
              />
              <PolarGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <Radar
                dataKey="messages"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fillOpacity: 1,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-3 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {messageStats.totalSent > 0 ? (
            <>
              <span className="text-lg font-bold text-primary">
                {messageStats.totalSent.toLocaleString()}
              </span>
              <span>mensagens enviadas</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </>
          ) : (
            <span className="text-muted-foreground">Nenhuma mensagem enviada ainda</span>
          )}
        </div>

        <div className="flex items-center justify-between w-full">
          <div className={`flex items-center gap-2 ${statusDisplay.color}`}>
            {statusDisplay.icon}
            <span className="font-medium">{statusDisplay.status}</span>
          </div>

          <div className="text-muted-foreground text-xs">
            {activeInstances > 0 ? (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-600" />
                {activeInstances} de {totalInstances} ativas
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Pause className="h-3 w-3 text-gray-500" />
                Nenhuma instância ativa
              </span>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}