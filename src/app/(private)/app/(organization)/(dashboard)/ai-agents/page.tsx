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
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/igniter.client'
import {
  Bot,
  MoreHorizontal,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  MessageSquare,
  Zap,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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

// Schema de validação para criação de agente
const createAgentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  type: z.enum(['LLM_AGENT', 'CREW_AI', 'LANGGRAPH_WORKFLOW']).default('LLM_AGENT'),
  role: z.string().optional(),
  goal: z.string().optional(),
  systemPrompt: z.string().min(10, 'Prompt do sistema deve ter pelo menos 10 caracteres'),
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8000).default(1000),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  enableContentFilter: z.boolean().default(true),
  enablePiiDetection: z.boolean().default(true),
  maxResponseLength: z.number().optional(),
  allowedTopics: z.array(z.string()).default([]),
  blockedTopics: z.array(z.string()).default([]),
  fallbackMessage: z.string().optional(),
  isActive: z.boolean().default(true),
})

type CreateAgentFormData = z.infer<typeof createAgentSchema>

export default function AIAgentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)


  // Queries
  const { data: agentsData, isLoading, refetch } = api.aiAgents.list.useQuery({
    search: searchTerm || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    limit: 50,
    offset: 0,
  })

  // Mutations
  const createAgentMutation = api.aiAgents.create.useMutation({
    onSuccess: () => {
      toast.success('Agente criado com sucesso!')
      setIsCreateDialogOpen(false)
      refetch()
    },
    onError: (error) => {
      toast.error('Erro ao criar agente: ' + error.message)
    },
  })

  const deleteAgentMutation = api.aiAgents.delete.useMutation({
    onSuccess: () => {
      toast.success('Agente excluído com sucesso!')
      refetch()
    },
    onError: (error) => {
      toast.error('Erro ao excluir agente: ' + error.message)
    },
  })

  // Form
  const form = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'LLM_AGENT',
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

  const onSubmit = (data: CreateAgentFormData) => {
    createAgentMutation.mutate(data)
  }

  const handleDeleteAgent = (agentId: string) => {
    if (confirm('Tem certeza que deseja excluir este agente?')) {
      deleteAgentMutation.mutate({ id: agentId })
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      LLM_AGENT: { label: 'LLM Agent', variant: 'default' as const },
      CREW_AI: { label: 'Crew AI', variant: 'secondary' as const },
      LANGGRAPH_WORKFLOW: { label: 'LangGraph', variant: 'outline' as const },
    }
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, variant: 'outline' as const }
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
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
              <BreadcrumbPage>Agentes IA</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageBody>
        <PageMainBar>
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Agentes IA</h1>
                <p className="text-muted-foreground">
                  Gerencie seus agentes de inteligência artificial
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Agente IA</DialogTitle>
                    <DialogDescription>
                      Configure um novo agente de inteligência artificial para sua organização.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Informações Básicas */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Informações Básicas</h3>
                          
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Agente</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Assistente de Vendas" {...field} />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="LLM_AGENT">LLM Agent</SelectItem>
                                    <SelectItem value="CREW_AI">Crew AI</SelectItem>
                                    <SelectItem value="LANGGRAPH_WORKFLOW">LangGraph Workflow</SelectItem>
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
                                  <Input placeholder="Ex: Especialista em vendas" {...field} />
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
                                  <Input placeholder="Ex: Ajudar clientes com dúvidas" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Configurações do Modelo */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Configurações do Modelo</h3>
                          
                          <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Modelo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
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
                                    onValueChange={(value) => field.onChange(value[0])}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Controla a criatividade das respostas (0 = conservador, 2 = criativo)
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
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Limite máximo de tokens por resposta
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
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
                              name="enablePiiDetection"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
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
                        </div>
                      </div>

                      {/* Prompt do Sistema */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Prompt do Sistema</h3>
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
                                Mensagem exibida quando o agente não consegue responder
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createAgentMutation.isPending}
                        >
                          {createAgentMutation.isPending ? 'Criando...' : 'Criar Agente'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{agentsData?.pagination.total || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {agentsData?.data.filter(agent => agent.isActive).length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversas Hoje</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tokens Usados</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar agentes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="LLM_AGENT">LLM Agent</SelectItem>
                      <SelectItem value="CREW_AI">Crew AI</SelectItem>
                      <SelectItem value="LANGGRAPH_WORKFLOW">LangGraph</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Agents Table */}
            <Card>
              <CardHeader>
                <CardTitle>Agentes</CardTitle>
                <CardDescription>
                  Lista de todos os agentes de IA da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : agentsData?.data.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum agente encontrado</h3>
                    <p className="text-muted-foreground">
                      Crie seu primeiro agente de IA para começar.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Agente
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentsData?.data.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{agent.name}</div>
                              {agent.description && (
                                <div className="text-sm text-muted-foreground">
                                  {agent.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(agent.type)}</TableCell>
                          <TableCell>{getStatusBadge(agent.isActive)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{agent.model}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(agent.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/app/ai-agents/${agent.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/app/ai-agents/${agent.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/app/ai-agents/${agent.id}/chat`}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Testar Chat
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteAgent(agent.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </PageMainBar>
      </PageBody>
    </PageWrapper>
  )
}