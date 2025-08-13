import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, TrendingUp, Clock, MapPin, Tag } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Badge } from '@/shared/components/ui/badge'
import { searchService } from '../services/search.service'
import { SearchSuggestion, TrendingSearch } from '../types'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { cn } from '@/shared/lib/utils'

interface SearchInputProps {
  placeholder?: string
  className?: string
  size?: 'default' | 'lg'
  showTrending?: boolean
  onSearch?: (query: string) => void
  autoFocus?: boolean
}

export function SearchInput({
  placeholder,
  className,
  size = 'default',
  showTrending = true,
  onSearch,
  autoFocus = false
}: SearchInputProps) {
  const { t, i18n } = useTranslation('search')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [trending, setTrending] = useState<TrendingSearch[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Load trending searches on mount
  useEffect(() => {
    if (showTrending) {
      loadTrendingSearches()
    }
    loadRecentSearches()
  }, [showTrending])

  // Fetch suggestions when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery, i18n.language])

  const loadTrendingSearches = async () => {
    try {
      const data = await searchService.getTrendingSearches(5)
      setTrending(data)
    } catch (error) {
      console.error('Failed to load trending searches:', error)
    }
  }

  const loadRecentSearches = () => {
    // Load from localStorage
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      setRecentSearches(JSON.parse(recent).slice(0, 5))
    }
  }

  const saveRecentSearch = (searchQuery: string) => {
    const recent = [searchQuery, ...recentSearches.filter(q => q !== searchQuery)].slice(0, 10)
    setRecentSearches(recent.slice(0, 5))
    localStorage.setItem('recentSearches', JSON.stringify(recent))
  }

  const fetchSuggestions = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const data = await searchService.getSuggestions(searchQuery)
      setSuggestions(data)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return

    saveRecentSearch(searchQuery)
    setIsOpen(false)
    
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }, [navigate, onSearch, recentSearches])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSearch(query)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'location':
        return <MapPin className="h-4 w-4" />
      case 'category':
        return <Tag className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <div className="relative">
            <Search className={cn(
              "absolute left-3 text-muted-foreground",
              size === 'lg' ? "top-4 h-5 w-5" : "top-3 h-4 w-4"
            )} />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder || t('search.placeholder')}
              className={cn(
                "pr-10",
                size === 'lg' ? "pl-12 h-14 text-lg" : "pl-10",
                className
              )}
              autoFocus={autoFocus}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-1",
                  size === 'lg' ? "top-2 h-10 w-10" : "top-1 h-8 w-8"
                )}
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isLoading && (
              <Loader2 className={cn(
                "absolute right-10 animate-spin text-muted-foreground",
                size === 'lg' ? "top-4 h-5 w-5" : "top-3 h-4 w-4"
              )} />
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <CommandGroup heading={t('search.suggestions')}>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.id}
                    onSelect={() => handleSearch(suggestion.text)}
                    className="flex items-center gap-2"
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <span className="flex-1">
                      {i18n.language === 'ar' ? suggestion.textAr : suggestion.text}
                    </span>
                    {suggestion.type !== 'query' && (
                      <Badge variant="secondary" className="text-xs">
                        {t(`search.type.${suggestion.type}`)}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && !query && (
              <>
                {suggestions.length > 0 && <CommandSeparator />}
                <CommandGroup heading={t('search.recent')}>
                  {recentSearches.map((search, index) => (
                    <CommandItem
                      key={`recent-${index}`}
                      onSelect={() => handleSearch(search)}
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{search}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Trending Searches */}
            {showTrending && trending.length > 0 && !query && (
              <>
                {(suggestions.length > 0 || recentSearches.length > 0) && <CommandSeparator />}
                <CommandGroup heading={t('search.trending')}>
                  {trending.map((item, index) => (
                    <CommandItem
                      key={`trending-${index}`}
                      onSelect={() => handleSearch(item.query)}
                      className="flex items-center gap-2"
                    >
                      <TrendingUp className={cn(
                        "h-4 w-4",
                        item.trend === 'up' ? "text-green-500" : 
                        item.trend === 'down' ? "text-red-500" : 
                        "text-muted-foreground"
                      )} />
                      <span className="flex-1">
                        {i18n.language === 'ar' ? item.queryAr : item.query}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "text-xs",
                          item.trend === 'up' ? "text-green-500" : 
                          item.trend === 'down' ? "text-red-500" : 
                          "text-muted-foreground"
                        )}>
                          {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}
                          {item.changePercent}%
                        </span>
                        {item.category && (
                          <Badge variant="outline" className="text-xs ml-1">
                            {t(`search.category.${item.category}`)}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Empty State */}
            {query && suggestions.length === 0 && !isLoading && (
              <CommandEmpty>{t('search.noResults')}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}