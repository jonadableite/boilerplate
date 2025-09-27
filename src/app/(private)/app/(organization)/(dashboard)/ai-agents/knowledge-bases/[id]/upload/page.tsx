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
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/igniter.client'
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  File,
  Brain,
  Settings,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
}

interface ProcessingSettings {
  chunkSize: number
  chunkOverlap: number
  enableOCR: boolean
  language: string
  extractMetadata: boolean
  autoProcess: boolean
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄'
  if (type.includes('word') || type.includes('doc')) return '📝'
  if (type.includes('text')) return '📃'
  if (type.includes('image')) return '🖼️'
  return '📁'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function UploadPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [knowledgeBase, setKnowledgeBase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingSettings, setProcessingSettings] =
    useState<ProcessingSettings>({
      chunkSize: 1000,
      chunkOverlap: 200,
      enableOCR: false,
      language: 'pt',
      extractMetadata: true,
      autoProcess: true,
    })

  // Queries e mutations
  const kbQuery = (api.aiAgents as any).knowledgeBases.getById.useQuery({ id })
  const uploadDocumentMutation = (
    api.aiAgents as any
  ).knowledgeBases.documents.upload.useMutation()

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

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }, [])

  const addFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'text/csv',
      ]

      if (!validTypes.includes(file.type)) {
        toast.error(`Tipo de arquivo não suportado: ${file.name}`)
        return false
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        toast.error(`Arquivo muito grande: ${file.name} (máx. 10MB)`)
        return false
      }

      return true
    })

    const newFiles: UploadFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0,
    }))

    setUploadFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
  }

  const updateFileStatus = (
    fileId: string,
    status: UploadFile['status'],
    progress = 0,
    error?: string,
  ) => {
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status, progress, error } : f,
      ),
    )
  }

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    updateFileStatus(uploadFile.id, 'uploading', 0)

    try {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('knowledgeBaseId', id)
      formData.append('settings', JSON.stringify(processingSettings))

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        updateFileStatus(
          uploadFile.id,
          'uploading',
          Math.min(uploadFile.progress + 10, 90),
        )
      }, 200)

      await uploadDocumentMutation.mutateAsync(formData as any)

      clearInterval(progressInterval)
      updateFileStatus(uploadFile.id, 'completed', 100)

      return true
    } catch (error: any) {
      updateFileStatus(
        uploadFile.id,
        'error',
        0,
        error.message || 'Erro no upload',
      )
      return false
    }
  }

  const handleUploadAll = async () => {
    if (uploadFiles.length === 0) return

    setIsUploading(true)
    let successCount = 0
    let errorCount = 0

    // Upload files sequentially to avoid overwhelming the server
    for (const file of uploadFiles.filter((f) => f.status === 'pending')) {
      const success = await uploadSingleFile(file)
      if (success) {
        successCount++
      } else {
        errorCount++
      }
    }

    setIsUploading(false)

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`)
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} arquivo(s) falharam no upload`)
    }

    if (successCount > 0 && errorCount === 0) {
      // Redirect back to knowledge base page after successful upload
      setTimeout(() => {
        router.push(`/app/ai-agents/knowledge-bases/${id}`)
      }, 2000)
    }
  }

  const totalFiles = uploadFiles.length
  const completedFiles = uploadFiles.filter(
    (f) => f.status === 'completed',
  ).length
  const errorFiles = uploadFiles.filter((f) => f.status === 'error').length
  const pendingFiles = uploadFiles.filter((f) => f.status === 'pending').length

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
          <div className="mx-auto max-w-4xl space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card>
              <CardContent className="p-8">
                <Skeleton className="h-32 w-full" />
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
                <BreadcrumbLink href={`/app/ai-agents/knowledge-bases/${id}`}>
                  {knowledgeBase.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Upload de Documentos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Upload de Documentos
              </h1>
              <p className="text-muted-foreground">
                Adicione documentos à base de conhecimento "{knowledgeBase.name}
                "
              </p>
            </div>

            <Link href={`/app/ai-agents/knowledge-bases/${id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Selecionar Arquivos
              </CardTitle>
              <CardDescription>
                Arraste e solte arquivos aqui ou clique para selecionar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={dropZoneRef}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {isDragOver
                    ? 'Solte os arquivos aqui'
                    : 'Selecione ou arraste arquivos'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Suporte para PDF, DOC, DOCX, TXT, MD, CSV
                </p>
                <p className="text-sm text-muted-foreground">
                  Tamanho máximo: 10MB por arquivo
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Processing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Processamento
              </CardTitle>
              <CardDescription>
                Configure como os documentos serão processados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chunkSize">Tamanho do Chunk</Label>
                  <Select
                    value={processingSettings.chunkSize.toString()}
                    onValueChange={(value) =>
                      setProcessingSettings((prev) => ({
                        ...prev,
                        chunkSize: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500 caracteres</SelectItem>
                      <SelectItem value="1000">1000 caracteres</SelectItem>
                      <SelectItem value="1500">1500 caracteres</SelectItem>
                      <SelectItem value="2000">2000 caracteres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chunkOverlap">Sobreposição</Label>
                  <Select
                    value={processingSettings.chunkOverlap.toString()}
                    onValueChange={(value) =>
                      setProcessingSettings((prev) => ({
                        ...prev,
                        chunkOverlap: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 caracteres</SelectItem>
                      <SelectItem value="200">200 caracteres</SelectItem>
                      <SelectItem value="300">300 caracteres</SelectItem>
                      <SelectItem value="400">400 caracteres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={processingSettings.language}
                    onValueChange={(value) =>
                      setProcessingSettings((prev) => ({
                        ...prev,
                        language: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">Inglês</SelectItem>
                      <SelectItem value="es">Espanhol</SelectItem>
                      <SelectItem value="fr">Francês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableOCR"
                    checked={processingSettings.enableOCR}
                    onCheckedChange={(checked) =>
                      setProcessingSettings((prev) => ({
                        ...prev,
                        enableOCR: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="enableOCR">
                    Habilitar OCR para imagens e PDFs escaneados
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="extractMetadata"
                    checked={processingSettings.extractMetadata}
                    onCheckedChange={(checked) =>
                      setProcessingSettings((prev) => ({
                        ...prev,
                        extractMetadata: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="extractMetadata">
                    Extrair metadados dos documentos
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoProcess"
                    checked={processingSettings.autoProcess}
                    onCheckedChange={(checked) =>
                      setProcessingSettings((prev) => ({
                        ...prev,
                        autoProcess: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="autoProcess">
                    Processar automaticamente após upload
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Arquivos Selecionados
                  <Badge variant="secondary">{totalFiles}</Badge>
                </CardTitle>
                <CardDescription>
                  {completedFiles > 0 && (
                    <span className="text-green-600">
                      {completedFiles} concluído(s)
                    </span>
                  )}
                  {errorFiles > 0 && (
                    <span className="text-red-600 ml-2">
                      {errorFiles} com erro
                    </span>
                  )}
                  {pendingFiles > 0 && (
                    <span className="text-muted-foreground ml-2">
                      {pendingFiles} pendente(s)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadFiles.map((uploadFile) => (
                    <div
                      key={uploadFile.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="text-2xl">
                        {getFileIcon(uploadFile.file.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">
                            {uploadFile.file.name}
                          </h3>
                          {uploadFile.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {uploadFile.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>{formatFileSize(uploadFile.file.size)}</span>
                          <span className="capitalize">
                            {uploadFile.status}
                          </span>
                        </div>

                        {uploadFile.status === 'uploading' && (
                          <Progress
                            value={uploadFile.progress}
                            className="h-2"
                          />
                        )}

                        {uploadFile.error && (
                          <p className="text-sm text-red-500 mt-1">
                            {uploadFile.error}
                          </p>
                        )}
                      </div>

                      {uploadFile.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Total: {totalFiles} arquivo(s) •{' '}
                    {formatFileSize(
                      uploadFiles.reduce((acc, f) => acc + f.file.size, 0),
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setUploadFiles([])}
                      disabled={isUploading}
                    >
                      Limpar Lista
                    </Button>

                    <Button
                      onClick={handleUploadAll}
                      disabled={isUploading || pendingFiles === 0}
                      className="min-w-[120px]"
                    >
                      {isUploading ? (
                        <>
                          <Zap className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar Todos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
