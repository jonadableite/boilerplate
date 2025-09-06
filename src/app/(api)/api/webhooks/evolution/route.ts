import { warmupService } from '@/features/warmup'
import { prisma } from '@/providers/prisma'
import { ChatProcedure } from '@/features/chat'
import { igniter } from '@/igniter'
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

        // Usar o ChatProcedure para processar o webhook
        try {
          // Criar contexto para o ChatProcedure
          const context = {
            providers: {
              database: prisma,
            },
          }

          // Inicializar o ChatProcedure
          const chatProcedure = await ChatProcedure.handler(undefined, { context })
          
          // Processar webhook usando o ChatProcedure
          const result = await chatProcedure.chat.processWebhook({
            payload: body,
            organizationId: instance.organizationId,
          })

          console.log('[Evolution Webhook] Mensagem processada via ChatProcedure:', {
            processed: result.processed,
            messageId: result.message?.id,
            conversationId: result.conversation?.id,
            contactId: result.contact?.id,
          })

          // Processar mensagem com agentes AI se configurado
          if (result.processed && result.message) {
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
                    content: result.message.content,
                    messageType: result.message.type,
                    fromNumber: result.message.fromNumber,
                    timestamp: messageData.messageTimestamp,
                    fromMe: messageData.key.fromMe || false,
                    organizationId: instance.organizationId,
                    conversationId: result.conversation?.id,
                    contactId: result.contact?.id,
                  }),
                },
              )

              if (aiProcessResponse.ok) {
                const aiResult = await aiProcessResponse.json()
                console.log(
                  '[Evolution Webhook] Mensagem processada pelo AI Agent:',
                  aiResult.success,
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
            '[Evolution Webhook] Erro ao processar webhook via ChatProcedure:',
            error,
          )
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
