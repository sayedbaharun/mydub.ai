import { Search, Filter } from 'lucide-react'
import { EmptyState } from '../EmptyState'

interface NoResultsEmptyStateProps {
  searchQuery?: string
  onClearFilters?: () => void
  onNewSearch?: () => void
  suggestions?: string[]
}

export function NoResultsEmptyState({
  searchQuery,
  onClearFilters,
  onNewSearch,
  suggestions = []
}: NoResultsEmptyStateProps) {
  return (
    <EmptyState
      icon={Search}
      title={searchQuery ? `No results for "${searchQuery}"` : 'No results found'}
      description={
        searchQuery 
          ? 'Try adjusting your search terms or clearing filters'
          : 'Try adjusting your filters or search criteria'
      }
      action={
        onClearFilters
          ? {
              label: 'Clear all filters',
              onClick: onClearFilters,
              variant: 'default'
            }
          : undefined
      }
      secondaryAction={
        onNewSearch
          ? {
              label: 'Start new search',
              onClick: onNewSearch,
              variant: 'outline'
            }
          : undefined
      }
    >
      {suggestions.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onNewSearch && onNewSearch()}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </EmptyState>
  )
}