'use client'

import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface GradientBackgroundProps {
  children: ReactNode
  className?: string
  variant?:
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
}

const gradientVariants = {
  primary: 'from-blue-500/20 via-purple-500/20 to-pink-500/20',
  secondary: 'from-gray-500/20 via-slate-500/20 to-zinc-500/20',
  accent: 'from-violet-500/20 via-indigo-500/20 to-blue-500/20',
  success: 'from-green-500/20 via-emerald-500/20 to-teal-500/20',
  warning: 'from-yellow-500/20 via-orange-500/20 to-red-500/20',
  danger: 'from-red-500/20 via-pink-500/20 to-rose-500/20',
}

export function GradientBackground({
  children,
  className,
  variant = 'primary',
}: GradientBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Animated gradient background */}
      <motion.div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-50',
          gradientVariants[variant],
        )}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-xl"
        animate={{
          x: [0, 10, 0],
          y: [0, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-xl"
        animate={{
          x: [0, -15, 0],
          y: [0, 15, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function GlowEffect({
  children,
  className,
  color = 'blue',
}: {
  children: ReactNode
  className?: string
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red'
}) {
  const glowColors = {
    blue: 'shadow-blue-500/25',
    purple: 'shadow-purple-500/25',
    green: 'shadow-green-500/25',
    orange: 'shadow-orange-500/25',
    red: 'shadow-red-500/25',
  }

  return (
    <motion.div
      className={cn('relative', className)}
      whileHover={{
        boxShadow: `0 0 30px var(--${color}-500)`,
      }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          glowColors[color],
        )}
      />
      {children}
    </motion.div>
  )
}
