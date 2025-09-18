'use client'

import { Button } from '@/components/ui/button'
import { CardTitle, CardDescription } from '@/components/ui/card'
import {
  CheckCircle2Icon,
  CircleIcon,
  MoveRight,
  Wallet2Icon,
  Crown,
  Zap,
  Shield,
  Users,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'
import { MagicCard } from '@/components/magicui/magic-card'
import { BorderBeam } from '@/components/magicui/border-beam'
import Link from 'next/link'

const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    description:
      'Perfeito para pequenos negócios começando no WhatsApp Marketing',
    price: 97,
    currency: 'BRL',
    interval: 'mês',
    icon: Zap,
    popular: false,
    features: [
      { description: 'Até 1.000 contatos', enabled: true },
      { description: '5.000 mensagens/mês', enabled: true },
      { description: '1 número WhatsApp', enabled: true },
      { description: 'Disparos em massa básicos', enabled: true },
      { description: 'Relatórios básicos', enabled: true },
      { description: 'Suporte por email', enabled: true },
      { description: 'Agente de IA', enabled: false },
      { description: 'Aquecimento avançado', enabled: false },
      { description: 'API personalizada', enabled: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description:
      'Ideal para empresas em crescimento que precisam de mais recursos',
    price: 197,
    currency: 'BRL',
    interval: 'mês',
    icon: Crown,
    popular: true,
    features: [
      { description: 'Até 10.000 contatos', enabled: true },
      { description: '50.000 mensagens/mês', enabled: true },
      { description: 'Até 3 números WhatsApp', enabled: true },
      { description: 'Disparos em massa avançados', enabled: true },
      { description: 'Agente de IA integrado', enabled: true },
      { description: 'Aquecimento inteligente', enabled: true },
      { description: 'Relatórios avançados', enabled: true },
      { description: 'Suporte prioritário', enabled: true },
      { description: 'Integração com CRM', enabled: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description:
      'Solução completa para grandes empresas com necessidades específicas',
    price: 497,
    currency: 'BRL',
    interval: 'mês',
    icon: Shield,
    popular: false,
    features: [
      { description: 'Contatos ilimitados', enabled: true },
      { description: 'Mensagens ilimitadas', enabled: true },
      { description: 'Números WhatsApp ilimitados', enabled: true },
      { description: 'IA personalizada', enabled: true },
      { description: 'Aquecimento premium', enabled: true },
      { description: 'Dashboard personalizado', enabled: true },
      { description: 'API completa', enabled: true },
      { description: 'Suporte 24/7', enabled: true },
      { description: 'Gerente de conta dedicado', enabled: true },
    ],
  },
]

export function SitePricingSection() {
  return (
    <div className="w-full py-24 bg-background">
      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div
          className="flex text-center justify-center items-center gap-6 flex-col"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="flex flex-col max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="flex items-center justify-center mb-6"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Wallet2Icon
                className="size-12 stroke-2 text-primary"
                fill="currentColor"
                fillOpacity={0.15}
              />
            </motion.div>

            <h2 className="mx-auto w-full max-w-4xl mb-4 text-balance text-center text-3xl font-bold !leading-[1.1] tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Planos que crescem com seu negócio
            </h2>

            <p className="mx-auto max-w-2xl text-center text-lg text-muted-foreground mb-4">
              Escolha o plano ideal para revolucionar suas vendas no WhatsApp
            </p>

            <div className="inline-flex items-center gap-2 mx-auto px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">
                🎉 Desconto de 30% nos primeiros 3 meses
              </span>
            </div>
          </motion.div>

          <div className="grid text-left grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mt-16">
            {pricingPlans.map((plan, index) => {
              const IconComponent = plan.icon

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="relative"
                >
                  <MagicCard
                    className={cn(
                      'relative h-full bg-background/50 backdrop-blur-sm border transition-all duration-300',
                      plan.popular
                        ? 'border-primary/50 shadow-lg shadow-primary/10'
                        : 'border-border/50 hover:border-primary/30',
                    )}
                    gradientColor={plan.popular ? '#3b82f6' : '#6b7280'}
                    gradientOpacity={plan.popular ? 0.15 : 0.1}
                  >
                    {plan.popular && (
                      <>
                        <BorderBeam
                          size={250}
                          duration={15}
                          colorFrom="#3b82f6"
                          colorTo="#8b5cf6"
                        />
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Mais Popular
                          </div>
                        </div>
                      </>
                    )}

                    <header className="space-y-6 p-8">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            plan.popular ? 'bg-primary/10' : 'bg-muted',
                          )}
                        >
                          <IconComponent
                            className={cn(
                              'w-6 h-6',
                              plan.popular
                                ? 'text-primary'
                                : 'text-muted-foreground',
                            )}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold">
                            {plan.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {plan.description}
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">
                          R$ {plan.price}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.interval}
                        </span>
                      </div>

                      {plan.popular && (
                        <div className="text-sm text-green-600 font-medium">
                          💰 Economize R$ {Math.round(plan.price * 0.3 * 3)} nos
                          primeiros 3 meses
                        </div>
                      )}
                    </header>

                    <main className="px-8 pb-8">
                      <div className="space-y-4">
                        {plan.features.map((feature, i) => (
                          <div
                            key={i}
                            className={cn([
                              'flex flex-row items-center gap-3 text-sm',
                              !feature.enabled && 'text-muted-foreground',
                            ])}
                          >
                            {feature.enabled ? (
                              <CheckCircle2Icon
                                className="w-5 h-5 text-green-500 flex-shrink-0"
                                fill="currentColor"
                                fillOpacity={0.2}
                              />
                            ) : (
                              <CircleIcon
                                className="w-5 h-5 text-muted-foreground/40 flex-shrink-0"
                                fill="currentColor"
                                fillOpacity={0.2}
                              />
                            )}
                            <p className="font-medium">{feature.description}</p>
                          </div>
                        ))}
                      </div>
                    </main>

                    <footer className="p-8 pt-0">
                      <Button
                        size="lg"
                        className={cn(
                          'w-full justify-between gap-2 rounded-lg font-semibold',
                          plan.popular
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                        )}
                        asChild
                      >
                        <Link href="/auth">
                          {plan.price === 0
                            ? 'Começar Grátis'
                            : 'Teste 14 dias grátis'}
                          <MoveRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </footer>
                  </MagicCard>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            className="mt-16 text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Sem taxa de setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Suporte em português</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Ativação imediata</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              Todos os planos incluem 14 dias de teste grátis. Cancele a
              qualquer momento. Preços em reais brasileiros, sem taxas ocultas.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
