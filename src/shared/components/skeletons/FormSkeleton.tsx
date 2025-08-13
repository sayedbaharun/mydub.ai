import { Skeleton } from './Skeleton'

interface FormSkeletonProps {
  fields?: number
  showTitle?: boolean
  showDescription?: boolean
}

export function FormSkeleton({ 
  fields = 4,
  showTitle = true,
  showDescription = true 
}: FormSkeletonProps) {
  return (
    <div className="space-y-6">
      {showTitle && (
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          {showDescription && (
            <Skeleton className="h-4 w-full max-w-md" />
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            {/* Label */}
            <Skeleton className="h-4 w-24" />
            {/* Input */}
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      {/* Submit button */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}