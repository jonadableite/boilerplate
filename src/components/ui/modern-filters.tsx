'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { ReactNode, useState } from 'react'
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react'

interface ModernFiltersProps {
  children: ReactNode
  className?: string
}

export function ModernFilters({ children, className }: ModernFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.25, 0, 1] }}
      className={cn(
        'flex flex-col sm:flex-row gap-4 p-6 rounded-xl border bg-card/50 backdrop-blur-sm',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/5 before:to-transparent before:rounded-xl',
        'relative overflow-hidden',
        className,
      )}
    >
      {/* Subtle animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 100%',
        }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full">
        {children}
      </div>
    </motion.div>
  )
}

export function SearchInput({
  placeholder = 'Buscar agentes...',
  value,
  onChange,
  className,
}: {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={cn('relative flex-1 min-w-0', className)}>
      <motion.div
        className="relative"
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <IconSearch
          className={cn(
            'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200',
            isFocused ? 'text-primary' : 'text-muted-foreground',
          )}
        />

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background/50 backdrop-blur-sm',
            'text-sm placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
            'transition-all duration-200',
            isFocused && 'bg-background/80',
          )}
        />

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <IconX className="w-3 h-3 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>

      <motion.select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        whileFocus={{ scale: 1.02 }}
        whileHover={{ scale: 1.01 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'px-3 py-2.5 rounded-lg border bg-background/50 backdrop-blur-sm',
          'text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
          'transition-all duration-200 min-w-[120px]',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </motion.select>
    </div>
  )
}

export function FilterButton({
  children,
  active = false,
  onClick,
  className,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium',
        'backdrop-blur-sm transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        active
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'bg-background/50 text-muted-foreground border-border/50 hover:bg-muted/30',
        className,
      )}
    >
      <IconFilter className="w-4 h-4" />
      {children}
    </motion.button>
  )
}

export function FilterChip({
  label,
  onRemove,
  className,
}: {
  label: string
  onRemove: () => void
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -20 }}
      transition={{ duration: 0.2 }}
      layout
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
        'bg-primary/10 text-primary border border-primary/30 backdrop-blur-sm',
        className,
      )}
    >
      {label}
      <motion.button
        whileHover={{ scale: 1.2, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.1 }}
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
      >
        <IconX className="w-3 h-3" />
      </motion.button>
    </motion.div>
  )
}
