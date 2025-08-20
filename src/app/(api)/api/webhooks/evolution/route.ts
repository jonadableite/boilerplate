import { InstanceConnectionStatus } from '@/features/whatsapp-instance/whatsapp-instance.types'
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Validar content-type
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser application/json' },
        { status: 400 },
      )
    }

    // Parse do payload
    const payload = await request.json()
    console.log('[Evolution Webhook] Evento recebido:', payload)

    // Validar estrutura básica do evento
    if (!payload.event || !payload.instance) {
      return NextResponse.json(
        { error: 'Estrutura de evento inválida' },
        { status: 400 },
      )
    }

    const { event, instance, data } = payload
    const instanceName = instance.instanceName || instance.name

    if (!instanceName) {
      console.warn(
        '[Evolution Webhook] Nome da instância não encontrado no payload',
      )
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    // Mapear eventos para status
    let newStatus: InstanceConnectionStatus | null = null

    switch (event) {
      case 'connection.update':
        if (data?.state === 'open') {
          newStatus = InstanceConnectionStatus.OPEN
        } else if (data?.state === 'close') {
          newStatus = InstanceConnectionStatus.CLOSE
        } else if (data?.state === 'connecting') {
          newStatus = InstanceConnectionStatus.CONNECTING
        }
        break

      case 'qrcode.updated':
        // QR Code foi atualizado, mantém como conectando
        newStatus = InstanceConnectionStatus.CONNECTING
        break

      case 'instance.created':
        newStatus = InstanceConnectionStatus.CONNECTING
        break

      case 'instance.deleted':
        // Instância foi deletada na Evolution API
        console.log('[Evolution Webhook] Instância deletada:', instanceName)
        break

      default:
        console.log('[Evolution Webhook] Evento não tratado:', event)
        return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    // Se não há mudança de status, ignora
    if (!newStatus) {
      return NextResponse.json({ status: 'no_update' }, { status: 200 })
    }

    // Buscar instância pelo instanceName
    const dbInstance = await prisma.whatsAppInstance.findFirst({
      where: { instanceName },
    })

    if (!dbInstance) {
      console.warn(
        '[Evolution Webhook] Instância não encontrada no banco:',
        instanceName,
      )
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 },
      )
    }

    // Atualizar status da instância
    await prisma.whatsAppInstance.update({
      where: { id: dbInstance.id },
      data: {
        status: newStatus,
        metadata: {
          ...(typeof dbInstance.metadata === 'object' &&
            dbInstance.metadata !== null
            ? dbInstance.metadata
            : {}),
          lastWebhookEvent: {
            event,
            data,
            timestamp: new Date().toISOString(),
          },
        },
        // Atualizar informações do perfil se disponível
        ...(data?.profileName && { profileName: data.profileName }),
        ...(data?.profilePicUrl && { profilePicUrl: data.profilePicUrl }),
        ...(data?.owner && { ownerJid: data.owner }),
      },
    })

    console.log(
      `[Evolution Webhook] Status atualizado para ${newStatus}:`,
      instanceName,
    )

    return NextResponse.json(
      {
        status: 'updated',
        instanceName,
        newStatus,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[Evolution Webhook] Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}