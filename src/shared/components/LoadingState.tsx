import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface LoadingStateProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ 
  message = "Loading...", 
  className,
  size = 'md' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      <div className="relative">
        <Loader2 className={cn(
          "animate-spin text-ai-blue",
          sizeClasses[size]
        )} />
        <div className="absolute inset-0 animate-ping">
          <div className={cn(
            "rounded-full bg-ai-blue/20",
            sizeClasses[size]
          )} />
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600 font-medium">{message}</p>
    </div>
  )
} 