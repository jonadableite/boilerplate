'use client'

import { Link } from 'next-view-transitions'
import { motion } from 'framer-motion'

import { RainbowButton } from '@/components/magicui/rainbow-button'
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  BotIcon,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { BorderBeam } from '@/components/magicui/border-beam'
import { HeroVideoDialog } from '@/components/magicui/hero-video-dialog'
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text'
import { AuroraText } from '@/components/magicui/aurora-text'
export function MainHeroSection() {
  return (
    <>
      <main className="pt-16 pb-16 relative overflow-hidden">
        {/* Background gradient - mesclado suavemente */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-blue-50/30 to-emerald-50/40 dark:from-green-950/15 dark:via-blue-950/10 dark:to-emerald-950/15" />

        {/* Gradiente adicional para transição suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/20 to-blue-50/30 dark:from-transparent dark:via-green-950/10 dark:to-blue-950/15" />

        <section className="relative z-10">
          <div className="relative mx-auto max-w-screen-lg mb-16">
            <div className="relative z-10 mx-auto max-w-screen-md flex flex-col items-center text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
                className="z-10 flex items-center justify-center"
              >
                <div
                  className={cn(
                    'group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800',
                  )}
                >
                  <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                    <span>✨ WhatsApp Marketing Profissional</span>
                    <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                  </AnimatedShinyText>
                </div>
              </motion.div>

              {/* Main heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                className="text-balance text-4xl sm:text-5xl lg:text-6xl font-bold max-w-[95%] mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent text-center"
              >
                Revolucione seu{' '}
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3,
                    ease: 'easeOut',
                    type: 'spring',
                    stiffness: 100
                  }}
                  className="relative inline-block"
                  style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 50%, #25D366 100%)',
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'whatsapp-glow 3s ease-in-out infinite alternate'
                  }}
                >
                  WhatsApp Business
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-[#25D366]/20 via-[#128C7E]/30 to-[#25D366]/20 rounded-lg blur-lg opacity-75"
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                      scale: [0.95, 1.05, 0.95],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </motion.span>
                {' '}com{' '}
                <AuroraText>IA</AuroraText>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mb-8 text-lg text-muted-foreground max-w-[80%] leading-relaxed"
              >
                Disparos em massa, gerenciamento inteligente de leads, agente de
                IA avançado e aquecimento automático para evitar banimentos.
                Tudo em uma plataforma completa.
              </motion.p>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4 text-green-500" />
                  <span>Disparos em Massa</span>
                </div>
                <div className="flex items-center gap-2">
                  <BotIcon className="w-4 h-4 text-blue-500" />
                  <span>Agente de IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-purple-500" />
                  <span>Anti-Banimento</span>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <RainbowButton className="px-8 py-6 text-lg font-semibold rounded-full">
                  <Link href="/auth" className="flex items-center">
                    <span>Começar Gratuitamente</span>
                    <ArrowRightIcon className="ml-2 size-5" />
                  </Link>
                </RainbowButton>

                <RainbowButton
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold rounded-full"
                >
                  <Link href="/contact" className="flex items-center">
                    <span>Agendar Demonstração</span>
                    <ArrowUpRightIcon className="w-5 h-5 ml-2" />
                  </Link>
                </RainbowButton>
              </motion.div>

              {/* Trust indicators */}
              {/* <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="mt-12 text-center"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  Confiado por mais de 1.000+ empresas brasileiras
                </p>
                <div className="flex justify-center items-center gap-8 opacity-60">
                  <div className="text-xs font-medium">⭐ 4.9/5 Avaliação</div>
                  <div className="text-xs font-medium">🚀 +500% ROI Médio</div>
                  <div className="text-xs font-medium">🛡️ 99.9% Uptime</div>
                </div>
              </motion.div> */}
            </div>
          </div>

          {/* Screenshot Section */}
          <div className="relative mx-auto max-w-screen-lg">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-4xl">
                {/* Glow effect mesclado com o background principal */}
                <div className="absolute inset-0 -m-16 bg-gradient-radial from-green-400/20 via-blue-400/15 to-emerald-400/10 blur-3xl opacity-60" />
                <div className="absolute inset-0 -m-20 bg-gradient-radial from-blue-300/15 via-green-300/10 to-cyan-300/8 blur-2xl opacity-40" />
                <div className="absolute inset-0 -m-24 bg-gradient-radial from-emerald-400/12 via-cyan-400/8 to-green-400/6 blur-xl opacity-30" />

                <div className="relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-sm shadow-2xl">
                  <BorderBeam size={250} duration={12} delay={9} />
                  <HeroVideoDialog
                    className="block dark:hidden"
                    animationStyle="from-center"
                    videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                    thumbnailSrc="/screenshots/screenshot-01-light.png"
                    thumbnailAlt="Dashboard Preview - Modo Claro"
                  />
                  <HeroVideoDialog
                    className="hidden dark:block"
                    animationStyle="from-center"
                    videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                    thumbnailSrc="/screenshots/screenshot-01-dark.jpeg"
                    thumbnailAlt="Dashboard Preview - Modo Escuro"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  )
}
