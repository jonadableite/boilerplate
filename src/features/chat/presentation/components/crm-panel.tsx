'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/igniter.client'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Clock,
  Download,
  Filter,
  MessageCircle,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import type { Contact, ContactStatus, FunnelStage } from '../../chat.types'

const FUNNEL_STAGES = [
  {
    stage: 'NEW_LEAD',
    name: 'Novo Lead',
    color: 'bg-blue-500',
    description: 'Leads que acabaram de chegar',
  },
  {
    stage: 'CONTACTED',
    name: 'Contatado',
    color: 'bg-yellow-500',
    description: 'Leads que já foram contatados',
  },
  {
    stage: 'QUALIFIED',
    name: 'Qualificado',
    color: 'bg-orange-500',
    description: 'Leads qualificados como prospects',
  },
  {
    stage: 'PROPOSAL_SENT',
    name: 'Proposta Enviada',
    color: 'bg-purple-500',
    description: 'Propostas comerciais enviadas',
  },
  {
    stage: 'NEGOTIATING',
    name: 'Negociando',
    color: 'bg-indigo-500',
    description: 'Em processo de negociação',
  },
  {
    stage: 'CLOSED_WON',
    name: 'Fechado - Ganho',
    color: 'bg-green-500',
    description: 'Vendas finalizadas com sucesso',
  },
  {
    stage: 'CLOSED_LOST',
    name: 'Fechado - Perdido',
    color: 'bg-red-500',
    description: 'Oportunidades perdidas',
  },
] as const

export function CRMPanel() {
  const [selectedStage, setSelectedStage] = useState<FunnelStage | null>(null)

  // Buscar estatísticas do CRM
  const { data: stats, isLoading: loadingStats } =
    (api.chat.getCRMStats as any).useQuery()

  // Buscar contatos por estágio
  const { data: contactsData, isLoading: loadingContacts } =
    (api.chat.listContacts as any).useQuery({
      funnelStage: selectedStage || 'all',
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })

  const contacts = contactsData?.data || []

  return (
    <div className="flex h-screen bg-background">
      {/* Painel principal - Funil Kanban */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">CRM - Funil de Vendas</h1>
              <p className="text-muted-foreground">
                Gerencie seus leads e oportunidades de venda
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total de Contatos"
              value={stats?.contacts.total || 0}
              change={stats?.contacts.newThisMonth || 0}
              changeLabel="novos este mês"
              icon={Users}
              trend="up"
            />
            <StatsCard
              title="Conversas Ativas"
              value={stats?.conversations.total || 0}
              change={stats?.conversations.unread || 0}
              changeLabel="não lidas"
              icon={MessageCircle}
              trend="neutral"
            />
            <StatsCard
              title="Taxa de Conversão"
              value={`${stats?.conversionRates.overallConversion || 0}%`}
              change={5.2}
              changeLabel="vs mês anterior"
              icon={TrendingUp}
              trend="up"
            />
            <StatsCard
              title="Mensagens Hoje"
              value={stats?.messages.totalToday || 0}
              change={stats?.messages.inbound || 0}
              changeLabel="recebidas"
              icon={MessageCircle}
              trend="up"
            />
          </div>
        </div>

        {/* Funil Kanban */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-7 gap-4 h-full">
            {FUNNEL_STAGES.map((stageConfig) => (
              <FunnelColumn
                key={stageConfig.stage}
                stage={stageConfig.stage as FunnelStage}
                name={stageConfig.name}
                color={stageConfig.color}
                description={stageConfig.description}
                count={stats?.contacts.byFunnelStage[stageConfig.stage as FunnelStage] || 0}
                contacts={contacts.filter(
                  (c: any) => c.funnelStage === stageConfig.stage,
                )}
                isSelected={selectedStage === stageConfig.stage}
                onClick={() =>
                  setSelectedStage(
                    selectedStage === stageConfig.stage
                      ? null
                      : (stageConfig.stage as FunnelStage),
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar - Detalhes do contato selecionado */}
      {selectedStage && (
        <div className="w-80 border-l border-border bg-muted/20">
          <ContactDetailsSidebar
            stage={selectedStage}
            contacts={contacts.filter((c: any) => c.funnelStage === selectedStage)}
            onClose={() => setSelectedStage(null)}
          />
        </div>
      )}
    </div>
  )
}

// Componente para card de estatísticas
function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  change: number
  changeLabel: string
  icon: any
  trend: 'up' | 'down' | 'neutral'
}) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <ArrowDown className="h-3 w-3 text-red-500" />
      default:
        return <ArrowRight className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {getTrendIcon()}
          <span className={cn('ml-1', getTrendColor())}>{change}</span>
          <span className="ml-1">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para coluna do funil
function FunnelColumn({
  stage,
  name,
  color,
  description,
  count,
  contacts,
  isSelected,
  onClick,
}: {
  stage: FunnelStage
  name: string
  color: string
  description: string
  count: number
  contacts: Contact[]
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col bg-background border border-border rounded-lg transition-all duration-200',
        isSelected && 'ring-2 ring-primary',
      )}
    >
      {/* Header da coluna */}
      <div
        className="p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', color)} />
            <h3 className="font-medium text-sm">{name}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Lista de contatos */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {contacts.slice(0, 10).map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
          {contacts.length > 10 && (
            <div className="text-center p-2">
              <Button variant="ghost" size="sm" onClick={onClick}>
                Ver mais {contacts.length - 10} contatos
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Componente para card de contato
function ContactCard({ contact }: { contact: Contact }) {
  const contactName = contact.name || contact.whatsappNumber
  const lastSeenTime = contact.lastSeenAt
    ? formatDistanceToNow(new Date(contact.lastSeenAt), {
      addSuffix: true,
      locale: ptBR,
    })
    : 'Nunca visto'

  const getStatusColor = (status: ContactStatus) => {
    switch (status) {
      case 'LEAD':
        return 'border-blue-500'
      case 'PROSPECT':
        return 'border-yellow-500'
      case 'CUSTOMER':
        return 'border-green-500'
      case 'INACTIVE':
        return 'border-gray-500'
      default:
        return 'border-gray-500'
    }
  }

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-4',
        getStatusColor(contact.status),
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={contact.profilePicUrl} />
          <AvatarFallback className="text-xs">
            {contactName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{contactName}</p>
          <p className="text-xs text-muted-foreground">{lastSeenTime}</p>
        </div>
      </div>

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {contact.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-1">
              {tag}
            </Badge>
          ))}
          {contact.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs px-1">
              +{contact.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {contact.notes && (
        <p className="text-xs text-muted-foreground truncate">
          {contact.notes}
        </p>
      )}
    </Card>
  )
}

// Sidebar com detalhes dos contatos
function ContactDetailsSidebar({
  stage,
  contacts,
  onClose,
}: {
  stage: FunnelStage
  contacts: Contact[]
  onClose: () => void
}) {
  const stageName = FUNNEL_STAGES.find((s) => s.stage === stage)?.name || stage

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{stageName}</h3>
            <p className="text-sm text-muted-foreground">
              {contacts.length} contatos
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      {/* Lista de contatos */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {contacts.map((contact) => (
            <ContactDetailCard key={contact.id} contact={contact} />
          ))}
          {contacts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum contato neste estágio</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Card detalhado do contato
function ContactDetailCard({ contact }: { contact: Contact }) {
  const contactName = contact.name || contact.whatsappNumber
  const assignedTo = contact.assignedTo

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.profilePicUrl} />
          <AvatarFallback>{contactName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{contactName}</h4>
          <p className="text-sm text-muted-foreground">
            {contact.whatsappNumber}
          </p>
          {contact.email && (
            <p className="text-sm text-muted-foreground">{contact.email}</p>
          )}
        </div>
      </div>

      {/* Status e estágio */}
      <div className="flex gap-2 mb-3">
        <Badge variant="secondary">{contact.status}</Badge>
        <Badge variant="outline">
          {contact.funnelStage.replace('_', ' ').toLowerCase()}
        </Badge>
      </div>

      {/* Responsável */}
      {assignedTo && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Responsável:</span>
          <span>{assignedTo.name}</span>
        </div>
      )}

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contact.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Notas */}
      {contact.notes && (
        <div className="mb-3">
          <p className="text-sm font-medium mb-1">Notas:</p>
          <p className="text-sm text-muted-foreground">{contact.notes}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          Editar
        </Button>
        <Button size="sm" className="flex-1">
          Conversar
        </Button>
      </div>
    </Card>
  )
}
