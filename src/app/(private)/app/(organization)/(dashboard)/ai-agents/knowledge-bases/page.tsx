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
  Brain,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  Trash2,
  Edit,
  Eye,
  Download,
  RefreshCw,
  Database,
  Calendar,
  Users,
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
import { Skeleton } from '@/components/ui/skeleton'

interface KnowledgeBase {
  id: string
  name: string
  description?: string
  documentCount: number
  totalSize: number
  status: 'active' | 'processing' | 'error'
  createdAt: string
  updatedAt?: string
  agentCount?: number
}

const knowledgeBaseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
})

type KnowledgeBaseFormData = z.infer<typeof knowledgeBaseSchema>

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function KnowledgeBasesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null)

  // Queries e mutations
  const knowledgeBasesQuery = (
    api.aiAgents as any
  ).knowledgeBases.list.useQuery()
  const createKBMutation = (
    api.aiAgents as any
  ).knowledgeBases.create.useMutation()
  const deleteKBMutation = (
    api.aiAgents as any
  ).knowledgeBases.delete.useMutation()
  const reprocessKBMutation = (
    api.aiAgents as any
  ).knowledgeBases.reprocess.useMutation()

  const form = useForm<KnowledgeBaseFormData>({
    resolver: zodResolver(knowledgeBaseSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const knowledgeBases = knowledgeBasesQuery.data?.data || []

  // Filtrar bases de conhecimento
  const filteredKnowledgeBases = knowledgeBases.filter((kb: KnowledgeBase) => {
    const matchesSearch = kb.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || kb.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const onSubmit = async (data: KnowledgeBaseFormData) => {
    try {
      const result = await createKBMutation.mutateAsync(data)

      if (result.success) {
        toast.success('Base de conhecimento criada com sucesso!')
        setIsCreateDialogOpen(false)
        form.reset()
        knowledgeBasesQuery.refetch()
      }
    } catch (error) {
      toast.error('Erro ao criar base de conhecimento')
      console.error('Error creating knowledge base:', error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir a base de conhecimento "${name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return
    }

    try {
      await deleteKBMutation.mutateAsync({ id })
      toast.success('Base de conhecimento excluída com sucesso')
      knowledgeBasesQuery.refetch()
    } catch (error) {
      toast.error('Erro ao excluir base de conhecimento')
    }
  }

  const handleReprocess = async (id: string, name: string) => {
    try {
      await reprocessKBMutation.mutateAsync({ id })
      toast.success(`Reprocessamento da base "${name}" iniciado`)
      knowledgeBasesQuery.refetch()
    } catch (error) {
      toast.error('Erro ao reprocessar base de conhecimento')
    }
  }

  return (
    <PageWrapper>
      <PageHeader className="border-0">
        <PageMainBar>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/app/ai-agents">
                  Agentes de IA
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Bases de Conhecimento</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Bases de Conhecimento
              </h1>
              <p className="text-muted-foreground">
                Gerencie as bases de conhecimento para seus agentes de IA
              </p>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Base de Conhecimento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Base de Conhecimento</DialogTitle>
                  <DialogDescription>
                    Crie uma nova base de conhecimento para seus agentes de IA.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Documentação do Produto"
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
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva o conteúdo desta base de conhecimento..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
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
                        disabled={createKBMutation.isPending}
                      >
                        {createKBMutation.isPending ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Criando...
                          </>
                        ) : (
                          'Criar Base'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar bases de conhecimento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Bases de Conhecimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Bases de Conhecimento
              </CardTitle>
              <CardDescription>
                {filteredKnowledgeBases.length} de {knowledgeBases.length} bases
                de conhecimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {knowledgeBasesQuery.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              ) : filteredKnowledgeBases.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Nenhuma base encontrada'
                      : 'Nenhuma base de conhecimento ainda'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca.'
                      : 'Crie sua primeira base de conhecimento para começar.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Base
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredKnowledgeBases.map((kb: KnowledgeBase) => (
                    <div
                      key={kb.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Brain className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{kb.name}</h3>
                          <Badge className={getStatusColor(kb.status)}>
                            {kb.status === 'active' && 'Ativo'}
                            {kb.status === 'processing' && 'Processando'}
                            {kb.status === 'error' && 'Erro'}
                          </Badge>
                        </div>

                        {kb.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {kb.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{kb.documentCount} documentos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            <span>{formatFileSize(kb.totalSize)}</span>
                          </div>
                          {kb.agentCount !== undefined && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{kb.agentCount} agentes</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(kb.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

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
                            <Link
                              href={`/app/ai-agents/knowledge-bases/${kb.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/app/ai-agents/knowledge-bases/${kb.id}/edit`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleReprocess(kb.id, kb.name)}
                            disabled={reprocessKBMutation.isPending}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reprocessar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(kb.id, kb.name)}
                            className="text-destructive focus:text-destructive"
                            disabled={deleteKBMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = false
