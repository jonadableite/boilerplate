'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Bot,
  Brain,
  Database,
  Settings,
  Shield,
  Zap,
  Upload,
  FileText,
  Plus,
  X,
  Volume2,
} from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageWrapper, PageHeader, PageBody } from '@/components/layouts/page'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { api } from '@/igniter.client'
import { AIAgentType } from '@/features/ai-agents/types/ai-agent.types'

const createAgentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.nativeEnum(AIAgentType).default(AIAgentType.LLM_AGENT),
  role: z.string().optional(),
  goal: z.string().optional(),
  systemPrompt: z.string().min(1, 'Prompt do sistema é obrigatório'),
  
  // Configurações do modelo
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(1000),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  
  // Base de conhecimento
  knowledgeFiles: z.array(z.string()).default([]),
  
  // Configurações de TTS
  ttsEnabled: z.boolean().default(false),
  ttsVoice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).default('alloy'),
  ttsModel: z.enum(['tts-1', 'tts-1-hd']).default('tts-1'),
  ttsSpeed: z.number().min(0.25).max(4.0).default(1.0)
  
  // Guardrails
  enableContentFilter: z.boolean().default(true),
  enablePiiDetection: z.boolean().default(true),
  maxResponseLength: z.number().optional(),
  allowedTopics: z.array(z.string()).default([]),
  blockedTopics: z.array(z.string()).default([]),
  
  // Configurações gerais
  fallbackMessage: z.string().optional(),
  isActive: z.boolean().default(true),
})

type CreateAgentFormData = z.infer<typeof createAgentSchema>

export default function NewAgentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [allowedTopics, setAllowedTopics] = useState<string[]>([])
  const [blockedTopics, setBlockedTopics] = useState<string[]>([])
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [newBlockedTopic, setNewBlockedTopic] = useState('')

  const createAgentMutation = api.aiAgent.create.useMutation()

  const form = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: '',
      description: '',
      type: AIAgentType.LLM_AGENT,
      role: '',
      goal: '',
      systemPrompt: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      ttsEnabled: false,
      ttsVoice: 'alloy',
      ttsModel: 'tts-1',
      ttsSpeed: 1.0,
      enableContentFilter: true,
      enablePiiDetection: true,
      allowedTopics: [],
      blockedTopics: [],
      isActive: true,
    },
  })

  const onSubmit = async (data: CreateAgentFormData) => {
    try {
      const result = await createAgentMutation.execute({
        body: {
          ...data,
          allowedTopics,
          blockedTopics,
        },
      })
      toast.success('Agente criado com sucesso!')
      router.push(`/app/ai-agents/${result.id}`)
    } catch (error: any) {
      toast.error(
        'Erro ao criar agente: ' + (error?.message || 'Erro desconhecido'),
      )
    }
  }

  const addTopic = (topic: string, type: 'allowed' | 'blocked') => {
    if (!topic.trim()) return
    
    if (type === 'allowed') {
      setAllowedTopics([...allowedTopics, topic.trim()])
    } else {
      setBlockedTopics([...blockedTopics, topic.trim()])
    }
    
    if (type === 'allowed') {
      setNewTopic('')
    } else {
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

  const handleKnowledgeFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const validFiles: File[] = []
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`Arquivo ${file.name} é muito grande. Máximo 10MB.`)
        return
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`Tipo de arquivo ${file.name} não suportado.`)
        return
      }

      validFiles.push(file)
    })

    if (validFiles.length > 0) {
      setKnowledgeFiles([...knowledgeFiles, ...validFiles])
      toast.success(`${validFiles.length} arquivo(s) adicionado(s) com sucesso!`)
    }

    // Reset input
    event.target.value = ''
  }

  const removeKnowledgeFile = (fileToRemove: File) => {
    setKnowledgeFiles(knowledgeFiles.filter((file) => file !== fileToRemove))
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
              <BreadcrumbPage>Novo Agente</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageBody>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Criar Novo Agente IA
              </h1>
              <p className="text-muted-foreground">
                Configure um agente inteligente personalizado para sua organização
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Conhecimento
                  </TabsTrigger>
                  <TabsTrigger value="model" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Modelo IA
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Voz
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Segurança
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Informações do Agente
                      </CardTitle>
                      <CardDescription>
                        Configure as informações básicas e personalidade do seu agente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Agente *</FormLabel>
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
                              <FormLabel>Tipo de Agente</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
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
                                  <SelectItem value={AIAgentType.LANGGRAPH_WORKFLOW}>
                                    LangGraph Workflow
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
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <FormDescription>
                                Define o papel que o agente desempenha
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="goal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objetivo Principal</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Converter leads em vendas"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                O objetivo principal do agente
                              </FormDescription>
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
                            <FormLabel>Prompt do Sistema *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Você é um assistente especializado em... Suas principais responsabilidades incluem..."
                                className="resize-none"
                                rows={6}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Instruções detalhadas que definem o comportamento do agente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="knowledge" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Base de Conhecimento
                      </CardTitle>
                      <CardDescription>
                        Adicione documentos e informações para treinar seu agente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('knowledge-file-input')?.click()}
                      >
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Adicionar Documentos
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Faça upload de PDFs, documentos de texto ou outros arquivos
                          para treinar seu agente
                        </p>
                        <Button variant="outline" className="mb-2" type="button">
                          <Plus className="h-4 w-4 mr-2" />
                          Selecionar Arquivos
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Suporta: PDF, TXT, DOC, DOCX (máx. 10MB por arquivo)
                        </p>
                        <input
                          id="knowledge-file-input"
                          type="file"
                          multiple
                          accept=".pdf,.txt,.doc,.docx"
                          className="hidden"
                          onChange={handleKnowledgeFileUpload}
                        />
                      </div>

                      {knowledgeFiles.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Arquivos Adicionados ({knowledgeFiles.length})</h4>
                          <div className="space-y-2">
                            {knowledgeFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeKnowledgeFile(file)}
                                  type="button"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900">
                              Dica: Base de Conhecimento
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Adicione documentos relevantes para que seu agente possa
                              responder perguntas específicas sobre seu negócio,
                              produtos ou serviços.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="model" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Configurações do Modelo IA
                      </CardTitle>
                      <CardDescription>
                        Ajuste os parâmetros do modelo para otimizar as respostas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="gpt-4">
                                  GPT-4 (Recomendado)
                                </SelectItem>
                                <SelectItem value="gpt-4-turbo">
                                  GPT-4 Turbo
                                </SelectItem>
                                <SelectItem value="gpt-3.5-turbo">
                                  GPT-3.5 Turbo
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Criatividade: {field.value}
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormDescription>
                                0 = Mais preciso, 2 = Mais criativo
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
                                  max={4000}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Controla o tamanho máximo das respostas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Configurações Avançadas</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="topP"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Top P</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    placeholder="0.9"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value ? parseFloat(e.target.value) : undefined
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="frequencyPenalty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Penalidade de Frequência</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={-2}
                                    max={2}
                                    step={0.1}
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value ? parseFloat(e.target.value) : undefined
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="presencePenalty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Penalidade de Presença</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={-2}
                                    max={2}
                                    step={0.1}
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value ? parseFloat(e.target.value) : undefined
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="voice" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5" />
                        Configurações de Voz
                      </CardTitle>
                      <CardDescription>
                        Configure respostas em áudio para seu agente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="ttsEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Respostas em Áudio
                              </FormLabel>
                              <FormDescription>
                                Permite que o agente responda com áudio quando apropriado
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

                      {form.watch('ttsEnabled') && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="ttsVoice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Voz</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma voz" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="alloy">Alloy (Neutro)</SelectItem>
                                    <SelectItem value="echo">Echo (Masculino)</SelectItem>
                                    <SelectItem value="fable">Fable (Britânico)</SelectItem>
                                    <SelectItem value="onyx">Onyx (Profundo)</SelectItem>
                                    <SelectItem value="nova">Nova (Feminino)</SelectItem>
                                    <SelectItem value="shimmer">Shimmer (Suave)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ttsModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Qualidade do Áudio</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a qualidade" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="tts-1">Padrão (Mais rápido)</SelectItem>
                                    <SelectItem value="tts-1-hd">Alta Definição (Melhor qualidade)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ttsSpeed"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Velocidade da Fala</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Input
                                      type="range"
                                      min={0.25}
                                      max={4.0}
                                      step={0.25}
                                      value={field.value}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                      <span>0.25x (Muito lento)</span>
                                      <span className="font-medium">{field.value}x</span>
                                      <span>4.0x (Muito rápido)</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Volume2 className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-900">
                              Sobre Respostas em Áudio
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                              O agente gerará áudio apenas para textos adequados (sem código, tabelas ou formatação complexa).
                              Respostas muito longas ou técnicas podem não ser convertidas em áudio.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Configurações de Segurança
                      </CardTitle>
                      <CardDescription>
                        Configure filtros e restrições para manter o agente seguro
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
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
                                  Bloqueia conteúdo inadequado ou ofensivo
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
                                  Detecção de Dados Pessoais
                                </FormLabel>
                                <FormDescription>
                                  Identifica e protege informações pessoais sensíveis
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

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Tópicos Permitidos</h4>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ex: vendas, suporte, produtos"
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
                            onClick={() => addTopic(newTopic, 'allowed')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {allowedTopics.length > 0 && (
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
                                  className="h-auto p-0 ml-1"
                                  onClick={() => removeTopic(index, 'allowed')}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Tópicos Bloqueados</h4>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ex: política, religião, conteúdo adulto"
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
                            onClick={() => addTopic(newBlockedTopic, 'blocked')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {blockedTopics.length > 0 && (
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
                                  className="h-auto p-0 ml-1 text-white hover:text-white"
                                  onClick={() => removeTopic(index, 'blocked')}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="fallbackMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensagem de Fallback</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Desculpe, não posso ajudar com isso. Entre em contato com nosso suporte."
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Mensagem exibida quando o agente não pode responder
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between pt-6 border-t">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Ativar agente após criação
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAgentMutation.isLoading}
                    className="min-w-[120px]"
                  >
                    {createAgentMutation.isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Criando...
                      </div>
                    ) : (
                      'Criar Agente'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </PageBody>
    </PageWrapper>
  )
}