'use client'

import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DEFAULT_WARMUP_CONFIG,
  DEFAULT_WARMUP_TEXTS,
  REACTION_EMOJIS,
} from '@/features/warmup/warmup.constants'
import { api } from '@/igniter.client'
import {
  AlertTriangle,
  FileAudio,
  FileImage,
  FileVideo,
  MessageSquare,
  Play,
  Sticker,
  Upload,
  X,
} from 'lucide-react'
import { ChangeEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

interface MediaContent {
  type: 'image' | 'video' | 'audio' | 'sticker'
  base64: string
  fileName: string
  mimetype: string
  preview?: string
}

// Interface removida pois não é mais utilizada

interface WhatsAppInstance {
  id: string
  instanceName: string
  profileName?: string
  status: string
  ownerJid?: string
}

export interface WarmupConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  selectedInstances: string[] // Mudando para obrigatório e usando array em vez de Set
  onInstanceToggle: (instanceName: string) => void // Nova prop para gerenciar seleção
}

const formSchema = z.object({
  instances: z.array(z.string()).min(1, 'Selecione pelo menos uma instância'),
  texts: z.array(z.string()).min(1, 'Adicione pelo menos um texto'),
})

export function WarmupConfigDialog({
  open,
  onOpenChange,
  onSuccess,
  selectedInstances, // Usando as instâncias já selecionadas
  onInstanceToggle,
}: WarmupConfigDialogProps) {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  // Removendo o estado duplicado selectedInstances
  const [texts, setTexts] = useState<string[]>(DEFAULT_WARMUP_TEXTS)
  const [newText, setNewText] = useState('')
  const [images, setImages] = useState<MediaContent[]>([])
  const [videos, setVideos] = useState<MediaContent[]>([])
  const [audios, setAudios] = useState<MediaContent[]>([])
  const [stickers, setStickers] = useState<MediaContent[]>([])
  const [mediaType, setMediaType] = useState<
    'image' | 'video' | 'audio' | 'sticker'
  >('image')
  const [loading, setLoading] = useState(false)
  const [isLoadingInstances, setIsLoadingInstances] = useState(false)

  const form = useFormWithZod({
    schema: formSchema,
    defaultValues: {
      instances: selectedInstances, // Usando as instâncias já selecionadas
      texts: DEFAULT_WARMUP_TEXTS,
    },
    onSubmit: async () => {
      await startWarmup()
    },
  })

  // Carregar instâncias do WhatsApp disponíveis apenas uma vez quando o modal abrir
  useEffect(() => {
    if (!open || instances.length > 0) return // Evita recarregar se já tem instâncias

    const fetchInstances = async () => {
      try {
        setIsLoadingInstances(true)
        const response = await fetch(
          '/api/v1/warmup/whatsapp-instances?status=open&limit=100',
        )
        if (response.ok) {
          const data = await response.json()
          setInstances(data.data || [])
        } else {
          toast.error('Erro ao carregar instâncias')
        }
      } catch (error) {
        console.error('Erro ao carregar instâncias:', error)
        toast.error('Erro ao carregar instâncias')
      } finally {
        setIsLoadingInstances(false)
      }
    }

    fetchInstances()
  }, [open, instances.length]) // Dependência mais específica

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        const maxWidth = 1024
        const maxHeight = 1024
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            resolve(blob || file)
          },
          'image/jpeg',
          0.8,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const maxTotalSize = 50 * 1024 * 1024 // 50MB total
    const maxFileSize = 10 * 1024 * 1024 // 10MB por arquivo

    const totalSize = Array.from(files).reduce(
      (acc, file) => acc + file.size,
      0,
    )
    if (totalSize > maxTotalSize) {
      toast.error('O tamanho total dos arquivos excede 50MB')
      return
    }

    setLoading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > maxFileSize) {
          toast.error(`O arquivo ${file.name} excede 10MB`)
          continue
        }

        if (mediaType === 'image') {
          const compressedFile = await compressImage(file)
          await processFile(compressedFile, file.name)
        } else if (mediaType === 'sticker') {
          // Converter para WebP se for sticker
          const webpFile = await convertToWebP(file)
          await processFile(webpFile, file.name.replace(/\.[^/.]+$/, '.webp'))
        } else {
          await processFile(file, file.name)
        }
      }
      toast.success('Arquivos processados com sucesso!')
    } catch (error) {
      console.error('Erro ao processar arquivos:', error)
      toast.error('Erro ao processar arquivos')
    } finally {
      setLoading(false)
    }
  }

  const convertToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Falha na conversão para WebP'))
            }
          },
          'image/webp',
          0.8,
        )
      }

      img.onerror = () => reject(new Error('Falha ao carregar imagem'))
      img.src = URL.createObjectURL(file)
    })
  }

  const processFile = async (file: Blob, fileName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string
          const base64Data = base64String.split(',')[1]

          // Validar se o base64 não está vazio
          if (!base64Data || base64Data.trim() === '') {
            reject(new Error('Arquivo vazio ou inválido'))
            return
          }

          const getMimetype = (type: string) => {
            switch (type) {
              case 'image':
                return 'image/jpeg'
              case 'video':
                return 'video/mp4'
              case 'audio':
                return 'audio/mp3'
              case 'sticker':
                return 'image/webp'
              default:
                return (file as File).type
            }
          }

          const newMedia: MediaContent = {
            type: mediaType,
            base64: base64Data,
            fileName,
            mimetype: getMimetype(mediaType),
            preview: base64String,
          }

          switch (mediaType) {
            case 'image':
              setImages((prev) => [...prev, newMedia])
              break
            case 'video':
              setVideos((prev) => [...prev, newMedia])
              break
            case 'audio':
              setAudios((prev) => [...prev, newMedia])
              break
            case 'sticker':
              setStickers((prev) => [...prev, newMedia])
              break
          }
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const addText = () => {
    if (newText.trim()) {
      setTexts((prev) => [...prev, newText.trim()])
      setNewText('')
    }
  }

  const removeText = (index: number) => {
    setTexts((prev) => prev.filter((_, i) => i !== index))
  }

  const removeMedia = (type: string, index: number) => {
    switch (type) {
      case 'image':
        setImages((prev) => prev.filter((_, i) => i !== index))
        break
      case 'video':
        setVideos((prev) => prev.filter((_, i) => i !== index))
        break
      case 'audio':
        setAudios((prev) => prev.filter((_, i) => i !== index))
        break
      case 'sticker':
        setStickers((prev) => prev.filter((_, i) => i !== index))
        break
    }
  }

  const toggleInstance = (instanceName: string) => {
    // Validação: Plano free permite máximo de 2 instâncias
    const maxInstances = 2 // Plano free

    if (selectedInstances.includes(instanceName)) {
      // Removendo instância - sempre permitido
      onInstanceToggle(instanceName)
    } else {
      // Adicionando instância - verificar limite
      if (selectedInstances.length >= maxInstances) {
        toast.error(`Plano Free permite máximo de ${maxInstances} instâncias simultâneas.`, {
          description: 'Faça upgrade para usar mais instâncias',
          action: {
            label: 'Ver Planos',
            onClick: () => window.open('/pricing', '_blank'),
          },
        })
        return
      }

      // Adicionar instância
      onInstanceToggle(instanceName)
    }
  }

  const startWarmup = async () => {
    try {
      if (selectedInstances.length < 1) {
        toast.error('Selecione pelo menos uma instância')
        return
      }

      if (texts.length === 0) {
        toast.error('Adicione pelo menos um texto')
        return
      }

      setLoading(true)

      const phoneInstances = instances
        .filter((instance) => {
          const isSelected = selectedInstances.includes(instance.instanceName)
          const hasValidPhoneNumber = instance.ownerJid?.trim()
          return isSelected && hasValidPhoneNumber
        })
        .map((instance) => ({
          phoneNumber: instance.ownerJid!.trim().replace('@s.whatsapp.net', ''),
          instanceId: instance.instanceName,
        }))

      if (phoneInstances.length === 0) {
        toast.error(
          'Nenhuma instância válida selecionada. Verifique se as instâncias estão conectadas.',
        )
        return
      }

      // Criação do payload
      // NOTA: O backend espera enums em maiúsculo (IMAGE, VIDEO, etc.)
      // mas a Evolution API espera em minúsculo (image, video, etc.)
      // A conversão será feita no backend antes de enviar para a Evolution API
      const payload = {
        phoneInstances,
        contents: {
          texts,
          images: images.map((img) => ({
            type: 'IMAGE', // Backend espera maiúsculo
            base64: img.base64,
            fileName: img.fileName,
            mimetype: img.mimetype,
          })),
          audios: audios.map((audio) => ({
            type: 'AUDIO', // Backend espera maiúsculo
            base64: audio.base64,
            fileName: audio.fileName,
            mimetype: audio.mimetype,
          })),
          videos: videos.map((video) => ({
            type: 'VIDEO', // Backend espera maiúsculo
            base64: video.base64,
            fileName: video.fileName,
            mimetype: video.mimetype,
          })),
          stickers: stickers.map((sticker) => ({
            type: 'STICKER', // Backend espera maiúsculo
            base64: sticker.base64,
            fileName: sticker.fileName,
            mimetype: sticker.mimetype,
          })),
          emojis: REACTION_EMOJIS,
        },
        config: DEFAULT_WARMUP_CONFIG,
      }

      await (api.warmup.startWarmup as any).mutate({
        body: payload as any, // Cast temporário para resolver incompatibilidade de tipos
      })

      toast.success('Aquecimento iniciado com sucesso!')
      onOpenChange(false)

      // Aguardar um pouco para o backend processar
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Atualizar dados no componente pai
      onSuccess?.()
    } catch (error: any) {
      console.error('Erro ao iniciar aquecimento:', error)

      let errorMessage = 'Erro ao iniciar aquecimento'

      // Tratamento específico para erros de limite de plano
      if (error?.error?.code === 'PLAN_LIMIT_EXCEEDED') {
        errorMessage = error.error.message
        toast.error(errorMessage, {
          description: error.error.details?.suggestion,
          action: {
            label: 'Ver Planos',
            onClick: () => {
              // Redirecionar para página de planos
              window.open('/pricing', '_blank')
            },
          },
        })
        return
      }

      if (error?.error?.code === 'MESSAGE_LIMIT_EXCEEDED') {
        errorMessage = error.error.message
        toast.error(errorMessage, {
          description: error.error.details?.suggestion,
          action: {
            label: 'Ver Planos',
            onClick: () => {
              window.open('/pricing', '_blank')
            },
          },
        })
        return
      }

      // Outros tipos de erro
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Aquecimento</DialogTitle>
          <DialogDescription>
            Configure as instâncias e conteúdos para o aquecimento do WhatsApp.
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Para aquecimento com grupo, certifique-se de que as instâncias
              estão no grupo configurado.
            </span>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(startWarmup)} className="space-y-6">
            <Tabs defaultValue="instances" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="instances">Instâncias</TabsTrigger>
                <TabsTrigger value="content">Conteúdos</TabsTrigger>
                <TabsTrigger value="media">Mídias</TabsTrigger>
              </TabsList>

              <TabsContent value="instances" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Selecionar Instâncias</CardTitle>
                    <CardDescription>
                      Escolha as instâncias do WhatsApp que participarão do
                      aquecimento
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        <strong>Plano Free:</strong> Máximo de 2 instâncias simultâneas.
                        <a
                          href="/pricing"
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800 underline ml-1"
                        >
                          Upgrade para mais instâncias
                        </a>
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        Instâncias selecionadas: {selectedInstances.length}/2
                      </span>
                      {selectedInstances.length >= 2 && (
                        <span className="text-sm text-orange-600 font-medium">
                          Limite do plano atingido
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingInstances ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Carregando instâncias...</span>
                      </div>
                    ) : instances.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                        <p>Nenhuma instância conectada encontrada</p>
                        <p className="text-sm">
                          Conecte pelo menos uma instância do WhatsApp primeiro
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {instances.map((instance) => (
                          <div
                            key={instance.instanceName}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedInstances.includes(instance.instanceName)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                              }`}
                            onClick={() =>
                              toggleInstance(instance.instanceName)
                            }
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={selectedInstances.includes(
                                  instance.instanceName,
                                )}
                                onChange={() =>
                                  toggleInstance(instance.instanceName)
                                }
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {instance.instanceName}
                                </h4>
                                {instance.profileName && (
                                  <p className="text-sm text-muted-foreground">
                                    {instance.profileName}
                                  </p>
                                )}
                                <p className="text-xs text-green-600">
                                  Status: {instance.status}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Textos para Aquecimento</CardTitle>
                    <CardDescription>
                      Gerencie os textos que serão enviados durante o
                      aquecimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite um novo texto..."
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addText()
                          }
                        }}
                      />
                      <Button type="button" onClick={addText}>
                        Adicionar
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {texts.map((text, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <span className="flex-1 text-sm">{text}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeText(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload de Mídias</CardTitle>
                    <CardDescription>
                      Adicione imagens, vídeos, áudios e stickers para o
                      aquecimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Button
                        type="button"
                        variant={mediaType === 'image' ? 'default' : 'outline'}
                        onClick={() => setMediaType('image')}
                        className="gap-2"
                      >
                        <FileImage className="h-4 w-4" />
                        Imagens
                      </Button>
                      <Button
                        type="button"
                        variant={mediaType === 'video' ? 'default' : 'outline'}
                        onClick={() => setMediaType('video')}
                        className="gap-2"
                      >
                        <FileVideo className="h-4 w-4" />
                        Vídeos
                      </Button>
                      <Button
                        type="button"
                        variant={mediaType === 'audio' ? 'default' : 'outline'}
                        onClick={() => setMediaType('audio')}
                        className="gap-2"
                      >
                        <FileAudio className="h-4 w-4" />
                        Áudios
                      </Button>
                      <Button
                        type="button"
                        variant={
                          mediaType === 'sticker' ? 'default' : 'outline'
                        }
                        onClick={() => setMediaType('sticker')}
                        className="gap-2"
                      >
                        <Sticker className="h-4 w-4" />
                        Stickers
                      </Button>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Label
                            htmlFor="file-upload"
                            className="cursor-pointer"
                          >
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Clique para fazer upload de {mediaType}s
                            </span>
                          </Label>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            multiple
                            accept={
                              mediaType === 'image'
                                ? 'image/*'
                                : mediaType === 'video'
                                  ? 'video/*'
                                  : mediaType === 'audio'
                                    ? 'audio/*'
                                    : 'image/webp'
                            }
                            onChange={handleFileUpload}
                            disabled={loading}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Máximo 10MB por arquivo, 50MB total
                          </p>
                        </div>
                      </div>
                    </div>

                    {loading && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">Processando arquivos...</span>
                      </div>
                    )}

                    {/* Preview das mídias */}
                    {mediaType === 'image' && images.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Imagens ({images.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {images.map((img, index) => (
                            <div key={index} className="relative">
                              <img
                                src={img.preview}
                                alt={img.fileName}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                onClick={() => removeMedia('image', index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mediaType === 'video' && videos.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Vídeos ({videos.length})
                        </h4>
                        <div className="space-y-2">
                          {videos.map((video, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <span className="text-sm">{video.fileName}</span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMedia('video', index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mediaType === 'audio' && audios.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Áudios ({audios.length})
                        </h4>
                        <div className="space-y-2">
                          {audios.map((audio, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <span className="text-sm">{audio.fileName}</span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMedia('audio', index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mediaType === 'sticker' && stickers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Stickers ({stickers.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {stickers.map((sticker, index) => (
                            <div key={index} className="relative">
                              <img
                                src={sticker.preview}
                                alt={sticker.fileName}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                onClick={() => removeMedia('sticker', index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedInstances.length === 0}
                className="gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Iniciar Aquecimento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
