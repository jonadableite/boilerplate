/**
 * Exemplo prático de uso da feature AI Agent
 * Este arquivo demonstra como usar todas as funcionalidades implementadas
 */

import { AIAgentService } from '../services/ai-agent.service'
import { KnowledgeBaseService } from '../services/knowledge-base.service'
import { EvolutionAPIClient } from '../services/evolution-api.client'

// Configurações
const EVOLUTION_BASE_URL = process.env.EVOLUTION_API_URL || 'https://sub.domain.com'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'your_key'
const INSTANCE_NAME = 'minha-instancia'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-proj-...'

// Exemplo 1: Configuração inicial
async function setupInitialConfiguration() {
  console.log('🚀 Configurando sistema inicial...')

  try {
    // 1. Criar cliente Evolution API
    const evolutionClient = new EvolutionAPIClient(
      EVOLUTION_BASE_URL,
      EVOLUTION_API_KEY,
      INSTANCE_NAME
    )

    // 2. Testar conexão
    const isConnected = await evolutionClient.testConnection()
    console.log('✅ Conexão Evolution API:', isConnected)

    // 3. Configurar credenciais OpenAI
    const credsResult = await evolutionClient.setOpenAICreds({
      name: 'API Key Principal',
      apiKey: OPENAI_API_KEY
    })
    console.log('✅ Credenciais OpenAI configuradas:', credsResult.data?.id)

    // 4. Configurar settings padrão
    const settingsResult = await evolutionClient.setDefaultSettings({
      openaiCredsId: credsResult.data?.id || '',
      expire: 30,
      keywordFinish: '#SAIR',
      delayMessage: 1000,
      unknownMessage: 'Desculpe, não entendi. Pode reformular?',
      listeningFromMe: false,
      stopBotFromMe: true,
      keepOpen: false,
      debounceTime: 10,
      ignoreJids: [],
      openaiIdFallback: credsResult.data?.id || ''
    })
    console.log('✅ Settings padrão configurados')

    return credsResult.data?.id
  } catch (error) {
    console.error('❌ Erro na configuração inicial:', error)
    throw error
  }
}

// Exemplo 2: Criar um agente de vendas
async function createSalesAgent(openaiCredsId: string) {
  console.log('🤖 Criando agente de vendas...')

  try {
    const agentService = new AIAgentService(
      EVOLUTION_BASE_URL,
      EVOLUTION_API_KEY,
      INSTANCE_NAME,
      OPENAI_API_KEY
    )

    const agent = await agentService.createAgent({
      name: 'Alex - Assistente de Vendas',
      description: 'Agente especializado em vendas de produtos SaaS',
      instanceName: INSTANCE_NAME,
      openaiCredsId,
      botType: 'chatCompletion',
      model: 'gpt-4o',
      systemMessages: [
        'Você é o Alex, um assistente de vendas especializado em produtos SaaS.',
        'Seu objetivo é ajudar clientes a entenderem nossos produtos e serviços.',
        'Seja sempre prestativo, profissional e honesto.',
        'Nunca faça promessas sobre preços ou funcionalidades não confirmadas.',
        'Se não souber algo, diga que vai verificar e retornar em breve.'
      ],
      assistantMessages: [
        'Olá! Sou o Alex, seu assistente de vendas. Como posso ajudar você hoje?'
      ],
      userMessages: [
        'Olá, preciso de informações sobre seus produtos'
      ],
      maxTokens: 800,
      triggerType: 'all',
      triggerOperator: 'none',
      expire: 30,
      keywordFinish: '#SAIR',
      delayMessage: 1000,
      unknownMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?',
      listeningFromMe: false,
      stopBotFromMe: true,
      keepOpen: false,
      debounceTime: 10,
      ignoreJids: [],
      persona: {
        name: 'Alex',
        role: 'Assistente de Vendas',
        tone: 'Profissional e amigável',
        expertise: [
          'Vendas SaaS',
          'Produtos digitais',
          'Atendimento ao cliente',
          'Soluções empresariais'
        ],
        limitations: [
          'Não pode fazer promessas sobre preços',
          'Não pode acessar sistemas internos',
          'Não pode processar pagamentos'
        ],
        greeting: 'Olá! Sou o Alex, seu assistente de vendas especializado em produtos SaaS. Como posso ajudar você hoje?',
        fallback: 'Desculpe, não consegui entender sua pergunta. Pode reformular ou usar #SAIR para falar com um humano?'
      },
      knowledgeBase: {
        enabled: true,
        sources: []
      }
    })

    console.log('✅ Agente criado com sucesso:', agent.id)
    return agent
  } catch (error) {
    console.error('❌ Erro ao criar agente:', error)
    throw error
  }
}

// Exemplo 3: Configurar base de conhecimento
async function setupKnowledgeBase(agentId: string) {
  console.log('📚 Configurando base de conhecimento...')

  try {
    const knowledgeService = new KnowledgeBaseService(OPENAI_API_KEY)

    // Exemplo de conteúdo para base de conhecimento
    const productManual = `
    # Manual do Produto SaaS
    
    ## Visão Geral
    Nosso produto é uma plataforma completa de gestão empresarial que inclui:
    - CRM integrado
    - Gestão de projetos
    - Controle financeiro
    - Relatórios avançados
    
    ## Funcionalidades Principais
    
    ### CRM
    - Gestão de contatos e leads
    - Pipeline de vendas
    - Histórico de interações
    - Automação de marketing
    
    ### Projetos
    - Criação e gestão de projetos
    - Atribuição de tarefas
    - Acompanhamento de progresso
    - Gestão de tempo
    
    ### Financeiro
    - Controle de receitas e despesas
    - Faturamento automático
    - Relatórios financeiros
    - Integração bancária
    
    ## Planos e Preços
    
    ### Starter
    - R$ 99/mês
    - Até 5 usuários
    - Funcionalidades básicas
    
    ### Professional
    - R$ 199/mês
    - Até 20 usuários
    - Todas as funcionalidades
    
    ### Enterprise
    - Preço sob consulta
    - Usuários ilimitados
    - Suporte dedicado
    `

    // Processar documento e criar chunks com embeddings
    const chunks = await knowledgeService.processDocument(productManual, {
      agentId,
      sourceId: 'product_manual_v1',
      title: 'Manual do Produto',
      category: 'Documentação',
      version: '1.0'
    })

    console.log(`✅ Base de conhecimento configurada com ${chunks.length} chunks`)
    return chunks
  } catch (error) {
    console.error('❌ Erro ao configurar base de conhecimento:', error)
    throw error
  }
}

// Exemplo 4: Processar mensagem de cliente
async function processCustomerMessage(agentId: string, customerMessage: string) {
  console.log('💬 Processando mensagem do cliente...')

  try {
    const agentService = new AIAgentService(
      EVOLUTION_BASE_URL,
      EVOLUTION_API_KEY,
      INSTANCE_NAME,
      OPENAI_API_KEY
    )

    const response = await agentService.processMessage(agentId, {
      remoteJid: '5511999999999@s.whatsapp.net',
      message: customerMessage,
      type: 'text',
      metadata: {
        generateAudio: false,
        priority: 'normal'
      }
    })

    if (response.success) {
      console.log('✅ Resposta gerada:', response.message)
      return response
    } else {
      console.error('❌ Erro ao processar mensagem:', response.error)
      return response
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error)
    throw error
  }
}

// Exemplo 5: Gerenciar sessões
async function manageSessions(agentId: string, openaiBotId: string) {
  console.log('🔐 Gerenciando sessões...')

  try {
    const agentService = new AIAgentService(
      EVOLUTION_BASE_URL,
      EVOLUTION_API_KEY,
      INSTANCE_NAME,
      OPENAI_API_KEY
    )

    // Buscar sessões ativas
    const sessions = await agentService.fetchSessions(openaiBotId)
    console.log('📋 Sessões ativas:', sessions.data)

    // Alterar status de uma sessão
    const statusResult = await agentService.changeSessionStatus({
      remoteJid: '5511999999999@s.whatsapp.net',
      status: 'paused'
    })
    console.log('⏸️ Status da sessão alterado:', statusResult)

    return sessions
  } catch (error) {
    console.error('❌ Erro ao gerenciar sessões:', error)
    throw error
  }
}

// Exemplo 6: Fluxo completo de atendimento
async function completeCustomerServiceFlow() {
  console.log('🔄 Iniciando fluxo completo de atendimento...')

  try {
    // 1. Configuração inicial
    const openaiCredsId = await setupInitialConfiguration()
    console.log('✅ Configuração inicial concluída')

    // 2. Criar agente
    const agent = await createSalesAgent(openaiCredsId)
    console.log('✅ Agente criado:', agent.name)

    // 3. Configurar base de conhecimento
    const knowledgeChunks = await setupKnowledgeBase(agent.id)
    console.log('✅ Base de conhecimento configurada')

    // 4. Simular mensagens de clientes
    const customerMessages = [
      'Olá, preciso de informações sobre seus produtos',
      'Qual é o preço do plano Professional?',
      'O plano inclui suporte técnico?',
      'Posso fazer um teste gratuito?'
    ]

    for (const message of customerMessages) {
      console.log(`\n📨 Cliente: ${message}`)
      const response = await processCustomerMessage(agent.id, message)
      console.log(`🤖 Alex: ${response.message}`)
      
      // Aguardar um pouco entre mensagens
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // 5. Gerenciar sessões
    if (agent.evolutionBotId) {
      await manageSessions(agent.id, agent.evolutionBotId)
    }

    console.log('\n🎉 Fluxo de atendimento concluído com sucesso!')
    return {
      agent,
      knowledgeChunks,
      openaiCredsId
    }
  } catch (error) {
    console.error('❌ Erro no fluxo de atendimento:', error)
    throw error
  }
}

// Exemplo 7: Processar áudio (STT)
async function processAudioMessage(agentId: string, audioUrl: string) {
  console.log('🎵 Processando mensagem de áudio...')

  try {
    const agentService = new AIAgentService(
      EVOLUTION_BASE_URL,
      EVOLUTION_API_KEY,
      INSTANCE_NAME,
      OPENAI_API_KEY
    )

    const response = await agentService.processMessage(agentId, {
      remoteJid: '5511999999999@s.whatsapp.net',
      message: 'Mensagem de áudio recebida',
      type: 'audio',
      audioUrl,
      metadata: {
        generateAudio: true, // Gerar resposta em áudio
        priority: 'high'
      }
    })

    if (response.success) {
      console.log('✅ Áudio processado:', response.message)
      if (response.audioUrl) {
        console.log('🎤 Resposta em áudio gerada:', response.audioUrl)
      }
      return response
    } else {
      console.error('❌ Erro ao processar áudio:', response.error)
      return response
    }
  } catch (error) {
    console.error('❌ Erro ao processar áudio:', error)
    throw error
  }
}

// Função principal para executar todos os exemplos
export async function runAllExamples() {
  console.log('🚀 Iniciando exemplos da feature AI Agent...\n')

  try {
    const result = await completeCustomerServiceFlow()
    
    console.log('\n📊 Resumo da execução:')
    console.log('- Agente criado:', result.agent.name)
    console.log('- Chunks de conhecimento:', result.knowledgeChunks.length)
    console.log('- Credenciais OpenAI configuradas')
    
    console.log('\n✅ Todos os exemplos executados com sucesso!')
    return result
  } catch (error) {
    console.error('\n❌ Erro na execução dos exemplos:', error)
    throw error
  }
}

// Exportar funções individuais para uso específico
export {
  setupInitialConfiguration,
  createSalesAgent,
  setupKnowledgeBase,
  processCustomerMessage,
  manageSessions,
  processAudioMessage
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllExamples()
    .then(() => {
      console.log('\n🎯 Exemplos concluídos!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error)
      process.exit(1)
    })
}
