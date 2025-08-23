'use client'

import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { CreateCampaignInput, InstanceHealthInfo } from '@/features/campaign'
import { api } from '@/igniter.client'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Image,
  Music,
  Smartphone,
  Smile,
  Upload,
  Video,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function NewCampaignPage() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [instancesHealth, setInstancesHealth] = useState<InstanceHealthInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>('')
  const [mediaType, setMediaType] = useState<string>('')
  const [mediaBase64, setMediaBase64] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    message: '',
    mediaCaption: '',
    minDelay: 30,
    maxDelay: 120,
    useInstanceRotation: true,
    selectedInstances: [] as string[],
    scheduledAt: '',
    timezone: 'America/Sao_Paulo',
    type: 'IMMEDIATE' as 'IMMEDIATE' | 'SCHEDULED' | 'RECURRING'
  })

  useEffect(() => {
    if (session?.organization?.id) {
      fetchInstancesHealth()
    }
  }, [session?.organization?.id])

  const fetchInstancesHealth = async () => {
    try {
      // Buscar dados reais das instâncias via API
      const response = await api.warmup.getInstanceHealth.query()

      if (response.error) {
        toast.error('Erro ao buscar saúde das instâncias')
        return
      }

      setInstancesHealth(response.data || [])
    } catch (error) {
      console.error('Erro ao buscar saúde das instâncias:', error)
      toast.error('Erro ao buscar saúde das instâncias')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tamanho do arquivo (máximo 16MB para WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo permitido: 16MB')
      return
    }

    setSelectedFile(file)
    setMediaType(file.type.split('/')[0])

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setMediaPreview(result)

      // Converter para base64
      const base64 = result.split(',')[1]
      setMediaBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleInstanceToggle = (instanceName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedInstances: prev.selectedInstances.includes(instanceName)
        ? prev.selectedInstances.filter(name => name !== instanceName)
        : [...prev.selectedInstances, instanceName]
    }))
  }

  const getHealthBadge = (instance: InstanceHealthInfo) => {
    if (instance.riskLevel === 'LOW' && instance.healthScore >= 80) {
      return <Badge variant="default" className="bg-green-600">Recomendada</Badge>
    } else if (instance.riskLevel === 'MEDIUM' && instance.healthScore >= 60) {
      return <Badge variant="secondary">Aceitável</Badge>
    } else {
      return <Badge variant="destructive">Não Recomendada</Badge>
    }
  }

  const getWarmupColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.message.trim()) {
      toast.error('A mensagem é obrigatória')
      return
    }

    if (formData.selectedInstances.length === 0) {
      toast.error('Selecione pelo menos uma instância')
      return
    }

    try {
      setLoading(true)

      // Preparar dados para a API
      const campaignData: CreateCampaignInput = {
        name: formData.name,
        description: formData.description,
        message: formData.message,
        minDelay: formData.minDelay,
        maxDelay: formData.maxDelay,
        useInstanceRotation: formData.useInstanceRotation,
        selectedInstances: formData.selectedInstances,
        timezone: formData.timezone,
        type: formData.type,
        ...(mediaBase64 && {
          mediaType: mediaType as 'image' | 'video' | 'audio' | 'sticker',
          mediaBase64: mediaBase64,
          mediaCaption: formData.mediaCaption
        }),
        ...(formData.type === 'SCHEDULED' && formData.scheduledAt && {
          scheduledAt: new Date(formData.scheduledAt)
        })
      }

      // Criar campanha via API
      const response = await api.campaign.create.mutate({
        body: campaignData
      })

      if (response.error) {
        toast.error('Erro ao criar campanha: ' + response.error.message)
        return
      }

      toast.success('Campanha criada com sucesso!')
      router.push('/app/campaigns')
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
      toast.error('Erro ao criar campanha')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      setLoading(true)

      const campaignData: CreateCampaignInput = {
        name: formData.name || 'Rascunho',
        description: formData.description,
        message: formData.message,
        minDelay: formData.minDelay,
        maxDelay: formData.maxDelay,
        useInstanceRotation: formData.useInstanceRotation,
        selectedInstances: formData.selectedInstances,
        timezone: formData.timezone,
        type: 'DRAFT' as any,
        ...(mediaBase64 && {
          mediaType: mediaType as 'image' | 'video' | 'audio' | 'sticker',
          mediaBase64: mediaBase64,
          mediaCaption: formData.mediaCaption
        })
      }

      const response = await api.campaign.create.mutate({
        body: campaignData
      })

      if (response.error) {
        toast.error('Erro ao salvar rascunho: ' + response.error.message)
        return
      }

      toast.success('Rascunho salvo com sucesso!')
      router.push('/app/campaigns')
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error)
      toast.error('Erro ao salvar rascunho')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Campanha</h1>
          <p className="text-muted-foreground">
            Crie uma nova campanha de disparo em massa no WhatsApp
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="instances">Instâncias</TabsTrigger>
            <TabsTrigger value="schedule">Agendamento</TabsTrigger>
          </TabsList>

          {/* Aba Básico */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Configure as informações principais da sua campanha
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Campanha *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Campanha de Boas-vindas"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Campanha</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMMEDIATE">Imediata</SelectItem>
                        <SelectItem value="SCHEDULED">Agendada</SelectItem>
                        <SelectItem value="RECURRING">Recorrente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o objetivo da campanha..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minDelay">Delay Mínimo (segundos) *</Label>
                    <Input
                      id="minDelay"
                      type="number"
                      min="5"
                      max="300"
                      value={formData.minDelay}
                      onChange={(e) => setFormData(prev => ({ ...prev, minDelay: parseInt(e.target.value) }))}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo mínimo entre mensagens para evitar bloqueios
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDelay">Delay Máximo (segundos) *</Label>
                    <Input
                      id="maxDelay"
                      type="number"
                      min="5"
                      max="600"
                      value={formData.maxDelay}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxDelay: parseInt(e.target.value) }))}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo máximo entre mensagens
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Conteúdo */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo da Mensagem</CardTitle>
                <CardDescription>
                  Configure o texto e mídia que será enviado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Digite sua mensagem aqui..."
                    rows={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    A mensagem é obrigatória para enviar a campanha
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Mídia (Opcional)</Label>
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <Video className="h-4 w-4" />
                      <Music className="h-4 w-4" />
                      <Smile className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*,video/*,audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        Clique para fazer upload ou arraste o arquivo
                      </p>
                      <p className="text-xs text-gray-500">
                        Suporta: Imagens, Vídeos, Áudios e Figurinhas (Máx: 16MB)
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{mediaType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>

                      {mediaPreview && (
                        <div className="max-w-xs">
                          {mediaType === 'image' && (
                            <img src={mediaPreview} alt="Preview" className="rounded-lg" />
                          )}
                          {mediaType === 'video' && (
                            <video src={mediaPreview} controls className="rounded-lg" />
                          )}
                          {mediaType === 'audio' && (
                            <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg">
                              <Music className="h-6 w-6" />
                              <span className="text-sm">{selectedFile.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="mediaCaption">Legenda da Mídia</Label>
                        <Textarea
                          id="mediaCaption"
                          value={formData.mediaCaption}
                          onChange={(e) => setFormData(prev => ({ ...prev, mediaCaption: e.target.value }))}
                          placeholder="Adicione uma legenda para a mídia..."
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Instâncias */}
          <TabsContent value="instances" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seleção de Instâncias</CardTitle>
                <CardDescription>
                  Escolha as instâncias que serão usadas no disparo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="instance-rotation"
                    checked={formData.useInstanceRotation}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useInstanceRotation: checked }))}
                  />
                  <Label htmlFor="instance-rotation">
                    Usar rotação inteligente de instâncias
                  </Label>
                </div>

                <p className="text-sm text-muted-foreground">
                  A rotação inteligente distribui a carga entre as instâncias selecionadas,
                  considerando saúde, aquecimento e uso recente para evitar bloqueios.
                </p>

                <Separator />

                <div className="space-y-4">
                  <Label>Instâncias Disponíveis</Label>

                  {instancesHealth.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                      <p>Nenhuma instância disponível</p>
                      <p className="text-sm">Configure suas instâncias do WhatsApp primeiro</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {instancesHealth.map((instance) => (
                        <div
                          key={instance.instanceName}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.selectedInstances.includes(instance.instanceName)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                          onClick={() => handleInstanceToggle(instance.instanceName)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              <span className="font-medium">{instance.instanceName}</span>
                            </div>
                            {getHealthBadge(instance)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={instance.status === 'open' ? 'default' : 'secondary'}>
                                  {instance.status === 'open' ? 'Conectada' : 'Desconectada'}
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted-foreground">Aquecimento:</span>
                                <span className={getWarmupColor(instance.warmupProgress)}>
                                  {instance.warmupProgress}%
                                </span>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted-foreground">Saúde:</span>
                                <span className={getHealthColor(instance.healthScore)}>
                                  {instance.healthScore}%
                                </span>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted-foreground">Mensagens 24h:</span>
                                <span>{instance.messagesSent24h}</span>
                              </div>
                            </div>
                          </div>

                          {instance.isRecommended ? (
                            <div className="flex items-center gap-2 mt-3 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Recomendada para uso
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
                              <XCircle className="h-4 w-4" />
                              Não recomendada
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.selectedInstances.length === 0 && instancesHealth.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                      <p>Selecione pelo menos uma instância para continuar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Agendamento */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agendamento</CardTitle>
                <CardDescription>
                  Configure quando a campanha deve ser executada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.type === 'SCHEDULED' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt">Data e Hora *</Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                          <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                          <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {formData.type === 'RECURRING' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diária</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Intervalo</Label>
                        <Input type="number" min="1" placeholder="Ex: 1" />
                      </div>

                      <div className="space-y-2">
                        <Label>Data de Fim</Label>
                        <Input type="date" />
                      </div>
                    </div>
                  </div>
                )}

                {formData.type === 'IMMEDIATE' && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="mx-auto h-12 w-12 mb-4" />
                    <p>A campanha será executada imediatamente após a criação</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Link href="/app/campaigns">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar como Rascunho'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Campanha'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}