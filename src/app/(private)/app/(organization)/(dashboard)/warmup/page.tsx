'use client'

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
import { api } from '@/igniter.client'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ExternalNumbersDialog } from './components/external-numbers-dialog'
import { HealthRadialChart } from './components/health-radial-chart'
import { ChartRadarDots } from './components/warmup-charts'
import { WarmupConfigDialog } from './components/warmup-config-dialog'

interface WarmupInstance {
  instanceName: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ERROR' | 'INACTIVE'
  progress: number
  lastActive?: Date
  warmupTime: number
  targetDuration: number
  startTime?: Date
  pauseTime?: Date
}

interface WarmupSummary {
  totalInstances: number
  activeInstances: number
  pausedInstances: number
  completedInstances: number
  globalStatus: string
}

interface WhatsAppInstance {
  id: string
  instanceName: string
  profileName?: string
  status: 'open' | 'close' | 'connecting'
  ownerJid?: string
  profilePicUrl?: string
}

export default function WarmupPage() {
  const [instances, setInstances] = useState<WarmupInstance[]>([])
  const [whatsappInstances, setWhatsappInstances] = useState<
    WhatsAppInstance[]
  >([])
  const [summary, setSummary] = useState<WarmupSummary>({
    totalInstances: 0,
    activeInstances: 0,
    pausedInstances: 0,
    completedInstances: 0,
    globalStatus: 'INACTIVE',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isExternalNumbersDialogOpen, setIsExternalNumbersDialogOpen] =
    useState(false)
  const [selectedInstances, setSelectedInstances] = useState<string[]>([])

  // Buscar status do warmup
  const fetchWarmupStatus = useCallback(async () => {
    if (isLoading) return

    try {
      setIsLoading(true)

      const response = await fetch('/api/v1/warmup/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Falha ao buscar status')
      }

      const data = await response.json()

      if (data.success) {
        setSummary(data.summary)

        // Converter os dados das instâncias para o formato esperado
        const instancesList = Object.entries(data.instances).map(
          ([instanceName, instanceData]: [string, any]) => ({
            instanceName,
            status: instanceData.status,
            progress: instanceData.progress || 0,
            lastActive: instanceData.lastActive
              ? new Date(instanceData.lastActive)
              : undefined,
            warmupTime: instanceData.warmupTime || 0,
            targetDuration: instanceData.targetDuration || 2073600, // 24 dias em segundos
            startTime: instanceData.startTime
              ? new Date(instanceData.startTime)
              : undefined,
            pauseTime: instanceData.pauseTime
              ? new Date(instanceData.pauseTime)
              : undefined,
          }),
        )

        setInstances(instancesList)
      }
    } catch (error) {
      console.error('Erro ao buscar status do aquecimento:', error)
      toast.error('Erro ao carregar dados do aquecimento')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  // Buscar instâncias do WhatsApp disponíveis
  const fetchWhatsAppInstances = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/warmup/whatsapp-instances', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Falha ao buscar instâncias')
      }

      const data = await response.json()

      if (data.success) {
        setWhatsappInstances(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias do WhatsApp:', error)
      toast.error('Erro ao carregar instâncias do WhatsApp')
    }
  }, [])

  // Função para atualizar dados após iniciar warmup
  const refreshAfterWarmupStart = useCallback(async () => {
    // Aguardar um pouco para o backend processar
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // Atualizar dados
    await fetchWarmupStatus()
    await fetchWhatsAppInstances()
  }, [fetchWarmupStatus, fetchWhatsAppInstances])

  // Atualização automática a cada 30 segundos quando há instâncias ativas
  useEffect(() => {
    if (summary.activeInstances > 0) {
      const interval = setInterval(() => {
        fetchWarmupStatus()
      }, 30000) // 30 segundos

      return () => clearInterval(interval)
    }
  }, [summary.activeInstances, fetchWarmupStatus])

  // Parar aquecimento de uma instância específica
  const handleStopInstance = async (instanceName: string) => {
    try {
      const result = await (api.warmup.stopWarmup as any).mutate({
        body: { instanceName },
      })

      console.log('[Warmup] Resposta da API:', result)
      toast.success(`Aquecimento parado para ${instanceName}`)
      await fetchWarmupStatus() // Recarregar dados
    } catch (error: any) {
      console.error('Erro ao parar aquecimento:', error)

      let errorMessage = 'Erro ao parar aquecimento'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      }

      toast.error(errorMessage)
    }
  }

  // Parar todos os aquecimentos
  const handleStopAll = async () => {
    try {
      const result = await (api.warmup.stopAllWarmups as any).mutate()

      console.log('[Warmup] Resposta da API (stop all):', result)
      toast.success('Todos os aquecimentos foram parados')
      await fetchWarmupStatus()
    } catch (error: any) {
      console.error('Erro ao parar todos os aquecimentos:', error)

      let errorMessage = 'Erro ao parar todos os aquecimentos'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      }

      toast.error(errorMessage)
    }
  }

  // Alternar seleção de instância
  const toggleInstanceSelection = (instanceName: string) => {
    setSelectedInstances((prev) =>
      prev.includes(instanceName)
        ? prev.filter((name) => name !== instanceName)
        : [...prev, instanceName],
    )
  }

  // Carregamento inicial
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('[WarmupPage] Componente montado - carregando dados iniciais')
      await fetchWarmupStatus()
      await fetchWhatsAppInstances()
    }

    loadInitialData()
  }, [fetchWarmupStatus, fetchWhatsAppInstances]) // Executa apenas no mount

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getStatusBadge = (status: WarmupInstance['status']) => {
    const variants = {
      ACTIVE: 'default',
      PAUSED: 'secondary',
      COMPLETED: 'outline',
      ERROR: 'destructive',
      INACTIVE: 'secondary',
    } as const

    const labels = {
      ACTIVE: 'Ativo',
      PAUSED: 'Pausado',
      COMPLETED: 'Completo',
      ERROR: 'Erro',
      INACTIVE: 'Inativo',
    }

    const icons = {
      ACTIVE: <Activity className="h-3 w-3" />,
      PAUSED: <Pause className="h-3 w-3" />,
      COMPLETED: <CheckCircle2 className="h-3 w-3" />,
      ERROR: <AlertCircle className="h-3 w-3" />,
      INACTIVE: <Clock className="h-3 w-3" />,
    }

    return (
      <Badge variant={variants[status] || 'secondary'} className="gap-1">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    )
  }

  // Função para calcular a saúde do sistema baseada no progresso das instâncias
  const getSystemHealth = () => {
    if (instances.length === 0) {
      return {
        score: 0,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        status: 'Sem instâncias',
        description: 'Configure instâncias para monitorar a saúde'
      }
    }

    const activeInstances = instances.filter((i) => i.status === 'ACTIVE')
    if (activeInstances.length === 0) {
      return {
        score: 0,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        status: 'Inativo',
        description: 'Nenhuma instância ativa detectada'
      }
    }

    // Calcular score baseado em múltiplos fatores de saúde
    const healthFactors = activeInstances.map(instance => {
      // Fatores de saúde baseados em ciência de dados
      const progressFactor = instance.progress / 100 // 0-1
      const timeFactor = calculateTimeFactor(instance) // 0-1
      const stabilityFactor = calculateStabilityFactor(instance) // 0-1
      const complianceFactor = calculateComplianceFactor(instance) // 0-1

      // Score ponderado (seguindo padrões do WhatsApp Business)
      const healthScore = (
        progressFactor * 0.30 +      // 30% - Progresso do aquecimento
        timeFactor * 0.25 +          // 25% - Tempo de atividade consistente
        stabilityFactor * 0.25 +     // 25% - Estabilidade da conexão
        complianceFactor * 0.20      // 20% - Compliance com políticas
      ) * 100

      return {
        instanceName: instance.instanceName,
        healthScore,
        riskLevel: determineRiskLevel(healthScore),
        factors: {
          progress: progressFactor,
          time: timeFactor,
          stability: stabilityFactor,
          compliance: complianceFactor
        }
      }
    })

    // Score geral da organização
    const avgHealthScore = healthFactors.reduce((sum, h) => sum + h.healthScore, 0) / healthFactors.length

    // Detectar instâncias em risco
    const criticalInstances = healthFactors.filter(h => h.riskLevel === 'CRITICAL').length
    const highRiskInstances = healthFactors.filter(h => h.riskLevel === 'HIGH').length

    // Determinar status geral baseado em análise avançada
    let status: string
    let description: string
    let color: string
    let bgColor: string

    if (criticalInstances > 0) {
      status = 'Crítico'
      description = `${criticalInstances} instância(s) em risco crítico`
      color = 'text-red-600'
      bgColor = 'bg-red-100'
    } else if (highRiskInstances > 0) {
      status = 'Atenção'
      description = `${highRiskInstances} instância(s) requer atenção`
      color = 'text-orange-600'
      bgColor = 'bg-orange-100'
    } else if (avgHealthScore >= 85) {
      status = 'Excelente'
      description = 'Todas as instâncias estão saudáveis'
      color = 'text-green-600'
      bgColor = 'bg-green-100'
    } else if (avgHealthScore >= 70) {
      status = 'Boa'
      description = 'Sistema funcionando adequadamente'
      color = 'text-blue-600'
      bgColor = 'bg-blue-100'
    } else if (avgHealthScore >= 50) {
      status = 'Regular'
      description = 'Algumas melhorias recomendadas'
      color = 'text-yellow-600'
      bgColor = 'bg-yellow-100'
    } else {
      status = 'Ruim'
      description = 'Ação corretiva necessária'
      color = 'text-orange-600'
      bgColor = 'bg-orange-100'
    }

    return {
      score: Math.round(avgHealthScore),
      color,
      bgColor,
      status,
      description,
      details: {
        totalInstances: instances.length,
        activeInstances: activeInstances.length,
        healthyInstances: healthFactors.filter(h => h.healthScore >= 70).length,
        criticalInstances,
        highRiskInstances,
        averageScore: avgHealthScore,
        instancesHealth: healthFactors
      }
    }
  }

  // Funções auxiliares para cálculo avançado de saúde
  const calculateTimeFactor = (instance: WarmupInstance): number => {
    if (!instance.startTime) return 0.5

    const now = new Date()
    const startTime = new Date(instance.startTime)
    const elapsedHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    // Fator baseado na consistência temporal (24 dias = 576 horas)
    const targetHours = instance.targetDuration / 3600 // converter segundos para horas
    const timeFactor = Math.min(elapsedHours / targetHours, 1)

    // Penalizar paradas frequentes
    const lastActiveHours = instance.lastActive
      ? (now.getTime() - new Date(instance.lastActive).getTime()) / (1000 * 60 * 60)
      : 0

    const activityPenalty = lastActiveHours > 2 ? 0.8 : 1 // Penalidade se inativo por > 2h

    return timeFactor * activityPenalty
  }

  const calculateStabilityFactor = (instance: WarmupInstance): number => {
    // Baseado no status e histórico de conexão
    const statusScore = instance.status === 'ACTIVE' ? 1 :
      instance.status === 'PAUSED' ? 0.6 :
        instance.status === 'ERROR' ? 0.2 : 0.8

    // Fator de estabilidade baseado em uptime
    const uptimeFactor = instance.pauseTime ? 0.7 : 1.0

    return statusScore * uptimeFactor
  }

  const calculateComplianceFactor = (instance: WarmupInstance): number => {
    // Simular compliance baseado em padrões observados
    const progressPenalty = instance.progress < 10 ? 0.8 : 1.0 // Penalizar progresso muito baixo
    const timingCompliance = 0.9 // Assumir 90% de compliance temporal
    const volumeCompliance = 0.95 // Assumir 95% de compliance de volume

    return progressPenalty * timingCompliance * volumeCompliance
  }

  const determineRiskLevel = (healthScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    if (healthScore >= 80) return 'LOW'
    if (healthScore >= 65) return 'MEDIUM'
    if (healthScore >= 40) return 'HIGH'
    return 'CRITICAL'
  }

  const systemHealth = getSystemHealth()

  const getInstanceStatusBadge = (status: WhatsAppInstance['status']) => {
    const variants = {
      open: 'default',
      close: 'destructive',
      connecting: 'secondary',
    } as const

    const labels = {
      open: 'Conectado',
      close: 'Desconectado',
      connecting: 'Conectando',
    }

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    )
  }

  if (isLoading && instances.length === 0 && whatsappInstances.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Aquecimento WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Gerencie o aquecimento das suas instâncias WhatsApp para melhorar a
            saúde das contas
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExternalNumbersDialogOpen(true)}
            className="gap-2 order-3 sm:order-1"
            size="sm"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Números Externos</span>
            <span className="sm:hidden">Números</span>
          </Button>

          <Button
            variant="outline"
            onClick={fetchWarmupStatus}
            disabled={isLoading}
            className="gap-2 order-2"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            onClick={() => setIsConfigDialogOpen(true)}
            className="gap-2 order-1 sm:order-3"
            disabled={selectedInstances.length === 0}
            size="sm"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Configurar Aquecimento</span>
            <span className="sm:hidden">Configurar</span>
            {selectedInstances.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedInstances.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-6">
        {/* Cards de status - todos na mesma linha */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-slate-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium leading-tight">
                Total
              </CardTitle>
              <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <MessageSquare className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                {summary.totalInstances}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                instâncias
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium leading-tight">
                Ativas
              </CardTitle>
              <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/20">
                <Activity className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {summary.activeInstances}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                aquecendo
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium leading-tight">
                Pausadas
              </CardTitle>
              <div className="p-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <Pause className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.pausedInstances}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                paradas
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium leading-tight">
                Completas
              </CardTitle>
              <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {summary.completedInstances}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                finalizadas
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium leading-tight">
                Progresso
              </CardTitle>
              <div
                className={`p-1 rounded-full ${systemHealth.bgColor} dark:bg-opacity-20`}
              >
                <TrendingUp className={`h-3 w-3 ${systemHealth.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className={`text-xl font-bold ${systemHealth.color}`}>
                {systemHealth.score.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                médio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Segunda linha - Card de progresso médio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">


          {/* Cards adicionais podem ser adicionados aqui */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="flex items-center justify-center gap-4 text-sm">
                <Zap className="h-4 w-4" />
                <span>
                  O sistema está monitorando {summary.totalInstances} instâncias
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="order-2 xl:order-1">
          <ChartRadarDots instances={instances} />
        </div>
        <div className="order-1 xl:order-2">
          <HealthRadialChart
            instances={instances}
            onAnalyzeHealth={(instanceName) => {
              toast.success(`Análise detalhada iniciada para ${instanceName || 'sistema'}`)
              // Aqui você pode adicionar lógica adicional se necessário
            }}
          />
        </div>
      </div>

      {/* WhatsApp Instances Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instâncias WhatsApp</CardTitle>
              <CardDescription>
                Selecione as instâncias para configurar o aquecimento
              </CardDescription>
            </div>
            <Badge variant="outline">
              {whatsappInstances.length} disponíveis
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {whatsappInstances.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                Nenhuma instância encontrada
              </h3>
              <p className="text-muted-foreground">
                Crie instâncias WhatsApp para começar o aquecimento
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {whatsappInstances.map((instance) => (
                <Card
                  key={instance.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedInstances.includes(instance.instanceName)
                    ? 'ring-2 ring-primary bg-muted/30'
                    : ''
                    }`}
                  onClick={() => toggleInstanceSelection(instance.instanceName)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {instance.instanceName}
                      </CardTitle>
                      {getInstanceStatusBadge(instance.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {instance.profileName || 'Sem nome'}
                        </span>
                      </div>
                      {instance.ownerJid && (
                        <div className="text-xs text-muted-foreground truncate">
                          {instance.ownerJid}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Warmup Instances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instâncias em Aquecimento</CardTitle>
              <CardDescription>
                Status e progresso de cada instância de aquecimento
              </CardDescription>
            </div>

            {summary.activeInstances > 0 && (
              <Button
                variant="outline"
                onClick={handleStopAll}
                className="gap-2"
              >
                <Pause className="h-4 w-4" />
                Parar Todos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                Nenhuma instância em aquecimento
              </h3>
              <p className="text-muted-foreground">
                Configure o aquecimento para começar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => (
                <Card key={instance.instanceName} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{instance.instanceName}</h4>
                      {getStatusBadge(instance.status)}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(instance.warmupTime)} /{' '}
                        {formatDuration(instance.targetDuration)}
                      </div>
                      {instance.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStopInstance(instance.instanceName)
                          }
                          className="gap-2"
                        >
                          <Pause className="h-3 w-3" />
                          Parar
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progresso do Aquecimento</span>
                      <span className="font-medium">
                        {instance.progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={instance.progress} className="h-2" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">
                          Iniciado
                        </div>
                        <div className="text-sm font-medium">
                          {instance.startTime?.toLocaleDateString() || '-'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">
                          Última Atividade
                        </div>
                        <div className="text-sm font-medium">
                          {instance.lastActive?.toLocaleTimeString() || '-'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">
                          Tempo Decorrido
                        </div>
                        <div className="text-sm font-medium">
                          {formatDuration(instance.warmupTime)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">
                          Previsão
                        </div>
                        <div className="text-sm font-medium">
                          {instance.status === 'ACTIVE'
                            ? formatDuration(
                              instance.targetDuration - instance.warmupTime,
                            )
                            : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <WarmupConfigDialog
        open={isConfigDialogOpen}
        onOpenChange={setIsConfigDialogOpen}
        onSuccess={async () => {
          // Aguardar um pouco para o backend processar
          await new Promise((resolve) => setTimeout(resolve, 2000))
          // Atualizar dados
          await fetchWarmupStatus()
          await fetchWhatsAppInstances()
        }}
        selectedInstances={selectedInstances}
        onInstanceToggle={toggleInstanceSelection}
      />

      <ExternalNumbersDialog
        open={isExternalNumbersDialogOpen}
        onOpenChange={setIsExternalNumbersDialogOpen}
      />
    </div>
  )
}
