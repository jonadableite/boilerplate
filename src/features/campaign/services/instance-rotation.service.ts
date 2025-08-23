import { evolutionApi } from '@/plugins/evolution-api.plugin'
import { prisma } from '@/providers/prisma'
import { InstanceHealthInfo, InstanceRotationService } from '../campaign.types'

export class InstanceRotationServiceImpl implements InstanceRotationService {
  /**
   * Obtém a próxima instância disponível para uma campanha
   * Considera saúde, aquecimento e distribuição de carga
   */
  async getNextAvailableInstance(
    campaignId: string,
  ): Promise<InstanceHealthInfo | null> {
    try {
      // 1. Buscar a campanha para obter instâncias selecionadas
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          selectedInstances: true,
          useInstanceRotation: true,
        },
      })

      if (!campaign) {
        throw new Error('Campanha não encontrada')
      }

      if (
        !campaign.useInstanceRotation ||
        campaign.selectedInstances.length === 0
      ) {
        return null
      }

      // 2. Obter informações de saúde de todas as instâncias selecionadas
      const instancesHealth = await this.getAllInstancesHealth()
      const availableInstances = instancesHealth.filter(
        (instance) =>
          campaign.selectedInstances.includes(instance.instanceName) &&
          instance.status === 'open' &&
          instance.isRecommended,
      )

      if (availableInstances.length === 0) {
        return null
      }

      // 3. Calcular score de prioridade para cada instância
      const instancesWithScore = availableInstances.map((instance) => {
        const score = this.calculateInstancePriorityScore(instance)
        return { ...instance, priorityScore: score }
      })

      // 4. Ordenar por score de prioridade (maior primeiro)
      instancesWithScore.sort(
        (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0),
      )

      // 5. Selecionar a instância com maior score
      const selectedInstance = instancesWithScore[0]

      // 6. Atualizar contador de uso para balanceamento
      await this.updateInstanceUsageCount(selectedInstance.instanceName)

      return selectedInstance
    } catch (error) {
      console.error(
        '[InstanceRotation] Erro ao obter próxima instância:',
        error,
      )
      return null
    }
  }

  /**
   * Obtém informações de saúde de uma instância específica
   */
  async getInstanceHealth(instanceName: string): Promise<InstanceHealthInfo> {
    try {
      // 1. Verificar status da instância na Evolution API
      const connectionStatus =
        await evolutionApi.actions.connectionStatus.handler({
          config: {},
          input: { instanceName },
        })

      // 2. Buscar dados de aquecimento
      const warmupStats = await prisma.warmupStats.findUnique({
        where: { instanceName },
        select: {
          status: true,
          progress: true,
          startTime: true,
          lastActive: true,
        },
      })

      // 3. Buscar métricas de saúde
      const healthMetrics = await prisma.healthMetrics.findFirst({
        where: { instanceName },
        orderBy: { analyzedAt: 'desc' },
        select: {
          healthScore: true,
          riskLevel: true,
          messagesSent24h: true,
          messagesReceived24h: true,
          responseRate: true,
          deliveryRate: true,
        },
      })

      // 4. Buscar estatísticas de mídia
      const mediaStats = await prisma.mediaStats.findFirst({
        where: { instanceName },
        orderBy: { date: 'desc' },
        select: {
          totalDaily: true,
          totalSent: true,
          totalReceived: true,
        },
      })

      // 5. Calcular se é recomendada
      const isRecommended = this.calculateIsRecommended({
        status: connectionStatus.state,
        warmupProgress: warmupStats?.progress || 0,
        healthScore: healthMetrics?.healthScore || 0,
        riskLevel: healthMetrics?.riskLevel || 'LOW',
        messagesSent24h: healthMetrics?.messagesSent24h || 0,
        responseRate: healthMetrics?.responseRate || 0,
      })

      return {
        instanceName,
        status: connectionStatus.state as 'open' | 'close' | 'connecting',
        warmupProgress: warmupStats?.progress || 0,
        healthScore: healthMetrics?.healthScore || 0,
        isRecommended,
        lastSeen: warmupStats?.lastActive || null,
        messagesSent24h: healthMetrics?.messagesSent24h || 0,
        messagesReceived24h: healthMetrics?.messagesReceived24h || 0,
        responseRate: healthMetrics?.responseRate || 0,
        deliveryRate: healthMetrics?.deliveryRate || 0,
        riskLevel: healthMetrics?.riskLevel || 'LOW',
      }
    } catch (error) {
      console.error(
        `[InstanceRotation] Erro ao obter saúde da instância ${instanceName}:`,
        error,
      )

      // Retornar instância com status de erro
      return {
        instanceName,
        status: 'close',
        warmupProgress: 0,
        healthScore: 0,
        isRecommended: false,
        lastSeen: null,
        messagesSent24h: 0,
        messagesReceived24h: 0,
        responseRate: 0,
        deliveryRate: 0,
        riskLevel: 'CRITICAL',
      }
    }
  }

  /**
   * Obtém informações de saúde de todas as instâncias
   */
  async getAllInstancesHealth(): Promise<InstanceHealthInfo[]> {
    try {
      // 1. Listar todas as instâncias da Evolution API
      const instances = await evolutionApi.actions.listInstances.handler({
        config: {},
        input: {},
      })

      // 2. Obter saúde de cada instância
      const healthPromises = instances.map((instance: any) =>
        this.getInstanceHealth(instance.instanceName),
      )

      const instancesHealth = await Promise.all(healthPromises)
      return instancesHealth
    } catch (error) {
      console.error(
        '[InstanceRotation] Erro ao obter saúde de todas as instâncias:',
        error,
      )
      return []
    }
  }

  /**
   * Calcula o score de prioridade de uma instância
   */
  private calculateInstancePriorityScore(instance: InstanceHealthInfo): number {
    let score = 0

    // 1. Score base da saúde (0-40 pontos)
    score += (instance.healthScore / 100) * 40

    // 2. Score do aquecimento (0-30 pontos)
    score += (instance.warmupProgress / 100) * 30

    // 3. Score da taxa de entrega (0-20 pontos)
    score += (instance.deliveryRate / 100) * 20

    // 4. Score da taxa de resposta (0-10 pontos)
    score += (instance.responseRate / 100) * 10

    // 5. Penalização por risco alto
    if (instance.riskLevel === 'HIGH') score -= 20
    if (instance.riskLevel === 'CRITICAL') score -= 40

    // 6. Penalização por muitas mensagens enviadas nas últimas 24h
    if (instance.messagesSent24h > 100) score -= 10
    if (instance.messagesSent24h > 200) score -= 20

    // 7. Bônus para instâncias com boa distribuição de carga
    if (instance.messagesSent24h < 50) score += 5

    return Math.max(0, score)
  }

  /**
   * Calcula se uma instância é recomendada para uso
   */
  private calculateIsRecommended(params: {
    status: string
    warmupProgress: number
    healthScore: number
    riskLevel: string
    messagesSent24h: number
    responseRate: number
  }): boolean {
    // 1. Status deve estar aberto
    if (params.status !== 'open') return false

    // 2. Aquecimento deve estar pelo menos 50% completo
    if (params.warmupProgress < 50) return false

    // 3. Saúde deve estar pelo menos 70%
    if (params.healthScore < 70) return false

    // 4. Risco não pode ser crítico
    if (params.riskLevel === 'CRITICAL') return false

    // 5. Não pode ter enviado muitas mensagens nas últimas 24h
    if (params.messagesSent24h > 300) return false

    // 6. Taxa de resposta deve ser pelo menos 60%
    if (params.responseRate < 0.6) return false

    return true
  }

  /**
   * Atualiza contador de uso da instância para balanceamento
   */
  private async updateInstanceUsageCount(instanceName: string): Promise<void> {
    try {
      // Aqui você pode implementar um sistema de contagem de uso
      // para distribuir melhor a carga entre as instâncias
      // Por exemplo, usar Redis ou uma tabela no banco

      console.log(
        `[InstanceRotation] Instância ${instanceName} selecionada para uso`,
      )
    } catch (error) {
      console.error(
        `[InstanceRotation] Erro ao atualizar contador de uso:`,
        error,
      )
    }
  }

  /**
   * Obtém estatísticas de uso das instâncias
   */
  async getInstanceUsageStats(): Promise<Record<string, number>> {
    try {
      // Implementar lógica para obter estatísticas de uso
      // Por exemplo, quantas mensagens cada instância enviou hoje
      return {}
    } catch (error) {
      console.error(
        '[InstanceRotation] Erro ao obter estatísticas de uso:',
        error,
      )
      return {}
    }
  }

  /**
   * Verifica se uma instância está sobrecarregada
   */
  async isInstanceOverloaded(instanceName: string): Promise<boolean> {
    try {
      const health = await this.getInstanceHealth(instanceName)

      // Considera sobrecarregada se:
      // - Saúde < 50%
      // - Muitas mensagens nas últimas 24h
      // - Risco alto ou crítico
      return (
        health.healthScore < 50 ||
        health.messagesSent24h > 500 ||
        health.riskLevel === 'HIGH' ||
        health.riskLevel === 'CRITICAL'
      )
    } catch (error) {
      console.error(`[InstanceRotation] Erro ao verificar sobrecarga:`, error)
      return true // Em caso de erro, considera sobrecarregada
    }
  }
}
