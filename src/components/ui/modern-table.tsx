'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface ModernTableProps {
  children: ReactNode
  className?: string
}

export function ModernTable({ children, className }: ModernTableProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent',
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </motion.div>
  )
}

export function ModernTableHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <thead className={cn('border-b border-border/50 bg-muted/30', className)}>
      {children}
    </thead>
  )
}

export function ModernTableBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <tbody className={cn('divide-y divide-border/30', className)}>
      {children}
    </tbody>
  )
}

export function ModernTableRow({
  children,
  className,
  index = 0,
}: {
  children: ReactNode
  className?: string
  index?: number
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.25, 0, 1],
      }}
      whileHover={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        transition: { duration: 0.2 },
      }}
      className={cn('group transition-colors hover:bg-muted/30', className)}
    >
      {children}
    </motion.tr>
  )
}

export function ModernTableHead({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        'px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
        'bg-gradient-to-r from-transparent via-muted/20 to-transparent',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function ModernTableCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <td
      className={cn(
        'px-6 py-4 text-sm text-foreground group-hover:text-foreground/90 transition-colors',
        className,
      )}
    >
      {children}
    </td>
  )
}

// Status Badge Component
export function StatusBadge({
  status,
  className,
}: {
  status: 'active' | 'inactive' | 'pending'
  className?: string
}) {
  const variants = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    inactive: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }

  const labels = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
  }

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        'backdrop-blur-sm',
        variants[status],
        className,
      )}
    >
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {labels[status]}
    </motion.span>
  )
}

// Action Button Component
export function ActionButton({
  children,
  onClick,
  variant = 'default',
  className,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger' | 'success'
  className?: string
}) {
  const variants = {
    default: 'hover:bg-primary/10 hover:text-primary border-border/50',
    danger: 'hover:bg-red-500/10 hover:text-red-400 border-red-500/30',
    success: 'hover:bg-green-500/10 hover:text-green-400 border-green-500/30',
  }

  return (
    <motion.button
      whileHover={{ 
        scale: 1.05,
        backgroundColor: variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : variant === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(var(--primary), 0.1)'
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border',
        'backdrop-blur-sm transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        variants[variant],
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
