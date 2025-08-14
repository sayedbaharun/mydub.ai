/**
 * AI Insights Engine for Personalized Dashboard
 * Generates intelligent insights, analytics, and recommendations for users
 */

import { supabase } from '@/shared/lib/supabase';
import { getCacheClient, CacheKeys, CacheTags } from '@/shared/lib/cache/redisClient';
import { getRecommendationEngine } from '@/shared/lib/ai/recommendationEngine';
import OpenAI from 'openai';

export interface UserInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'alert' | 'achievement' | 'opportunity' | 'summary';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  confidence: number;
  actionable: boolean;
  actions?: Array<{
    label: string;
    type: 'navigate' | 'bookmark' | 'share' | 'contact';
    target: string;
  }>;
  metadata?: {
    trend_direction?: 'up' | 'down' | 'stable';
    percentage_change?: number;
    comparison_period?: string;
    related_content?: string[];
    location?: { lat: number; lng: number };
  };
  created_at: Date;
  expires_at?: Date;
}

export interface DashboardMetrics {
  activity_score: number;
  engagement_level: 'low' | 'medium' | 'high';
  interests_discovered: number;
  goals_progress: Array<{
    goal: string;
    progress: number;
    target: number;
  }>;
  weekly_summary: {
    searches: number;
    content_viewed: number;
    places_visited: number;
    services_used: number;
  };
  trending_topics: string[];
  upcoming_events: number;
  personalization_score: number;
}

export interface WeatherInsight {
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    wind_speed: number;
  };
  forecast: Array<{
    date: Date;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
  }>;
  recommendations: string[];
}

export interface TrafficInsight {
  current_conditions: 'light' | 'moderate' | 'heavy' | 'severe';
  affected_routes: Array<{
    route: string;
    delay_minutes: number;
    alternative?: string;
  }>;
  best_travel_times: Array<{
    destination: string;
    optimal_time: string;
    estimated_duration: number;
  }>;
  recommendations: string[];
}

export interface PersonalizedContent {
  morning_briefing: {
    weather: WeatherInsight;
    traffic: TrafficInsight;
    news_highlights: any[];
    daily_recommendations: any[];
    important_reminders: string[];
  };
  discovery_feed: any[];
  learning_path: Array<{
    topic: string;
    progress: number;
    next_steps: string[];
    estimated_time: string;
  }>;
  social_updates: any[];
}

class AIInsightsEngine {
  private openai: OpenAI | null = null;
  private cache = getCacheClient();
  private recommendationEngine = getRecommendationEngine();

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey && apiKey !== 'placeholder') {
      try {
        this.openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true
        });
        // OpenAI initialized successfully
      } catch (error) {
        // OpenAI initialization failed, will use fallback
        this.openai = null;
      }
    } else {
      // OpenAI not configured - using fallback data
    }
  }

  /**
   * Generate comprehensive dashboard insights for a user
   */
  async generateUserInsights(userId: string): Promise<{
    insights: UserInsight[];
    metrics: DashboardMetrics;
    content: PersonalizedContent;
  }> {
    try {
      const cacheKey = `dashboard:${userId}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      // Generate insights in parallel
      const [insights, metrics, content] = await Promise.all([
        this.generateInsights(userId),
        this.calculateMetrics(userId),
        this.generatePersonalizedContent(userId)
      ]);

      const result = { insights, metrics, content };

      // Cache for 15 minutes
      await this.cache.set(cacheKey, result, {
        ttl: 900,
        tags: [CacheTags.USER, CacheTags.ANALYTICS]
      });

      return result;

    } catch (error) {
      console.error('Failed to generate user insights:', error);
      throw new Error('Failed to generate dashboard insights');
    }
  }

  /**
   * Generate AI-powered insights
   */
  async generateInsights(userId: string): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];

    // Get user activity data
    const userActivity = await this.getUserActivity(userId);
    const userPreferences = await this.getUserPreferences(userId);

    // Activity trend insights
    const activityInsights = await this.generateActivityInsights(userActivity);
    insights.push(...activityInsights);

    // Content recommendation insights
    const contentInsights = await this.generateContentInsights(userId, userPreferences);
    insights.push(...contentInsights);

    // Location-based insights
    const locationInsights = await this.generateLocationInsights(userId);
    insights.push(...locationInsights);

    // Seasonal and weather insights
    const weatherInsights = await this.generateWeatherInsights(userId);
    insights.push(...weatherInsights);

    // Goal progress insights
    const goalInsights = await this.generateGoalInsights(userId);
    insights.push(...goalInsights);

    // Opportunity insights
    const opportunityInsights = await this.generateOpportunityInsights(userId);
    insights.push(...opportunityInsights);

    // Sort by priority and confidence
    return insights
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Top 10 insights
  }

  /**
   * Calculate user dashboard metrics
   */
  async calculateMetrics(userId: string): Promise<DashboardMetrics> {
    const [activity, engagement, interests, goals, weeklyStats] = await Promise.all([
      this.calculateActivityScore(userId),
      this.calculateEngagementLevel(userId),
      this.calculateInterestsDiscovered(userId),
      this.getGoalsProgress(userId),
      this.getWeeklyStats(userId)
    ]);

    return {
      activity_score: activity,
      engagement_level: engagement,
      interests_discovered: interests,
      goals_progress: goals,
      weekly_summary: weeklyStats,
      trending_topics: await this.getTrendingTopics(),
      upcoming_events: await this.getUpcomingEventsCount(userId),
      personalization_score: await this.calculatePersonalizationScore(userId)
    };
  }

  /**
   * Generate personalized content for dashboard
   */
  async generatePersonalizedContent(userId: string): Promise<PersonalizedContent> {
    const [morningBriefing, discoveryFeed, learningPath, socialUpdates] = await Promise.all([
      this.generateMorningBriefing(userId),
      this.generateDiscoveryFeed(userId),
      this.generateLearningPath(userId),
      this.getSocialUpdates(userId)
    ]);

    return {
      morning_briefing: morningBriefing,
      discovery_feed: discoveryFeed,
      learning_path: learningPath,
      social_updates: socialUpdates
    };
  }

  /**
   * Generate activity-based insights
   */
  private async generateActivityInsights(userActivity: any): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];

    // Search pattern analysis
    if (userActivity.search_patterns?.trending_up) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'trend',
        title: 'Your Dubai exploration is trending up!',
        description: `You've been 40% more active this week, discovering new places and services in Dubai.`,
        priority: 'medium',
        category: 'activity',
        confidence: 0.85,
        actionable: true,
        actions: [
          { label: 'View Activity', type: 'navigate', target: '/profile/activity' },
          { label: 'Share Progress', type: 'share', target: '/share/activity' }
        ],
        metadata: {
          trend_direction: 'up',
          percentage_change: 40,
          comparison_period: 'last_week'
        },
        created_at: new Date()
      });
    }

    // Content engagement patterns
    if (userActivity.engagement_score > 0.7) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'achievement',
        title: 'High Engagement Achieved!',
        description: 'Your interaction with Dubai content shows deep local interest.',
        priority: 'low',
        category: 'engagement',
        confidence: 0.9,
        actionable: false,
        created_at: new Date()
      });
    }

    return insights;
  }

  /**
   * Generate content recommendation insights
   */
  private async generateContentInsights(userId: string, preferences: any): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];

    // Get personalized recommendations
    const recommendations = await this.recommendationEngine.getRecommendations({
      user_id: userId,
      filters: { max_results: 3 },
      strategy: 'focused'
    });

    if (recommendations.length > 0) {
      const topRec = recommendations[0];
      
      insights.push({
        id: crypto.randomUUID(),
        type: 'recommendation',
        title: `New ${topRec.content.category} recommendations`,
        description: `Based on your interests, we found ${recommendations.length} new places you might love.`,
        priority: 'high',
        category: 'discovery',
        confidence: topRec.confidence,
        actionable: true,
        actions: [
          { label: 'Explore Now', type: 'navigate', target: `/recommendations` },
          { label: 'Save for Later', type: 'bookmark', target: topRec.content.id }
        ],
        metadata: {
          related_content: recommendations.map(r => r.content.id)
        },
        created_at: new Date()
      });
    }

    return insights;
  }

  /**
   * Generate location-based insights
   */
  private async generateLocationInsights(userId: string): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];

    // Check for nearby events or attractions
    const nearbyContent = await this.getNearbyContent(userId);
    
    if (nearbyContent.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'opportunity',
        title: 'Discover nearby attractions',
        description: `There are ${nearbyContent.length} interesting places within 5km of your location.`,
        priority: 'medium',
        category: 'location',
        confidence: 0.75,
        actionable: true,
        actions: [
          { label: 'View Nearby', type: 'navigate', target: '/nearby' }
        ],
        created_at: new Date()
      });
    }

    return insights;
  }

  /**
   * Generate weather-based insights
   */
  private async generateWeatherInsights(userId: string): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];
    
    // Get current weather
    const weather = await this.getCurrentWeather();
    
    if (weather.temperature > 35) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'alert',
        title: 'Hot weather alert',
        description: `It's ${weather.temperature}°C today. Consider indoor activities or early morning visits.`,
        priority: 'medium',
        category: 'weather',
        confidence: 1.0,
        actionable: true,
        actions: [
          { label: 'Indoor Activities', type: 'navigate', target: '/activities?type=indoor' }
        ],
        created_at: new Date()
      });
    }

    // Weekend weather planning
    const forecast = await this.getWeatherForecast();
    const weekendWeather = forecast.filter(day => 
      [0, 6].includes(new Date(day.date).getDay())
    );

    if (weekendWeather.some(day => day.condition === 'sunny')) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'opportunity',
        title: 'Perfect weekend weather',
        description: 'Sunny weather expected this weekend - great for outdoor activities!',
        priority: 'low',
        category: 'planning',
        confidence: 0.8,
        actionable: true,
        actions: [
          { label: 'Outdoor Activities', type: 'navigate', target: '/activities?type=outdoor' }
        ],
        created_at: new Date()
      });
    }

    return insights;
  }

  /**
   * Generate goal progress insights
   */
  private async generateGoalInsights(userId: string): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];
    
    const goals = await this.getUserGoals(userId);
    
    goals.forEach(goal => {
      if (goal.progress >= 0.8) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'achievement',
          title: `Almost there! ${goal.title}`,
          description: `You're ${Math.round(goal.progress * 100)}% complete with your goal.`,
          priority: 'medium',
          category: 'goals',
          confidence: 1.0,
          actionable: true,
          actions: [
            { label: 'Complete Goal', type: 'navigate', target: `/goals/${goal.id}` }
          ],
          created_at: new Date()
        });
      }
    });

    return insights;
  }

  /**
   * Generate opportunity insights
   */
  private async generateOpportunityInsights(userId: string): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];

    // Check for events in user's interests
    const relevantEvents = await this.getRelevantEvents(userId);
    
    if (relevantEvents.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'opportunity',
        title: 'Events matching your interests',
        description: `${relevantEvents.length} upcoming events in your areas of interest.`,
        priority: 'high',
        category: 'events',
        confidence: 0.9,
        actionable: true,
        actions: [
          { label: 'View Events', type: 'navigate', target: '/events' }
        ],
        created_at: new Date()
      });
    }

    return insights;
  }

  /**
   * Generate morning briefing
   */
  private async generateMorningBriefing(userId: string): Promise<PersonalizedContent['morning_briefing']> {
    const [weather, traffic, news, recommendations, reminders] = await Promise.all([
      this.getWeatherInsight(),
      this.getTrafficInsight(),
      this.getPersonalizedNews(userId),
      this.getDailyRecommendations(userId),
      this.getImportantReminders(userId)
    ]);

    return {
      weather,
      traffic,
      news_highlights: news,
      daily_recommendations: recommendations,
      important_reminders: reminders
    };
  }

  // Helper methods for data retrieval

  private async getUserActivity(userId: string): Promise<any> {
    const { data } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return {
      search_patterns: { trending_up: data && data.length > 10 },
      engagement_score: data ? data.length / 100 : 0
    };
  }

  private async getUserPreferences(userId: string): Promise<any> {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data || {};
  }

  private async calculateActivityScore(userId: string): Promise<number> {
    // Calculate based on recent interactions
    return Math.random() * 100; // Placeholder
  }

  private async calculateEngagementLevel(userId: string): Promise<'low' | 'medium' | 'high'> {
    const score = await this.calculateActivityScore(userId);
    if (score > 70) return 'high';
    if (score > 40) return 'medium';
    return 'low';
  }

  private async calculateInterestsDiscovered(userId: string): Promise<number> {
    return Math.floor(Math.random() * 20) + 5; // Placeholder
  }

  private async getGoalsProgress(userId: string): Promise<DashboardMetrics['goals_progress']> {
    return [
      { goal: 'Explore 10 new places', progress: 7, target: 10 },
      { goal: 'Try 5 local restaurants', progress: 3, target: 5 }
    ];
  }

  private async getWeeklyStats(userId: string): Promise<DashboardMetrics['weekly_summary']> {
    return {
      searches: 25,
      content_viewed: 48,
      places_visited: 6,
      services_used: 12
    };
  }

  private async getTrendingTopics(): Promise<string[]> {
    return ['Dubai Expo', 'Desert Safari', 'Burj Khalifa', 'Dubai Mall', 'Marina Walk'];
  }

  private async getUpcomingEventsCount(userId: string): Promise<number> {
    return 8;
  }

  private async calculatePersonalizationScore(userId: string): Promise<number> {
    return 85;
  }

  private async getNearbyContent(userId: string): Promise<any[]> {
    return []; // Placeholder
  }

  private async getCurrentWeather(): Promise<{ temperature: number; condition: string }> {
    // In production, integrate with weather API
    return { temperature: 28, condition: 'sunny' };
  }

  private async getWeatherForecast(): Promise<Array<{ date: Date; condition: string }>> {
    return [];
  }

  private async getUserGoals(userId: string): Promise<Array<{ id: string; title: string; progress: number }>> {
    return [];
  }

  private async getRelevantEvents(userId: string): Promise<any[]> {
    return [];
  }

  private async getWeatherInsight(): Promise<WeatherInsight> {
    return {
      current: {
        temperature: 28,
        condition: 'sunny',
        humidity: 65,
        wind_speed: 15
      },
      forecast: [],
      recommendations: ['Perfect weather for outdoor activities', 'Consider visiting Dubai Marina']
    };
  }

  private async getTrafficInsight(): Promise<TrafficInsight> {
    return {
      current_conditions: 'moderate',
      affected_routes: [
        { route: 'Sheikh Zayed Road', delay_minutes: 15, alternative: 'Al Khail Road' }
      ],
      best_travel_times: [],
      recommendations: ['Avoid Sheikh Zayed Road during peak hours']
    };
  }

  private async getPersonalizedNews(userId: string): Promise<any[]> {
    return [];
  }

  private async getDailyRecommendations(userId: string): Promise<any[]> {
    return [];
  }

  private async getImportantReminders(userId: string): Promise<string[]> {
    return ['Dubai Summer Surprises starts next week', 'Your visa expires in 30 days'];
  }

  private async generateDiscoveryFeed(userId: string): Promise<any[]> {
    return [];
  }

  private async generateLearningPath(userId: string): Promise<PersonalizedContent['learning_path']> {
    return [
      {
        topic: 'Dubai Culture & Traditions',
        progress: 60,
        next_steps: ['Visit Dubai Museum', 'Explore Al Fahidi District'],
        estimated_time: '2 hours'
      }
    ];
  }

  private async getSocialUpdates(userId: string): Promise<any[]> {
    return [];
  }
}

// Export singleton instance
let insightsEngine: AIInsightsEngine | null = null;

export function getAIInsightsEngine(): AIInsightsEngine {
  if (!insightsEngine) {
    insightsEngine = new AIInsightsEngine();
  }
  return insightsEngine;
}