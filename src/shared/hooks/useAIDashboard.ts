import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAIInsightsEngine, 
  UserInsight, 
  DashboardMetrics, 
  PersonalizedContent 
} from '@/shared/lib/dashboard/aiInsightsEngine';
import { useAuth } from '@/features/auth/context/AuthContext';

interface UseAIDashboardOptions {
  enabled?: boolean;
  refreshInterval?: number;
  includeMetrics?: boolean;
  includeContent?: boolean;
}

/**
 * Main hook for AI-powered dashboard
 */
export function useAIDashboard(options: UseAIDashboardOptions = {}) {
  const { user } = useAuth();
  const insightsEngine = getAIInsightsEngine();
  
  const {
    enabled = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    includeMetrics = true,
    includeContent = true
  } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-dashboard', user?.id],
    queryFn: () => insightsEngine.generateUserInsights(user!.id),
    enabled: enabled && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: refreshInterval,
    retry: 2
  });

  const refreshDashboard = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    insights: data?.insights || [],
    metrics: data?.metrics,
    content: data?.content,
    isLoading,
    error,
    refreshDashboard,
    hasData: !!data
  };
}

/**
 * Hook for managing individual insights
 */
export function useInsights(userId?: string) {
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const { insights, refreshDashboard } = useAIDashboard();

  const dismissInsight = useCallback((insightId: string) => {
    setDismissedInsights(prev => new Set(prev).add(insightId));
  }, []);

  const undismissInsight = useCallback((insightId: string) => {
    setDismissedInsights(prev => {
      const newSet = new Set(prev);
      newSet.delete(insightId);
      return newSet;
    });
  }, []);

  const clearDismissed = useCallback(() => {
    setDismissedInsights(new Set());
  }, []);

  const activeInsights = insights.filter(insight => !dismissedInsights.has(insight.id));
  const criticalInsights = activeInsights.filter(insight => insight.priority === 'critical');
  const actionableInsights = activeInsights.filter(insight => insight.actionable);

  return {
    allInsights: insights,
    activeInsights,
    criticalInsights,
    actionableInsights,
    dismissedCount: dismissedInsights.size,
    dismissInsight,
    undismissInsight,
    clearDismissed,
    refreshInsights: refreshDashboard
  };
}

/**
 * Hook for dashboard metrics and analytics
 */
export function useDashboardMetrics() {
  const { metrics, isLoading } = useAIDashboard();
  
  const [historicalMetrics, setHistoricalMetrics] = useState<DashboardMetrics[]>([]);

  // Store metrics history for trends
  useEffect(() => {
    if (metrics) {
      setHistoricalMetrics(prev => {
        const newHistory = [...prev, { ...metrics, timestamp: new Date() } as any];
        return newHistory.slice(-30); // Keep last 30 data points
      });
    }
  }, [metrics]);

  const getTrend = useCallback((metric: keyof DashboardMetrics) => {
    if (historicalMetrics.length < 2) return 'stable';
    
    const current = historicalMetrics[historicalMetrics.length - 1];
    const previous = historicalMetrics[historicalMetrics.length - 2];
    
    if (typeof current[metric] === 'number' && typeof previous[metric] === 'number') {
      const currentValue = current[metric] as number;
      const previousValue = previous[metric] as number;
      
      if (currentValue > previousValue) return 'up';
      if (currentValue < previousValue) return 'down';
    }
    
    return 'stable';
  }, [historicalMetrics]);

  const getMetricChange = useCallback((metric: keyof DashboardMetrics) => {
    if (historicalMetrics.length < 2) return 0;
    
    const current = historicalMetrics[historicalMetrics.length - 1];
    const previous = historicalMetrics[historicalMetrics.length - 2];
    
    if (typeof current[metric] === 'number' && typeof previous[metric] === 'number') {
      const currentValue = current[metric] as number;
      const previousValue = previous[metric] as number;
      
      if (previousValue === 0) return 0;
      return ((currentValue - previousValue) / previousValue) * 100;
    }
    
    return 0;
  }, [historicalMetrics]);

  return {
    metrics,
    historicalMetrics,
    isLoading,
    getTrend,
    getMetricChange,
    hasHistory: historicalMetrics.length > 1
  };
}

/**
 * Hook for personalized content sections
 */
export function usePersonalizedContent() {
  const { content, isLoading } = useAIDashboard();

  const [preferences, setPreferences] = useState({
    showMorningBriefing: true,
    showDiscoveryFeed: true,
    showLearningPath: true,
    showSocialUpdates: true
  });

  const updatePreference = useCallback((key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    content,
    preferences,
    updatePreference,
    isLoading,
    morningBriefing: content?.morning_briefing,
    discoveryFeed: content?.discovery_feed || [],
    learningPath: content?.learning_path || [],
    socialUpdates: content?.social_updates || []
  };
}

/**
 * Hook for weather insights
 */
export function useWeatherInsights() {
  const { content } = usePersonalizedContent();
  const weather = content?.morning_briefing?.weather;

  const getWeatherRecommendations = useCallback(() => {
    if (!weather) return [];
    
    const recommendations = [...(weather.recommendations || [])];
    
    // Add temperature-based recommendations
    if (weather.current.temperature > 35) {
      recommendations.push('Stay hydrated and seek air-conditioned spaces');
    } else if (weather.current.temperature < 20) {
      recommendations.push('Perfect weather for outdoor activities');
    }
    
    // Add humidity-based recommendations
    if (weather.current.humidity > 80) {
      recommendations.push('High humidity - indoor activities recommended');
    }
    
    return recommendations;
  }, [weather]);

  const getOutfitRecommendation = useCallback(() => {
    if (!weather) return 'Comfortable clothing recommended';
    
    const temp = weather.current.temperature;
    
    if (temp > 35) return 'Light, breathable fabrics and sun protection';
    if (temp > 25) return 'Light summer clothing';
    if (temp > 20) return 'Comfortable casual wear';
    return 'Light jacket recommended';
  }, [weather]);

  return {
    weather,
    recommendations: getWeatherRecommendations(),
    outfitRecommendation: getOutfitRecommendation(),
    isHot: weather?.current.temperature && weather.current.temperature > 35,
    isCool: weather?.current.temperature && weather.current.temperature < 25
  };
}

/**
 * Hook for traffic insights
 */
export function useTrafficInsights() {
  const { content } = usePersonalizedContent();
  const traffic = content?.morning_briefing?.traffic;

  const getSeverityColor = useCallback((condition: string) => {
    switch (condition) {
      case 'light': return 'green';
      case 'moderate': return 'yellow';
      case 'heavy': return 'orange';
      case 'severe': return 'red';
      default: return 'gray';
    }
  }, []);

  const getRouteSuggestions = useCallback(() => {
    if (!traffic?.affected_routes) return [];
    
    return traffic.affected_routes
      .filter(route => route.alternative)
      .map(route => ({
        original: route.route,
        alternative: route.alternative!,
        timeSaving: route.delay_minutes
      }));
  }, [traffic]);

  return {
    traffic,
    severityColor: getSeverityColor(traffic?.current_conditions || 'light'),
    routeSuggestions: getRouteSuggestions(),
    hasDelays: traffic?.affected_routes && traffic.affected_routes.length > 0,
    recommendations: traffic?.recommendations || []
  };
}

/**
 * Hook for learning path management
 */
export function useLearningPath() {
  const { learningPath } = usePersonalizedContent();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const markStepCompleted = useCallback((topicId: string, step: string) => {
    setCompletedSteps(prev => new Set(prev).add(`${topicId}:${step}`));
  }, []);

  const getTopicProgress = useCallback((topic: any) => {
    const totalSteps = topic.next_steps?.length || 0;
    const completed = topic.next_steps?.filter((step: string) => 
      completedSteps.has(`${topic.topic}:${step}`)
    ).length || 0;
    
    return totalSteps > 0 ? (completed / totalSteps) * 100 : topic.progress;
  }, [completedSteps]);

  const getNextRecommendation = useCallback(() => {
    if (!learningPath.length) return null;
    
    // Find topic with lowest progress
    return learningPath.reduce((lowest, current) => 
      current.progress < lowest.progress ? current : lowest
    );
  }, [learningPath]);

  return {
    learningPath,
    completedSteps: completedSteps.size,
    markStepCompleted,
    getTopicProgress,
    nextRecommendation: getNextRecommendation(),
    totalTopics: learningPath.length
  };
}

/**
 * Hook for insight actions
 */
export function useInsightActions() {
  const queryClient = useQueryClient();

  const executeAction = useCallback(async (action: UserInsight['actions'][0]) => {
    switch (action.type) {
      case 'navigate':
        window.location.href = action.target;
        break;
      
      case 'bookmark':
        // Implement bookmark functionality
                break;
      
      case 'share':
        if (navigator.share) {
          await navigator.share({
            title: 'MyDub.AI Insight',
            url: action.target
          });
        }
        break;
      
      case 'contact':
        window.location.href = `mailto:${action.target}`;
        break;
    }
  }, []);

  const trackInsightInteraction = useCallback((insightId: string, actionType: string) => {
    // Track interaction for analytics
        // Invalidate insights to refresh
    queryClient.invalidateQueries({ queryKey: ['ai-dashboard'] });
  }, [queryClient]);

  return {
    executeAction,
    trackInsightInteraction
  };
}

/**
 * Hook for dashboard customization
 */
export function useDashboardCustomization() {
  const [layout, setLayout] = useState({
    insights: { position: 1, visible: true },
    metrics: { position: 2, visible: true },
    weather: { position: 3, visible: true },
    traffic: { position: 4, visible: true },
    learning: { position: 5, visible: true },
    discovery: { position: 6, visible: true }
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  const updateWidgetVisibility = useCallback((widget: keyof typeof layout, visible: boolean) => {
    setLayout(prev => ({
      ...prev,
      [widget]: { ...prev[widget], visible }
    }));
  }, []);

  const updateWidgetPosition = useCallback((widget: keyof typeof layout, position: number) => {
    setLayout(prev => ({
      ...prev,
      [widget]: { ...prev[widget], position }
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout({
      insights: { position: 1, visible: true },
      metrics: { position: 2, visible: true },
      weather: { position: 3, visible: true },
      traffic: { position: 4, visible: true },
      learning: { position: 5, visible: true },
      discovery: { position: 6, visible: true }
    });
  }, []);

  const getOrderedWidgets = useCallback(() => {
    return Object.entries(layout)
      .filter(([_, config]) => config.visible)
      .sort(([_, a], [__, b]) => a.position - b.position)
      .map(([widget, _]) => widget);
  }, [layout]);

  return {
    layout,
    theme,
    setTheme,
    updateWidgetVisibility,
    updateWidgetPosition,
    resetLayout,
    getOrderedWidgets
  };
}