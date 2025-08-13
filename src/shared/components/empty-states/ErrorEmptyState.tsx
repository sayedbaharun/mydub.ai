import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { EmptyState } from '../EmptyState'

interface ErrorEmptyStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  onGoHome?: () => void
  errorCode?: string
}

export function ErrorEmptyState({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content. Please try again.',
  onRetry,
  onGoHome,
  errorCode
}: ErrorEmptyStateProps) {
  return (
    <EmptyState
      icon={AlertCircle}
      iconClassName="text-red-500"
      title={title}
      description={description}
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
        onGoHome
          ? {
              label: 'Go to homepage',
              onClick: onGoHome,
              variant: 'outline'
            }
          : undefined
      }
    >
      {errorCode && (
        <p className="text-xs text-gray-400 mt-4">
          Error code: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{errorCode}</code>
        </p>
      )}
    </EmptyState>
  )
}