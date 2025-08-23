'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Edit,
  Settings,
  MessageSquare,
  Activity,
  Bot,
  BookOpen,
  Users,
  Clock,
  Play,
  Pause,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface AIAgentDetailsProps {
  agentId: string
}

// Mock data - substituir por dados reais da API
const mockAgent = {
  id: '1',
  name: 'Alex - Assistente de Vendas',
  description: 'Agente especializado em vendas de produtos SaaS',
  status: 'ACTIVE',
  instanceName: 'vendas-instance',
  evolutionBotId: 'bot_123',
  openaiCredsId: 'creds_456',
  botType: 'chatCompletion',
  assistantId: null,
  functionUrl: null,
  model: 'gpt-4o',
  systemMessages: [
    'Você é o Alex, um assistente de vendas especializado em produtos SaaS.',
    'Seu objetivo é ajudar clientes a entenderem nossos produtos e serviços.',
    'Seja sempre prestativo, profissional e honesto.'
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
  triggerValue: null,
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
    expertise: ['Vendas SaaS', 'Produtos digitais', 'Atendimento ao cliente'],
    limitations: ['Não pode fazer promessas sobre preços', 'Não pode acessar sistemas internos'],
    greeting: 'Olá! Sou o Alex, seu assistente de vendas especializado em produtos SaaS. Como posso ajudar você hoje?',
    fallback: 'Desculpe, não consegui entender sua pergunta. Pode reformular ou usar #SAIR para falar com um humano?'
  },
  knowledgeBase: {
    enabled: true,
    sources: [
      { id: '1', type: 'pdf', title: 'Manual do Produto', status: 'processed' },
      { id: '2', type: 'txt', title: 'FAQ Geral', status: 'processed' }
    ]
  },
  conversations: 156,
  messages: 1247,
  lastActive: '2024-01-15T10:30:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
}

export function AIAgentDetails({ agentId }: AIAgentDetailsProps) {
  const [agent, setAgent] = useState(mockAgent)
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'TRAINING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Activity className="w-4 h-4" />
      case 'INACTIVE':
        return <Pause className="w-4 h-4" />
      case 'TRAINING':
        return <Bot className="w-4 h-4" />
      case 'ERROR':
        return <Activity className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getBotTypeLabel = (type: string) => {
    switch (type) {
      case 'assistant':
        return 'OpenAI Assistant'
      case 'chatCompletion':
        return 'Chat Completion'
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/ai-agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-600">{agent.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Testar Chat
          </Button>
        </div>
      </div>

      {/* Status e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={`mt-2 ${getStatusColor(agent.status)}`}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(agent.status)}
                    {agent.status === 'ACTIVE' ? 'Ativo' : 
                     agent.status === 'INACTIVE' ? 'Inativo' :
                     agent.status === 'TRAINING' ? 'Treinando' :
                     agent.status === 'ERROR' ? 'Erro' : agent.status}
                  </span>
                </Badge>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversas</p>
                <p className="text-2xl font-bold text-gray-900">{agent.conversations}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens</p>
                <p className="text-2xl font-bold text-gray-900">{agent.messages}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Última Atividade</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(agent.lastActive)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="persona">Persona</TabsTrigger>
          <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tipo de Bot</p>
                    <p className="text-sm text-gray-900">{getBotTypeLabel(agent.botType)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Modelo</p>
                    <p className="text-sm text-gray-900">{agent.model}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Instância</p>
                    <p className="text-sm text-gray-900">{agent.instanceName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Max Tokens</p>
                    <p className="text-sm text-gray-900">{agent.maxTokens}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Mensagens do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">System Messages</p>
                  <div className="space-y-2">
                    {agent.systemMessages.map((msg, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-800">{msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Persona */}
        <TabsContent value="persona" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Configuração da Persona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Nome</p>
                  <p className="text-lg font-semibold text-gray-900">{agent.persona.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Função</p>
                  <p className="text-lg font-semibold text-gray-900">{agent.persona.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Tom</p>
                  <p className="text-lg font-semibold text-gray-900">{agent.persona.tone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {agent.persona.expertise.map((exp, index) => (
                    <Badge key={index} variant="outline">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Limitações</p>
                <div className="flex flex-wrap gap-2">
                  {agent.persona.limitations.map((lim, index) => (
                    <Badge key={index} variant="outline" className="text-red-600 border-red-200">
                      {lim}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Saudação</p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-800">{agent.persona.greeting}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Mensagem de Fallback</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800">{agent.persona.fallback}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Base de Conhecimento */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Base de Conhecimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Status</h4>
                  <p className="text-sm text-gray-600">
                    {agent.knowledgeBase.enabled ? 'Habilitada' : 'Desabilitada'}
                  </p>
                </div>
                <Badge variant={agent.knowledgeBase.enabled ? 'default' : 'secondary'}>
                  {agent.knowledgeBase.enabled ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              {agent.knowledgeBase.enabled && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Documentos Carregados</h4>
                  <div className="space-y-3">
                    {agent.knowledgeBase.sources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{source.title}</p>
                            <p className="text-sm text-gray-600">Tipo: {source.type.toUpperCase()}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {source.status === 'processed' ? 'Processado' : source.status}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <Button className="mt-4">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Adicionar Documentos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Tipo de Trigger</p>
                  <p className="text-sm text-gray-900">{agent.triggerType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Operador</p>
                  <p className="text-sm text-gray-900">{agent.triggerOperator}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Expira em (min)</p>
                  <p className="text-sm text-gray-900">{agent.expire}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Delay (ms)</p>
                  <p className="text-sm text-gray-900">{agent.delayMessage}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Keyword de Saída</p>
                  <p className="text-sm text-gray-900">{agent.keywordFinish}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Debounce (ms)</p>
                  <p className="text-sm text-gray-900">{agent.debounceTime}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Mensagem Desconhecida</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800">{agent.unknownMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Métricas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Analytics detalhados estarão disponíveis em breve. 
                Incluirá métricas de conversão, tempo de resposta, satisfação do cliente e muito mais.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
