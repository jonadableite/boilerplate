import { prisma } from '@/providers/prisma'
import { AgentEngineService } from '@/features/ai-agents/services/agent-engine.service'
import type { NextRequest } from 'next/server'

// Endpoint interno para processar mensagens do Evolution Bot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { instanceName, remoteJid, content, fromMe, organizationId } = body

    // Validar dados obrigatórios
    if (!instanceName || !remoteJid || !content || !organizationId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Dados obrigatórios não fornecidos',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Buscar agente AI ativo para esta instância
    const aiAgent = await prisma.aIAgent.findFirst({
      where: {
        organizationId,
        isActive: true,
        metadata: {
          path: ['instanceName'],
          equals: instanceName,
        },
      },
      include: {
        organization: true,
      },
    })

    if (!aiAgent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nenhum agente AI ativo encontrado para esta instância',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Não processar mensagens enviadas pelo próprio bot
    if (fromMe) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Mensagem enviada pelo bot, ignorando processamento',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('[AI Agent API] Processando mensagem:', {
      agentId: aiAgent.id,
      agentName: aiAgent.name,
      from: remoteJid,
      content: content.substring(0, 50),
    })

    // Buscar credenciais OpenAI ou usar chave global
    let openaiApiKey: string

    if (aiAgent.openaiCredsId) {
      // Usar credenciais específicas do banco de dados
      const openaiCreds = await prisma.openAICreds.findUnique({
        where: { id: aiAgent.openaiCredsId },
      })

      if (!openaiCreds) {
        console.error(
          '[AI Agent API] Credenciais OpenAI não encontradas para o agente:',
          aiAgent.id,
        )
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Credenciais OpenAI não configuradas',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      openaiApiKey = openaiCreds.apiKey
    } else {
      // Usar chave global do .env
      openaiApiKey = process.env.OPENAI_API_KEY || ''

      if (!openaiApiKey) {
        console.error(
          '[AI Agent API] Chave OpenAI global não configurada no .env',
        )
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Chave OpenAI global não configurada',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    }

    // Inicializar o serviço de AI Agent
    const agentEngineService = new AgentEngineService()

    // Processar mensagem com o agente AI
    const result = await agentEngineService.processMessage({
      agentId: aiAgent.id,
      organizationId,
      sessionId: remoteJid,
      userMessage: content,
    })

    console.log('[AI Agent API] Resposta gerada:', {
      hasResponse: !!result.response,
      responseLength: result.response?.length || 0,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensagem processada com sucesso',
        response: result.response,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('[AI Agent API] Erro ao processar mensagem:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'AI Agent Message Processing API is working',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
