import { evolutionApi } from '@/plugins/evolution-api.plugin'
import { prisma } from '@/providers/prisma'
import {
  EvolutionApiResponse,
  MediaContent,
  StartDispatchInput,
} from '../campaign.types'
import { InstanceRotationServiceImpl } from './instance-rotation.service'
import { cleanMediaMetadata } from './metadata-cleaner.service'

export class MessageDispatcherService {
  private stop: boolean = false
  private instanceRotationService: InstanceRotationServiceImpl

  constructor() {
    this.instanceRotationService = new InstanceRotationServiceImpl()
  }

  /**
   * Inicia o disparo de uma campanha
   */
  public async startDispatch(params: StartDispatchInput): Promise<void> {
    try {
      console.log(
        `[MessageDispatcher] Iniciando disparo da campanha ${params.campaignId}`,
      )

      // 1. Verificar todos os leads da campanha
      const totalLeads = await prisma.campaignLead.count({
        where: { campaignId: params.campaignId },
      })

      console.log(
        `[MessageDispatcher] Total de leads na campanha: ${totalLeads}`,
      )

      if (totalLeads === 0) {
        throw new Error('Campanha não possui leads cadastrados')
      }

      // 2. Resetar status dos leads para PENDING
      const resetResult = await prisma.campaignLead.updateMany({
        where: {
          campaignId: params.campaignId,
          NOT: { status: 'PENDING' },
        },
        data: {
          status: 'PENDING',
          sentAt: null,
          deliveredAt: null,
          readAt: null,
          failedAt: null,
          failureReason: null,
          messageId: null,
        },
      })

      console.log(
        `[MessageDispatcher] Leads resetados para PENDING: ${resetResult.count}`,
      )

      // 3. Verificar leads disponíveis após o reset
      const availableLeads = await prisma.campaignLead.findMany({
        where: {
          campaignId: params.campaignId,
          status: 'PENDING',
          AND: [{ phone: { not: '' } }, { phone: { not: undefined } }],
        },
        orderBy: { createdAt: 'asc' },
      })

      if (availableLeads.length === 0) {
        throw new Error(
          'Não há leads disponíveis para disparo após reset de status',
        )
      }

      console.log(
        `[MessageDispatcher] Leads disponíveis para disparo: ${availableLeads.length}`,
      )

      // 4. Atualizar status da campanha para RUNNING
      await prisma.campaign.update({
        where: { id: params.campaignId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
          progress: 0,
        },
      })

      // 5. Iniciar processamento dos leads
      let processedCount = 0
      const totalLeadsToProcess = availableLeads.length

      for (const lead of availableLeads) {
        if (this.stop) {
          console.log('[MessageDispatcher] Processo interrompido manualmente')
          break
        }

        try {
          console.log(
            `[MessageDispatcher] Processando lead ${lead.id} (${lead.phone})`,
          )

          // Obter próxima instância disponível (com rotação se habilitada)
          let currentInstanceName = params.instanceName
          if (!currentInstanceName) {
            const nextInstance =
              await this.instanceRotationService.getNextAvailableInstance(
                params.campaignId,
              )

            if (!nextInstance) {
              throw new Error('Nenhuma instância disponível para envio')
            }

            currentInstanceName = nextInstance.instanceName
            console.log(
              `[MessageDispatcher] Usando instância rotativa: ${currentInstanceName}`,
            )
          }

          // Atualizar status para processando
          await prisma.campaignLead.update({
            where: { id: lead.id },
            data: {
              status: 'PROCESSING',
              updatedAt: new Date(),
            },
          })

          let response: EvolutionApiResponse | undefined

          // Enviar mídia primeiro, se houver
          if (params.media?.media) {
            console.log('[MessageDispatcher] Enviando mídia...')
            response = await this.sendMedia(
              currentInstanceName,
              lead.phone,
              params.media,
            )
          }

          // Enviar mensagem de texto, mesmo que não haja mídia
          if (params.message && params.message.trim().length > 0) {
            console.log('[MessageDispatcher] Enviando mensagem de texto...')
            response = await this.sendText(
              currentInstanceName,
              lead.phone,
              params.message,
            )
          }

          if (response) {
            await this.saveEvolutionResponse(
              response,
              params.campaignId,
              lead.id,
            )

            // Atualizar status para SENT
            await prisma.campaignLead.update({
              where: { id: lead.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
              },
            })
          }

          processedCount++

          const progress = Math.floor(
            (processedCount / totalLeadsToProcess) * 100,
          )

          // Atualizar progresso da campanha
          await prisma.campaign.update({
            where: { id: params.campaignId },
            data: { progress },
          })

          // Atualizar estatísticas
          await this.updateCampaignStats(params.campaignId, processedCount)

          // Delay aleatório entre mensagens
          const delay =
            Math.floor(
              Math.random() * (params.maxDelay - params.minDelay + 1),
            ) + params.minDelay
          console.log(
            `[MessageDispatcher] Aguardando ${delay} segundos antes do próximo envio...`,
          )

          await new Promise((resolve) => setTimeout(resolve, delay * 1000))
        } catch (error) {
          console.error(
            `[MessageDispatcher] Erro ao processar lead ${lead.id}:`,
            error,
          )

          // Atualizar status para FAILED
          await prisma.campaignLead.update({
            where: { id: lead.id },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
              failureReason:
                error instanceof Error ? error.message : 'Erro desconhecido',
            },
          })
        }
      }

      // Atualizar status da campanha
      await prisma.campaign.update({
        where: { id: params.campaignId },
        data: {
          status: this.stop ? 'PAUSED' : 'COMPLETED',
          completedAt: this.stop ? null : new Date(),
          progress: this.stop
            ? Math.floor((processedCount / totalLeads) * 100)
            : 100,
        },
      })

      console.log('✅ Campanha concluída com sucesso', {
        campaignId: params.campaignId,
        totalLeads: availableLeads.length,
      })
    } catch (error) {
      console.error('[MessageDispatcher] Erro no processo de dispatch:', error)

      // Atualizar status da campanha para ERROR
      await prisma.campaign.update({
        where: { id: params.campaignId },
        data: {
          status: 'ERROR',
          progress: 0,
        },
      })

      throw error
    }
  }

  /**
   * Envia mensagem de texto
   */
  private async sendText(
    instanceName: string,
    phone: string,
    text: string,
  ): Promise<EvolutionApiResponse> {
    try {
      const formattedNumber = phone.startsWith('55') ? phone : `55${phone}`

      console.log(
        `[MessageDispatcher] Enviando mensagem para ${formattedNumber} usando instância ${instanceName}`,
      )

      // Removido payload não utilizado

      const response = await evolutionApi.actions.sendText.handler({
        config: {},
        input: {
          instanceName,
          number: formattedNumber,
          text,
          delay: 1000,
        },
      })

      console.log('[MessageDispatcher] Mensagem de texto enviada com sucesso')
      return response
    } catch (error) {
      console.error(
        '[MessageDispatcher] Erro ao enviar mensagem de texto:',
        error,
      )
      throw error
    }
  }

  /**
   * Envia mídia (imagem, vídeo, áudio, sticker)
   */
  private async sendMedia(
    instanceName: string,
    phone: string,
    media: MediaContent,
  ): Promise<EvolutionApiResponse> {
    try {
      const formattedNumber = phone.startsWith('55') ? phone : `55${phone}`

      console.log(
        `[MessageDispatcher] Iniciando limpeza de metadados para ${media.type}: ${media.fileName || 'arquivo'}`,
      )

      // Limpar metadados antes do envio
      const cleanResult = await cleanMediaMetadata(
        media.media,
        media.fileName || `media.${media.type}`,
        media.mimetype || this.getDefaultMimeType(media.type),
      )

      if (!cleanResult.success) {
        throw new Error(`Falha ao limpar metadados: ${cleanResult.error}`)
      }

      console.log(
        `[MessageDispatcher] Metadados removidos com sucesso: ${cleanResult.cleanedMedia?.fileName}`,
      )

      let response: EvolutionApiResponse

      switch (media.type) {
        case 'image':
        case 'video':
        case 'document':
          response = await evolutionApi.actions.sendMedia.handler({
            config: {},
            input: {
              instanceName,
              number: formattedNumber,
              mediatype: media.type,
              media: cleanResult.cleanedMedia!.data,
              caption: media.caption,
              fileName: cleanResult.cleanedMedia!.fileName,
              mimetype: cleanResult.cleanedMedia!.mimetype,
              delay: 1000,
            },
          })
          break

        case 'audio':
          response = await evolutionApi.actions.sendAudio.handler({
            config: {},
            input: {
              instanceName,
              number: formattedNumber,
              audio: cleanResult.cleanedMedia!.data,
              delay: 1000,
              encoding: true,
            },
          })
          break

        case 'sticker':
          response = await evolutionApi.actions.sendSticker.handler({
            config: {},
            input: {
              instanceName,
              number: formattedNumber,
              sticker: cleanResult.cleanedMedia!.data,
              delay: 1000,
            },
          })
          break

        default:
          throw new Error(`Tipo de mídia não suportado: ${media.type}`)
      }

      console.log(`[MessageDispatcher] ${media.type} enviado com sucesso`)
      return response
    } catch (error) {
      console.error(`[MessageDispatcher] Erro ao enviar ${media.type}:`, error)
      throw error
    }
  }

  /**
   * Salva resposta da Evolution API
   */
  private async saveEvolutionResponse(
    response: EvolutionApiResponse,
    campaignId: string,
    leadId: string,
  ): Promise<void> {
    try {
      if (!response?.key?.id || !response?.messageTimestamp) {
        throw new Error('Resposta da Evolution inválida')
      }

      const messageLog = await prisma.messageLog.create({
        data: {
          messageId: response.key.id,
          campaignId,
          campaignLeadId: leadId,
          messageDate: new Date(response.messageTimestamp * 1000),
          messageType: response.messageType || 'text',
          content: this.extractMessageContent(response),
          status: response.status || 'PENDING',
          statusHistory: [
            {
              status: response.status || 'PENDING',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      })

      await prisma.campaignLead.update({
        where: { id: leadId },
        data: {
          messageId: response.key.id,
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      console.log(
        `[MessageDispatcher] Resposta da Evolution salva: ${messageLog.id}`,
      )
    } catch (error) {
      console.error(
        '[MessageDispatcher] Erro ao salvar resposta da Evolution:',
        error,
      )
      throw error
    }
  }

  /**
   * Extrai conteúdo da mensagem da resposta da Evolution
   */
  private extractMessageContent(response: EvolutionApiResponse): string {
    if (response.message?.conversation) {
      return response.message.conversation
    }
    if (response.message?.imageMessage?.caption) {
      return response.message.imageMessage.caption
    }
    if (response.message?.videoMessage?.caption) {
      return response.message.videoMessage.caption
    }
    return ''
  }

  /**
   * Retorna o MIME type padrão baseado no tipo de mídia
   */
  private getDefaultMimeType(type: string): string {
    switch (type) {
      case 'image':
        return 'image/jpeg'
      case 'video':
        return 'video/mp4'
      case 'audio':
        return 'audio/mpeg'
      case 'sticker':
        return 'image/webp'
      default:
        return 'application/octet-stream'
    }
  }

  /**
   * Atualiza estatísticas da campanha
   */
  private async updateCampaignStats(
    campaignId: string,
    newLeadsCount: number,
  ): Promise<void> {
    try {
      await prisma.campaignStatistics.upsert({
        where: { campaignId },
        update: {
          sentCount: { increment: newLeadsCount },
          updatedAt: new Date(),
        },
        create: {
          campaignId,
          sentCount: newLeadsCount,
          totalLeads: 0,
          deliveredCount: 0,
          readCount: 0,
          failedCount: 0,
          blockedCount: 0,
          deliveryRate: 0,
          readRate: 0,
        },
      })
    } catch (error) {
      console.error(
        '[MessageDispatcher] Erro ao atualizar estatísticas da campanha:',
        error,
      )
    }
  }

  /**
   * Para o disparo
   */
  public stopDispatch(): void {
    console.log('[MessageDispatcher] Parando disparo...')
    this.stop = true
  }

  /**
   * Retoma o disparo
   */
  public resumeDispatch(): void {
    console.log('[MessageDispatcher] Retomando disparo...')
    this.stop = false
  }

  /**
   * Obtém estatísticas diárias da campanha
   */
  async getDailyStats(
    campaignId: string,
    date: Date,
  ): Promise<Record<string, number>> {
    try {
      const stats = await prisma.messageLog.groupBy({
        by: ['status'],
        where: {
          campaignId,
          messageDate: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() + 1,
            ),
          },
        },
        _count: {
          status: true,
        },
      })

      return stats.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.status]: curr._count.status,
        }),
        {} as Record<string, number>,
      )
    } catch (error) {
      console.error(
        '[MessageDispatcher] Erro ao obter estatísticas diárias:',
        error,
      )
      return {}
    }
  }

  /**
   * Obtém relatório detalhado da campanha
   */
  async getDetailedReport(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    try {
      return await prisma.messageLog.findMany({
        where: {
          campaignId,
          messageDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          messageDate: 'asc',
        },
      })
    } catch (error) {
      console.error(
        '[MessageDispatcher] Erro ao obter relatório detalhado:',
        error,
      )
      return []
    }
  }
}
