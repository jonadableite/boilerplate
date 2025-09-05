'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import { Badge } from './badge'

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning'
  label: string
  className?: string
}

const statusVariants = {
  active: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
  pending:
    'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
  success:
    'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
  error: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  warning:
    'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
}

export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, label, className, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn(
          'transition-colors duration-200',
          statusVariants[status],
          className,
        )}
        {...props}
      >
        {label}
      </Badge>
    )
  },
)
StatusBadge.displayName = 'StatusBadge'
