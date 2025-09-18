'use client'

import { cn } from '@/utils/cn'
import { MessageSquareIcon, UsersIcon, TrendingUpIcon, ActivityIcon, BotIcon, ZapIcon } from 'lucide-react'

interface PerformanceDashboardDemoProps {
  className?: string
}

export function PerformanceDashboardDemo({ className }: PerformanceDashboardDemoProps) {
  const metrics = [
    {
      icon: MessageSquareIcon,
      label: "Mensagens",
      value: "2,847",
      change: "+18%",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: UsersIcon,
      label: "Leads",
      value: "1,234",
      change: "+12%",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: TrendingUpIcon,
      label: "Conversão",
      value: "23.4%",
      change: "+5.2%",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: ActivityIcon,
      label: "Uptime",
      value: "99.9%",
      change: "+0.1%",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: BotIcon,
      label: "IA Respostas",
      value: "1,847",
      change: "+24%",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      icon: ZapIcon,
      label: "Campanhas",
      value: "47",
      change: "+8",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      iconColor: "text-yellow-600 dark:text-yellow-400"
    }
  ]

  return (
    <div className={cn("w-full h-full p-4", className)}>
      <div className="grid grid-cols-2 gap-3 h-full">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div
              key={index}
              className={cn(
                "relative overflow-hidden rounded-lg border p-3 transition-all duration-300",
                "border-gray-200/50 bg-white/50 hover:bg-white/80",
                "dark:border-gray-800/50 dark:bg-gray-900/50 dark:hover:bg-gray-900/80",
                "hover:shadow-lg hover:scale-105"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      metric.bgColor
                    )}>
                      <Icon className={cn("h-3 w-3", metric.iconColor)} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {metric.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {metric.value}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {metric.change}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Animated background gradient */}
              <div className={cn(
                "absolute inset-0 opacity-5 bg-gradient-to-br",
                metric.color,
                "animate-pulse"
              )} />
            </div>
          )
        })}
      </div>
      
      {/* Subtle animated dots for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 right-2 w-1 h-1 bg-blue-400 rounded-full animate-ping" />
        <div className="absolute bottom-4 left-4 w-1 h-1 bg-green-400 rounded-full animate-ping delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-2000" />
      </div>
    </div>
  )
}

export default PerformanceDashboardDemo