import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getRecommendationEngine, 
  RecommendationRequest, 
  RecommendationResult, 
  ContentInteraction 
} from '@/shared/lib/ai/recommendationEngine';
import { useAuth } from '@/features/auth/context/AuthContext';

interface UseRecommendationsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  context?: RecommendationRequest['context'];
  filters?: RecommendationRequest['filters'];
  strategy?: RecommendationRequest['strategy'];
}

/**
 * Hook for getting personalized content recommendations
 */
export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const { user } = useAuth();
  const engine = getRecommendationEngine();
  
  const {
    enabled = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutes
    context,
    filters,
    strategy = 'diverse'
  } = options;

  const request: RecommendationRequest = {
    user_id: user?.id,
    context,
    filters,
    strategy
  };

  const query = useQuery({
    queryKey: ['recommendations', request],
    queryFn: () => engine.getRecommendations(request),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval,
    retry: 2
  });

  return {
    ...query,
    recommendations: query.data || []
  };
}

/**
 * Hook for trending content recommendations
 */
export function useTrendingRecommendations(
  timeframe: '1h' | '6h' | '24h' | '7d' = '24h',
  category?: string
) {
  const engine = getRecommendationEngine();

  const query = useQuery({
    queryKey: ['trending', timeframe, category],
    queryFn: () => engine.getTrendingRecommendations(timeframe, category),
    staleTime: 5 * 60 * 1000, // 5 minutes for trending
    gcTime: 15 * 60 * 1000,
    retry: 2
  });

  return {
    ...query,
    trending: query.data || []
  };
}

/**
 * Hook for location-based recommendations
 */
export function useLocationRecommendations(
  location?: { lat: number; lng: number },
  options: { enabled?: boolean; radius?: number } = {}
) {
  const { user } = useAuth();
  const engine = getRecommendationEngine();
  const { enabled = true, radius = 10 } = options;

  const query = useQuery({
    queryKey: ['location-recommendations', location, radius],
    queryFn: () => engine.getLocationBasedRecommendations(null, { location }),
    enabled: enabled && !!location,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });

  return {
    ...query,
    locationRecommendations: query.data || []
  };
}

/**
 * Hook for similar content recommendations
 */
export function useSimilarContent(
  contentId: string,
  contentType: string,
  options: { enabled?: boolean; limit?: number } = {}
) {
  const engine = getRecommendationEngine();
  const { enabled = true, limit = 10 } = options;

  const query = useQuery({
    queryKey: ['similar-content', contentType, contentId, limit],
    queryFn: () => engine.getSimilarContentRecommendations(contentId, contentType, limit),
    enabled: enabled && !!contentId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });

  return {
    ...query,
    similarContent: query.data || []
  };
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking() {
  const engine = getRecommendationEngine();
  const queryClient = useQueryClient();

  const trackInteraction = useMutation({
    mutationFn: (interaction: ContentInteraction) => engine.trackInteraction(interaction),
    onSuccess: () => {
      // Invalidate recommendations to refresh them
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    }
  });

  const trackView = useCallback((contentId: string, contentType: string, duration?: number) => {
    trackInteraction.mutate({
      content_id: contentId,
      content_type: contentType as any,
      interaction_type: 'view',
      timestamp: new Date(),
      duration,
      context: {
        source: 'web',
        device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    });
  }, [trackInteraction]);

  const trackLike = useCallback((contentId: string, contentType: string) => {
    trackInteraction.mutate({
      content_id: contentId,
      content_type: contentType as any,
      interaction_type: 'like',
      timestamp: new Date(),
      context: {
        source: 'web',
        device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    });
  }, [trackInteraction]);

  const trackSave = useCallback((contentId: string, contentType: string) => {
    trackInteraction.mutate({
      content_id: contentId,
      content_type: contentType as any,
      interaction_type: 'save',
      timestamp: new Date(),
      context: {
        source: 'web',
        device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    });
  }, [trackInteraction]);

  const trackShare = useCallback((contentId: string, contentType: string) => {
    trackInteraction.mutate({
      content_id: contentId,
      content_type: contentType as any,
      interaction_type: 'share',
      timestamp: new Date(),
      context: {
        source: 'web',
        device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    });
  }, [trackInteraction]);

  const trackClick = useCallback((contentId: string, contentType: string) => {
    trackInteraction.mutate({
      content_id: contentId,
      content_type: contentType as any,
      interaction_type: 'click',
      timestamp: new Date(),
      context: {
        source: 'web',
        device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    });
  }, [trackInteraction]);

  return {
    trackView,
    trackLike,
    trackSave,
    trackShare,
    trackClick,
    isTracking: trackInteraction.isPending
  };
}

/**
 * Hook for contextual recommendations based on current page/content
 */
export function useContextualRecommendations(
  currentContent?: {
    id: string;
    type: string;
    category?: string;
  },
  options: UseRecommendationsOptions = {}
) {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Silently fail if location is not available
        }
      );
    }
  }, []);

  const context: RecommendationRequest['context'] = {
    ...options.context,
    location: location || options.context?.location,
    time_of_day: new Date().getHours() < 12 ? 'morning' : 
                 new Date().getHours() < 18 ? 'afternoon' : 'evening',
    device_type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
    current_content: currentContent?.id
  };

  return useRecommendations({
    ...options,
    context,
    strategy: 'focused'
  });
}

/**
 * Hook for real-time recommendation updates
 */
export function useRealtimeRecommendations(options: UseRecommendationsOptions = {}) {
  const recommendations = useRecommendations({
    ...options,
    refetchInterval: 30 * 1000 // Refresh every 30 seconds
  });

  const [newRecommendations, setNewRecommendations] = useState<RecommendationResult[]>([]);

  useEffect(() => {
    if (recommendations.data) {
      // Compare with previous recommendations to find new ones
      // This would be more sophisticated in production
      setNewRecommendations(recommendations.data.slice(0, 3));
    }
  }, [recommendations.data]);

  return {
    ...recommendations,
    newRecommendations,
    hasNewRecommendations: newRecommendations.length > 0
  };
}

/**
 * Hook for recommendation analytics
 */
export function useRecommendationAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    conversionRate: 0,
    topCategories: [] as string[],
    averageRelevanceScore: 0
  });

  const updateAnalytics = useCallback((recommendation: RecommendationResult, action: string) => {
    setAnalytics(prev => ({
      ...prev,
      totalViews: prev.totalViews + (action === 'view' ? 1 : 0),
      // Update other metrics...
    }));
  }, []);

  return {
    analytics,
    updateAnalytics
  };
}

/**
 * Hook for A/B testing recommendation strategies
 */
export function useRecommendationABTest(
  strategies: RecommendationRequest['strategy'][],
  userId?: string
) {
  const [selectedStrategy, setSelectedStrategy] = useState<RecommendationRequest['strategy']>();

  useEffect(() => {
    if (strategies.length > 0) {
      // Simple A/B test based on user ID hash
      const hash = userId ? userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.random() * 1000;
      const index = Math.floor(hash) % strategies.length;
      setSelectedStrategy(strategies[index]);
    }
  }, [strategies, userId]);

  const recommendations = useRecommendations({
    strategy: selectedStrategy,
    enabled: !!selectedStrategy
  });

  return {
    ...recommendations,
    strategy: selectedStrategy,
    isTestActive: !!selectedStrategy
  };
}