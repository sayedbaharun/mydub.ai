import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from './Skeleton'

interface ContentCardSkeletonProps {
  showImage?: boolean
  showDescription?: boolean
  lines?: number
}

export function ContentCardSkeleton({ 
  showImage = true, 
  showDescription = true,
  lines = 3 
}: ContentCardSkeletonProps) {
  return (
    <Card className="overflow-hidden">
      {showImage && (
        <Skeleton className="h-48 w-full" variant="rectangular" />
      )}
      
      <CardContent className="p-6">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 mb-3" />
        
        {showDescription && (
          <div className="space-y-2 mb-4">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-4" 
                style={{ width: `${100 - (i * 15)}%` }}
              />
            ))}
          </div>
        )}
        
        {/* Action or meta info */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}