'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react'
import {
  useKnowledgeUpload,
  type KnowledgeFile,
  type UploadProgress,
} from '../hooks/use-knowledge-upload'
import { cn } from '@/utils/cn'

interface KnowledgeUploadProps {
  agentId: string
  className?: string
}

export function KnowledgeUpload({ agentId, className }: KnowledgeUploadProps) {
  const {
    files,
    uploadProgress,
    isUploading,
    uploadFiles,
    removeFile,
    formatFileSize,
    getFileIcon,
    isRemoving,
  } = useKnowledgeUpload(agentId)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      uploadFiles(acceptedFiles)
    },
    [uploadFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  })

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivos de Conhecimento
          </CardTitle>
          <CardDescription>
            Faça upload de documentos PDF, TXT, DOC ou DOCX para criar a base de
            conhecimento do agente. Tamanho máximo: 10MB por arquivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              isUploading && 'cursor-not-allowed opacity-50',
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Solte os arquivos aqui...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporte para PDF, TXT, DOC e DOCX
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progresso do Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadProgress.map((progress) => (
                <UploadProgressItem key={progress.fileId} progress={progress} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Arquivos da Base de Conhecimento
            </CardTitle>
            <CardDescription>
              {files.length} arquivo(s) •{' '}
              {files.reduce(
                (total: number, file: KnowledgeFile) =>
                  total + file.chunksCount,
                0,
              )}{' '}
              chunk(s) total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {files.map((file: KnowledgeFile) => (
                  <KnowledgeFileItem
                    key={file.id}
                    file={file}
                    onRemove={() => removeFile(file.id)}
                    isRemoving={isRemoving}
                    formatFileSize={formatFileSize}
                    getFileIcon={getFileIcon}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {files.length === 0 && uploadProgress.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  Nenhum arquivo na base de conhecimento
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Faça upload de documentos para que o agente possa usar essas
                  informações nas respostas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Componente para mostrar progresso individual de upload
function UploadProgressItem({ progress }: { progress: UploadProgress }) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (progress.status) {
      case 'uploading':
        return 'Enviando...'
      case 'processing':
        return 'Processando...'
      case 'completed':
        return 'Concluído'
      case 'error':
        return progress.error || 'Erro'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium truncate">
            {progress.fileName}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{getStatusText()}</span>
      </div>
      <Progress
        value={progress.progress}
        className={cn(
          'h-2',
          progress.status === 'error' && 'bg-red-100',
          progress.status === 'completed' && 'bg-green-100',
        )}
      />
    </div>
  )
}

// Componente para mostrar arquivo individual
interface KnowledgeFileItemProps {
  file: KnowledgeFile
  onRemove: () => void
  isRemoving: boolean
  formatFileSize: (bytes: number) => string
  getFileIcon: (type: string) => string
}

function KnowledgeFileItem({
  file,
  onRemove,
  isRemoving,
  formatFileSize,
  getFileIcon,
}: KnowledgeFileItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl">{getFileIcon(file.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.originalName}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            <span>{file.chunksCount} chunks</span>
            <span>
              Processado em {new Date(file.processedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {file.type.split('/')[1].toUpperCase()}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={isRemoving}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
