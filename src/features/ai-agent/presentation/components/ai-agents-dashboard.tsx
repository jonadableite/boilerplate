'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAIAgents } from '../hooks/use-ai-agents'
import { AgentStats } from './agent-stats'
import { AIAgentCard } from './ai-agent-card'
import { EmptyState } from './empty-state'
import { CreateAgentModal } from './create-agent-modal'

export function AIAgentsDashboard() {
  const { agents, loading, error, deleteAgent, refreshAgents } = useAIAgents()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Filtrar agentes
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.description?.toLowerCase() || '').includes(
        searchTerm.toLowerCase(),
      )
    const matchesStatus =
      statusFilter === 'all' || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Estatísticas
  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.status === 'ACTIVE').length,
    inactive: agents.filter((a) => a.status === 'INACTIVE').length,
    training: agents.filter((a) => a.status === 'TRAINING').length,
    error: agents.filter((a) => a.status === 'ERROR').length,
  }

  const handleStatusChange = async (agentId: string, newStatus: string) => {
    try {
      // TODO: Implementar chamada para a API para atualizar o status
      console.log('Alterando status do agente:', agentId, 'para:', newStatus)
      toast.success('Status do agente atualizado com sucesso')
      await refreshAgents()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do agente')
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (
      confirm(
        'Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.',
      )
    ) {
      try {
        const success = await deleteAgent(agentId)
        if (success) {
          toast.success('Agente excluído com sucesso')
        } else {
          toast.error('Erro ao excluir agente')
        }
      } catch (error) {
        console.error('Erro ao excluir agente:', error)
        toast.error('Erro ao excluir agente')
      }
    }
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar agentes
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshAgents} variant="outline">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <AgentStats
        stats={{
          total: stats.total,
          active: stats.active,
          totalConversations: 0, // TODO: Implementar contagem de conversas
          totalMessages: 0, // TODO: Implementar contagem de mensagens
        }}
      />

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar agentes por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de Status */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Todos ({agents.length})
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ACTIVE')}
                size="sm"
              >
                Ativos ({stats.active})
              </Button>
              <Button
                variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('INACTIVE')}
                size="sm"
              >
                Inativos ({stats.inactive})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agentes */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando agentes...</p>
          </div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          searchTerm={searchTerm}
          onReset={() => {
            setSearchTerm('')
            setStatusFilter('all')
          }}
          onCreateAgent={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid gap-6">
          {filteredAgents.map((agent) => (
            <AIAgentCard
              key={agent.id}
              agent={agent}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteAgent}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {filteredAgents.length > 0 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página 1 de 1</span>
            <Button variant="outline" size="sm" disabled>
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Criação */}
      <CreateAgentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  )
}
