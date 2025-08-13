import { useState, useEffect, useRef } from 'react'
import { Search, Clock, TrendingUp, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from './ui/button'

interface SearchSuggestion {
  id: string
  text: string
  type: 'recent' | 'trending' | 'suggestion'
  count?: number
  timestamp?: string
}

interface SearchSuggestionsProps {
  query: string
  isOpen: boolean
  onSelect: (suggestion: string) => void
  onClose: () => void
  recentSearches?: string[]
  trendingSearches?: SearchSuggestion[]
  suggestions?: SearchSuggestion[]
  className?: string
  maxSuggestions?: number
  onClearRecent?: () => void
}

export function SearchSuggestions({
  query,
  isOpen,
  onSelect,
  onClose,
  recentSearches = [],
  trendingSearches = [],
  suggestions = [],
  className,
  maxSuggestions = 8,
  onClearRecent
}: SearchSuggestionsProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Combine all suggestions
  const allSuggestions: SearchSuggestion[] = [
    ...recentSearches.slice(0, 3).map((text, index) => ({
      id: `recent-${index}`,
      text,
      type: 'recent' as const
    })),
    ...suggestions.slice(0, maxSuggestions),
    ...(!query && trendingSearches.length > 0 ? trendingSearches.slice(0, 5) : [])
  ]

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev < allSuggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : allSuggestions.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < allSuggestions.length) {
            onSelect(allSuggestions[highlightedIndex].text)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, allSuggestions, onSelect, onClose])

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [query, isOpen])

  if (!isOpen || allSuggestions.length === 0) return null

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  const getSectionTitle = () => {
    if (query) return 'Suggestions'
    if (recentSearches.length > 0) return 'Recent searches'
    if (trendingSearches.length > 0) return 'Trending searches'
    return 'Popular searches'
  }

  return (
    <div 
      ref={suggestionsRef}
      className={cn(
        'absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50',
        className
      )}
    >
      <div className="max-h-96 overflow-y-auto">
        {/* Section header */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">{getSectionTitle()}</span>
          {recentSearches.length > 0 && !query && onClearRecent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearRecent}
              className="text-xs text-gray-500 hover:text-gray-700 h-auto py-1 px-2"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Suggestions list */}
        <div className="py-2">
          {allSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => onSelect(suggestion.text)}
              className={cn(
                'w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors',
                highlightedIndex === index && 'bg-gray-50'
              )}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {getIcon(suggestion.type)}
              <span className="flex-1 text-sm">
                {query && suggestion.type === 'suggestion' ? (
                  <HighlightedText text={suggestion.text} highlight={query} />
                ) : (
                  suggestion.text
                )}
              </span>
              {suggestion.count && suggestion.count > 0 && (
                <span className="text-xs text-gray-400">
                  {suggestion.count.toLocaleString()} results
                </span>
              )}
              {suggestion.type === 'recent' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle removing individual recent search
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Quick actions */}
        {query && (
          <div className="border-t border-gray-100 px-4 py-3">
            <button
              onClick={() => onSelect(query)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Search for "{query}"
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component to highlight matching text
function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) {
    return <>{text}</>
  }

  const regex = new RegExp(`(${highlight})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) => (
        regex.test(part) ? (
          <span key={i} className="font-semibold text-gray-900">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </>
  )
}