'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateAgentModal } from './create-agent-modal'

export function AIAgentsHeader() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Agentes de IA para WhatsApp
        </h1>
        <p className="text-muted-foreground">
          Crie assistentes inteligentes que conversam automaticamente com seus clientes via WhatsApp
        </p>
      </div>

      <Button
        onClick={() => setShowCreateModal(true)}
        className="bg-primary hover:bg-primary/90"
      >
        <Plus className="w-4 h-4 mr-2" />
        Criar Agente
      </Button>

      {/* Modal de Criação */}
      <CreateAgentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  )
}
