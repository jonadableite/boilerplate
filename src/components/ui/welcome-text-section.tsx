'use client'

import { motion } from 'motion/react'
import { LayoutTextFlip } from '@/components/ui/layout-text-flip'

export function WelcomeTextSection() {
  return (
    <div className="relative z-10 flex items-center justify-center w-full h-full">
      <div className="flex flex-col items-center justify-center text-center">
        <motion.div className="relative mx-4 my-4 flex flex-col items-center justify-center gap-4 text-center sm:mx-0 sm:mb-0 sm:flex-row">
          <LayoutTextFlip
            text="Bem-vindo ao "
            words={['WhatLeads', 'Futuro', 'Sucesso']}
          />
        </motion.div>
        <p className="mt-4 text-center text-base text-neutral-600 dark:text-neutral-400">
          Transforme seus leads em oportunidades reais de negócio
        </p>
      </div>
    </div>
  )
}
