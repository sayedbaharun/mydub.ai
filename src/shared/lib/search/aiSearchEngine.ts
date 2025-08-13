/**
 * AI-Powered Search Engine for MyDub.AI
 * Advanced search with semantic understanding, natural language queries, and intelligent filtering
 */

import { supabase } from '@/shared/lib/supabase';
import { getCacheClient, CacheKeys, CacheTags } from '@/shared/lib/cache/redisClient';
import OpenAI from 'openai';

export interface SearchQuery {
  text: string;
  filters?: SearchFilters;
  context?: SearchContext;
  options?: SearchOptions;
}

export interface SearchFilters {
  content_types?: ('article' | 'government_service' | 'tourism_place' | 'event' | 'news')[];
  categories?: string[];
  languages?: string[];
  locations?: Array<{
    lat: number;
    lng: number;
    radius_km?: number;
  }>;
  date_range?: {
    from?: Date;
    to?: Date;
  };
  price_range?: {
    min?: number;
    max?: number;
  };
  ratings?: {
    min?: number;
    max?: number;
  };
  accessibility?: string[];
  target_audience?: string[];
  difficulty_level?: string[];
  exclude_ids?: string[];
}

export interface SearchContext {
  user_id?: string;
  location?: { lat: number; lng: number };
  device_type?: 'mobile' | 'desktop' | 'tablet';
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  weather?: string;
  intent?: 'research' | 'planning' | 'booking' | 'navigation';
  previous_searches?: string[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  include_suggestions?: boolean;
  include_aggregations?: boolean;
  boost_recent?: boolean;
  boost_popular?: boolean;
  boost_local?: boolean;
  semantic_search?: boolean;
  fuzzy_matching?: boolean;
  expand_query?: boolean;
  personalize?: boolean;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  url: string;
  image_url?: string;
  location?: { lat: number; lng: number; address?: string };
  rating?: number;
  price?: number;
  relevance_score: number;
  match_reasons: string[];
  highlighted_text?: {
    title?: string;
    description?: string;
    content?: string;
  };
  metadata?: {
    author?: string;
    created_at?: Date;
    updated_at?: Date;
    tags?: string[];
    difficulty_level?: string;
    time_required?: string;
    accessibility?: string[];
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  search_time_ms: number;
  suggestions?: string[];
  aggregations?: SearchAggregations;
  corrected_query?: string;
  intent_analysis?: {
    detected_intent: string;
    confidence: number;
    entities: Array<{ type: string; value: string; confidence: number }>;
  };
  related_searches?: string[];
}

export interface SearchAggregations {
  content_types: Array<{ type: string; count: number }>;
  categories: Array<{ category: string; count: number }>;
  locations: Array<{ area: string; count: number }>;
  price_ranges: Array<{ range: string; count: number }>;
  ratings: Array<{ rating: number; count: number }>;
}

class AISearchEngine {
  private openai: OpenAI;
  private cache = getCacheClient();

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Main search function with AI enhancement
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.buildCacheKey(query);
      const cached = await this.cache.get<SearchResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Process and enhance the query
      const processedQuery = await this.processQuery(query);
      
      // Perform multi-stage search
      const results = await this.performSearch(processedQuery);
      
      // Generate suggestions and aggregations
      const [suggestions, aggregations] = await Promise.all([
        query.options?.include_suggestions ? this.generateSuggestions(query.text) : undefined,
        query.options?.include_aggregations ? this.generateAggregations(results) : undefined
      ]);

      // Analyze intent if requested
      const intentAnalysis = await this.analyzeIntent(query.text);

      const response: SearchResponse = {
        results,
        total_count: results.length,
        search_time_ms: Date.now() - startTime,
        suggestions,
        aggregations,
        intent_analysis: intentAnalysis,
        related_searches: await this.getRelatedSearches(query.text)
      };

      // Cache the response
      await this.cache.set(cacheKey, response, {
        ttl: 300, // 5 minutes
        tags: [CacheTags.SEARCH]
      });

      return response;

    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Search request failed');
    }
  }

  /**
   * Semantic search using vector embeddings
   */
  async semanticSearch(
    text: string,
    filters?: SearchFilters,
    limit = 20
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for the search text
      const embedding = await this.generateEmbedding(text);
      
      // Search using vector similarity
      const { data, error } = await supabase.rpc('semantic_search', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit,
        filters: filters || {}
      });

      if (error) throw error;

      return data.map((item: any) => this.normalizeSearchResult(item));

    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Natural language query understanding
   */
  async understandQuery(text: string): Promise<{
    intent: string;
    entities: Array<{ type: string; value: string; confidence: number }>;
    filters: Partial<SearchFilters>;
    enhanced_query: string;
  }> {
    try {
      const prompt = `
        Analyze this search query for a Dubai information platform:
        "${text}"
        
        Extract:
        1. Intent (research, planning, booking, navigation, etc.)
        2. Entities (locations, dates, prices, categories, etc.)
        3. Suggested filters
        4. Enhanced/expanded query
        
        Return JSON format with intent, entities, filters, and enhanced_query.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that understands search queries for a Dubai information platform. Provide structured analysis in JSON format.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');
      return analysis;

    } catch (error) {
      console.error('Query understanding failed:', error);
      return {
        intent: 'research',
        entities: [],
        filters: {},
        enhanced_query: text
      };
    }
  }

  /**
   * Auto-complete and suggestions
   */
  async getAutoComplete(partial: string, limit = 10): Promise<string[]> {
    const cacheKey = `autocomplete:${partial}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get suggestions from popular searches and content
      const { data: suggestions } = await supabase.rpc('get_search_suggestions', {
        partial_query: partial,
        suggestion_limit: limit
      });

      const results = suggestions || [];
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, results, { ttl: 3600 });
      
      return results;

    } catch (error) {
      console.error('Autocomplete failed:', error);
      return [];
    }
  }

  /**
   * Search with filters and faceted search
   */
  async facetedSearch(
    query: string,
    facets: string[] = ['content_type', 'category', 'location', 'price_range']
  ): Promise<{
    results: SearchResult[];
    facets: Record<string, Array<{ value: string; count: number }>>;
  }> {
    const searchResults = await this.search({
      text: query,
      options: { include_aggregations: true }
    });

    // Build facet data
    const facetData: Record<string, Array<{ value: string; count: number }>> = {};
    
    if (searchResults.aggregations) {
      if (facets.includes('content_type')) {
        facetData.content_type = searchResults.aggregations.content_types.map(ct => ({
          value: ct.type,
          count: ct.count
        }));
      }
      
      if (facets.includes('category')) {
        facetData.category = searchResults.aggregations.categories.map(cat => ({
          value: cat.category,
          count: cat.count
        }));
      }
      
      // Add other facets...
    }

    return {
      results: searchResults.results,
      facets: facetData
    };
  }

  /**
   * Location-based search
   */
  async nearbySearch(
    location: { lat: number; lng: number },
    radius_km = 10,
    query?: string,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('nearby_search', {
        user_lat: location.lat,
        user_lng: location.lng,
        radius_km,
        search_query: query,
        filters: filters || {}
      });

      if (error) throw error;

      return data.map((item: any) => this.normalizeSearchResult(item));

    } catch (error) {
      console.error('Nearby search failed:', error);
      return [];
    }
  }

  /**
   * Personalized search based on user history
   */
  async personalizedSearch(
    query: SearchQuery,
    userId: string
  ): Promise<SearchResponse> {
    try {
      // Get user preferences and history
      const userProfile = await this.getUserSearchProfile(userId);
      
      // Enhance query with personalization
      const personalizedQuery = {
        ...query,
        context: {
          ...query.context,
          user_id: userId
        },
        options: {
          ...query.options,
          personalize: true
        }
      };

      // Perform search with personalization boosting
      const results = await this.search(personalizedQuery);
      
      // Re-rank results based on user preferences
      results.results = this.personalizeResults(results.results, userProfile);

      return results;

    } catch (error) {
      console.error('Personalized search failed:', error);
      return this.search(query);
    }
  }

  /**
   * Multi-language search
   */
  async multiLanguageSearch(
    query: string,
    targetLanguages: string[] = ['en', 'ar']
  ): Promise<SearchResult[]> {
    const searches = targetLanguages.map(lang => 
      this.search({
        text: query,
        filters: { languages: [lang] }
      })
    );

    const results = await Promise.all(searches);
    
    // Merge and deduplicate results
    const allResults = results.flatMap(r => r.results);
    const uniqueResults = this.deduplicateResults(allResults);
    
    return uniqueResults;
  }

  // Private helper methods

  private async processQuery(query: SearchQuery): Promise<SearchQuery> {
    // Expand query if requested
    if (query.options?.expand_query) {
      const understanding = await this.understandQuery(query.text);
      return {
        ...query,
        text: understanding.enhanced_query,
        filters: {
          ...query.filters,
          ...understanding.filters
        }
      };
    }

    return query;
  }

  private async performSearch(query: SearchQuery): Promise<SearchResult[]> {
    const searchMethods = [];

    // Semantic search if enabled
    if (query.options?.semantic_search !== false) {
      searchMethods.push(
        this.semanticSearch(query.text, query.filters, query.options?.limit)
      );
    }

    // Traditional full-text search
    searchMethods.push(
      this.fullTextSearch(query.text, query.filters, query.options)
    );

    // Location search if location context provided
    if (query.context?.location) {
      searchMethods.push(
        this.nearbySearch(
          query.context.location,
          10, // 10km radius
          query.text,
          query.filters
        )
      );
    }

    const allResults = await Promise.all(searchMethods);
    const combinedResults = allResults.flat();
    
    // Merge and rank results
    return this.mergeAndRankResults(combinedResults, query);
  }

  private async fullTextSearch(
    text: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('full_text_search', {
        search_query: text,
        filters: filters || {},
        search_limit: options?.limit || 20,
        search_offset: options?.offset || 0
      });

      if (error) throw error;

      return data.map((item: any) => this.normalizeSearchResult(item));

    } catch (error) {
      console.error('Full-text search failed:', error);
      return [];
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });

      return response.data[0].embedding;

    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  private async analyzeIntent(text: string) {
    // Simplified intent analysis
    const intents = {
      'research': ['what', 'how', 'why', 'information', 'about'],
      'planning': ['plan', 'itinerary', 'schedule', 'visit', 'trip'],
      'booking': ['book', 'reserve', 'buy', 'ticket', 'appointment'],
      'navigation': ['where', 'location', 'direction', 'address', 'near']
    };

    const lowerText = text.toLowerCase();
    let maxScore = 0;
    let detectedIntent = 'research';

    for (const [intent, keywords] of Object.entries(intents)) {
      const score = keywords.reduce((acc, keyword) => 
        acc + (lowerText.includes(keyword) ? 1 : 0), 0
      );
      
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent;
      }
    }

    return {
      detected_intent: detectedIntent,
      confidence: maxScore / text.split(' ').length,
      entities: [] // Would extract entities in production
    };
  }

  private async generateSuggestions(text: string): Promise<string[]> {
    // Generate query suggestions
    return [
      `${text} in Dubai`,
      `${text} near me`,
      `best ${text}`,
      `${text} reviews`,
      `${text} prices`
    ];
  }

  private async generateAggregations(results: SearchResult[]): Promise<SearchAggregations> {
    const contentTypes = new Map<string, number>();
    const categories = new Map<string, number>();
    
    results.forEach(result => {
      contentTypes.set(result.type, (contentTypes.get(result.type) || 0) + 1);
      categories.set(result.category, (categories.get(result.category) || 0) + 1);
    });

    return {
      content_types: Array.from(contentTypes.entries()).map(([type, count]) => ({ type, count })),
      categories: Array.from(categories.entries()).map(([category, count]) => ({ category, count })),
      locations: [],
      price_ranges: [],
      ratings: []
    };
  }

  private async getRelatedSearches(text: string): Promise<string[]> {
    // Get related searches from user behavior
    return [];
  }

  private normalizeSearchResult(item: any): SearchResult {
    return {
      id: item.id,
      type: item.type || item.content_type,
      title: item.title,
      description: item.description || item.content,
      category: item.category,
      url: item.url || `/content/${item.id}`,
      image_url: item.image_url,
      location: item.location,
      rating: item.rating,
      price: item.price,
      relevance_score: item.similarity || item.rank || 1,
      match_reasons: item.match_reasons || [],
      metadata: item.metadata || {}
    };
  }

  private mergeAndRankResults(results: SearchResult[], query: SearchQuery): SearchResult[] {
    // Deduplicate
    const unique = this.deduplicateResults(results);
    
    // Boost results based on options
    if (query.options?.boost_recent) {
      unique.forEach(result => {
        if (result.metadata?.created_at) {
          const daysSince = (Date.now() - new Date(result.metadata.created_at).getTime()) / (1000 * 60 * 60 * 24);
          result.relevance_score += Math.max(0, 1 - daysSince / 30) * 0.2;
        }
      });
    }

    // Sort by relevance score
    return unique
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, query.options?.limit || 20);
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.type}:${result.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private buildCacheKey(query: SearchQuery): string {
    return `search:${JSON.stringify(query)}`;
  }

  private async getUserSearchProfile(userId: string) {
    // Get user search preferences and history
    return {};
  }

  private personalizeResults(results: SearchResult[], userProfile: any): SearchResult[] {
    // Apply personalization boosting
    return results;
  }
}

// Export singleton instance
let searchEngine: AISearchEngine | null = null;

export function getAISearchEngine(): AISearchEngine {
  if (!searchEngine) {
    searchEngine = new AISearchEngine();
  }
  return searchEngine;
}