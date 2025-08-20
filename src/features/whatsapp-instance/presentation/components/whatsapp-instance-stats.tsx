// src/features/whatsapp-instance/presentation/components/whatsapp-instance-stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { Loader2Icon, PhoneOffIcon, TrendingUp, WifiIcon } from 'lucide-react'
import { type WhatsAppInstanceStats } from '../../whatsapp-instance.types'

interface WhatsAppInstanceStatsProps {
  stats: WhatsAppInstanceStats
  className?: string
}

export function WhatsAppInstanceStats({
  stats,
  className,
}: WhatsAppInstanceStatsProps) {
  const cards = [
    {
      title: 'Conectadas',
      value: stats.connected,
      icon: WifiIcon,
      description: 'Instâncias ativas e operantes',
      gradient: 'from-green-500/10 via-green-400/5 to-emerald-500/10',
      border: 'border-green-200/50',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50/80',
    },
    {
      title: 'Conectando',
      value: stats.connecting,
      icon: Loader2Icon,
      description: 'Instâncias em processo de conexão',
      gradient: 'from-yellow-500/10 via-amber-400/5 to-orange-500/10',
      border: 'border-yellow-200/50',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50/80',
    },
    {
      title: 'Desconectadas',
      value: stats.disconnected,
      icon: PhoneOffIcon,
      description: 'Instâncias sem conexão',
      gradient: 'from-red-500/10 via-rose-400/5 to-pink-500/10',
      border: 'border-red-200/50',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50/80',
    },
  ]

  return (
    <div className={cn('grid gap-6 md:grid-cols-3', className)}>
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className={cn(
            'group relative overflow-hidden backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
            `bg-gradient-to-br ${card.gradient}`,
            card.border,
          )}
          style={{
            animationDelay: `${index * 150}ms`,
          }}
        >
          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className={cn('text-sm font-medium', card.textColor)}>
                {card.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className={cn('text-2xl font-bold', card.textColor)}>
                  {card.value}
                </div>
                {stats.total > 0 && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {((card.value / stats.total) * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>

            <div
              className={cn(
                'p-3 rounded-xl transition-all duration-300 group-hover:scale-110',
                card.bgColor,
              )}
            >
              <card.icon
                className={cn(
                  'h-6 w-6 transition-all duration-300',
                  card.iconColor,
                  card.title === 'Conectando' && 'animate-spin',
                )}
              />
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <p
              className={cn(
                'text-xs leading-relaxed',
                card.textColor,
                'opacity-80',
              )}
            >
              {card.description}
            </p>

            {/* Barra de progresso */}
            {stats.total > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Proporção</span>
                  <span className={cn('font-medium', card.textColor)}>
                    {card.value}/{stats.total}
                  </span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 ease-out',
                      card.iconColor.replace('text-', 'bg-'),
                    )}
                    style={{
                      width: `${stats.total > 0 ? (card.value / stats.total) * 100 : 0}%`,
                      animationDelay: `${index * 200 + 300}ms`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
