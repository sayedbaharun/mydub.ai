import { Skeleton } from './Skeleton'
import { cn } from '@/shared/lib/utils'

interface ListItemSkeletonProps {
  showAvatar?: boolean
  showIcon?: boolean
  lines?: number
  className?: string
}

export function ListItemSkeleton({ 
  showAvatar = false,
  showIcon = false,
  lines = 2,
  className 
}: ListItemSkeletonProps) {
  return (
    <div className={cn("flex items-start gap-4 p-4", className)}>
      {showAvatar && (
        <Skeleton className="h-10 w-10 flex-shrink-0" variant="circular" />
      )}
      
      {showIcon && !showAvatar && (
        <Skeleton className="h-6 w-6 flex-shrink-0" />
      )}
      
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        {lines > 1 && (
          <>
            {Array.from({ length: lines - 1 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-4" 
                style={{ width: `${85 - (i * 10)}%` }}
              />
            ))}
          </>
        )}
      </div>
      
      <Skeleton className="h-4 w-16 flex-shrink-0" />
    </div>
  )
}