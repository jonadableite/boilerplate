'use client'

import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const logos = [
  'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418af3b2b766cebaba02d_client-logo-01.svg',
  'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418ce6a0062cf2d279e35_client-logo-02.svg',
  'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418ce9f1b45e141bf28b5_client-logo-03.svg',
  'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418ce2c404b364300ba31_client-logo-04.svg',
  'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418cea9dabe252e43b0c0_client-logo-07.svg',
  'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418cea9dabef95143b0c1_client-logo-06.svg',
]

export const SiteLogoShowcase = ({ className }: { className?: string }) => {
  return (
    <div className={cn('relative w-full py-16 overflow-hidden', className)}>
      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-background" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />

      {/* Container de rolagem infinita */}
      <div className="relative flex overflow-hidden">
        {/* Gradientes laterais para efeito de fade */}
        <div className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />

        {/* Primeira sequência de logos */}
        <motion.div
          className="flex items-center gap-12 pr-12"
          animate={{
            x: [0, -100 * logos.length],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {logos.map((logo, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 flex items-center justify-center w-32 h-16 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg"
              whileHover={{ scale: 1.05 }}
              animate={{
                y: [0, -5, 0],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.3,
              }}
            >
              <img
                src={logo}
                alt={`Client ${index + 1}`}
                className="w-full h-full object-contain opacity-80 dark:invert invert-0"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Segunda sequência de logos (para continuidade) */}
        <motion.div
          className="flex items-center gap-12 pr-12"
          animate={{
            x: [0, -100 * logos.length],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {logos.map((logo, index) => (
            <motion.div
              key={`duplicate-${index}`}
              className="flex-shrink-0 flex items-center justify-center w-32 h-16 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg"
              whileHover={{ scale: 1.05 }}
              animate={{
                y: [0, -5, 0],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.3,
              }}
            >
              <img
                src={logo}
                alt={`Client ${index + 1}`}
                className="w-full h-full object-contain opacity-80 dark:invert invert-0"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
