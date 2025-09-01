'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Check,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CreateAgentInput, AgentType } from '../../ai-agent.types'
import { useAIAgents } from '../hooks/use-ai-agents'
import { useAvailableWhatsAppInstances } from '../../../whatsapp-instance/presentation/hooks/use-whatsapp-instances'

interface CreateAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type WizardStep = 'basic' | 'persona' | 'knowledge' | 'instance' | 'review'

const personaTemplates = [
  {
    id: 'sales',
    name: 'Vendedor',
    role: 'Assistente de Vendas',
    tone: 'Profissional e persuasivo',
    expertise: ['Vendas', 'Produtos', 'Atendimento ao cliente'],
    description: 'Ideal para qualificar leads e apresentar produtos',
  },
  {
    id: 'support',
    name: 'Suporte',
    role: 'Suporte Técnico',
    tone: 'Prestativo e técnico',
    expertise: ['Suporte', 'Troubleshooting', 'Documentação'],
    description: 'Perfeito para resolver problemas e dúvidas técnicas',
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    role: 'Especialista em Onboarding',
    tone: 'Acolhedor e didático',
    expertise: ['Onboarding', 'Treinamento', 'Documentação'],
    description: 'Excelente para orientar novos usuários',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    role: 'Assistente Personalizado',
    tone: 'Personalizável',
    expertise: ['Personalizável'],
    description: 'Configure do zero conforme sua necessidade',
  },
]

export function CreateAgentModal({
  open,
  onOpenChange,
}: CreateAgentModalProps) {
  const { createAgent, loading } = useAIAgents()
  const { instances: whatsappInstances, isLoading: loadingInstances } =
    useAvailableWhatsAppInstances()
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [formData, setFormData] = useState({
    // Dados básicos
    name: '',
    description: '',
    botType: AgentType.CHAT_COMPLETION,
    model: 'gpt-4o',
    systemPrompt: '',

    // Instância WhatsApp
    selectedInstanceId: '',

    // Persona
    personaName: '',
    personaRole: '',
    personaTone: '',
    personaExpertise: [] as string[],
    personaLimitations: [] as string[],
    personaGreeting: '',
    personaFallback: '',

    // Base de conhecimento
    knowledgeEnabled: true,
    knowledgeSources: [] as any[],
  })

  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep === 'basic') setCurrentStep('persona')
    else if (currentStep === 'persona') setCurrentStep('knowledge')
    else if (currentStep === 'knowledge') setCurrentStep('instance')
    else if (currentStep === 'instance') setCurrentStep('review')
  }

  const prevStep = () => {
    if (currentStep === 'persona') setCurrentStep('basic')
    else if (currentStep === 'knowledge') setCurrentStep('persona')
    else if (currentStep === 'instance') setCurrentStep('knowledge')
    else if (currentStep === 'review') setCurrentStep('instance')
  }

  const applyTemplate = (template: any) => {
    setFormData((prev) => ({
      ...prev,
      personaName: template.name,
      personaRole: template.role,
      personaTone: template.tone,
      personaExpertise: template.expertise,
      personaGreeting: `Olá! Sou o ${template.name}, ${template.role.toLowerCase()}. Como posso ajudar você hoje?`,
      personaFallback: 'Desculpe, não entendi sua pergunta. Pode reformular?',
    }))
    setSelectedTemplate(template.id)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name && formData.description
      case 'persona':
        return (
          formData.personaName && formData.personaRole && formData.personaTone
        )
      case 'knowledge':
        return true
      case 'instance':
        return formData.selectedInstanceId
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    try {
      // Preparar dados para a API
      const selectedInstance = whatsappInstances.find(
        (i) => i.id === formData.selectedInstanceId,
      )
      if (!selectedInstance) {
        toast.error('Por favor, selecione uma instância WhatsApp')
        return
      }

      const agentData: CreateAgentInput = {
        name: formData.name,
        description: formData.description,
        instanceName: selectedInstance.instanceName,
        openaiCredsId: 'default', // Você precisaria implementar seleção de credenciais
        botType: formData.botType,
        model: formData.model,
        triggerType: 'all',
        triggerOperator: 'none',
        systemMessages: formData.systemPrompt
          ? [formData.systemPrompt]
          : undefined,
        persona: {
          name: formData.personaName,
          role: formData.personaRole,
          tone: formData.personaTone,
          expertise: formData.personaExpertise,
          limitations: formData.personaLimitations,
          greeting: formData.personaGreeting,
          fallback: formData.personaFallback,
        },
        knowledgeBase: {
          enabled: formData.knowledgeEnabled,
        },
      }

      const newAgent = await createAgent(agentData)

      if (newAgent) {
        toast.success('Agente criado com sucesso!')
        onOpenChange(false)
        resetForm()
      } else {
        toast.error('Erro ao criar agente')
      }
    } catch (error) {
      console.error('Erro ao criar agente:', error)
      toast.error('Erro ao criar agente')
    }
  }

  const resetForm = () => {
    setCurrentStep('basic')
    setFormData({
      name: '',
      description: '',
      botType: AgentType.CHAT_COMPLETION,
      model: 'gpt-4o',
      systemPrompt: '',
      selectedInstanceId: '',
      personaName: '',
      personaRole: '',
      personaTone: '',
      personaExpertise: [],
      personaLimitations: [],
      personaGreeting: '',
      personaFallback: '',
      knowledgeEnabled: true,
      knowledgeSources: [],
    })
    setSelectedTemplate('')
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {['basic', 'persona', 'knowledge', 'instance', 'review'].map(
        (step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step
                  ? 'bg-blue-600 text-white'
                  : index <
                      [
                        'basic',
                        'persona',
                        'knowledge',
                        'instance',
                        'review',
                      ].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index <
              ['basic', 'persona', 'knowledge', 'review'].indexOf(
                currentStep,
              ) ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  index <
                  [
                    'basic',
                    'persona',
                    'knowledge',
                    'instance',
                    'review',
                  ].indexOf(currentStep)
                    ? 'bg-green-600'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ),
      )}
    </div>
  )

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Nome do Agente *</Label>
        <Input
          id="name"
          placeholder="Ex: Alex - Assistente de Vendas"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          placeholder="Descreva o que este agente fará..."
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          className="mt-2"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="botType">Tipo de Bot</Label>
          <Select
            value={formData.botType}
            onValueChange={(value) => updateFormData('botType', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AgentType.CHAT_COMPLETION}>
                Chat Completion
              </SelectItem>
              <SelectItem value={AgentType.ASSISTANT}>
                OpenAI Assistant
              </SelectItem>
              <SelectItem value={AgentType.EVOLUTION_BOT}>Agente IA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="model">Modelo</Label>
          <Select
            value={formData.model}
            onValueChange={(value) => updateFormData('model', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="systemPrompt">Prompt do Sistema (Opcional)</Label>
        <Textarea
          id="systemPrompt"
          placeholder="Ex: Você é um assistente especializado em vendas. Seja sempre educado e profissional..."
          value={formData.systemPrompt}
          onChange={(e) => updateFormData('systemPrompt', e.target.value)}
          className="mt-2"
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Define o comportamento base do agente. Se não preenchido, será gerado
          automaticamente baseado na persona.
        </p>
      </div>
    </div>
  )

  const renderPersonaStep = () => (
    <div className="space-y-6">
      {/* Templates de Persona */}
      <div>
        <Label className="text-base font-medium mb-4 block">
          Escolha um Template (Opcional)
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {personaTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:shadow-md'
              }`}
              onClick={() => applyTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedTemplate === template.id
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    }`}
                  >
                    <Bot
                      className={`w-5 h-5 ${
                        selectedTemplate === template.id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">
                      {template.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.expertise.slice(0, 2).map((exp, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Campos de Persona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="personaName">Nome da Persona *</Label>
          <Input
            id="personaName"
            placeholder="Ex: Alex"
            value={formData.personaName}
            onChange={(e) => updateFormData('personaName', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="personaRole">Função *</Label>
          <Input
            id="personaRole"
            placeholder="Ex: Assistente de Vendas"
            value={formData.personaRole}
            onChange={(e) => updateFormData('personaRole', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="personaTone">Tom de Comunicação *</Label>
        <Input
          id="personaTone"
          placeholder="Ex: Profissional e amigável"
          value={formData.personaTone}
          onChange={(e) => updateFormData('personaTone', e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="personaGreeting">Saudação Inicial</Label>
        <Textarea
          id="personaGreeting"
          placeholder="Ex: Olá! Sou o Alex, seu assistente de vendas. Como posso ajudar?"
          value={formData.personaGreeting}
          onChange={(e) => updateFormData('personaGreeting', e.target.value)}
          className="mt-2"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="personaFallback">Mensagem de Fallback</Label>
        <Textarea
          id="personaFallback"
          placeholder="Ex: Desculpe, não entendi. Pode reformular sua pergunta?"
          value={formData.personaFallback}
          onChange={(e) => updateFormData('personaFallback', e.target.value)}
          className="mt-2"
          rows={2}
        />
      </div>
    </div>
  )

  const renderKnowledgeStep = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Base de Conhecimento
        </h3>
        <p className="text-muted-foreground mb-6">
          Configure documentos e informações que seu agente deve conhecer
        </p>
        <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">
            🚧 Esta funcionalidade estará disponível em breve!
          </p>
        </div>
      </div>
    </div>
  )

  const renderInstanceStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Bot className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Selecionar Instância WhatsApp
        </h3>
        <p className="text-muted-foreground">
          Escolha qual instância do WhatsApp será usada por este agente
        </p>
      </div>

      {loadingInstances ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando instâncias...</p>
        </div>
      ) : whatsappInstances.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-muted/50 rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              Nenhuma instância WhatsApp encontrada.
            </p>
            <p className="text-sm text-muted-foreground">
              Você precisa criar uma instância WhatsApp antes de configurar um
              agente.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Instâncias Disponíveis
          </Label>
          <div className="grid gap-3">
            {whatsappInstances.map((instance) => (
              <Card
                key={instance.id}
                className={`cursor-pointer transition-all ${
                  formData.selectedInstanceId === instance.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:shadow-md'
                }`}
                onClick={() =>
                  updateFormData('selectedInstanceId', instance.id)
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          instance.status === 'open'
                            ? 'bg-green-500'
                            : instance.status === 'connecting'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <h4 className="font-medium">{instance.instanceName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Status:{' '}
                          {instance.status === 'open'
                            ? 'Conectado'
                            : instance.status === 'connecting'
                              ? 'Conectando'
                              : 'Desconectado'}
                        </p>
                      </div>
                    </div>
                    {formData.selectedInstanceId === instance.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Revisar Configuração
        </h3>
        <p className="text-gray-600">
          Confirme os dados antes de criar seu agente
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Informações Básicas
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Descrição:</span>
                <span className="font-medium">{formData.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instância WhatsApp:</span>
                <span className="font-medium">
                  {whatsappInstances.find(
                    (i) => i.id === formData.selectedInstanceId,
                  )?.instanceName || 'Nenhuma selecionada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{formData.botType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modelo:</span>
                <span className="font-medium">{formData.model}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Persona
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{formData.personaName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Função:</span>
                <span className="font-medium">{formData.personaRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tom:</span>
                <span className="font-medium">{formData.personaTone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Base de Conhecimento
            </h4>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge
                variant={formData.knowledgeEnabled ? 'default' : 'secondary'}
              >
                {formData.knowledgeEnabled ? 'Habilitada' : 'Desabilitada'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        return renderBasicStep()
      case 'persona':
        return renderPersonaStep()
      case 'knowledge':
        return renderKnowledgeStep()
      case 'instance':
        return renderInstanceStep()
      case 'review':
        return renderReviewStep()
      default:
        return renderBasicStep()
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'basic':
        return 'Informações Básicas'
      case 'persona':
        return 'Configurar Persona'
      case 'knowledge':
        return 'Base de Conhecimento'
      case 'instance':
        return 'Selecionar Instância'
      case 'review':
        return 'Revisar e Criar'
      default:
        return 'Criar Agente'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="py-6">{renderCurrentStep()}</div>

        {/* Navegação */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 'basic'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentStep === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Criando...' : 'Criar Agente'}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
