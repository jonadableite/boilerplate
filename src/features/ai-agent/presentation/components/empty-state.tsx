import { Button } from '@/components/ui/button'
import { Bot, Search, Plus } from 'lucide-react'

interface EmptyStateProps {
  searchTerm?: string
  onReset?: () => void
  onCreateAgent?: () => void
}

export function EmptyState({
  searchTerm,
  onReset,
  onCreateAgent,
}: EmptyStateProps) {
  if (searchTerm) {
    return (
      <div className="text-center py-16">
        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhum agente encontrado
        </h3>
        <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
          Nenhum agente encontrado para "{searchTerm}". Tente
          ajustar os filtros ou criar um novo agente.
        </p>
        <Button onClick={onReset} variant="outline">
          Limpar Filtros
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center py-16">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Crie seu primeiro agente de IA
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Automatize conversas e atendimento
            com seus clientes via WhatsApp. Configure a personalidade, carregue a
            base de conhecimento e deixe a IA trabalhar para você.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h4 className="font-semibold text-foreground mb-2">
              Configure o Agente
            </h4>
            <p className="text-sm text-muted-foreground">
              Defina nome, descrição e tipo de bot (assistente ou chat completion)
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h4 className="font-semibold text-foreground mb-2">
              Personalize a Persona
            </h4>
            <p className="text-sm text-muted-foreground">
              Configure tom, expertise e comportamento do seu assistente
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h4 className="font-semibold text-foreground mb-2">
              Carregue Conhecimento
            </h4>
            <p className="text-sm text-muted-foreground">
              Adicione documentos e FAQs para respostas precisas
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold"
          onClick={onCreateAgent}
        >
          <Plus className="w-5 h-5 mr-2" />
          Criar Meu Primeiro Agente
        </Button>

        <p className="text-muted-foreground mt-4 text-sm">
          ⚡ Configuração guiada em menos de 5 minutos
        </p>
      </div>
    </div>
  )
}
