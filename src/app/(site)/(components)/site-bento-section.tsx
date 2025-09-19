'use client'

import { CalendarIcon, FileTextIcon } from "@radix-ui/react-icons"
import { BellIcon, Share2Icon, MessageCircleIcon, BotIcon, TrendingUpIcon, BarChart3Icon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/utils/cn"
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid"
import { WhatsAppIcon } from "@/components/ui/icons/chat-providers"
import { AnimatedBeamIntegration } from "@/components/demo/animated-beam-integration"
import Marquee from "@/components/magicui/marquee"

// Dados simulados para demonstração
const whatsappMessages = [
  {
    name: "João Silva",
    message: "Olá! Gostaria de saber mais sobre seus produtos.",
    time: "14:32",
    status: "delivered"
  },
  {
    name: "Maria Santos",
    message: "Quando vocês fazem entrega?",
    time: "14:28",
    status: "read"
  },
  {
    name: "Carlos Oliveira",
    message: "Preciso de um orçamento urgente!",
    time: "14:25",
    status: "delivered"
  },
  {
    name: "Ana Costa",
    message: "Obrigada pelo atendimento! Vou comprar.",
    time: "14:20",
    status: "read"
  },
]

const leadStats = [
  { label: "Leads Hoje", value: "127", change: "+23%" },
  { label: "Conversões", value: "34", change: "+45%" },
  { label: "Taxa Conversão", value: "26.8%", change: "+12%" },
  { label: "Vendas", value: "R$ 15.2k", change: "+67%" },
]

const aiResponses = [
  {
    question: "Qual o horário de funcionamento?",
    response: "Funcionamos de segunda a sexta das 8h às 18h, e sábados das 8h às 12h. Posso ajudar com mais alguma coisa?",
    confidence: 98
  },
  {
    question: "Vocês fazem entrega?",
    response: "Sim! Fazemos entregas em toda a cidade. O prazo é de 24h para região central e 48h para demais bairros.",
    confidence: 95
  },
  {
    question: "Como posso fazer um pedido?",
    response: "Você pode fazer seu pedido aqui mesmo pelo WhatsApp! Me informe os produtos desejados e eu processo tudo para você.",
    confidence: 97
  }
]

const integrationNodes = [
  { name: "WhatsApp", icon: WhatsAppIcon, color: "#25D366" },
  { name: "IA Agent", icon: BotIcon, color: "#3B82F6" },
  { name: "Leads", icon: TrendingUpIcon, color: "#8B5CF6" },
  { name: "Vendas", icon: BarChart3Icon, color: "#10B981" },
]

const features = [
  {
    Icon: WhatsAppIcon,
    name: "WhatsApp Business",
    description: "Conecte múltiplas contas do WhatsApp Business e gerencie todas as conversas em um só lugar.",
    href: "#",
    cta: "Conectar WhatsApp",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 flex flex-col justify-center p-4">
        <Marquee
          pauseOnHover
          className="[--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)]"
        >
          {whatsappMessages.map((msg, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-3 mx-2",
                "border-gray-200/50 bg-white/80 hover:bg-white/90",
                "dark:border-gray-700/50 dark:bg-gray-800/80 dark:hover:bg-gray-800/90",
                "backdrop-blur-sm transition-all duration-300"
              )}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <WhatsAppIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {msg.name}
                    </p>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {msg.message}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      msg.status === "read" ? "bg-blue-500" : "bg-gray-400"
                    )} />
                    <span className="text-xs text-gray-500 ml-1 capitalize">{msg.status}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </Marquee>
      </div>
    ),
  },
  {
    Icon: BotIcon,
    name: "Agente de IA",
    description: "IA avançada que responde clientes 24/7, qualifica leads e agenda reuniões automaticamente.",
    href: "#",
    cta: "Configurar IA",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="absolute inset-0 p-4 overflow-hidden">
        <div className="space-y-3 h-full overflow-y-auto">
          {aiResponses.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.5 }}
              className="bg-white/10 dark:bg-gray-800/30 rounded-lg p-3 backdrop-blur-sm"
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <BotIcon className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {item.question}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.response}
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{item.confidence}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    Icon: Share2Icon,
    name: "Integrações",
    description: "Conecte WhatsApp, IA, leads e vendas em um fluxo automatizado e inteligente.",
    href: "#",
    cta: "Ver Integrações",
    className: "col-span-3 lg:col-span-2",
    background: (
      <AnimatedBeamIntegration className="absolute right-2 top-4 h-[300px] border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
    ),
  },
  {
    Icon: TrendingUpIcon,
    name: "Analytics & Vendas",
    description: "Acompanhe leads, conversões e vendas em tempo real com dashboards inteligentes.",
    className: "col-span-3 lg:col-span-1",
    href: "#",
    cta: "Ver Relatórios",
    background: (
      <div className="absolute inset-0 p-4 flex flex-col justify-center">
        <div className="space-y-3">
          {leadStats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="bg-white/10 dark:bg-gray-800/30 rounded-lg p-3 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  stat.change.startsWith('+')
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {stat.change}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
]

export function SiteBentoSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20 relative" style={{ perspective: "1000px" }}>
      <div className="container mx-auto px-4" style={{ transform: "translateZ(0)", willChange: "transform" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
          style={{ transform: "translateZ(0.1px)", willChange: "transform" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Share2Icon className="w-4 h-4" />
            Plataforma Completa
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Tudo que você precisa para
            <span className="text-primary"> vender mais</span> no WhatsApp
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Uma plataforma completa que integra WhatsApp Business, IA avançada,
            gerenciamento de leads e analytics para maximizar suas vendas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <BentoGrid className="max-w-7xl mx-auto">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <BentoCard {...feature} />
              </motion.div>
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  )
}