'use client'

import React, { useState } from 'react'
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
import { AIAgentType } from '@/features/ai-agents/types/ai-agent.types'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { createAIAgentSchema } from '@/features/ai-agents/validation/ai-agent.validation'

import { BorderBeam } from '@/components/magicui/border-beam'
import { MagicCard } from '@/components/magicui/magic-card'
import { useTheme } from 'next-themes'
import { GradientBackground } from '@/components/ui/gradient-background'
import {
  ModernTable,
  ModernTableHeader,
  ModernTableBody,
  ModernTableRow,
  ModernTableHead,
  ModernTableCell,
} from '@/components/ui/modern-table'
import {
  ModernFilters,
  SearchInput,
  FilterSelect,
} from '@/components/ui/modern-filters'
import { StatusBadge } from '@/components/ui/status-badge'
import { ActionButton } from '@/components/ui/action-button'
import {
  IconRobot,
  IconUsers,
  IconMessageCircle,
  IconCoin,
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash,
  IconDots,
  IconActivity,
  IconClock,
  IconBrain,
  IconStar,
} from '@tabler/icons-react'
import Image from 'next/image'

// Schema de validação para criação de agente
const createAgentSchema = createAIAgentSchema

type CreateAgentFormData = z.infer<typeof createAgentSchema>

export default function AIAgentsPage() {
  const { theme } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Queries
  const {
    data: agentsData,
    isLoading,
    refetch,
  } = (api.aiAgents.list as any).useQuery({
    search: searchTerm || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    isActive:
      statusFilter === 'active'
        ? true
        : statusFilter === 'inactive'
          ? false
          : undefined,
    limit: 50,
    offset: 0,
  })

  // Mutations
  const createAgentMutation = (api.aiAgents.create as any).useMutation({
    onSuccess: () => {
      toast.success('Agente criado com sucesso!')
      setIsCreateDialogOpen(false)
      refetch()
    },
    onError: (error: any) => {
      toast.error('Erro ao criar agente: ' + error.message)
    },
  })

  const deleteAgentMutation = (api.aiAgents.delete as any).useMutation({
    onSuccess: () => {
      toast.success('Agente excluído com sucesso!')
      refetch()
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir agente: ' + error.message)
    },
  })

  // Form
  const form = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: '',
      description: '',
      type: AIAgentType.LLM_AGENT,
      role: '',
      goal: '',
      systemPrompt: 'Você é um assistente útil e prestativo.',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      enableContentFilter: true,
      enablePiiDetection: true,
      allowedTopics: [],
      blockedTopics: [],
      fallbackMessage: '',
      isActive: true,
    },
  })

  const onSubmit = (data: CreateAgentFormData) => {
    createAgentMutation.mutate({ body: data })
  }

  const handleDeleteAgent = (agentId: string) => {
    if (confirm('Tem certeza que deseja excluir este agente?')) {
      deleteAgentMutation.mutate({ params: { id: agentId } })
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
      [AIAgentType.LLM_AGENT]: {
        label: 'LLM Agent',
        variant: 'default' as const,
      },
      [AIAgentType.CREW_AI]: {
        label: 'Crew AI',
        variant: 'secondary' as const,
      },
      [AIAgentType.LANGGRAPH_WORKFLOW]: {
        label: 'LangGraph',
        variant: 'outline' as const,
      },
      [AIAgentType.GOOGLE_ADK]: {
        label: 'Google ADK',
        variant: 'destructive' as const,
      },
      [AIAgentType.A2A_PROTOCOL]: {
        label: 'A2A Protocol',
        variant: 'secondary' as const,
      },
      [AIAgentType.MCP_SERVER]: {
        label: 'MCP Server',
        variant: 'outline' as const,
      },
    }
    const typeInfo = typeMap[type as keyof typeof typeMap] || {
      label: type,
      variant: 'outline' as const,
    }
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
          <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header with gradient background */}
            <GradientBackground variant="primary" className="rounded-2xl p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Agentes IA
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      Gerencie seus agentes de inteligência artificial. Crie,
                      configure e monitore agentes para automatizar tarefas e
                      processos.
                    </p>
                  </div>
                </div>
                <Link href="/app/ai-agents/new">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <IconPlus className="h-5 w-5" />
                    Novo Agente
                  </Button>
                </Link>
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="gap-2"
                      style={{ display: 'none' }}
                    >
                      <IconPlus className="h-5 w-5" />
                      Criar Agente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Agente IA</DialogTitle>
                      <DialogDescription>
                        Configure um novo agente de inteligência artificial para
                        automatizar tarefas específicas.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo do Agente</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
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
                                    <SelectItem
                                      value={AIAgentType.A2A_PROTOCOL}
                                    >
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
                        </div>
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva o propósito e funcionalidades do agente..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    placeholder="Ex: Aumentar conversões de vendas"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="systemPrompt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prompt do Sistema</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Instruções detalhadas para o comportamento do agente..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Define como o agente deve se comportar e
                                responder às interações.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Modelo</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                    <SelectItem value="gpt-3.5-turbo">
                                      GPT-3.5 Turbo
                                    </SelectItem>
                                    <SelectItem value="claude-3">
                                      Claude 3
                                    </SelectItem>
                                    <SelectItem value="gemini-pro">
                                      Gemini Pro
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
                                <FormLabel>
                                  Temperatura: {field.value}
                                </FormLabel>
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
                                    min={100}
                                    max={4000}
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">
                            Configurações de Segurança
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="enableContentFilter"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Filtro de Conteúdo
                                    </FormLabel>
                                    <FormDescription>
                                      Ativa filtros para conteúdo inadequado
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
                                    <FormLabel className="text-base">
                                      Detecção de PII
                                    </FormLabel>
                                    <FormDescription>
                                      Detecta e protege informações pessoais
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
                                  Determina se o agente está disponível para uso
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
                            {createAgentMutation.isPending
                              ? 'Criando...'
                              : 'Criar Agente'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </GradientBackground>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Total de Agentes
                      </p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {agentsData?.data?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full transform hover:rotate-12 transition-transform duration-300">
                      <IconBrain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Agentes Ativos
                      </p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {agentsData?.data?.filter(
                          (agent: any) => agent.isActive,
                        ).length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full transform hover:rotate-12 transition-transform duration-300">
                      <IconActivity className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        Agentes Inativos
                      </p>
                      <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {agentsData?.data?.filter(
                          (agent: any) => !agent.isActive,
                        ).length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-full transform hover:rotate-12 transition-transform duration-300">
                      <IconClock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Filters */}
            <ModernFilters>
              <div className="space-y-4">
                {/* Search and Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder="Buscar por nome, descrição ou modelo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={typeFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTypeFilter('all')}
                      className="transition-all duration-200"
                    >
                      Todos
                    </Button>
                    <Button
                      variant={
                        statusFilter === 'active' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        setStatusFilter(
                          statusFilter === 'active' ? 'all' : 'active',
                        )
                      }
                      className="transition-all duration-200"
                    >
                      Ativos
                    </Button>
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="flex flex-wrap gap-3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🤖 Todos os tipos</SelectItem>
                      <SelectItem value={AIAgentType.LLM_AGENT}>
                        🧠 LLM Agent
                      </SelectItem>
                      <SelectItem value={AIAgentType.CREW_AI}>
                        👥 Crew AI
                      </SelectItem>
                      <SelectItem value={AIAgentType.LANGGRAPH_WORKFLOW}>
                        🔄 LangGraph
                      </SelectItem>
                      <SelectItem value={AIAgentType.GOOGLE_ADK}>
                        🔍 Google ADK
                      </SelectItem>
                      <SelectItem value={AIAgentType.A2A_PROTOCOL}>
                        🔗 A2A Protocol
                      </SelectItem>
                      <SelectItem value={AIAgentType.MCP_SERVER}>
                        🖥️ MCP Server
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">📊 Todos</SelectItem>
                      <SelectItem value="active">🟢 Ativo</SelectItem>
                      <SelectItem value="inactive">🔴 Inativo</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Options */}
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">📅 Mais recente</SelectItem>
                      <SelectItem value="oldest">📅 Mais antigo</SelectItem>
                      <SelectItem value="name">🔤 Nome A-Z</SelectItem>
                      <SelectItem value="active">⚡ Mais ativos</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  {(searchTerm ||
                    typeFilter !== 'all' ||
                    statusFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('')
                          setTypeFilter('all')
                          setStatusFilter('all')
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        ✨ Limpar filtros
                      </Button>
                    )}
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Mostrando {agentsData?.data?.length || 0} agentes</span>
                  <div className="flex items-center gap-2">
                    <span>Visualização:</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                        <div className="bg-current rounded-sm" />
                        <div className="bg-current rounded-sm" />
                        <div className="bg-current rounded-sm" />
                        <div className="bg-current rounded-sm" />
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </ModernFilters>

            {/* Agents Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : agentsData?.data && agentsData.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentsData.data.map((agent: any, index: number) => (
                  <Card
                    key={agent.id}
                    className="relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-500 border rounded-xl"
                  >
                    <MagicCard
                      gradientColor={theme === 'dark' ? '#262626' : '#D9D9D955'}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                <Image
                                  src="/cyborg.png"
                                  alt={`Avatar do ${agent.name}`}
                                  width={56}
                                  height={56}
                                  className="rounded-full object-cover"
                                />
                              </div>
                            </div>
                            {agent.isActive && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                                {agent.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 ml-2">
                                <div className="flex items-center gap-1">
                                  <IconStar className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm text-muted-foreground">
                                    4.8
                                  </span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <IconDots className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <Link href={`/app/ai-agents/${agent.id}`}>
                                        <IconEye className="mr-2 h-4 w-4" />
                                        Visualizar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/app/ai-agents/${agent.id}/edit`}
                                      >
                                        <IconEdit className="mr-2 h-4 w-4" />
                                        Editar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/app/ai-agents/${agent.id}/chat`}
                                      >
                                        <IconMessageCircle className="mr-2 h-4 w-4" />
                                        Chat
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() =>
                                        handleDeleteAgent(agent.id)
                                      }
                                    >
                                      <IconTrash className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              {getTypeBadge(agent.type)}
                              {getStatusBadge(agent.isActive)}
                            </div>

                            {/* Informações adicionais */}
                            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <IconClock className="h-3 w-3" />
                                <span>
                                  Criado:{' '}
                                  {new Date(agent.createdAt).toLocaleDateString(
                                    'pt-BR',
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <IconActivity className="h-3 w-3" />
                                <span>
                                  Atualizado:{' '}
                                  {agent.updatedAt
                                    ? new Date(
                                      agent.updatedAt,
                                    ).toLocaleDateString('pt-BR')
                                    : 'Nunca'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {agent.description || 'Sem descrição disponível'}
                          </p>

                          {/* Métricas do agente */}
                          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                127
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Conversas
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                98%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Precisão
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                2.3s
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Resposta
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Modelo: {agent.model}</span>
                            <span>Temp: {agent.temperature}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                asChild
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 transform hover:scale-105 transition-all duration-200"
                              >
                                <Link href={`/app/ai-agents/${agent.id}/chat`}>
                                  <IconMessageCircle className="mr-2 h-3 w-3" />
                                  Conversar
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="hover:bg-gray-50 dark:hover:bg-gray-800 transform hover:scale-105 transition-all duration-200"
                              >
                                <Link href={`/app/ai-agents/${agent.id}`}>
                                  <IconEye className="mr-2 h-3 w-3" />
                                  Detalhes
                                </Link>
                              </Button>
                            </div>

                            {/* Status indicator */}
                            <div className="flex items-center gap-2">
                              {agent.isActive ? (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  Online
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                  Offline
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <BorderBeam
                        size={300}
                        duration={4}
                        reverse
                        className="from-transparent via-green-500 to-transparent"
                      />
                    </MagicCard>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconRobot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum agente encontrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Nenhum agente corresponde aos filtros aplicados.'
                    : 'Você ainda não criou nenhum agente IA.'}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Criar Primeiro Agente
                </Button>
              </div>
            )}
          </div>
        </PageMainBar>
      </PageBody>
    </PageWrapper>
  )
}
