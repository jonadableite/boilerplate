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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/igniter.client'
import { Bot, Save, ArrowLeft, Brain, Database, Settings, Shield, Zap, Upload, FileText, Plus, X } from 'lucide-react'
import { KnowledgeUpload } from '@/features/ai-agents/components/knowledge-upload'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIAgentType } from '@/features/ai-agents/types/ai-agent.types'

const updateAgentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  type: z.nativeEnum(AIAgentType),
  role: z.string().optional(),
  goal: z.string().optional(),
  systemPrompt: z
    .string()
    .min(10, 'Prompt do sistema deve ter pelo menos 10 caracteres'),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(8000),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  enableContentFilter: z.boolean(),
  enablePiiDetection: z.boolean(),
  maxResponseLength: z.number().optional(),
  allowedTopics: z.array(z.string()),
  blockedTopics: z.array(z.string()),
  fallbackMessage: z.string().optional(),
  isActive: z.boolean(),
})

type UpdateAgentFormData = z.infer<typeof updateAgentSchema>

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const [activeTab, setActiveTab] = useState('basic')
  const [knowledgeFiles, setKnowledgeFiles] = useState<string[]>([])
  const [allowedTopics, setAllowedTopics] = useState<string[]>([])
  const [blockedTopics, setBlockedTopics] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState('')
  const [newBlockedTopic, setNewBlockedTopic] = useState('')

  const agentQuery = api.aiAgents.getById.useQuery({
    params: { id: agentId },
  })

  const agent = agentQuery.data
  const isLoading = agentQuery.loading

  const updateAgentMutation = api.aiAgents.update.useMutation()

  const form = useForm<UpdateAgentFormData>({
    resolver: zodResolver(updateAgentSchema),
    defaultValues: {
      name: '',
      description: '',
      type: AIAgentType.LLM_AGENT,
      role: '',
      goal: '',
      systemPrompt: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      enableContentFilter: true,
      enablePiiDetection: true,
      allowedTopics: [],
      blockedTopics: [],
      isActive: true,
    },
  })

  useEffect(() => {
    if (agent) {
      form.reset({
        name: agent.name,
        description: agent.description || '',
        type: agent.type,
        role: agent.role || '',
        goal: agent.goal || '',
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        topP: agent.topP,
        frequencyPenalty: agent.frequencyPenalty,
        presencePenalty: agent.presencePenalty,
        enableContentFilter: agent.enableContentFilter,
        enablePiiDetection: agent.enablePiiDetection,
        maxResponseLength: agent.maxResponseLength,
        allowedTopics: agent.allowedTopics || [],
        blockedTopics: agent.blockedTopics || [],
        fallbackMessage: agent.fallbackMessage || '',
        isActive: agent.isActive,
      })
      
      // Set topics from agent data
      setAllowedTopics(agent.allowedTopics || [])
      setBlockedTopics(agent.blockedTopics || [])
      
      // Set knowledge files if available
      setKnowledgeFiles(agent.knowledgeFiles || [])
    }
  }, [agent, form])

  const onSubmit = async (data: UpdateAgentFormData) => {
    try {
      await updateAgentMutation.execute({
        params: { id: agentId },
        body: {
          ...data,
          allowedTopics,
          blockedTopics,
          knowledgeFiles,
        },
      })
      toast.success('Agente atualizado com sucesso!')
      router.push(`/app/ai-agents/${agentId}`)
    } catch (error: any) {
      toast.error(
        'Erro ao atualizar agente: ' + (error?.message || 'Erro desconhecido'),
      )
    }
  }

  const addTopic = (topic: string, type: 'allowed' | 'blocked') => {
    if (!topic.trim()) return
    
    if (type === 'allowed') {
      setAllowedTopics([...allowedTopics, topic.trim()])
      setNewTopic('')
    } else {
      setBlockedTopics([...blockedTopics, topic.trim()])
      setNewBlockedTopic('')
    }
  }

  const removeTopic = (index: number, type: 'allowed' | 'blocked') => {
    if (type === 'allowed') {
      setAllowedTopics(allowedTopics.filter((_, i) => i !== index))
    } else {
      setBlockedTopics(blockedTopics.filter((_, i) => i !== index))
    }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <PageBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

  if (!agent) {
    return (
      <PageWrapper>
        <PageBody>
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Agente não encontrado
            </h3>
            <p className="text-muted-foreground">
              O agente solicitado não existe ou você não tem permissão para
              editá-lo.
            </p>
            <Button asChild className="mt-4">
              <Link href="/app/ai-agents">Voltar para Agentes</Link>
            </Button>
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

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
              <BreadcrumbPage>Editar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageBody>
        <PageMainBar>
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Editar Agente
                </h1>
                <p className="text-muted-foreground">
                  Modifique as configurações do agente {agent.name}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/app/ai-agents/${agentId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Básico
                    </TabsTrigger>
                    <TabsTrigger value="model" className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Modelo
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Base de Conhecimento
                    </TabsTrigger>
                    <TabsTrigger value="guardrails" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Guardrails
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>
                          Configure as informações principais do agente
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Agente</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Assistente de Vendas"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva o propósito do agente..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Agente</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={AIAgentType.LLM_AGENT}>
                                  LLM Agent
                                </SelectItem>
                                <SelectItem value={AIAgentType.CREW_AI}>
                                  Crew AI
                                </SelectItem>
                                <SelectItem
                                  value={AIAgentType.LANGGRAPH_WORKFLOW}
                                >
                                  LangGraph Workflow
                                </SelectItem>
                                <SelectItem value={AIAgentType.GOOGLE_ADK}>
                                  Google ADK
                                </SelectItem>
                                <SelectItem value={AIAgentType.A2A_PROTOCOL}>
                                  A2A Protocol
                                </SelectItem>
                                <SelectItem value={AIAgentType.MCP_SERVER}>
                                  MCP Server
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Papel/Função</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Especialista em vendas"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Objetivo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Ajudar clientes com dúvidas"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Agente Ativo
                                </FormLabel>
                                <FormDescription>
                                  Ativar ou desativar o agente
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="model" className="space-y-6">

                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações do Modelo</CardTitle>
                        <CardDescription>
                          Ajuste os parâmetros do modelo de IA
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                                <SelectItem value="gpt-4-turbo">
                                  GPT-4 Turbo
                                </SelectItem>
                                <SelectItem value="gpt-3.5-turbo">
                                  GPT-3.5 Turbo
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperatura: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={2}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Controla a criatividade das respostas (0 =
                              conservador, 2 = criativo)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxTokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Tokens</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={8000}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Limite máximo de tokens por resposta
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="enableContentFilter"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Filtro de Conteúdo</FormLabel>
                                <FormDescription className="text-xs">
                                  Ativar filtros de segurança
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="topP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top P</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Controla a diversidade das respostas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="frequencyPenalty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Penalidade de Frequência</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={-2}
                                  max={2}
                                  step={0.1}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Reduz repetições de palavras
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presencePenalty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Penalidade de Presença</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={-2}
                                  max={2}
                                  step={0.1}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Encoraja novos tópicos
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="knowledge" className="space-y-6">
                    <KnowledgeUpload agentId={params.id} />
                  </TabsContent>

                  <TabsContent value="guardrails" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Guardrails e Segurança
                        </CardTitle>
                        <CardDescription>
                          Configure filtros de segurança e limitações do agente
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="enableContentFilter"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Filtro de Conteúdo</FormLabel>
                                  <FormDescription className="text-xs">
                                    Ativar filtros de segurança
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="enablePiiDetection"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Detecção PII</FormLabel>
                                  <FormDescription className="text-xs">
                                    Detectar informações pessoais
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Tópicos Permitidos</h4>
                            <div className="flex gap-2 mb-2">
                              <Input
                                placeholder="Adicionar tópico permitido..."
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addTopic(newTopic, 'allowed')
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addTopic(newTopic, 'allowed')}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {allowedTopics.map((topic, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {topic}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 ml-1"
                                    onClick={() => removeTopic(index, 'allowed')}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Tópicos Bloqueados</h4>
                            <div className="flex gap-2 mb-2">
                              <Input
                                placeholder="Adicionar tópico bloqueado..."
                                value={newBlockedTopic}
                                onChange={(e) => setNewBlockedTopic(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addTopic(newBlockedTopic, 'blocked')
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addTopic(newBlockedTopic, 'blocked')}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {blockedTopics.map((topic, index) => (
                                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                                  {topic}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 ml-1 text-destructive-foreground hover:text-destructive-foreground"
                                    onClick={() => removeTopic(index, 'blocked')}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <FormField
                          control={form.control}
                          name="maxResponseLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tamanho Máximo da Resposta</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Ex: 500"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Limite de caracteres por resposta (opcional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fallbackMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mensagem de Fallback</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Desculpe, não consegui entender. Pode reformular?"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Mensagem exibida quando o agente não consegue responder
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle>Prompt do Sistema</CardTitle>
                    <CardDescription>
                      Defina o comportamento e personalidade do agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instruções do Sistema</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Você é um assistente especializado em... Suas responsabilidades incluem..."
                              className="min-h-[120px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Defina o comportamento e personalidade do agente
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fallbackMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem de Fallback</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Desculpe, não consegui entender. Pode reformular?"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Mensagem exibida quando o agente não consegue
                            responder
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/app/ai-agents/${agentId}`}>Cancelar</Link>
                  </Button>
                  <Button type="submit" disabled={updateAgentMutation.loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateAgentMutation.loading
                      ? 'Salvando...'
                      : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </PageMainBar>
      </PageBody>
    </PageWrapper>
  )
}
