import {
  StatCard,
  StatCardMain,
  StatCardHeader,
  StatCardTitle,
  StatCardValue,
} from '@/components/ui/stat-card'
import { Bot, MessageSquare, Users, Activity } from 'lucide-react'

interface AgentStatsProps {
  stats: {
    total: number
    active: number
    totalConversations: number
    totalMessages: number
  }
}

export function AgentStats({ stats }: AgentStatsProps) {
  const statCards = [
    {
      title: 'Total de Agentes',
      value: stats.total,
      icon: Bot,
      description: 'Agentes criados'
    },
    {
      title: 'Agentes Ativos',
      value: stats.active,
      icon: Activity,
      description: 'Em operação'
    },
    {
      title: 'Conversas',
      value: stats.totalConversations,
      icon: Users,
      description: 'Total de conversas'
    },
    {
      title: 'Mensagens',
      value: stats.totalMessages,
      icon: MessageSquare,
      description: 'Mensagens processadas'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <StatCard key={index}>
          <StatCardHeader>
            <StatCardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </StatCardTitle>
          </StatCardHeader>
          <StatCardMain>
            <div className="flex items-center justify-between">
              <StatCardValue className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </StatCardValue>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
                      </StatCardMain>
        </StatCard>
      ))}
    </div>
  )
}
