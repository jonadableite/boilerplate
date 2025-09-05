'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import { Button } from './button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  variant?: 'view' | 'edit' | 'delete' | 'success' | 'ghost' | 'default'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

const variantStyles = {
  view: 'hover:bg-blue-50 hover:text-blue-600 text-blue-500',
  edit: 'hover:bg-yellow-50 hover:text-yellow-600 text-yellow-500',
  delete: 'hover:bg-red-50 hover:text-red-600 text-red-500',
  success: 'hover:bg-green-50 hover:text-green-600 text-green-500',
  ghost: 'hover:bg-gray-50 hover:text-gray-600 text-gray-500',
  default: 'hover:bg-primary/10 hover:text-primary text-muted-foreground',
}

const sizeStyles = {
  sm: 'h-7 w-7 p-0',
  md: 'h-8 w-8 p-0',
  lg: 'h-9 w-9 p-0',
}

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(
  (
    {
      icon: Icon,
      label,
      onClick,
      variant = 'default',
      size = 'md',
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={ref}
              variant="ghost"
              onClick={onClick}
              disabled={disabled}
              className={cn(
                'transition-colors duration-200',
                sizeStyles[size],
                variantStyles[variant],
                className,
              )}
              {...props}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  },
)
ActionButton.displayName = 'ActionButton'
