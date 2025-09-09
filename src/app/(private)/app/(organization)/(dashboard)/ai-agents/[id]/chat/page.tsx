'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  PageBody,
  PageHeader,
  PageMainBar,
  PageWrapper,
} from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bot,
  Send,
  User,
  ArrowLeft,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Agent {
  id: string
  name: string
  description?: string
  model: string
  isActive: boolean
}

export default function AgentChatPage() {
  const params = useParams()
  const agentId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [agentLoading, setAgentLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch agent data manually
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setAgentLoading(true)
        setError(null)
        
        const response = await fetch(`/api/v1/ai-agents/${agentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
        })

        if (response.status === 401) {
          setError('Você precisa fazer login para acessar este agente.')
          return
        }

        if (response.status === 404) {
          setError('Agente não encontrado ou você não tem permissão para acessá-lo.')
          return
        }

        if (!response.ok) {
          const errorText = await response.text()
          setError(`Erro ao carregar agente: ${response.status} - ${errorText}`)
          return
        }

        const data = await response.json()
        
        // Handle different response formats
        const agentData = data.data || data
        
        if (agentData && agentData.id) {
          setAgent(agentData)
        } else {
          setError('Dados do agente inválidos.')
        }
      } catch (err) {
        console.error('Error fetching agent:', err)
        setError('Erro de conexão ao carregar o agente.')
      } finally {
        setAgentLoading(false)
      }
    }

    if (agentId) {
      fetchAgent()
    }
  }, [agentId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !agent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Gerar sessionId único para esta conversa
      const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Chamar API real do agente IA
      const response = await fetch(`/api/v1/ai-agents/${agentId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: sessionId,
          userMessage: inputMessage.trim(),
          context: {
            messageId: userMessage.id,
            metadata: {
              source: 'web-chat',
              timestamp: new Date().toISOString(),
            },
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      const agentResponse = result.data

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: agentResponse.response || agentResponse.message || 'Desculpe, não consegui processar sua mensagem.',
        role: 'assistant',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Erro ao enviar mensagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      
      // Adicionar mensagem de erro como resposta do assistente
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  // Loading state
  if (agentLoading) {
    return (
      <PageWrapper>
        <PageBody>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando agente...</p>
            </div>
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

  // Error state
  if (error || !agent) {
    return (
      <PageWrapper>
        <PageBody>
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {error || 'Agente não encontrado'}
            </h3>
            <p className="text-muted-foreground mt-2">
              {error || 'O agente solicitado não existe ou você não tem permissão para acessá-lo.'}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button asChild variant="outline">
                <Link href="/auth">Fazer Login</Link>
              </Button>
              <Button asChild>
                <Link href="/app/ai-agents">Voltar para Agentes</Link>
              </Button>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg text-sm text-left max-w-md mx-auto">
              <p className="font-semibold mb-2">Debug Info:</p>
              <p>Agent ID: {agentId}</p>
              <p>Error: {error || 'Agent not found'}</p>
              <p>URL: /api/v1/ai-agents/{agentId}</p>
            </div>
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

  // Inactive agent state
  if (!agent.isActive) {
    return (
      <PageWrapper>
        <PageBody>
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Agente Inativo</h3>
            <p className="text-muted-foreground">
              Este agente está desativado e não pode processar mensagens.
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button asChild variant="outline">
                <Link href={`/app/ai-agents/${agentId}`}>Ver Detalhes</Link>
              </Button>
              <Button asChild>
                <Link href={`/app/ai-agents/${agentId}/edit`}>
                  Ativar Agente
                </Link>
              </Button>
            </div>
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

  // Main chat interface
  return (
    <PageWrapper>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/app/ai-agents">Agentes IA</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/app/ai-agents/${agentId}`}>
                {agent.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chat</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageBody>
        <PageMainBar>
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Ativo</Badge>
                    <Badge variant="outline">{agent.model}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={clearChat}
                  disabled={messages.length === 0}
                >
                  Limpar Chat
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/app/ai-agents/${agentId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Link>
                </Button>
              </div>
            </div>

            {/* Chat Container */}
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat de Teste
                </CardTitle>
                <CardDescription>
                  Teste as funcionalidades do agente em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Inicie uma conversa
                        </h3>
                        <p className="text-muted-foreground">
                          Digite uma mensagem abaixo para começar a testar o
                          agente
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {message.role === 'user' && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Digitando...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pressione Enter para enviar, Shift+Enter para nova linha
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageMainBar>
      </PageBody>
    </PageWrapper>
  )
}
