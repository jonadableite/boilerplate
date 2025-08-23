'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Brain,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from 'lucide-react'

interface CreateAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type WizardStep = 'basic' | 'persona' | 'knowledge' | 'review'

const personaTemplates = [
  {
    id: 'sales',
    name: 'Vendedor',
    role: 'Assistente de Vendas',
    tone: 'Profissional e persuasivo',
    expertise: ['Vendas', 'Produtos', 'Atendimento ao cliente'],
    description: 'Ideal para qualificar leads e apresentar produtos'
  },
  {
    id: 'support',
    name: 'Suporte',
    role: 'Suporte Técnico',
    tone: 'Prestativo e técnico',
    expertise: ['Suporte', 'Troubleshooting', 'Documentação'],
    description: 'Perfeito para resolver problemas e dúvidas técnicas'
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    role: 'Especialista em Onboarding',
    tone: 'Acolhedor e didático',
    expertise: ['Onboarding', 'Treinamento', 'Documentação'],
    description: 'Excelente para orientar novos usuários'
  },
  {
    id: 'custom',
    name: 'Personalizado',
    role: 'Assistente Personalizado',
    tone: 'Personalizável',
    expertise: ['Personalizável'],
    description: 'Configure do zero conforme sua necessidade'
  }
]

export function CreateAgentModal({ open, onOpenChange }: CreateAgentModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [formData, setFormData] = useState({
    // Dados básicos
    name: '',
    description: '',
    instanceName: '',
    botType: 'chatCompletion',
    model: 'gpt-4o',
    
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
    knowledgeSources: [] as any[]
  })

  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep === 'basic') setCurrentStep('persona')
    else if (currentStep === 'persona') setCurrentStep('knowledge')
    else if (currentStep === 'knowledge') setCurrentStep('review')
  }

  const prevStep = () => {
    if (currentStep === 'persona') setCurrentStep('basic')
    else if (currentStep === 'knowledge') setCurrentStep('persona')
    else if (currentStep === 'review') setCurrentStep('knowledge')
  }

  const applyTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      personaName: template.name,
      personaRole: template.role,
      personaTone: template.tone,
      personaExpertise: template.expertise,
      personaGreeting: `Olá! Sou o ${template.name}, ${template.role.toLowerCase()}. Como posso ajudar você hoje?`,
      personaFallback: 'Desculpe, não entendi sua pergunta. Pode reformular?'
    }))
    setSelectedTemplate(template.id)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name && formData.description && formData.instanceName
      case 'persona':
        return formData.personaName && formData.personaRole && formData.personaTone
      case 'knowledge':
        return true
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    try {
      // Aqui você faria a chamada para a API
      console.log('Dados do agente:', formData)
      
      // Fechar modal e resetar
      onOpenChange(false)
      setCurrentStep('basic')
      setFormData({
        name: '',
        description: '',
        instanceName: '',
        botType: 'chatCompletion',
        model: 'gpt-4o',
        personaName: '',
        personaRole: '',
        personaTone: '',
        personaExpertise: [],
        personaLimitations: [],
        personaGreeting: '',
        personaFallback: '',
        knowledgeEnabled: true,
        knowledgeSources: []
      })
    } catch (error) {
      console.error('Erro ao criar agente:', error)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {['basic', 'persona', 'knowledge', 'review'].map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === step 
              ? 'bg-blue-600 text-white' 
              : index < ['basic', 'persona', 'knowledge', 'review'].indexOf(currentStep)
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}>
            {index < ['basic', 'persona', 'knowledge', 'review'].indexOf(currentStep) ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < 3 && (
            <div className={`w-16 h-1 mx-2 ${
              index < ['basic', 'persona', 'knowledge', 'review'].indexOf(currentStep)
                ? 'bg-green-600'
                : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
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

      <div>
        <Label htmlFor="instanceName">Nome da Instância *</Label>
        <Input
          id="instanceName"
          placeholder="Ex: vendas-instance"
          value={formData.instanceName}
          onChange={(e) => updateFormData('instanceName', e.target.value)}
          className="mt-2"
        />
        <p className="text-sm text-gray-500 mt-1">
          Identificador único para sua instância do WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="botType">Tipo de Bot</Label>
          <Select value={formData.botType} onValueChange={(value) => updateFormData('botType', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chatCompletion">Chat Completion</SelectItem>
              <SelectItem value="assistant">OpenAI Assistant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="model">Modelo</Label>
          <Select value={formData.model} onValueChange={(value) => updateFormData('model', value)}>
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
    </div>
  )

  const renderPersonaStep = () => (
    <div className="space-y-6">
      {/* Templates de Persona */}
      <div>
        <Label className="text-base font-medium mb-4 block">Escolha um Template (Opcional)</Label>
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
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedTemplate === template.id ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Bot className={`w-5 h-5 ${
                      selectedTemplate === template.id ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.expertise.slice(0, 2).map((exp, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
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
      <div className="text-center">
        <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Base de Conhecimento
        </h3>
        <p className="text-gray-600">
          Configure como seu agente acessará informações para responder perguntas
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">Habilitar Base de Conhecimento</h4>
              <p className="text-sm text-gray-600">
                Permite que o agente use documentos carregados para responder perguntas
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.knowledgeEnabled}
              onChange={(e) => updateFormData('knowledgeEnabled', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>

          {formData.knowledgeEnabled && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">📚 Como Funciona</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Carregue PDFs, DOCX, TXT ou URLs</li>
                  <li>• O sistema cria embeddings automáticos</li>
                  <li>• O agente busca informações relevantes</li>
                  <li>• Respostas mais precisas e contextualizadas</li>
                </ul>
              </div>

              <Button variant="outline" className="w-full">
                <BookOpen className="w-4 h-4 mr-2" />
                Carregar Documentos (Após Criação)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Nome:</span>
              <span className="font-medium">{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Descrição:</span>
              <span className="font-medium">{formData.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Instância:</span>
              <span className="font-medium">{formData.instanceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span className="font-medium">{formData.botType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modelo:</span>
              <span className="font-medium">{formData.model}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Persona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Base de Conhecimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant={formData.knowledgeEnabled ? 'default' : 'secondary'}>
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

        <div className="py-6">
          {renderCurrentStep()}
        </div>

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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Criar Agente
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
