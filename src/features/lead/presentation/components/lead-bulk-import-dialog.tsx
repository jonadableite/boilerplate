'use client'

import { useState, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  AlertTriangle,
  XCircle,
  Loader2,
  Info,
  Phone,
  Mail,
  User,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api } from '@/igniter.client'

interface ImportResult {
  success: number
  errors: Array<{
    row: number
    message: string
  }>
  total: number
}

interface LeadBulkImportDialogProps {
  onImportComplete?: () => void
}

export function LeadBulkImportDialog({
  onImportComplete,
}: LeadBulkImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bulkImportMutation = (api.lead.bulkImport as any).useMutation({
    onSuccess: (result) => {
      setImportResult(result)
      setIsUploading(false)
      setUploadProgress(100)
    },
    onError: (error: any) => {
      setError(error.message)
      setIsUploading(false)
      setUploadProgress(0)
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validar tipo de arquivo
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ]

      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.match(/\.(xlsx?|csv)$/i)
      ) {
        setError(
          'Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)',
        )
        return
      }

      // Validar tamanho do arquivo (máximo 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 10MB')
        return
      }

      setFile(selectedFile)
      setError(null)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Converter arquivo para base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Converter arquivo para base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        try {
          await bulkImportMutation.mutateAsync({
            file: base64,
            filename: file.name,
          })
          clearInterval(progressInterval)
        } catch (error) {
          clearInterval(progressInterval)
          throw error
        }
      }

      reader.onerror = () => {
        clearInterval(progressInterval)
        setError('Erro ao ler o arquivo')
        setIsUploading(false)
      }

      reader.readAsDataURL(file)

      clearInterval(progressInterval)
    } catch (error) {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportResult(null)
    setError(null)
    setUploadProgress(0)
    setIsUploading(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(handleReset, 300) // Delay para animação do dialog
  }

  const downloadTemplate = () => {
    // Criar template CSV
    const csvContent =
      'nome,email,telefone\nJoão Silva,joao@exemplo.com,11999999999\nMaria Santos,maria@exemplo.com,11888888888'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template-leads.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Upload className="h-4 w-4 mr-2" />
          Importar Leads
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Leads em Massa
          </DialogTitle>
          <DialogDescription>
            Importe múltiplos leads de uma vez usando um arquivo Excel ou CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">
                    Precisa de um modelo?
                  </h4>
                </div>
                <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                  Baixe nosso template com as colunas necessárias:{' '}
                  <strong>telefone</strong> (obrigatório),
                  <strong> nome</strong> e <strong>email</strong> (opcionais).
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    O campo <strong>telefone</strong> é obrigatório para todos
                    os leads
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors ml-4"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Modelo
              </Button>
            </div>
          </div>

          {/* File Upload */}
          {!importResult && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-4"
                >
                  <div className="p-4 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Upload className="h-8 w-8 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                      Clique para selecionar um arquivo
                    </p>
                    <p className="text-sm text-gray-500">
                      Formatos aceitos:{' '}
                      <span className="font-medium">.xlsx, .xls, .csv</span>{' '}
                      (máximo 10MB)
                    </p>
                    <p className="text-xs text-gray-400">
                      Ou arraste e solte o arquivo aqui
                    </p>
                  </div>
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileSpreadsheet className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        {file.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Arquivo
                        selecionado
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-green-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Processando arquivo...
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Validando dados e criando leads...
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Importação Concluída!
                </h3>
                <p className="text-sm text-gray-600">
                  Seus leads foram processados com sucesso
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-800">
                        {importResult.successful}
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                        Leads criados
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-800">
                        {importResult.duplicates}
                      </p>
                      <p className="text-sm text-yellow-600 font-medium">
                        Duplicados ignorados
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-800">
                        {importResult.errors}
                      </p>
                      <p className="text-sm text-red-600 font-medium">
                        Erros encontrados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {importResult.errorDetails &&
                importResult.errorDetails.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Detalhes dos Erros:
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {importResult.errorDetails.map((error, index) => (
                        <div
                          key={index}
                          className="text-xs text-red-700 bg-red-100 p-2 rounded-lg"
                        >
                          <span className="font-medium">
                            Linha {error.row}:
                          </span>{' '}
                          {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
            {!importResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || isUploading}
                  className="order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isUploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Leads
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleClose}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Concluir
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Nova Importação
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
