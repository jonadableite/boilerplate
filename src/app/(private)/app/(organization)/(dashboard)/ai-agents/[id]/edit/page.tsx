'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Bot,
  Brain,
  Database,
  Shield,
  Save,
  ArrowLeft,
  Plus,
  X,
} from 'lucide-react'
import {
  PageWrapper,
  PageHeader,
  PageBody,
  PageMainBar,
} from '@/components/ui/page'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/igniter.client'
import { KnowledgeUpload } from '@/features/ai-agents/components/knowledge-upload'

const updateAgentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  model: z.string().min(1, 'Modelo é obrigatório'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(4000),
  systemPrompt: z.string().min(1, 'Prompt do sistema é obrigatório'),
  fallbackMessage: z.string().optional(),
  enableContentFilter: z.boolean(),
  enableRateLimiting: z.boolean(),
  maxRequestsPerMinute: z.number().min(1).max(100),
  allowedTopics: z.array(z.string()).optional(),
  blockedTopics: z.array(z.string()).optional(),
})

type UpdateAgentFormData = z.infer<typeof updateAgentSchema>

export default function EditAgentPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [allowedTopics, setAllowedTopics] = useState<string[]>([])
  const [blockedTopics, setBlockedTopics] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState('')
  const [newBlockedTopic, setNewBlockedTopic] = useState('')

  const agentId = params.id

  const agentQuery = api.aiAgents.getById.useQuery({
    id: agentId,
  })

  const updateAgentMutation = api.aiAgents.update.useMutation()

  const form = useForm<UpdateAgentFormData>({
    resolver: zodResolver(updateAgentSchema),
    defaultValues: {
      name: '',
      description: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: '',
      fallbackMessage: '',
      enableContentFilter: true,
      enableRateLimiting: true,
      maxRequestsPerMinute: 10,
      allowedTopics: [],
      blockedTopics: [],
    },
  })

  const { data: agent, isLoading } = agentQuery

  useEffect(() => {
    if (agent) {
      form.reset({
        name: agent.name,
        description: agent.description || '',
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        systemPrompt: agent.systemPrompt,
        fallbackMessage: agent.fallbackMessage || '',
        enableContentFilter: agent.enableContentFilter,
        enableRateLimiting: agent.enableRateLimiting,
        maxRequestsPerMinute: agent.maxRequestsPerMinute,
        allowedTopics: agent.allowedTopics || [],
        blockedTopics: agent.blockedTopics || [],
      })

      setAllowedTopics(agent.allowedTopics || [])
      setBlockedTopics(agent.blockedTopics || [])
    }
  }, [agent, form])

  const onSubmit = async (data: UpdateAgentFormData) => {
    try {
      await updateAgentMutation.execute({
        id: agentId,
        body: {
          ...data,
          allowedTopics,
          blockedTopics,
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
              <BreadcrumbPage>Editar {agent.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/ai-agents/${agentId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </PageHeader>

      <PageBody>
        <PageMainBar>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Editar Agente</h1>
              <p className="text-muted-foreground">
                Modifique as configurações do seu agente de IA
              </p>
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
                          Configure as informações básicas do seu agente
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
                              <FormDescription>
                                Nome que será exibido para identificar o agente
                              </FormDescription>
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
                                  placeholder="Descreva o propósito e funcionalidades do agente..."
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Descrição opcional do agente e suas funcionalidades
                              </FormDescription>
                              <FormMessage />
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
                                onValueChange={(value) =>
                                  field.onChange(value)
                                }
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um modelo" />
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
                              <FormDescription>
                                Modelo de IA que será usado pelo agente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="temperature"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Temperatura</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="2"
                                    placeholder="0.7"
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value))
                                    }
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Controla a criatividade (0-2)
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
                                    min="1"
                                    max="4000"
                                    placeholder="1000"
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Limite de tokens por resposta
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
                                  <FormDescription>
                                    Filtra conteúdo inadequado
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
                            name="enableRateLimiting"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Limite de Taxa</FormLabel>
                                  <FormDescription>
                                    Limita requisições por minuto
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

                        {form.watch('enableRateLimiting') && (
                          <FormField
                            control={form.control}
                            name="maxRequestsPerMinute"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Máximo de Requisições por Minuto</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    placeholder="10"
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Número máximo de requisições permitidas por minuto
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Tópicos Permitidos
                            </h4>
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
                                size="sm"
                                onClick={() => addTopic(newTopic, 'allowed')}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {allowedTopics.map((topic, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {topic}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 hover:bg-transparent"
                                    onClick={() => removeTopic(index, 'allowed')}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Tópicos Bloqueados
                            </h4>
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
                                size="sm"
                                onClick={() => addTopic(newBlockedTopic, 'blocked')}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {blockedTopics.map((topic, index) => (
                                <Badge
                                  key={index}
                                  variant="destructive"
                                  className="flex items-center gap-1"
                                >
                                  {topic}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 hover:bg-transparent"
                                    onClick={() => removeTopic(index, 'blocked')}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
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
