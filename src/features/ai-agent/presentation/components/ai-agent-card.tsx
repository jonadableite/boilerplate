'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Activity,
  Bot,
  Clock,
  Edit,
  Eye,
  MessageSquare,
  MoreVertical,
  Pause,
  Play,
  Settings,
  Trash2,
  Users,
} from 'lucide-react'
import type { AIAgent } from '../../ai-agent.types'

interface AIAgentCardProps {
  agent: AIAgent
  onStatusChange: (agentId: string, newStatus: string) => void
  onDelete: (agentId: string) => void
  loading: boolean
}

export function AIAgentCard({
  agent,
  onStatusChange,
  onDelete,
  loading,
}: AIAgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'INACTIVE':
        return 'bg-muted text-muted-foreground border-border'
      case 'TRAINING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Activity className="w-4 h-4" />
      case 'INACTIVE':
        return <Pause className="w-4 h-4" />
      case 'TRAINING':
        return <Bot className="w-4 h-4" />
      case 'ERROR':
        return <Activity className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getBotTypeLabel = (type: string) => {
    switch (type) {
      case 'assistant':
        return 'OpenAI Assistant'
      case 'chatCompletion':
        return 'Chat Completion'
      default:
        return type
    }
  }

  const formatLastActive = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch {
      return 'Nunca'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Informações principais */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-foreground">
                {agent.name}
              </h3>
              <Badge className={getStatusColor(agent.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(agent.status)}
                  {agent.status === 'ACTIVE'
                    ? 'Ativo'
                    : agent.status === 'INACTIVE'
                      ? 'Inativo'
                      : agent.status === 'TRAINING'
                        ? 'Treinando'
                        : agent.status === 'ERROR'
                          ? 'Erro'
                          : agent.status}
                </span>
              </Badge>
            </div>

            <p className="text-muted-foreground mb-3">
              {agent.description || 'Sem descrição'}
            </p>

            {/* Metadados do agente */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="w-4 h-4" />
                <span className="font-medium">
                  {getBotTypeLabel(agent.botType)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span className="font-medium">
                  {agent.model || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">
                  {agent.instanceName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="font-medium">
                  {agent.triggerType}
                </span>
              </div>
            </div>

            {/* Persona */}
            {agent.persona && (
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Persona:
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {agent.persona.name} - {agent.persona.role}
                  </Badge>
                </div>
              </div>
            )}

            {/* Última atividade */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Criado: {formatLastActive(agent.createdAt.toISOString())}
              </span>
            </div>
          </div>

          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => window.open(`/ai-agents/${agent.id}`, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`/ai-agents/${agent.id}/edit`, '_blank')}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`/ai-agents/${agent.id}/settings`, '_blank')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onStatusChange(
                    agent.id,
                    agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                  )
                }
                disabled={loading}
              >
                {agent.status === 'ACTIVE' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(agent.id)}
                disabled={loading}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/ai-agents/${agent.id}/chat`, '_blank')}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Testar Chat
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/ai-agents/${agent.id}/analytics`, '_blank')}
            className="flex-1"
          >
            <Activity className="w-4 h-4 mr-2" />
            Analytics
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/ai-agents/${agent.id}/knowledge`, '_blank')}
            className="flex-1"
          >
            <Bot className="w-4 h-4 mr-2" />
            Base de Conhecimento
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
