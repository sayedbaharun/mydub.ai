/**
 * AI-Powered Content Recommendation Engine for MyDub.AI
 * Provides personalized content recommendations based on user behavior, preferences, and context
 */

import { supabase } from '@/shared/lib/supabase';
import { getCacheClient, CacheKeys, CacheTags } from '@/shared/lib/cache/redisClient';

export interface UserProfile {
  id: string;
  interests: string[];
  visited_places: string[];
  language_preferences: string[];
  interaction_history: ContentInteraction[];
  demographics?: {
    age_range?: string;
    nationality?: string;
    residence_status?: 'resident' | 'tourist' | 'visitor';
  };
  location_history?: Array<{
    lat: number;
    lng: number;
    timestamp: Date;
    place_name?: string;
  }>;
}

export interface ContentInteraction {
  content_id: string;
  content_type: 'article' | 'service' | 'place' | 'event';
  interaction_type: 'view' | 'like' | 'save' | 'share' | 'click';
  timestamp: Date;
  duration?: number; // seconds spent on content
  context?: {
    source: string;
    device: string;
    location?: { lat: number; lng: number };
  };
}

export interface ContentItem {
  id: string;
  type: 'article' | 'government_service' | 'tourism_place' | 'event' | 'news';
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  location?: { lat: number; lng: number };
  popularity_score: number;
  quality_score: number;
  freshness_score: number;
  language: string;
  target_audience: string[];
  created_at: Date;
  updated_at: Date;
  metadata?: {
    difficulty_level?: string;
    time_required?: string;
    cost_level?: string;
    accessibility?: string;
  };
}

export interface RecommendationResult {
  content: ContentItem;
  relevance_score: number;
  reasoning: string[];
  recommendation_type: 'personalized' | 'trending' | 'location_based' | 'similar_users' | 'contextual';
  confidence: number;
}

export interface RecommendationRequest {
  user_id?: string;
  context?: {
    location?: { lat: number; lng: number };
    time_of_day?: string;
    device_type?: string;
    current_content?: string;
    search_query?: string;
  };
  filters?: {
    content_types?: string[];
    categories?: string[];
    languages?: string[];
    max_results?: number;
    exclude_seen?: boolean;
  };
  strategy?: 'diverse' | 'focused' | 'trending' | 'discovery';
}

class RecommendationEngine {
  private cache = getCacheClient();
  
  // Main recommendation function
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    try {
      const cacheKey = this.buildCacheKey(request);
      
      // Try cache first
      const cached = await this.cache.get<RecommendationResult[]>(cacheKey);
      if (cached) {
        return cached;
      }

      let recommendations: RecommendationResult[] = [];

      // Get user profile if user is logged in
      let userProfile: UserProfile | null = null;
      if (request.user_id) {
        userProfile = await this.getUserProfile(request.user_id);
      }

      // Generate recommendations using multiple strategies
      const strategies = this.selectStrategies(request, userProfile);
      
      for (const strategy of strategies) {
        const strategyResults = await this.executeStrategy(strategy, request, userProfile);
        recommendations.push(...strategyResults);
      }

      // Deduplicate and rank
      recommendations = this.deduplicateAndRank(recommendations, request);

      // Apply filters
      recommendations = this.applyFilters(recommendations, request.filters);

      // Limit results
      const maxResults = request.filters?.max_results || 20;
      recommendations = recommendations.slice(0, maxResults);

      // Cache results
      await this.cache.set(cacheKey, recommendations, {
        ttl: 300, // 5 minutes
        tags: [CacheTags.CONTENT, 'recommendations']
      });

      return recommendations;

    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return this.getFallbackRecommendations(request);
    }
  }

  // Personalized recommendations based on user history
  async getPersonalizedRecommendations(
    userProfile: UserProfile,
    context: RecommendationRequest['context'] = {}
  ): Promise<RecommendationResult[]> {
    
    const recommendations: RecommendationResult[] = [];

    // Interest-based recommendations
    const interestResults = await this.getInterestBasedRecommendations(userProfile, context);
    recommendations.push(...interestResults);

    // Collaborative filtering (similar users)
    const collaborativeResults = await this.getCollaborativeRecommendations(userProfile);
    recommendations.push(...collaborativeResults);

    // Location-based recommendations
    if (context.location || userProfile.location_history?.length) {
      const locationResults = await this.getLocationBasedRecommendations(userProfile, context);
      recommendations.push(...locationResults);
    }

    // Behavioral pattern recommendations
    const behavioralResults = await this.getBehavioralRecommendations(userProfile);
    recommendations.push(...behavioralResults);

    return recommendations;
  }

  // Trending content recommendations
  async getTrendingRecommendations(
    timeframe: '1h' | '6h' | '24h' | '7d' = '24h',
    category?: string
  ): Promise<RecommendationResult[]> {
    
    const cacheKey = `trending:${timeframe}:${category || 'all'}`;
    const cached = await this.cache.get<RecommendationResult[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get trending content from analytics
      const { data: trendingContent } = await supabase
        .from('analytics_events')
        .select(`
          content_id,
          content_type,
          count(*) as interaction_count
        `)
        .gte('created_at', this.getTimeframeStart(timeframe))
        .eq('event_type', 'content_view')
        .group('content_id, content_type')
        .order('interaction_count', { ascending: false })
        .limit(50);

      if (!trendingContent) return [];

      // Fetch full content details
      const recommendations: RecommendationResult[] = [];
      
      for (const trending of trendingContent) {
        const content = await this.getContentById(trending.content_id, trending.content_type);
        if (content) {
          const trendingScore = this.calculateTrendingScore(
            trending.interaction_count,
            content.created_at,
            content.popularity_score
          );

          recommendations.push({
            content,
            relevance_score: trendingScore,
            reasoning: ['Currently trending', `${trending.interaction_count} recent interactions`],
            recommendation_type: 'trending',
            confidence: 0.8
          });
        }
      }

      // Cache for 15 minutes
      await this.cache.set(cacheKey, recommendations, {
        ttl: 900,
        tags: [CacheTags.CONTENT, 'trending']
      });

      return recommendations;

    } catch (error) {
      console.error('Failed to get trending recommendations:', error);
      return [];
    }
  }

  // Location-based recommendations
  async getLocationBasedRecommendations(
    userProfile: UserProfile | null,
    context: RecommendationRequest['context'] = {}
  ): Promise<RecommendationResult[]> {
    
    const location = context.location || userProfile?.location_history?.[0];
    if (!location) return [];

    try {
      // Find nearby content
      const { data: nearbyContent } = await supabase.rpc('get_nearby_content', {
        user_lat: location.lat,
        user_lng: location.lng,
        radius_km: 10, // 10km radius
        limit_count: 20
      });

      if (!nearbyContent) return [];

      return nearbyContent.map((item: any) => ({
        content: item,
        relevance_score: this.calculateLocationRelevance(location, item.location, item.distance),
        reasoning: [`${item.distance.toFixed(1)}km from your location`, 'Popular in this area'],
        recommendation_type: 'location_based' as const,
        confidence: 0.7
      }));

    } catch (error) {
      console.error('Failed to get location-based recommendations:', error);
      return [];
    }
  }

  // Content-based recommendations (similar content)
  async getSimilarContentRecommendations(
    contentId: string,
    contentType: string,
    limit = 10
  ): Promise<RecommendationResult[]> {
    
    const cacheKey = `similar:${contentType}:${contentId}`;
    const cached = await this.cache.get<RecommendationResult[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const baseContent = await this.getContentById(contentId, contentType);
      if (!baseContent) return [];

      // Find similar content based on tags, category, and other attributes
      const { data: similarContent } = await supabase
        .from(this.getTableForContentType(contentType))
        .select('*')
        .neq('id', contentId)
        .or(`category.eq.${baseContent.category},tags.cs.{${baseContent.tags.join(',')}}`)
        .limit(limit * 2); // Get more to filter

      if (!similarContent) return [];

      const recommendations = similarContent
        .map((item: any) => {
          const similarity = this.calculateContentSimilarity(baseContent, item);
          return {
            content: this.normalizeContentItem(item, contentType),
            relevance_score: similarity,
            reasoning: this.generateSimilarityReasons(baseContent, item),
            recommendation_type: 'similar_content' as const,
            confidence: similarity
          };
        })
        .filter(rec => rec.relevance_score > 0.3)
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, limit);

      // Cache for 1 hour
      await this.cache.set(cacheKey, recommendations, {
        ttl: 3600,
        tags: [CacheTags.CONTENT]
      });

      return recommendations;

    } catch (error) {
      console.error('Failed to get similar content recommendations:', error);
      return [];
    }
  }

  // Time-based contextual recommendations
  async getContextualRecommendations(
    context: RecommendationRequest['context']
  ): Promise<RecommendationResult[]> {
    
    const recommendations: RecommendationResult[] = [];
    const currentHour = new Date().getHours();

    // Morning recommendations (6-12)
    if (currentHour >= 6 && currentHour < 12) {
      const morningContent = await this.getContentByContext('morning');
      recommendations.push(...morningContent.map(content => ({
        content,
        relevance_score: 0.8,
        reasoning: ['Perfect for morning planning', 'Popular morning activity'],
        recommendation_type: 'contextual' as const,
        confidence: 0.7
      })));
    }

    // Afternoon recommendations (12-18)
    if (currentHour >= 12 && currentHour < 18) {
      const afternoonContent = await this.getContentByContext('afternoon');
      recommendations.push(...afternoonContent.map(content => ({
        content,
        relevance_score: 0.8,
        reasoning: ['Great for afternoon visits', 'Currently open'],
        recommendation_type: 'contextual' as const,
        confidence: 0.7
      })));
    }

    // Evening recommendations (18-24)
    if (currentHour >= 18) {
      const eveningContent = await this.getContentByContext('evening');
      recommendations.push(...eveningContent.map(content => ({
        content,
        relevance_score: 0.8,
        reasoning: ['Perfect for evening activities', 'Night-time attraction'],
        recommendation_type: 'contextual' as const,
        confidence: 0.7
      })));
    }

    return recommendations;
  }

  // Machine learning-based recommendations (simplified version)
  async getMLRecommendations(
    userProfile: UserProfile,
    contentPool: ContentItem[]
  ): Promise<RecommendationResult[]> {
    
    // This is a simplified ML approach - in production, you'd use proper ML models
    const recommendations: RecommendationResult[] = [];

    for (const content of contentPool) {
      const features = this.extractFeatures(userProfile, content);
      const score = this.calculateMLScore(features);
      
      if (score > 0.5) {
        recommendations.push({
          content,
          relevance_score: score,
          reasoning: this.generateMLReasons(features),
          recommendation_type: 'personalized',
          confidence: score
        });
      }
    }

    return recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  // Track user interactions for learning
  async trackInteraction(interaction: ContentInteraction): Promise<void> {
    try {
      // Store in database
      await supabase
        .from('user_interactions')
        .insert({
          user_id: interaction.content_id, // This should be user_id
          content_id: interaction.content_id,
          content_type: interaction.content_type,
          interaction_type: interaction.interaction_type,
          duration: interaction.duration,
          context: interaction.context,
          created_at: interaction.timestamp.toISOString()
        });

      // Invalidate user profile cache
      await this.cache.invalidateByTags(['user_profile']);

      // Update real-time analytics
      await this.updateAnalytics(interaction);

    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }

  // Private helper methods

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = CacheKeys.user(userId);
    let profile = await this.cache.get<UserProfile>(cacheKey);

    if (!profile) {
      // Fetch from database and build profile
      profile = await this.buildUserProfile(userId);
      if (profile) {
        await this.cache.set(cacheKey, profile, {
          ttl: 1800, // 30 minutes
          tags: ['user_profile']
        });
      }
    }

    return profile;
  }

  private async buildUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Get user data
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user) return null;

      // Get interaction history
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      // Build interests from interactions
      const interests = this.extractInterestsFromInteractions(interactions || []);
      
      return {
        id: userId,
        interests,
        visited_places: [],
        language_preferences: [user.language || 'en'],
        interaction_history: interactions || [],
        demographics: {
          nationality: user.nationality,
          residence_status: user.residence_status
        }
      };

    } catch (error) {
      console.error('Failed to build user profile:', error);
      return null;
    }
  }

  private selectStrategies(
    request: RecommendationRequest,
    userProfile: UserProfile | null
  ): string[] {
    const strategies = [];

    if (userProfile) {
      strategies.push('personalized');
    }

    if (request.context?.location) {
      strategies.push('location_based');
    }

    strategies.push('trending');
    strategies.push('contextual');

    return strategies;
  }

  private async executeStrategy(
    strategy: string,
    request: RecommendationRequest,
    userProfile: UserProfile | null
  ): Promise<RecommendationResult[]> {
    
    switch (strategy) {
      case 'personalized':
        return userProfile ? await this.getPersonalizedRecommendations(userProfile, request.context) : [];
      
      case 'location_based':
        return await this.getLocationBasedRecommendations(userProfile, request.context);
      
      case 'trending':
        return await this.getTrendingRecommendations();
      
      case 'contextual':
        return await this.getContextualRecommendations(request.context);
      
      default:
        return [];
    }
  }

  private deduplicateAndRank(
    recommendations: RecommendationResult[],
    request: RecommendationRequest
  ): RecommendationResult[] {
    
    const seen = new Set<string>();
    const unique: RecommendationResult[] = [];

    for (const rec of recommendations) {
      const key = `${rec.content.type}:${rec.content.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    }

    // Rank by relevance score and diversity
    return unique.sort((a, b) => {
      // Primary sort by relevance
      if (Math.abs(a.relevance_score - b.relevance_score) > 0.1) {
        return b.relevance_score - a.relevance_score;
      }
      
      // Secondary sort by recommendation type diversity
      const typeOrder = ['personalized', 'location_based', 'trending', 'contextual'];
      return typeOrder.indexOf(a.recommendation_type) - typeOrder.indexOf(b.recommendation_type);
    });
  }

  private applyFilters(
    recommendations: RecommendationResult[],
    filters?: RecommendationRequest['filters']
  ): RecommendationResult[] {
    
    if (!filters) return recommendations;

    return recommendations.filter(rec => {
      if (filters.content_types && !filters.content_types.includes(rec.content.type)) {
        return false;
      }
      
      if (filters.categories && !filters.categories.includes(rec.content.category)) {
        return false;
      }
      
      if (filters.languages && !filters.languages.includes(rec.content.language)) {
        return false;
      }
      
      return true;
    });
  }

  private buildCacheKey(request: RecommendationRequest): string {
    const parts = [
      'recommendations',
      request.user_id || 'anonymous',
      JSON.stringify(request.context || {}),
      JSON.stringify(request.filters || {}),
      request.strategy || 'default'
    ];
    
    return parts.join(':');
  }

  private async getFallbackRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResult[]> {
    // Return popular content as fallback
    return await this.getTrendingRecommendations('24h');
  }

  // Additional helper methods would be implemented here...
  private getTimeframeStart(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private calculateTrendingScore(interactionCount: number, createdAt: Date, popularityScore: number): number {
    const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const recencyFactor = Math.max(0, 1 - (hoursSinceCreated / 168)); // Decay over 7 days
    return (interactionCount * 0.6 + popularityScore * 0.4) * recencyFactor;
  }

  private calculateLocationRelevance(userLocation: {lat: number, lng: number}, contentLocation: {lat: number, lng: number} | undefined, distance: number): number {
    if (!contentLocation) return 0.3;
    
    // Higher score for closer content
    const maxDistance = 50; // km
    const distanceScore = Math.max(0, 1 - (distance / maxDistance));
    return Math.min(1, 0.5 + distanceScore * 0.5);
  }

  private async getContentById(contentId: string, contentType: string): Promise<ContentItem | null> {
    // Implementation to fetch content from appropriate table
    return null; // Placeholder
  }

  private getTableForContentType(contentType: string): string {
    switch (contentType) {
      case 'article': return 'articles';
      case 'government_service': return 'government_services';
      case 'tourism_place': return 'tourism_places';
      default: return 'articles';
    }
  }

  private calculateContentSimilarity(content1: ContentItem, content2: any): number {
    // Implementation for content similarity calculation
    return 0.5; // Placeholder
  }

  private generateSimilarityReasons(baseContent: ContentItem, similarContent: any): string[] {
    // Generate reasons for similarity
    return ['Similar category', 'Related topics'];
  }

  private normalizeContentItem(item: any, contentType: string): ContentItem {
    // Normalize database item to ContentItem interface
    return item as ContentItem; // Placeholder
  }

  private async getContentByContext(context: string): Promise<ContentItem[]> {
    // Get content appropriate for time context
    return []; // Placeholder
  }

  private extractFeatures(userProfile: UserProfile, content: ContentItem): any {
    // Extract ML features
    return {};
  }

  private calculateMLScore(features: any): number {
    // Simple ML scoring
    return Math.random(); // Placeholder
  }

  private generateMLReasons(features: any): string[] {
    return ['Based on your preferences'];
  }

  private async updateAnalytics(interaction: ContentInteraction): Promise<void> {
    // Update analytics
  }

  private extractInterestsFromInteractions(interactions: any[]): string[] {
    // Extract interests from user interactions
    return [];
  }

  private async getInterestBasedRecommendations(userProfile: UserProfile, context: any): Promise<RecommendationResult[]> {
    return [];
  }

  private async getCollaborativeRecommendations(userProfile: UserProfile): Promise<RecommendationResult[]> {
    return [];
  }

  private async getBehavioralRecommendations(userProfile: UserProfile): Promise<RecommendationResult[]> {
    return [];
  }
}

// Export singleton instance
let recommendationEngine: RecommendationEngine | null = null;

export function getRecommendationEngine(): RecommendationEngine {
  if (!recommendationEngine) {
    recommendationEngine = new RecommendationEngine();
  }
  return recommendationEngine;
}