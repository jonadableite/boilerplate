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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { api } from '@/igniter.client'
import {
  ArrowLeft,
  Brain,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  Trash2,
  Download,
  RefreshCw,
  Database,
  Calendar,
  Users,
  File,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface Document {
  id: string
  name: string
  type: string
  size: number
  status: 'processing' | 'completed' | 'error'
  uploadedAt: string
  processedAt?: string
  chunkCount?: number
  errorMessage?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />
    case 'processing':
      return <Clock className="h-4 w-4" />
    case 'error':
      return <XCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄'
  if (type.includes('word') || type.includes('doc')) return '📝'
  if (type.includes('text')) return '📃'
  if (type.includes('image')) return '🖼️'
  return '📁'
}

export default function KnowledgeBasePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [knowledgeBase, setKnowledgeBase] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Queries e mutations
  const kbQuery = (api.aiAgents as any).knowledgeBases.getById.useQuery({ id })
  const documentsQuery = (
    api.aiAgents as any
  ).knowledgeBases.documents.list.useQuery({
    knowledgeBaseId: id,
  })
  const uploadDocumentMutation = (
    api.aiAgents as any
  ).knowledgeBases.documents.upload.useMutation()
  const deleteDocumentMutation = (
    api.aiAgents as any
  ).knowledgeBases.documents.delete.useMutation()
  const reprocessDocumentMutation = (
    api.aiAgents as any
  ).knowledgeBases.documents.reprocess.useMutation()
  const deleteKBMutation = (
    api.aiAgents as any
  ).knowledgeBases.delete.useMutation()
  const statsQuery = (api.aiAgents as any).knowledgeBases.stats.useQuery({ id })

  useEffect(() => {
    if (kbQuery.data?.data) {
      setKnowledgeBase(kbQuery.data.data)
      setLoading(false)
    }
  }, [kbQuery.data])

  useEffect(() => {
    if (kbQuery.error) {
      toast.error('Erro ao carregar base de conhecimento')
      setLoading(false)
    }
  }, [kbQuery.error])

  const documents = documentsQuery.data?.data || []

  // Filtrar documentos
  const filteredDocuments = documents.filter((doc: Document) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('knowledgeBaseId', id)

        await uploadDocumentMutation.mutateAsync(formData as any)
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`)
      documentsQuery.refetch()
      setIsUploadDialogOpen(false)
    } catch (error) {
      toast.error('Erro ao enviar arquivos')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o documento "${docName}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return
    }

    try {
      await deleteDocumentMutation.mutateAsync({ id: docId })
      toast.success('Documento excluído com sucesso')
      documentsQuery.refetch()
    } catch (error) {
      toast.error('Erro ao excluir documento')
    }
  }

  const handleReprocessDocument = async (docId: string, docName: string) => {
    try {
      await reprocessDocumentMutation.mutateAsync({ id: docId })
      toast.success(`Reprocessamento do documento "${docName}" iniciado`)
      documentsQuery.refetch()
    } catch (error) {
      toast.error('Erro ao reprocessar documento')
    }
  }

  const handleDeleteKB = async () => {
    if (
      !confirm(
        `Tem certeza que deseja excluir a base de conhecimento "${knowledgeBase?.name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return
    }

    try {
      await deleteKBMutation.mutateAsync({ id })
      toast.success('Base de conhecimento excluída com sucesso')
      router.push('/app/ai-agents/knowledge-bases')
    } catch (error) {
      toast.error('Erro ao excluir base de conhecimento')
    }
  }

  if (loading) {
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
                  <BreadcrumbLink href="/app/ai-agents/knowledge-bases">
                    Bases de Conhecimento
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Carregando...</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageMainBar>
        </PageHeader>

        <PageBody>
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <Skeleton className="h-8 w-8" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </PageBody>
      </PageWrapper>
    )
  }

  if (!knowledgeBase) {
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
                  <BreadcrumbLink href="/app/ai-agents/knowledge-bases">
                    Bases de Conhecimento
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Base não encontrada</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageMainBar>
        </PageHeader>

        <PageBody>
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Base de conhecimento não encontrada
                </h2>
                <p className="text-muted-foreground mb-4">
                  A base de conhecimento solicitada não existe ou foi removida.
                </p>
                <Link href="/app/ai-agents/knowledge-bases">
                  <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Bases de Conhecimento
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </PageBody>
      </PageWrapper>
    )
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
                <BreadcrumbLink href="/app/ai-agents/knowledge-bases">
                  Bases de Conhecimento
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{knowledgeBase.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {knowledgeBase.name}
                  </h1>
                  <Badge className={getStatusColor(knowledgeBase.status)}>
                    {knowledgeBase.status === 'active' && 'Ativo'}
                    {knowledgeBase.status === 'processing' && 'Processando'}
                    {knowledgeBase.status === 'error' && 'Erro'}
                  </Badge>
                </div>
                {knowledgeBase.description && (
                  <p className="text-muted-foreground">
                    {knowledgeBase.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Documentos
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Documentos</DialogTitle>
                    <DialogDescription>
                      Selecione os arquivos que deseja adicionar à base de
                      conhecimento.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Clique para selecionar arquivos ou arraste e solte aqui
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Suporte para PDF, DOC, DOCX, TXT (máx. 10MB por arquivo)
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(e.target.files)
                        }
                      }}
                    />

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Enviando arquivos...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsUploadDialogOpen(false)}
                      disabled={isUploading}
                    >
                      Cancelar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={handleDeleteKB}
                disabled={deleteKBMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Base
              </Button>

              <Link href="/app/ai-agents/knowledge-bases">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Documentos
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsQuery.data?.data?.totalDocuments ||
                    knowledgeBase.documentCount ||
                    0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tamanho Total
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatFileSize(
                    statsQuery.data?.data?.totalSize ||
                    knowledgeBase.totalSize ||
                    0,
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Chunks Processados
                </CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsQuery.data?.data?.totalChunks || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Agentes Conectados
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsQuery.data?.data?.connectedAgents ||
                    knowledgeBase.agentCount ||
                    0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
              <CardDescription>
                {filteredDocuments.length} de {documents.length} documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsQuery.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <Skeleton className="h-8 w-8" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm
                      ? 'Nenhum documento encontrado'
                      : 'Nenhum documento ainda'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? 'Tente ajustar o termo de busca.'
                      : 'Envie seus primeiros documentos para começar.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Primeiro Documento
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((doc: Document) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-2xl">{getFileIcon(doc.type)}</div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{doc.name}</h3>
                          <Badge className={getStatusColor(doc.status)}>
                            {getStatusIcon(doc.status)}
                            {doc.status === 'completed' && 'Processado'}
                            {doc.status === 'processing' && 'Processando'}
                            {doc.status === 'error' && 'Erro'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(doc.size)}</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {doc.chunkCount && (
                            <span>{doc.chunkCount} chunks</span>
                          )}
                        </div>

                        {doc.errorMessage && (
                          <p className="text-sm text-destructive mt-1">
                            {doc.errorMessage}
                          </p>
                        )}
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleReprocessDocument(doc.id, doc.name)
                            }
                            disabled={reprocessDocumentMutation.isPending}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reprocessar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteDocument(doc.id, doc.name)
                            }
                            className="text-destructive focus:text-destructive"
                            disabled={deleteDocumentMutation.isPending}
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
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
