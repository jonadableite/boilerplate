'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SITE_FAQ_ITEMS } from '@/content/site/site-faq-items'
import { cn } from '@/utils/cn'
import { HelpCircleIcon, CheckCircle2Icon, ShieldCheckIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { MagicCard } from '@/components/magicui/magic-card'
import { BorderBeam } from '@/components/magicui/border-beam'

export const SiteFaqSection = ({ className }: { className?: string }) => (
  <div className={cn('w-full space-y-16 py-16', className)}>
    <motion.div
      className="container max-w-screen-md mx-auto flex gap-4 flex-col items-center text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      {/* Badge de Confiança */}
      <motion.div
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full text-sm font-medium text-green-700 dark:text-green-300 mb-4"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
      >
        <ShieldCheckIcon className="size-4" />
        Compliance LGPD & WhatsApp Business
      </motion.div>

      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <HelpCircleIcon
          className="size-12 mb-6 stroke-2 mx-auto text-primary relative z-10"
          fill="currentColor"
          fillOpacity={0.15}
        />
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      </motion.div>

      <motion.h4
        className="mx-auto w-full max-w-xl text-balance text-center text-3xl font-bold !leading-[1.2] tracking-tight sm:text-4xl md:text-5xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Perguntas
        </span>{' '}
        <br />
        Frequentes
      </motion.h4>

      <motion.p
        className="text-muted-foreground text-lg max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        viewport={{ once: true }}
      >
        Tire suas dúvidas sobre WhatsApp Business, compliance e nossa plataforma
      </motion.p>
    </motion.div>

    <motion.div
      className="container mx-auto max-w-screen-md"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      viewport={{ once: true }}
    >
      <MagicCard className="relative overflow-hidden bg-background/50 backdrop-blur-sm border-0">
        <BorderBeam size={250} duration={12} delay={9} />

        <Accordion type="single" collapsible className="w-full">
          {SITE_FAQ_ITEMS.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <AccordionItem
                value={'index-' + index}
                className="bg-transparent border-border/50 hover:bg-secondary/30 transition-colors duration-200"
              >
                <AccordionTrigger className="text-left hover:no-underline px-6 py-4 text-base font-semibold">
                  <div className="flex items-start gap-3">
                    <CheckCircle2Icon className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    {item.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  <div className="pl-8">{item.answer}</div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </MagicCard>
    </motion.div>

    {/* Indicadores de Confiança */}
    <motion.div
      className="container mx-auto max-w-screen-md"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <motion.div
          className="flex flex-col items-center gap-2 p-4"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="size-12 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <h5 className="font-semibold">100% Seguro</h5>
          <p className="text-sm text-muted-foreground">
            Compliance total com WhatsApp e LGPD
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-2 p-4"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="size-12 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
            <HelpCircleIcon className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h5 className="font-semibold">Suporte 24/7</h5>
          <p className="text-sm text-muted-foreground">
            Equipe especializada em português
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-2 p-4"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="size-12 bg-purple-100 dark:bg-purple-950/30 rounded-full flex items-center justify-center">
            <CheckCircle2Icon className="size-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h5 className="font-semibold">Teste Grátis</h5>
          <p className="text-sm text-muted-foreground">
            7 dias sem compromisso
          </p>
        </motion.div>
      </div>
    </motion.div>
  </div>
)
