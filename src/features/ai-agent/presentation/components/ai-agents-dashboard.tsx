'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Users, 
  Activity,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Settings
} from 'lucide-react'
import { AIAgentCard } from './ai-agent-card'
import { EmptyState } from './empty-state'
import { AgentStats } from './agent-stats'

// Mock data - substituir por dados reais da API
const mockAgents = [
  {
    id: '1',
    name: 'Alex - Assistente de Vendas',
    description: 'Agente especializado em vendas de produtos SaaS',
    status: 'ACTIVE',
    instanceName: 'vendas-instance',
    botType: 'chatCompletion',
    model: 'gpt-4o',
    conversations: 156,
    messages: 1247,
    lastActive: '2024-01-15T10:30:00Z',
    persona: {
      name: 'Alex',
      role: 'Assistente de Vendas'
    }
  },
  {
    id: '2',
    name: 'Sofia - Suporte Técnico',
    description: 'Agente para resolução de problemas técnicos',
    status: 'ACTIVE',
    instanceName: 'suporte-instance',
    botType: 'assistant',
    model: 'gpt-4o',
    conversations: 89,
    messages: 567,
    lastActive: '2024-01-15T09:15:00Z',
    persona: {
      name: 'Sofia',
      role: 'Suporte Técnico'
    }
  },
  {
    id: '3',
    name: 'Carlos - Onboarding',
    description: 'Agente para orientar novos usuários',
    status: 'INACTIVE',
    instanceName: 'onboarding-instance',
    botType: 'chatCompletion',
    model: 'gpt-3.5-turbo',
    conversations: 23,
    messages: 89,
    lastActive: '2024-01-14T16:45:00Z',
    persona: {
      name: 'Carlos',
      role: 'Especialista em Onboarding'
    }
  }
]

export function AIAgentsDashboard() {
  const [agents, setAgents] = useState(mockAgents)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  // Filtrar agentes
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Estatísticas
  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'ACTIVE').length,
    totalConversations: agents.reduce((sum, a) => sum + a.conversations, 0),
    totalMessages: agents.reduce((sum, a) => sum + a.messages, 0)
  }

  const handleStatusChange = async (agentId: string, newStatus: string) => {
    setLoading(true)
    try {
      // Aqui você faria a chamada para a API
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: newStatus }
          : agent
      ))
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (confirm('Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.')) {
      setLoading(true)
      try {
        // Aqui você faria a chamada para a API
        setAgents(prev => prev.filter(agent => agent.id !== agentId))
      } catch (error) {
        console.error('Erro ao excluir agente:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <AgentStats stats={stats} />

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
                Inativos ({agents.length - stats.active})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agentes */}
      {filteredAgents.length === 0 ? (
        <EmptyState 
          searchTerm={searchTerm}
          onReset={() => {
            setSearchTerm('')
            setStatusFilter('all')
          }}
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
    </div>
  )
}
