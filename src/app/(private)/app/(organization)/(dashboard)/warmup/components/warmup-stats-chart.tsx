'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface WarmupStats {
  instanceName: string
  totalMessages: number
  textMessages: number
  imageMessages: number
  videoMessages: number
  audioMessages: number
  stickerMessages: number
  reactionsCount: number
  date: string
}

export function WarmupStatsChart() {
  const [stats, setStats] = useState<WarmupStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Por enquanto, vamos usar dados mockados até implementarmos a API
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Dados mockados para demonstração
        const mockStats: WarmupStats[] = [
          {
            instanceName: 'Instance 1',
            totalMessages: 45,
            textMessages: 20,
            imageMessages: 8,
            videoMessages: 3,
            audioMessages: 7,
            stickerMessages: 5,
            reactionsCount: 2,
            date: new Date().toISOString(),
          },
          {
            instanceName: 'Instance 2',
            totalMessages: 32,
            textMessages: 15,
            imageMessages: 6,
            videoMessages: 2,
            audioMessages: 5,
            stickerMessages: 3,
            reactionsCount: 1,
            date: new Date().toISOString(),
          },
          {
            instanceName: 'Instance 3',
            totalMessages: 28,
            textMessages: 12,
            imageMessages: 5,
            videoMessages: 1,
            audioMessages: 6,
            stickerMessages: 3,
            reactionsCount: 1,
            date: new Date().toISOString(),
          },
        ]

        setStats(mockStats)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const messageTypeData = stats.map(stat => ({
    instance: stat.instanceName,
    Textos: stat.textMessages,
    Imagens: stat.imageMessages,
    Vídeos: stat.videoMessages,
    Áudios: stat.audioMessages,
    Stickers: stat.stickerMessages,
    Reações: stat.reactionsCount,
  }))

  const totalStats = stats.reduce(
    (acc, curr) => ({
      totalMessages: acc.totalMessages + curr.totalMessages,
      textMessages: acc.textMessages + curr.textMessages,
      imageMessages: acc.imageMessages + curr.imageMessages,
      videoMessages: acc.videoMessages + curr.videoMessages,
      audioMessages: acc.audioMessages + curr.audioMessages,
      stickerMessages: acc.stickerMessages + curr.stickerMessages,
      reactionsCount: acc.reactionsCount + curr.reactionsCount,
    }),
    {
      totalMessages: 0,
      textMessages: 0,
      imageMessages: 0,
      videoMessages: 0,
      audioMessages: 0,
      stickerMessages: 0,
      reactionsCount: 0,
    }
  )

  const pieData = [
    { name: 'Textos', value: totalStats.textMessages, color: '#3b82f6' },
    { name: 'Imagens', value: totalStats.imageMessages, color: '#10b981' },
    { name: 'Vídeos', value: totalStats.videoMessages, color: '#f59e0b' },
    { name: 'Áudios', value: totalStats.audioMessages, color: '#ef4444' },
    { name: 'Stickers', value: totalStats.stickerMessages, color: '#8b5cf6' },
    { name: 'Reações', value: totalStats.reactionsCount, color: '#f97316' },
  ].filter(item => item.value > 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Aquecimento</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Aquecimento</CardTitle>
          <CardDescription>
            Gráficos e métricas do progresso do aquecimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="mx-auto h-12 w-12 mb-4" />
            <p>Nenhuma estatística disponível</p>
            <p className="text-sm">Inicie um aquecimento para ver os dados</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de barras por instância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Mensagens por Instância
          </CardTitle>
          <CardDescription>
            Distribuição de tipos de mensagens por instância
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={messageTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="instance"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="Textos" fill="#3b82f6" name="Textos" />
              <Bar dataKey="Imagens" fill="#10b981" name="Imagens" />
              <Bar dataKey="Vídeos" fill="#f59e0b" name="Vídeos" />
              <Bar dataKey="Áudios" fill="#ef4444" name="Áudios" />
              <Bar dataKey="Stickers" fill="#8b5cf6" name="Stickers" />
              <Bar dataKey="Reações" fill="#f97316" name="Reações" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de pizza - distribuição total */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Distribuição de Conteúdo
          </CardTitle>
          <CardDescription>
            Proporção total de tipos de mensagens enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Resumo numérico */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de mensagens:</span>
                  <span className="font-medium">{totalStats.totalMessages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Textos:</span>
                  <span className="font-medium">{totalStats.textMessages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Imagens:</span>
                  <span className="font-medium">{totalStats.imageMessages}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vídeos:</span>
                  <span className="font-medium">{totalStats.videoMessages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Áudios:</span>
                  <span className="font-medium">{totalStats.audioMessages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stickers:</span>
                  <span className="font-medium">{totalStats.stickerMessages}</span>
                </div>
              </div>
            </div>

            {/* Gráfico de pizza */}
            {pieData.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Legenda */}
            <div className="flex flex-wrap gap-2 justify-center">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
