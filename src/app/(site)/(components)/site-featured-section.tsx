'use client'

import { AppConfig } from '@/boilerplate.config'
import { motion } from 'framer-motion'
import { MagicCard } from '@/components/magicui/magic-card'
import { BorderBeam } from '@/components/magicui/border-beam'
import {
  MessageCircleIcon,
  BotIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  UsersIcon,
  BarChart3Icon,
  ZapIcon,
  HeartHandshakeIcon,
  CheckCircle2Icon,
  FileChartLineIcon,
} from 'lucide-react'

const features = [
  {
    icon: MessageCircleIcon,
    title: 'Disparos em Massa',
    description:
      'Envie milhares de mensagens personalizadas no WhatsApp com segurança e eficiência, respeitando os limites da plataforma.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    delay: 0.1,
  },
  {
    icon: BotIcon,
    title: 'Agente de IA Avançado',
    description:
      'Chatbot inteligente que responde automaticamente seus clientes 24/7, qualifica leads e agenda reuniões.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    delay: 0.2,
  },
  {
    icon: TrendingUpIcon,
    title: 'Gerenciamento de Leads',
    description:
      'Capture, organize e nutra seus leads automaticamente com funis de conversão otimizados para WhatsApp.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    delay: 0.3,
  },
  {
    icon: ShieldCheckIcon,
    title: 'Sistema Anti-Banimento',
    description:
      'Aquecimento inteligente de contas e monitoramento da saúde para evitar bloqueios e suspensões.',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    delay: 0.4,
  },
  {
    icon: UsersIcon,
    title: 'Multi-Usuários',
    description:
      'Gerencie múltiplas contas do WhatsApp Business com diferentes usuários e níveis de permissão.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    delay: 0.5,
  },
  {
    icon: BarChart3Icon,
    title: 'Analytics Avançado',
    description:
      'Relatórios detalhados de performance, taxa de entrega, conversões e ROI das suas campanhas.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    delay: 0.6,
  },
]

export function SiteFeaturedSection() {
  return (
    <div className="w-full py-24 bg-gradient-to-b from-background">
      <div className="container mx-auto max-w-screen-xl px-4">
        <div className="flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex gap-4 flex-col items-center text-center mb-20"
          >
            <div className="relative">
              <ZapIcon
                className="size-12 mb-6 stroke-2 text-primary mx-auto"
                fill="currentColor"
                fillOpacity={0.15}
              />
              <motion.div
                className="absolute -inset-4 bg-primary/5 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            <h2 className="text-balance text-3xl font-bold !leading-[1.2] tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
              Tudo que Você Precisa <br /> para Dominar o WhatsApp
            </h2>
            <p className="text-balance text-muted-foreground text-lg leading-7 sm:text-xl sm:leading-8 max-w-3xl">
              Nossa plataforma oferece todas as ferramentas essenciais para você
              escalar seu negócio no WhatsApp Business de forma profissional e
              segura
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: feature.delay }}
                viewport={{ once: true }}
                className="group"
              >
                <MagicCard className="relative h-full">
                  <div className="p-8 h-full flex flex-col justify-between bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-border transition-all duration-300 group-hover:shadow-lg">
                    <div>
                      <div
                        className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <feature.icon
                          className={`w-8 h-8 stroke-2 ${feature.color}`}
                          fill="currentColor"
                          fillOpacity={0.2}
                        />
                      </div>

                      <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>

                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Hover effect indicator */}
                    <motion.div
                      className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <span>Saiba mais</span>
                      <motion.div
                        className="ml-2 w-4 h-4"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </motion.div>
                  </div>
                  <BorderBeam
                    size={150}
                    duration={10 + index * 2}
                    delay={index * 0.5}
                  />
                </MagicCard>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <HeartHandshakeIcon className="w-4 h-4" />
              <span>
                Mais de 1.000+ empresas já confiam em nossa plataforma
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
