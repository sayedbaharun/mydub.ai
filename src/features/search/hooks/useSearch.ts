import { useState, useCallback, useEffect } from 'react';
import { searchService } from '../services/searchService';
import type { SearchFilters, SearchResponse } from '@/shared/types/database';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface UseSearchOptions {
  initialFilters?: Partial<SearchFilters>;
  pageSize?: number;
  debounceMs?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { 
    initialFilters = {}, 
    pageSize = 20, 
    debounceMs = 300 
  } = options;

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    sortBy: 'relevance',
    ...initialFilters
  });

  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedQuery = useDebounce(filters.query, debounceMs);

  const search = useCallback(async (newFilters?: Partial<SearchFilters>, newPage?: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const searchFilters = newFilters ? { ...filters, ...newFilters } : filters;
      const searchPage = newPage || page;

      const result = await searchService.search(searchFilters, searchPage, pageSize);
      setResponse(result);

      if (newFilters) {
        setFilters(searchFilters);
      }
      if (newPage) {
        setPage(newPage);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, pageSize]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== undefined) {
      search();
    }
  }, [debouncedQuery]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const nextPage = useCallback(() => {
    if (response && page < Math.ceil(response.total / pageSize)) {
      search(undefined, page + 1);
    }
  }, [response, page, pageSize, search]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      search(undefined, page - 1);
    }
  }, [page, search]);

  const goToPage = useCallback((newPage: number) => {
    if (response && newPage >= 1 && newPage <= Math.ceil(response.total / pageSize)) {
      search(undefined, newPage);
    }
  }, [response, pageSize, search]);

  const reset = useCallback(() => {
    setFilters({
      query: '',
      type: 'all',
      sortBy: 'relevance',
      ...initialFilters
    });
    setPage(1);
    setResponse(null);
    setError(null);
  }, [initialFilters]);

  return {
    // State
    filters,
    page,
    response,
    isLoading,
    error,

    // Computed values
    results: response?.results || [],
    total: response?.total || 0,
    totalPages: response ? Math.ceil(response.total / pageSize) : 0,
    hasNextPage: response ? page < Math.ceil(response.total / pageSize) : false,
    hasPreviousPage: page > 1,

    // Actions
    search,
    updateFilters,
    nextPage,
    previousPage,
    goToPage,
    reset
  };
}

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const results = await searchService.getSearchSuggestions(debouncedQuery);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  return { suggestions, isLoading };
}

export function usePopularSearches(limit = 10) {
  const [searches, setSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const results = await searchService.getPopularSearches(limit);
        setSearches(results);
      } catch (error) {
        console.error('Failed to fetch popular searches:', error);
        setSearches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularSearches();
  }, [limit]);

  return { searches, isLoading };
}