import { Skeleton } from './Skeleton'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: TableSkeletonProps) {
  return (
    <div className="w-full">
      <div className="border rounded-lg overflow-hidden">
        {showHeader && (
          <div className="bg-gray-50 dark:bg-gray-800 border-b">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="px-6 py-3">
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
              key={rowIndex}
              className="grid" 
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="px-6 py-4">
                  <Skeleton 
                    className="h-4" 
                    style={{ width: `${70 + Math.random() * 30}%` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}