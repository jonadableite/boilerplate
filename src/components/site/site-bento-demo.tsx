'use client'

import { CalendarIcon, FileTextIcon } from '@radix-ui/react-icons'
import {
  BellIcon,
  Share2Icon,
  MessageSquareIcon,
  BotIcon,
  TrendingUpIcon,
  BarChart3Icon,
} from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/utils/cn'
import AnimatedBeamMultipleOutputDemo from '@/registry/example/animated-beam-multiple-outputs'
import AnimatedListDemo from '@/registry/example/animated-list-demo'
import { AnimatedBeamPlatformFlow } from '@/components/demo/animated-beam-platform-flow'
import { PerformanceDashboardDemo } from '@/components/demo/performance-dashboard-demo'
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid'
import Marquee from '@/components/magicui/marquee'
import { Vortex } from '@/components/ui/vortex'

const leads = [
  {
    name: 'João Silva',
    message: 'Interessado no produto premium',
    source: 'WhatsApp',
    status: 'Novo',
  },
  {
    name: 'Maria Santos',
    message: 'Precisa de mais informações sobre preços',
    source: 'Site',
    status: 'Qualificado',
  },
  {
    name: 'Pedro Costa',
    message: 'Quer agendar uma demonstração',
    source: 'WhatsApp',
    status: 'Oportunidade',
  },
  {
    name: 'Ana Oliveira',
    message: 'Interessada em planos empresariais',
    source: 'LinkedIn',
    status: 'Negociação',
  },
  {
    name: 'Carlos Ferreira',
    message: 'Solicitou proposta comercial',
    source: 'WhatsApp',
    status: 'Fechamento',
  },
]

const features = [
  {
    Icon: MessageSquareIcon,
    name: 'WhatsApp Automático',
    description: 'Automatize conversas e capture leads 24/7 no WhatsApp.',
    href: '#',
    cta: 'Saiba mais',
    className: 'col-span-3 lg:col-span-1',
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)]"
      >
        {leads.map((lead, idx) => (
          <figure
            key={idx}
            className={cn(
              'relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4',
              'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
              'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]',
              'transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none',
            )}
          >
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col">
                <figcaption className="text-sm font-medium dark:text-white">
                  {lead.name}
                </figcaption>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {lead.source}
                </p>
              </div>
            </div>
            <blockquote className="mt-2 text-xs">{lead.message}</blockquote>
            <div className="mt-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                  lead.status === 'Novo' &&
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                  lead.status === 'Qualificado' &&
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                  lead.status === 'Oportunidade' &&
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                  lead.status === 'Negociação' &&
                  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                  lead.status === 'Fechamento' &&
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                )}
              >
                {lead.status}
              </span>
            </div>
          </figure>
        ))}
      </Marquee>
    ),
  },
  {
    Icon: BellIcon,
    name: 'Notificações Inteligentes',
    description:
      'Receba alertas em tempo real sobre novos leads e oportunidades.',
    href: '#',
    cta: 'Configurar',
    className: 'col-span-3 lg:col-span-2',
    background: (
      <AnimatedListDemo className="absolute right-2 top-4 h-[300px] w-full scale-75 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-90" />
    ),
  },
  {
    Icon: Share2Icon,
    name: 'Ecossistema Completo',
    description:
      'Plataforma integrada com aquecedor, monitoramento de saúde, IA e análise de dados avançada.',
    href: '#',
    cta: 'Ver ecossistema',
    className: 'col-span-3 lg:col-span-2',
    background: (
      <AnimatedBeamPlatformFlow className="absolute right-2 top-4 h-[300px] border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
    ),
  },
  {
    Icon: BarChart3Icon,
    name: 'Dashboard de Performance',
    description:
      'Monitore métricas de WhatsApp, leads, campanhas e performance da IA em tempo real.',
    className: 'col-span-3 lg:col-span-1',
    href: '#',
    cta: 'Ver métricas',
    background: (
      <PerformanceDashboardDemo className="absolute inset-0 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
    ),
  },
]

export function SiteBentoDemo() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <Vortex
          containerClassName="mx-auto max-w-2xl text-center mb-16 relative"
          className="z-10"
          backgroundColor="rgba(0,0,0,0.02)"
          baseHue={220}
          particleCount={600}
          baseRadius={0.8}
          rangeRadius={1.5}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl relative z-10">
            Tudo que você precisa para{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              vender mais
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground relative z-10">
            Uma plataforma completa para automatizar vendas, capturar leads e
            aumentar sua receita.
          </p>
        </Vortex>

        <BentoGrid className="mx-auto max-w-6xl">
          {features.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}
