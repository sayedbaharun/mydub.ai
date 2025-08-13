import { useState, useEffect, useCallback, useRef } from 'react';
import { getCacheClient, CacheOptions, CacheKeys, CacheTags } from '@/shared/lib/cache/redisClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseCacheOptions extends CacheOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for cached data fetching with React Query integration
 */
export function useCachedQuery<T = any>(
  key: string | string[],
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const cache = getCacheClient();
  const queryKey = Array.isArray(key) ? key : [key];
  const cacheKey = Array.isArray(key) ? key.join(':') : key;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Try cache first if enabled
      if (options.enabled !== false) {
        const cached = await cache.get<T>(cacheKey);
        if (cached !== null) {
          return cached;
        }
      }

      // Fetch fresh data
      const data = await fetcher();

      // Store in cache
      if (options.enabled !== false) {
        await cache.set(cacheKey, data, options);
      }

      return data;
    },
    staleTime: options.staleTime || 5 * 60 * 1000, // 5 minutes
    gcTime: options.cacheTime || 10 * 60 * 1000, // 10 minutes
    refetchInterval: options.refetchInterval,
    enabled: options.enabled,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Invalidate cache
  const invalidate = useCallback(async () => {
    await cache.del(cacheKey);
    query.refetch();
  }, [cache, cacheKey, query]);

  return {
    ...query,
    invalidate
  };
}

/**
 * Hook for cached mutations
 */
export function useCachedMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    invalidateTags?: string[];
    invalidateKeys?: string[];
    optimisticUpdate?: (variables: TVariables) => any;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
  } = {}
) {
  const cache = getCacheClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: async (data, variables) => {
      // Invalidate cache by tags
      if (options.invalidateTags && options.invalidateTags.length > 0) {
        await cache.invalidateByTags(options.invalidateTags);
      }

      // Invalidate specific keys
      if (options.invalidateKeys && options.invalidateKeys.length > 0) {
        await Promise.all(
          options.invalidateKeys.map(key => cache.del(key))
        );
      }

      // Invalidate React Query cache
      queryClient.invalidateQueries();

      // Call user callback
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onMutate: options.optimisticUpdate ? async (variables) => {
      const optimisticData = options.optimisticUpdate!(variables);
      
      // Cancel outgoing queries
      await queryClient.cancelQueries();
      
      // Snapshot previous values
      const previousData = queryClient.getQueryData(['optimistic']);
      
      // Optimistically update
      queryClient.setQueryData(['optimistic'], optimisticData);
      
      return { previousData };
    } : undefined,
    onSettled: () => {
      queryClient.invalidateQueries();
    }
  });

  return mutation;
}

/**
 * Hook for rate limiting
 */
export function useRateLimit(
  identifier: string,
  options: {
    limit: number;
    window: number; // seconds
    onLimitExceeded?: () => void;
  }
) {
  const cache = getCacheClient();
  const [status, setStatus] = useState({
    allowed: true,
    remaining: options.limit,
    resetIn: 0
  });

  const checkLimit = useCallback(async () => {
    const result = await cache.checkRateLimit(
      identifier,
      options.limit,
      options.window
    );
    
    setStatus(result);
    
    if (!result.allowed && options.onLimitExceeded) {
      options.onLimitExceeded();
    }
    
    return result.allowed;
  }, [cache, identifier, options]);

  return {
    ...status,
    checkLimit
  };
}

/**
 * Hook for cache warming
 */
export function useCacheWarming(
  configs: Array<{
    key: string;
    fetcher: () => Promise<any>;
    options?: CacheOptions;
  }>
) {
  const cache = getCacheClient();
  const [isWarming, setIsWarming] = useState(false);
  const [progress, setProgress] = useState(0);

  const warmCache = useCallback(async () => {
    setIsWarming(true);
    setProgress(0);

    try {
      for (let i = 0; i < configs.length; i++) {
        const { key, fetcher, options } = configs[i];
        
        // Check if already cached
        const exists = await cache.exists(key);
        if (!exists) {
          const data = await fetcher();
          await cache.set(key, data, options);
        }
        
        setProgress((i + 1) / configs.length * 100);
      }
    } catch (error) {
      console.error('Cache warming failed:', error);
    } finally {
      setIsWarming(false);
    }
  }, [cache, configs]);

  useEffect(() => {
    // Warm cache on mount
    warmCache();
  }, []);

  return {
    isWarming,
    progress,
    warmCache
  };
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
  const cache = getCacheClient();
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0
  });

  // Track cache hits/misses
  const trackHit = useCallback(() => {
    setStats(prev => ({
      ...prev,
      hits: prev.hits + 1,
      hitRate: (prev.hits + 1) / (prev.hits + prev.misses + 1)
    }));
  }, []);

  const trackMiss = useCallback(() => {
    setStats(prev => ({
      ...prev,
      misses: prev.misses + 1,
      hitRate: prev.hits / (prev.hits + prev.misses + 1)
    }));
  }, []);

  return {
    ...stats,
    trackHit,
    trackMiss
  };
}

/**
 * Hook for prefetching data
 */
export function usePrefetch() {
  const cache = getCacheClient();
  const queryClient = useQueryClient();

  const prefetch = useCallback(async (
    key: string,
    fetcher: () => Promise<any>,
    options?: CacheOptions
  ) => {
    // Check if already cached
    const cached = await cache.get(key);
    if (cached !== null) return;

    // Prefetch and cache
    try {
      const data = await fetcher();
      await cache.set(key, data, options);
      
      // Also update React Query cache
      queryClient.setQueryData([key], data);
    } catch (error) {
      console.error('Prefetch failed:', error);
    }
  }, [cache, queryClient]);

  return { prefetch };
}

/**
 * Hook for real-time cache invalidation
 */
export function useCacheInvalidation(
  tags: string[],
  onInvalidate?: () => void
) {
  const cache = getCacheClient();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Set up periodic check for invalidation
    intervalRef.current = setInterval(async () => {
      // This would connect to a WebSocket or SSE endpoint in production
      // For now, we'll just demonstrate the pattern
      
      // Check if any tagged data needs invalidation
      // In production, this would be triggered by server events
      
      if (onInvalidate) {
        onInvalidate();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tags, onInvalidate]);

  const invalidate = useCallback(async () => {
    await cache.invalidateByTags(tags);
    queryClient.invalidateQueries();
  }, [cache, queryClient, tags]);

  return { invalidate };
}

// Preset hooks for common use cases
export const useArticlesCache = (category?: string, page?: number) => 
  useCachedQuery(
    CacheKeys.articles(category, page),
    async () => {
      // Fetch articles from API
      const response = await fetch(`/api/articles?category=${category}&page=${page}`);
      return response.json();
    },
    {
      ttl: 300, // 5 minutes
      tags: [CacheTags.ARTICLE, CacheTags.CONTENT]
    }
  );

export const useGovernmentServicesCache = (category?: string) =>
  useCachedQuery(
    CacheKeys.governmentServices(category),
    async () => {
      // Fetch government services from API
      const response = await fetch(`/api/government-services?category=${category}`);
      return response.json();
    },
    {
      ttl: 3600, // 1 hour
      tags: [CacheTags.GOVERNMENT]
    }
  );

export const useTourismPlacesCache = (category?: string) =>
  useCachedQuery(
    CacheKeys.tourismPlaces(category),
    async () => {
      // Fetch tourism places from API
      const response = await fetch(`/api/tourism-places?category=${category}`);
      return response.json();
    },
    {
      ttl: 3600, // 1 hour
      tags: [CacheTags.TOURISM]
    }
  );

export const useSearchCache = (query: string, filters?: any) =>
  useCachedQuery(
    CacheKeys.searchResults(query, filters),
    async () => {
      // Perform search
      const response = await fetch(`/api/search?q=${query}&filters=${JSON.stringify(filters)}`);
      return response.json();
    },
    {
      ttl: 600, // 10 minutes
      tags: [CacheTags.SEARCH]
    }
  );