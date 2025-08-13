import { WifiOff, RefreshCw } from 'lucide-react'
import { EmptyState } from '../EmptyState'

interface OfflineEmptyStateProps {
  onRetry?: () => void
  showCachedContent?: boolean
  onViewCached?: () => void
}

export function OfflineEmptyState({
  onRetry,
  showCachedContent,
  onViewCached
}: OfflineEmptyStateProps) {
  return (
    <EmptyState
      icon={WifiOff}
      iconClassName="text-gray-400"
      title="You're offline"
      description="Please check your internet connection to load new content"
      action={
        onRetry
          ? {
              label: 'Try again',
              onClick: onRetry,
              variant: 'default'
            }
          : undefined
      }
      secondaryAction={
        showCachedContent && onViewCached
          ? {
              label: 'View cached content',
              onClick: onViewCached,
              variant: 'outline'
            }
          : undefined
      }
    >
      <div className="mt-4 text-sm text-gray-500">
        <p>You can still:</p>
        <ul className="mt-2 space-y-1">
          <li>• View previously loaded content</li>
          <li>• Access your bookmarks</li>
          <li>• Read downloaded articles</li>
        </ul>
      </div>
    </EmptyState>
  )
}