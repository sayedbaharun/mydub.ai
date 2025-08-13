import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAISearchEngine, 
  SearchQuery, 
  SearchResponse, 
  SearchResult, 
  SearchFilters 
} from '@/shared/lib/search/aiSearchEngine';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface UseAISearchOptions {
  enabled?: boolean;
  debounceMs?: number;
  autoSearch?: boolean;
  includeAggregations?: boolean;
  includeSuggestions?: boolean;
  semanticSearch?: boolean;
  personalizeResults?: boolean;
}

/**
 * Main hook for AI-powered search
 */
export function useAISearch(options: UseAISearchOptions = {}) {
  const { user } = useAuth();
  const searchEngine = getAISearchEngine();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState<SearchQuery>({
    text: '',
    filters: {},
    options: {
      include_suggestions: options.includeSuggestions ?? true,
      include_aggregations: options.includeAggregations ?? true,
      semantic_search: options.semanticSearch ?? true,
      personalize: options.personalizeResults ?? true
    }
  });

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query.text, options.debounceMs || 300);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (searchQuery: SearchQuery): Promise<SearchResponse> => {
      if (options.personalizeResults && user) {
        return searchEngine.personalizedSearch(searchQuery, user.id);
      }
      return searchEngine.search(searchQuery);
    },
    onSuccess: (data, variables) => {
      // Add to search history
      if (variables.text.trim() && !searchHistory.includes(variables.text)) {
        setSearchHistory(prev => [variables.text, ...prev.slice(0, 9)]); // Keep last 10
      }
      
      // Cache successful searches
      queryClient.setQueryData(['search', variables], data);
    }
  });

  // Auto search when query changes
  useEffect(() => {
    if (options.autoSearch && debouncedQuery.trim() && options.enabled !== false) {
      searchMutation.mutate({
        ...query,
        text: debouncedQuery
      });
    }
  }, [debouncedQuery, query.filters, options.autoSearch, options.enabled]);

  const search = useCallback((searchText?: string, filters?: SearchFilters) => {
    const searchQuery = {
      ...query,
      text: searchText || query.text,
      filters: filters || query.filters
    };
    
    searchMutation.mutate(searchQuery);
  }, [query, searchMutation]);

  const updateQuery = useCallback((updates: Partial<SearchQuery>) => {
    setQuery(prev => ({
      ...prev,
      ...updates,
      filters: { ...prev.filters, ...updates.filters },
      options: { ...prev.options, ...updates.options }
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery(prev => ({ ...prev, text: '' }));
    searchMutation.reset();
  }, [searchMutation]);

  return {
    query,
    updateQuery,
    search,
    clearSearch,
    searchHistory,
    results: searchMutation.data?.results || [],
    totalCount: searchMutation.data?.total_count || 0,
    suggestions: searchMutation.data?.suggestions || [],
    aggregations: searchMutation.data?.aggregations,
    intentAnalysis: searchMutation.data?.intent_analysis,
    relatedSearches: searchMutation.data?.related_searches || [],
    isLoading: searchMutation.isPending,
    error: searchMutation.error,
    hasSearched: searchMutation.isSuccess || searchMutation.isError
  };
}

/**
 * Hook for autocomplete suggestions
 */
export function useSearchAutocomplete(
  query: string,
  options: { enabled?: boolean; debounceMs?: number } = {}
) {
  const searchEngine = getAISearchEngine();
  const debouncedQuery = useDebounce(query, options.debounceMs || 200);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['autocomplete', debouncedQuery],
    queryFn: () => searchEngine.getAutoComplete(debouncedQuery),
    enabled: (options.enabled !== false) && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  return {
    suggestions,
    isLoading
  };
}

/**
 * Hook for semantic search
 */
export function useSemanticSearch(
  query: string,
  filters?: SearchFilters,
  options: { enabled?: boolean; limit?: number } = {}
) {
  const searchEngine = getAISearchEngine();

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['semantic-search', query, filters],
    queryFn: () => searchEngine.semanticSearch(query, filters, options.limit),
    enabled: (options.enabled !== false) && query.length >= 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  return {
    results,
    isLoading,
    error
  };
}

/**
 * Hook for location-based search
 */
export function useLocationSearch(
  location?: { lat: number; lng: number },
  options: {
    radius?: number;
    query?: string;
    filters?: SearchFilters;
    enabled?: boolean;
  } = {}
) {
  const searchEngine = getAISearchEngine();
  const { radius = 10, query = '', filters, enabled = true } = options;

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['location-search', location, radius, query, filters],
    queryFn: () => searchEngine.nearbySearch(location!, radius, query, filters),
    enabled: enabled && !!location,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  return {
    results,
    isLoading,
    error
  };
}

/**
 * Hook for faceted search with filters
 */
export function useFacetedSearch(
  query: string,
  facets: string[] = ['content_type', 'category', 'location', 'price_range']
) {
  const searchEngine = getAISearchEngine();

  const { data, isLoading, error } = useQuery({
    queryKey: ['faceted-search', query, facets],
    queryFn: () => searchEngine.facetedSearch(query, facets),
    enabled: query.length >= 2,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2
  });

  return {
    results: data?.results || [],
    facets: data?.facets || {},
    isLoading,
    error
  };
}

/**
 * Hook for multi-language search
 */
export function useMultiLanguageSearch(
  query: string,
  languages: string[] = ['en', 'ar'],
  options: { enabled?: boolean } = {}
) {
  const searchEngine = getAISearchEngine();

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['multilang-search', query, languages],
    queryFn: () => searchEngine.multiLanguageSearch(query, languages),
    enabled: (options.enabled !== false) && query.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  return {
    results,
    isLoading,
    error
  };
}

/**
 * Hook for search analytics and tracking
 */
export function useSearchAnalytics() {
  const [searchMetrics, setSearchMetrics] = useState({
    totalSearches: 0,
    avgResponseTime: 0,
    topQueries: [] as string[],
    noResultsQueries: [] as string[],
    clickThroughRate: 0
  });

  const trackSearch = useCallback((query: string, resultCount: number, responseTime: number) => {
    setSearchMetrics(prev => ({
      ...prev,
      totalSearches: prev.totalSearches + 1,
      avgResponseTime: (prev.avgResponseTime * (prev.totalSearches - 1) + responseTime) / prev.totalSearches,
      noResultsQueries: resultCount === 0 ? [...prev.noResultsQueries, query] : prev.noResultsQueries
    }));
  }, []);

  const trackClick = useCallback((result: SearchResult, position: number) => {
    // Track click-through rates
    setSearchMetrics(prev => ({
      ...prev,
      clickThroughRate: prev.clickThroughRate + 1 // Simplified calculation
    }));
  }, []);

  return {
    searchMetrics,
    trackSearch,
    trackClick
  };
}

/**
 * Hook for search suggestions and query understanding
 */
export function useQueryUnderstanding(query: string) {
  const searchEngine = getAISearchEngine();

  const { data: understanding, isLoading } = useQuery({
    queryKey: ['query-understanding', query],
    queryFn: () => searchEngine.understandQuery(query),
    enabled: query.length >= 3,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  return {
    intent: understanding?.intent,
    entities: understanding?.entities || [],
    suggestedFilters: understanding?.filters || {},
    enhancedQuery: understanding?.enhanced_query,
    isLoading
  };
}

/**
 * Hook for saved searches
 */
export function useSavedSearches() {
  const { user } = useAuth();
  const [savedSearches, setSavedSearches] = useState<Array<{
    id: string;
    query: string;
    filters: SearchFilters;
    name: string;
    created_at: Date;
  }>>([]);

  const saveSearch = useCallback((query: string, filters: SearchFilters, name: string) => {
    const saved = {
      id: crypto.randomUUID(),
      query,
      filters,
      name,
      created_at: new Date()
    };
    
    setSavedSearches(prev => [saved, ...prev]);
    
    // In production, save to database
    // await supabase.from('saved_searches').insert(saved);
  }, []);

  const removeSavedSearch = useCallback((id: string) => {
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    savedSearches,
    saveSearch,
    removeSavedSearch
  };
}

/**
 * Hook for search filters management
 */
export function useSearchFilters(initialFilters: SearchFilters = {}) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  useEffect(() => {
    const count = Object.values(filters).reduce((acc, filter) => {
      if (Array.isArray(filter)) return acc + filter.length;
      if (typeof filter === 'object' && filter !== null) return acc + Object.keys(filter).length;
      return acc + (filter ? 1 : 0);
    }, 0);
    
    setActiveFilterCount(count);
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const removeFilter = useCallback((key: keyof SearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const addToArrayFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: any
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: [...(prev[key] as any[] || []), value]
    }));
  }, []);

  const removeFromArrayFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: any
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as any[] || []).filter(item => item !== value)
    }));
  }, []);

  return {
    filters,
    activeFilterCount,
    updateFilter,
    removeFilter,
    clearFilters,
    addToArrayFilter,
    removeFromArrayFilter
  };
}