import { warmupService } from '@/features/warmup'
import { prisma } from '@/providers/prisma'
import type { NextRequest } from 'next/server'

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json()

    console.log('[Evolution Webhook] Mensagem recebida:', {
      event: body.event,
      instance: body.instance,
      data: body.data ? 'presente' : 'ausente',
    })

    // Verificar se é um evento de mensagem
    if (body.event === 'messages.upsert' && body.data) {
      const messageData = body.data
      const instanceName = body.instance

      // Verificar se a instância existe no sistema
      const instance = await prisma.whatsAppInstance.findFirst({
        where: {
          instanceName,
        },
      })

      if (instance) {
        // Processar mensagem no sistema de aquecimento se não foi enviada por nós
        if (!messageData.key?.fromMe) {
          await warmupService.processReceivedMessage(
            instanceName,
            instance.organizationId,
            {
              key: messageData.key,
              pushName: messageData.pushName || '',
              status: 'received',
              message: messageData.message || {},
              messageType: messageData.messageType || 'text',
              messageTimestamp: messageData.messageTimestamp || Date.now(),
              instanceId: instanceName,
              source: 'webhook',
            },
          )
        }

        // Salvar mensagem no banco de dados (CRM)
        if (messageData.key && messageData.message) {
          try {
            // Determinar tipo de mensagem
            let messageType = 'TEXT'
            let content = ''
            const mediaUrl = null
            let mediaType = null
            let fileName = null

            if (messageData.message.conversation) {
              messageType = 'TEXT'
              content = messageData.message.conversation
            } else if (messageData.message.imageMessage) {
              messageType = 'IMAGE'
              content = messageData.message.imageMessage.caption || '[Imagem]'
              mediaType = 'image/jpeg'
            } else if (messageData.message.videoMessage) {
              messageType = 'VIDEO'
              content = messageData.message.videoMessage.caption || '[Vídeo]'
              mediaType = 'video/mp4'
            } else if (messageData.message.audioMessage) {
              messageType = 'AUDIO'
              content = '[Áudio]'
              mediaType = 'audio/ogg'
            } else if (messageData.message.documentMessage) {
              messageType = 'DOCUMENT'
              content =
                messageData.message.documentMessage.title || '[Documento]'
              fileName = messageData.message.documentMessage.fileName
              mediaType = messageData.message.documentMessage.mimetype
            } else if (messageData.message.stickerMessage) {
              messageType = 'STICKER'
              content = '[Figurinha]'
              mediaType = 'image/webp'
            }

            // Extrair número do remetente
            const fromNumber = messageData.key.remoteJid?.replace(
              '@s.whatsapp.net',
              '',
            )

            if (fromNumber) {
              // Buscar ou criar contato
              let contact = await prisma.contact.findFirst({
                where: {
                  whatsappNumber: fromNumber,
                  organizationId: instance.organizationId,
                },
              })

              if (!contact) {
                contact = await prisma.contact.create({
                  data: {
                    whatsappNumber: fromNumber,
                    name: messageData.pushName || fromNumber,
                    organizationId: instance.organizationId,
                    status: 'LEAD',
                    funnelStage: 'NEW_LEAD',
                  },
                })
              }

              // Buscar ou criar conversa
              let conversation = await prisma.conversation.findFirst({
                where: {
                  whatsappChatId: messageData.key.remoteJid,
                  whatsappInstanceId: instance.id,
                  organizationId: instance.organizationId,
                },
              })

              if (!conversation) {
                conversation = await prisma.conversation.create({
                  data: {
                    whatsappChatId: messageData.key.remoteJid,
                    title: contact.name || fromNumber,
                    organizationId: instance.organizationId,
                    whatsappInstanceId: instance.id,
                    contactId: contact.id,
                    status: 'OPEN',
                    isGroup:
                      messageData.key.remoteJid?.includes('@g.us') || false,
                    lastMessageAt: new Date(
                      messageData.messageTimestamp * 1000,
                    ),
                    lastMessage: content.substring(0, 100),
                    lastMessageType: messageType as any,
                  },
                })
              } else {
                // Atualizar conversa com última mensagem
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: {
                    lastMessageAt: new Date(
                      messageData.messageTimestamp * 1000,
                    ),
                    lastMessage: content.substring(0, 100),
                    lastMessageType: messageType as any,
                    unreadCount: { increment: 1 },
                  },
                })
              }

              // Salvar mensagem
              await prisma.message.create({
                data: {
                  whatsappMessageId: messageData.key.id,
                  content,
                  type: messageType as any,
                  direction: 'INBOUND',
                  status: 'DELIVERED',
                  mediaUrl,
                  mediaType,
                  fileName,
                  timestamp: new Date(messageData.messageTimestamp * 1000),
                  fromMe: messageData.key.fromMe || false,
                  fromName: messageData.pushName,
                  fromNumber,
                  organizationId: instance.organizationId,
                  conversationId: conversation.id,
                  contactId: contact.id,
                },
              })

              console.log('[Evolution Webhook] Mensagem salva no CRM:', {
                messageId: messageData.key.id,
                type: messageType,
                from: fromNumber,
                content: content.substring(0, 50),
              })

              // Processar mensagem com agentes AI se configurado
              try {
                const aiProcessResponse = await fetch(
                  `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai-agents/process-message`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      instanceName: instance.instanceName,
                      remoteJid: messageData.key.remoteJid,
                      content,
                      messageType,
                      fromNumber,
                      timestamp: messageData.messageTimestamp,
                      fromMe: messageData.key.fromMe || false,
                      organizationId: instance.organizationId,
                      conversationId: conversation.id,
                      contactId: contact.id,
                    }),
                  },
                )

                if (aiProcessResponse.ok) {
                  const result = await aiProcessResponse.json()
                  console.log(
                    '[Evolution Webhook] Mensagem processada pelo AI Agent:',
                    result.success,
                  )
                } else {
                  console.warn(
                    '[Evolution Webhook] Falha ao processar mensagem com AI Agent:',
                    aiProcessResponse.status,
                  )
                }
              } catch (aiError) {
                console.error(
                  '[Evolution Webhook] Erro ao chamar AI Agent API:',
                  aiError,
                )
              }
            }
          } catch (error) {
            console.error(
              '[Evolution Webhook] Erro ao salvar mensagem no CRM:',
              error,
            )
          }
        }
      } else {
        console.warn(
          `[Evolution Webhook] Instância não encontrada: ${instanceName}`,
        )
      }
    }

    // Processar outros eventos conforme necessário
    if (body.event === 'connection.update') {
      const instanceName = body.instance
      const connectionState = body.data?.state

      if (instanceName && connectionState) {
        await prisma.whatsAppInstance.updateMany({
          where: {
            instanceName,
          },
          data: {
            status:
              connectionState === 'open'
                ? 'open'
                : connectionState === 'close'
                  ? 'close'
                  : 'connecting',
            lastSeen: new Date(),
          },
        })

        console.log(
          `[Evolution Webhook] Status da instância ${instanceName} atualizado para: ${connectionState}`,
        )
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[Evolution Webhook] Erro ao processar webhook:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}

// Método GET para verificar se o webhook está funcionando
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Evolution API Webhook is working',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}
