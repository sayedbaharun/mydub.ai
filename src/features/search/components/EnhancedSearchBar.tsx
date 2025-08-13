import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { SearchSuggestions } from '@/shared/components/SearchSuggestions'
import { searchHistoryService } from '@/shared/services/search-history.service'
import { useAuth } from '@/features/auth/context/AuthContext'
import { cn } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'

interface EnhancedSearchBarProps {
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  showSuggestions?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function EnhancedSearchBar({
  value: externalValue,
  onChange,
  onSubmit,
  placeholder = 'Search for news, events, places...',
  className,
  autoFocus = false,
  showSuggestions = true,
  size = 'md'
}: EnhancedSearchBarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [internalValue, setInternalValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [trendingSearches, setTrendingSearches] = useState<any[]>([])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Use external value if provided, otherwise use internal state
  const value = externalValue !== undefined ? externalValue : internalValue
  const setValue = (newValue: string) => {
    if (onChange) {
      onChange(newValue)
    } else {
      setInternalValue(newValue)
    }
  }

  // Debounce the search query for suggestions
  const debouncedQuery = useDebounce(value, 300)

  // Size configuration
  const sizeConfig = {
    sm: {
      input: 'h-8 text-sm pl-8 pr-8',
      icon: 'h-4 w-4',
      button: 'h-6 w-6'
    },
    md: {
      input: 'h-10 text-base pl-10 pr-10',
      icon: 'h-5 w-5',
      button: 'h-8 w-8'
    },
    lg: {
      input: 'h-12 text-lg pl-12 pr-12',
      icon: 'h-6 w-6',
      button: 'h-10 w-10'
    }
  }

  const config = sizeConfig[size]

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const [recent, trending] = await Promise.all([
        searchHistoryService.getRecentSearches(user?.id),
        searchHistoryService.getTrendingSearches()
      ])
      
      setRecentSearches(recent)
      setTrendingSearches(trending.map((item, index) => ({
        id: `trending-${index}`,
        text: item.query,
        type: 'trending',
        count: item.count
      })))
    }

    loadInitialData()
  }, [user?.id])

  // Load suggestions based on query
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoadingSuggestions(true)
      try {
        const results = await searchHistoryService.getSuggestions(debouncedQuery)
        setSuggestions(results.map((text, index) => ({
          id: `suggestion-${index}`,
          text,
          type: 'suggestion'
        })))
      } catch (error) {
        console.error('Error loading suggestions:', error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    loadSuggestions()
  }, [debouncedQuery])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestionsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Save to history
    await searchHistoryService.saveSearch(searchQuery, user?.id)
    
    // Update recent searches
    const newRecent = await searchHistoryService.getRecentSearches(user?.id)
    setRecentSearches(newRecent)

    // Close suggestions
    setShowSuggestionsDropdown(false)

    // Handle submission
    if (onSubmit) {
      onSubmit(searchQuery)
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }, [user?.id, onSubmit, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(value)
  }

  const handleClear = () => {
    setValue('')
    searchInputRef.current?.focus()
  }

  const handleClearRecentSearches = async () => {
    await searchHistoryService.clearHistory(user?.id)
    setRecentSearches([])
  }

  const handleSuggestionSelect = (suggestion: string) => {
    setValue(suggestion)
    handleSearch(suggestion)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Icon */}
        <div className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
          isLoadingSuggestions && 'opacity-0'
        )}>
          <Search className={cn(config.icon, 'text-gray-400')} />
        </div>

        {/* Loading Spinner */}
        {isLoadingSuggestions && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className={cn(config.icon, 'text-gray-400 animate-spin')} />
          </div>
        )}

        {/* Search Input */}
        <Input
          ref={searchInputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
            if (showSuggestions) {
              setShowSuggestionsDropdown(true)
            }
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            config.input,
            'w-full bg-white border-gray-200 rounded-xl shadow-sm transition-all duration-200',
            isFocused && 'shadow-md border-gray-300',
            className
          )}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label="Search"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestionsDropdown}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors',
              config.button,
              'flex items-center justify-center'
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <SearchSuggestions
          query={value}
          isOpen={showSuggestionsDropdown}
          onSelect={handleSuggestionSelect}
          onClose={() => setShowSuggestionsDropdown(false)}
          recentSearches={recentSearches}
          trendingSearches={value ? [] : trendingSearches}
          suggestions={suggestions}
          onClearRecent={handleClearRecentSearches}
          className="mt-2"
        />
      )}
    </div>
  )
}