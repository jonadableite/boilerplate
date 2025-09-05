'use client'

import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hover = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.25, 0, 1],
      }}
      whileHover={
        hover
          ? {
            y: -5,
            transition: { duration: 0.2 },
          }
          : undefined
      }
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedCardHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-between space-y-0 p-6 pb-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function AnimatedCardContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>
}

export function AnimatedCardTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('text-sm font-medium tracking-tight', className)}>
      {children}
    </h3>
  )
}
