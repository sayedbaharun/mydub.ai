import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from './Skeleton'

interface NewsArticleCardSkeletonProps {
  variant?: 'default' | 'clean' | 'compact'
}

export function NewsArticleCardSkeleton({ variant = 'default' }: NewsArticleCardSkeletonProps) {
  if (variant === 'clean') {
    return (
      <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm">
        <div className="relative">
          {/* Image skeleton */}
          <Skeleton className="h-48 w-full" variant="rectangular" />
          
          <CardContent className="p-6">
            {/* Title skeleton */}
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2 mb-4" />
            
            {/* Description skeleton */}
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6 mb-4" />
            
            {/* Meta info skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex gap-4 p-4 border-b">
        {/* Thumbnail skeleton */}
        <Skeleton className="h-20 w-20 flex-shrink-0" />
        
        <div className="flex-1 space-y-2">
          {/* Title skeleton */}
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          
          {/* Meta skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full" variant="rectangular" />
      
      <CardContent className="p-4">
        {/* Category badge skeleton */}
        <Skeleton className="h-6 w-20 mb-3" />
        
        {/* Title skeleton */}
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-3/4 mb-3" />
        
        {/* Description skeleton */}
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6 mb-4" />
        
        {/* Author and date skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" variant="circular" />
            <div>
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}