import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  iconClassName?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  }
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeConfig = {
    sm: {
      container: 'py-8',
      icon: 'h-10 w-10',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-2'
    },
    md: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-3'
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-4'
    }
  }

  const config = sizeConfig[size]

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      config.container,
      className
    )}>
      <div className={cn('mx-auto', config.spacing)}>
        {Icon && (
          <div className="mx-auto mb-4">
            <div className={cn(
              'rounded-full bg-gray-100 dark:bg-gray-800 p-3 mx-auto w-fit',
              size === 'lg' && 'p-4'
            )}>
              <Icon className={cn(
                config.icon,
                'text-gray-400 dark:text-gray-500',
                iconClassName
              )} />
            </div>
          </div>
        )}
        
        <h3 className={cn(
          'font-semibold text-gray-900 dark:text-gray-100',
          config.title
        )}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            'text-gray-500 dark:text-gray-400 max-w-md mx-auto',
            config.description
          )}>
            {description}
          </p>
        )}
        
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
        
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
                size={size === 'sm' ? 'sm' : 'default'}
              >
                {action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || 'outline'}
                size={size === 'sm' ? 'sm' : 'default'}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}