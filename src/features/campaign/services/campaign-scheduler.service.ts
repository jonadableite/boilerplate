import { prisma } from '@/providers/prisma'
import { Campaign } from '../campaign.types'
import { MessageDispatcherService } from './message-dispatcher.service'

export class CampaignSchedulerService {
  private dispatcher: MessageDispatcherService

  constructor() {
    this.dispatcher = new MessageDispatcherService()
  }

  /**
   * Inicia o serviço de agendamento
   */
  async startScheduler(): Promise<void> {
    console.log('[CampaignScheduler] Iniciando serviço de agendamento...')

    // Verificar campanhas agendadas a cada minuto
    setInterval(async () => {
      await this.checkScheduledCampaigns()
    }, 60000) // 1 minuto

    // Verificar campanhas recorrentes a cada hora
    setInterval(async () => {
      await this.checkRecurringCampaigns()
    }, 3600000) // 1 hora

    console.log('[CampaignScheduler] Serviço de agendamento iniciado')
  }

  /**
   * Verifica campanhas agendadas para execução
   */
  private async checkScheduledCampaigns(): Promise<void> {
    try {
      const now = new Date()

      // Buscar campanhas agendadas para execução
      const scheduledCampaigns = await prisma.campaign.findMany({
        where: {
          status: 'SCHEDULED',
          type: 'SCHEDULED',
          scheduledAt: {
            lte: now,
          },
        },
      })

      for (const campaign of scheduledCampaigns) {
        // Garante que description seja string ("" se null) ou undefined
        await this.executeScheduledCampaign({
          ...campaign,
          description: campaign.description ?? undefined,
        } as Campaign)
      }
    } catch (error) {
      console.error(
        '[CampaignScheduler] Erro ao verificar campanhas agendadas:',
        error,
      )
    }
  }

  /**
   * Verifica campanhas recorrentes
   */
  private async checkRecurringCampaigns(): Promise<void> {
    try {
      const now = new Date()

      // Buscar campanhas recorrentes
      const recurringCampaigns = await prisma.campaign.findMany({
        where: {
          status: 'SCHEDULED',
          type: 'RECURRING',
          scheduledAt: {
            lte: now,
          },
        },
      })

      for (const campaign of recurringCampaigns) {
        // Garante que description seja string ("" se null)
        await this.executeRecurringCampaign({
          ...campaign,
          description: campaign.description ?? undefined,
        } as Campaign)
      }
    } catch (error) {
      console.error(
        '[CampaignScheduler] Erro ao verificar campanhas recorrentes:',
        error,
      )
    }
  }

  /**
   * Executa uma campanha agendada
   */
  private async executeScheduledCampaign(campaign: Campaign): Promise<void> {
    try {
      console.log(
        `[CampaignScheduler] Executando campanha agendada: ${campaign.name}`,
      )

      // Atualizar status para RUNNING
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      })

      // Iniciar disparo
      await this.dispatcher.startDispatch({
        campaignId: campaign.id,
        message: campaign.message,
        minDelay: campaign.minDelay,
        maxDelay: campaign.maxDelay,
      })

      console.log(
        `[CampaignScheduler] Campanha ${campaign.name} executada com sucesso`,
      )
    } catch (error) {
      console.error(
        `[CampaignScheduler] Erro ao executar campanha ${campaign.name}:`,
        error,
      )

      // Atualizar status para ERROR
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'ERROR',
        },
      })
    }
  }

  /**
   * Executa uma campanha recorrente
   */
  private async executeRecurringCampaign(campaign: Campaign): Promise<void> {
    try {
      console.log(
        `[CampaignScheduler] Executando campanha recorrente: ${campaign.name}`,
      )

      const recurring = campaign.recurring as any
      if (!recurring?.enabled) return

      // Verificar se deve executar baseado na frequência
      const shouldExecute = this.shouldExecuteRecurringCampaign(
        campaign,
        recurring,
      )
      if (!shouldExecute) return

      // Atualizar status para RUNNING
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      })

      // Iniciar disparo
      await this.dispatcher.startDispatch({
        campaignId: campaign.id,
        message: campaign.message,
        minDelay: campaign.minDelay,
        maxDelay: campaign.maxDelay,
      })

      // Calcular próxima execução
      const nextExecution = this.calculateNextExecution(
        campaign.scheduledAt!,
        recurring,
      )

      // Atualizar agendamento para próxima execução
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'SCHEDULED',
          scheduledAt: nextExecution,
        },
      })

      console.log(
        `[CampaignScheduler] Campanha recorrente ${campaign.name} executada. Próxima execução: ${nextExecution}`,
      )
    } catch (error) {
      console.error(
        `[CampaignScheduler] Erro ao executar campanha recorrente ${campaign.name}:`,
        error,
      )

      // Atualizar status para ERROR
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'ERROR',
        },
      })
    }
  }

  /**
   * Verifica se uma campanha recorrente deve ser executada
   */
  private shouldExecuteRecurringCampaign(
    campaign: Campaign,
    recurring: any,
  ): boolean {
    if (!campaign.scheduledAt) return false

    const now = new Date()
    const scheduledTime = new Date(campaign.scheduledAt)

    // Verificar se chegou a hora de executar
    if (now < scheduledTime) return false

    // Verificar se não passou da data de fim
    if (recurring.endDate) {
      const endDate = new Date(recurring.endDate)
      if (now > endDate) return false
    }

    return true
  }

  /**
   * Calcula a próxima execução de uma campanha recorrente
   */
  private calculateNextExecution(
    currentScheduledAt: Date,
    recurring: any,
  ): Date {
    const nextExecution = new Date(currentScheduledAt)

    switch (recurring.frequency) {
      case 'daily':
        nextExecution.setDate(
          nextExecution.getDate() + (recurring.interval || 1),
        )
        break
      case 'weekly':
        nextExecution.setDate(
          nextExecution.getDate() + (recurring.interval || 1) * 7,
        )
        break
      case 'monthly':
        nextExecution.setMonth(
          nextExecution.getMonth() + (recurring.interval || 1),
        )
        break
      default:
        // Padrão: diário
        nextExecution.setDate(nextExecution.getDate() + 1)
    }

    return nextExecution
  }

  /**
   * Agenda uma nova campanha
   */
  async scheduleCampaign(
    campaignId: string,
    scheduledAt: Date,
    recurring?: {
      enabled: boolean
      frequency: 'daily' | 'weekly' | 'monthly'
      interval: number
      endDate?: Date
    },
  ): Promise<void> {
    try {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          scheduledAt,
          recurring,
          type: recurring?.enabled ? 'RECURRING' : 'SCHEDULED',
          status: 'SCHEDULED',
        },
      })

      console.log(
        `[CampaignScheduler] Campanha ${campaignId} agendada para ${scheduledAt}`,
      )
    } catch (error) {
      console.error(
        `[CampaignScheduler] Erro ao agendar campanha ${campaignId}:`,
        error,
      )
      throw error
    }
  }

  /**
   * Cancela o agendamento de uma campanha
   */
  async cancelScheduledCampaign(campaignId: string): Promise<void> {
    try {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'CANCELLED',
          scheduledAt: null,
          recurring: undefined,
        },
      })

      console.log(
        `[CampaignScheduler] Agendamento da campanha ${campaignId} cancelado`,
      )
    } catch (error) {
      console.error(
        `[CampaignScheduler] Erro ao cancelar agendamento da campanha ${campaignId}:`,
        error,
      )
      throw new Error('Erro ao cancelar agendamento da campanha')
    }
  }

  /**
   * Obtém próximas execuções agendadas
   */
  async getUpcomingExecutions(organizationId: string): Promise<Campaign[]> {
    try {
      const now = new Date()
      const campaigns = await prisma.campaign.findMany({
        where: {
          organizationId,
          status: 'SCHEDULED',
          scheduledAt: {
            gte: now,
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      })
      
      // Converter null para undefined para compatibilidade com o tipo Campaign
      return campaigns.map(campaign => ({
        ...campaign,
        description: campaign.description ?? undefined,
      })) as Campaign[]
    } catch (error) {
      console.error(
        '[CampaignScheduler] Erro ao buscar próximas execuções:',
        error,
      )
      return []
    }
  }

  /**
   * Obtém histórico de execuções
   */
  async getExecutionHistory(
    organizationId: string,
    limit: number = 50,
  ): Promise<Campaign[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          organizationId,
          status: {
            in: ['COMPLETED', 'ERROR'],
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: limit,
      })
      
      // Converter null para undefined para compatibilidade com o tipo Campaign
      return campaigns.map(campaign => ({
        ...campaign,
        description: campaign.description ?? undefined,
      })) as Campaign[]
    } catch (error) {
      console.error(
        '[CampaignScheduler] Erro ao buscar histórico de execuções:',
        error,
      )
      return []
    }
  }
}
