import { cn } from '@/utils/cn'

interface CalloutProps {
  icon?: string
  children?: React.ReactNode
  type?: 'default' | 'warning' | 'danger'
}

export function Callout({
  children,
  icon,
  type = 'default',
  ...props
}: CalloutProps) {
  return (
    <div
      className={cn(
        'my-6 flex items-start rounded-md border border-l-4 p-4 space-y-0',
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn([
            'mr-4 text-2xl',
            type === 'default' && 'text-primary',
            type === 'warning' && 'text-warning',
            type === 'danger' && 'text-danger',
          ])}
        >
          {icon}
        </span>
      )}
      <div className="[&>p]:last:mb-0">{children}</div>
    </div>
  )
}
