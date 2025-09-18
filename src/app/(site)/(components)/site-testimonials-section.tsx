'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/utils/cn'
import { MessageCircleHeart, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import Marquee from '@/components/magicui/marquee'
import { BorderBeam } from '@/components/magicui/border-beam'

const testimonials = [
  {
    title: 'Resultados Impressionantes',
    content:
      'Desde que começamos a usar esta plataforma, nossos disparos em massa no WhatsApp aumentaram nossa conversão em 300%. O sistema de aquecimento evitou qualquer banimento.',
    author: 'Carlos Silva',
    role: 'CEO, E-commerce Brasil',
    avatar: 'CS',
    rating: 5,
    company: 'Loja Virtual Plus',
  },
  {
    title: 'IA que Realmente Funciona',
    content:
      'O agente de IA responde nossos clientes 24/7 com uma precisão incrível. Conseguimos reduzir 80% do tempo de atendimento manual e aumentar a satisfação dos clientes.',
    author: 'Marina Santos',
    role: 'Diretora de Marketing',
    avatar: 'MS',
    rating: 5,
    company: 'Consultoria Digital',
  },
  {
    title: 'Gerenciamento Completo',
    content:
      'A plataforma centraliza todos nossos contatos, campanhas e métricas. O dashboard de saúde da conta nos dá total controle sobre nossos números do WhatsApp.',
    author: 'Roberto Oliveira',
    role: 'Gerente de Vendas',
    avatar: 'RO',
    rating: 5,
    company: 'Imobiliária Prime',
  },
  {
    title: 'Suporte Excepcional',
    content:
      'Equipe brasileira que entende nossas necessidades. Implementação rápida e suporte técnico sempre disponível. Melhor investimento que fizemos este ano.',
    author: 'Ana Paula Costa',
    role: 'Fundadora',
    avatar: 'AC',
    rating: 5,
    company: 'Startup Inovação',
  },
  {
    title: 'Automação Inteligente',
    content:
      'Os fluxos automatizados economizam horas do nosso time. A segmentação avançada permite campanhas super direcionadas com resultados excepcionais.',
    author: 'Pedro Henrique',
    role: 'Diretor Comercial',
    avatar: 'PH',
    rating: 5,
    company: 'Tech Solutions',
  },
  {
    title: 'ROI Comprovado',
    content:
      'Em 3 meses recuperamos o investimento. A plataforma se pagou sozinha com o aumento nas vendas via WhatsApp. Recomendo para qualquer empresa.',
    author: 'Juliana Ferreira',
    role: 'CMO',
    avatar: 'JF',
    rating: 5,
    company: 'Marketing Pro',
  },
]

const firstRow = testimonials.slice(0, testimonials.length / 2)
const secondRow = testimonials.slice(testimonials.length / 2)

const TestimonialCard = ({
  title,
  content,
  author,
  role,
  avatar,
  rating,
  company,
}: {
  title: string
  content: string
  author: string
  role: string
  avatar: string
  rating: number
  company: string
}) => {
  return (
    <figure
      className={cn(
        'relative h-full w-fit sm:w-72 cursor-pointer overflow-hidden rounded-xl border p-4',
        // light styles
        'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
        // dark styles
        'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]',
      )}
    >
      <BorderBeam size={250} duration={12} delay={0} />
      <div className="flex flex-row items-center gap-2 mb-3">
        <Avatar className="size-8 rounded-full">
          <AvatarImage src="" />
          <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/20 to-primary/10">
            {avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {author}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{role}</p>
        </div>
      </div>

      <div className="flex mb-2 gap-0.5">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="size-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <h3 className="font-bold text-sm mb-2 text-primary">{title}</h3>

      <blockquote className="text-sm leading-relaxed text-muted-foreground">
        {content}
      </blockquote>

      <p className="text-xs text-primary/60 mt-2 font-medium">{company}</p>
    </figure>
  )
}

export const SiteTestimonialsSection = ({
  className,
}: {
  className?: string
}) => {
  return (
    <div className={cn('w-full py-32 relative overflow-hidden', className)}>
      {/* Removendo todos os backgrounds para deixar transparente */}

      <div className="container max-w-screen-xl mx-auto px-4 relative z-10">
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <motion.div
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0, rotate: -10 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", bounce: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <MessageCircleHeart
                className="size-14 stroke-2 text-primary mr-4 drop-shadow-lg"
                fill="currentColor"
                fillOpacity={0.2}
              />
              <div className="absolute -top-1 -right-1 size-4 bg-primary/20 rounded-full animate-pulse" />
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + i * 0.1,
                    type: "spring",
                    bounce: 0.6
                  }}
                  viewport={{ once: true }}
                >
                  <Star className="size-6 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.h2
            className="mx-auto w-full max-w-5xl mb-6 text-balance text-center text-3xl font-bold !leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Mais de 10.000 empresas brasileiras <br />
            <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
              confiam em nossa plataforma
            </span>
          </motion.h2>

          <motion.p
            className="mx-auto max-w-3xl text-center text-xl text-muted-foreground/90 mb-20 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Veja como nossos clientes estão revolucionando suas vendas com
            WhatsApp Marketing e automação inteligente
          </motion.p>

          {/* Enhanced Marquee with 3D perspective similar to the example */}
          <div className="relative flex h-96 w-full flex-row items-center justify-center gap-4 overflow-hidden [perspective:300px]">
            <div
              className="flex flex-row items-center gap-4"
              style={{
                transform: 'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
              }}
            >
              <Marquee pauseOnHover vertical className="[--duration:20s]">
                {firstRow.map((testimonial) => (
                  <TestimonialCard key={testimonial.author} {...testimonial} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:20s]"
                vertical
              >
                {secondRow.map((testimonial) => (
                  <TestimonialCard key={testimonial.author} {...testimonial} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:20s]"
                vertical
              >
                {firstRow.map((testimonial) => (
                  <TestimonialCard key={testimonial.author} {...testimonial} />
                ))}
              </Marquee>
              <Marquee pauseOnHover className="[--duration:20s]" vertical>
                {secondRow.map((testimonial) => (
                  <TestimonialCard key={testimonial.author} {...testimonial} />
                ))}
              </Marquee>
            </div>

            {/* Gradient overlays for fade effect like in the example */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background"></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
          </div>

          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-full border border-primary/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="size-5 fill-yellow-400 text-yellow-400 drop-shadow-sm"
                  />
                ))}
              </div>
              <span className="text-base font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                4.9/5 baseado em 2.847 avaliações
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
