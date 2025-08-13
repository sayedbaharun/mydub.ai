import { supabase } from '@/shared/lib/supabase';
import type { 
  SearchFilters, 
  SearchResult, 
  SearchResponse,
  NewsArticle,
  GovernmentService,
  TourismAttraction,
  TourismEvent
} from '@/shared/types/database';

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async search(filters: SearchFilters, page = 1, pageSize = 20): Promise<SearchResponse> {
    try {
      // Record search history
      await this.recordSearchHistory(filters.query);

      const results: SearchResult[] = [];
      let total = 0;

      // Search based on type filter
      if (!filters.type || filters.type === 'all' || filters.type === 'news') {
        const newsResults = await this.searchNews(filters);
        results.push(...newsResults.results);
        total += newsResults.total;
      }

      if (!filters.type || filters.type === 'all' || filters.type === 'government') {
        const govResults = await this.searchGovernmentServices(filters);
        results.push(...govResults.results);
        total += govResults.total;
      }

      if (!filters.type || filters.type === 'all' || filters.type === 'tourism') {
        const tourismResults = await this.searchTourismAttractions(filters);
        results.push(...tourismResults.results);
        total += tourismResults.total;
      }

      if (!filters.type || filters.type === 'all' || filters.type === 'events') {
        const eventResults = await this.searchTourismEvents(filters);
        results.push(...eventResults.results);
        total += eventResults.total;
      }

      // Sort results
      const sortedResults = this.sortResults(results, filters.sortBy);

      // Paginate results
      const startIndex = (page - 1) * pageSize;
      const paginatedResults = sortedResults.slice(startIndex, startIndex + pageSize);

      // Generate facets
      const facets = this.generateFacets(results);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(filters.query);

      return {
        results: paginatedResults,
        total,
        page,
        pageSize,
        filters,
        suggestions,
        facets
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  private async searchNews(filters: SearchFilters): Promise<{ results: SearchResult[], total: number }> {
    let query = supabase
      .from('news_articles')
      .select('*, source:news_sources(name, name_ar)', { count: 'exact' });

    // Apply search query
    if (filters.query) {
      const searchQuery = `%${filters.query}%`;
      query = query.or(`title.ilike.${searchQuery},title_ar.ilike.${searchQuery},summary.ilike.${searchQuery},summary_ar.ilike.${searchQuery},content.ilike.${searchQuery},content_ar.ilike.${searchQuery}`);
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Apply date filters
    if (filters.dateFrom) {
      query = query.gte('published_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('published_at', filters.dateTo);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const results: SearchResult[] = (data || []).map((article: NewsArticle) => ({
      id: article.id,
      type: 'news' as const,
      title: filters.language === 'ar' && article.title_ar ? article.title_ar : article.title,
      title_ar: article.title_ar,
      description: filters.language === 'ar' && article.summary_ar ? article.summary_ar : article.summary,
      description_ar: article.summary_ar,
      url: article.url,
      image_url: article.image_url,
      date: article.published_at,
      category: article.category,
      score: this.calculateRelevanceScore(article, filters.query)
    }));

    return { results, total: count || 0 };
  }

  private async searchGovernmentServices(filters: SearchFilters): Promise<{ results: SearchResult[], total: number }> {
    let query = supabase
      .from('government_services')
      .select('*, department:government_departments(name, name_ar)', { count: 'exact' })
      .eq('is_active', true);

    // Apply search query
    if (filters.query) {
      const searchQuery = `%${filters.query}%`;
      query = query.or(`title.ilike.${searchQuery},title_ar.ilike.${searchQuery},description.ilike.${searchQuery},description_ar.ilike.${searchQuery}`);
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const results: SearchResult[] = (data || []).map((service: GovernmentService) => ({
      id: service.id,
      type: 'government' as const,
      title: filters.language === 'ar' && service.title_ar ? service.title_ar : service.title,
      title_ar: service.title_ar,
      description: filters.language === 'ar' && service.description_ar ? service.description_ar : service.description,
      description_ar: service.description_ar,
      url: service.url,
      category: service.category,
      score: this.calculateRelevanceScore(service, filters.query)
    }));

    return { results, total: count || 0 };
  }

  private async searchTourismAttractions(filters: SearchFilters): Promise<{ results: SearchResult[], total: number }> {
    let query = supabase
      .from('tourism_attractions')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply search query
    if (filters.query) {
      const searchQuery = `%${filters.query}%`;
      query = query.or(`name.ilike.${searchQuery},name_ar.ilike.${searchQuery},description.ilike.${searchQuery},description_ar.ilike.${searchQuery}`);
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Apply location filter
    if (filters.location) {
      query = query.or(`address.ilike.%${filters.location}%,address_ar.ilike.%${filters.location}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const results: SearchResult[] = (data || []).map((attraction: TourismAttraction) => ({
      id: attraction.id,
      type: 'tourism' as const,
      title: filters.language === 'ar' && attraction.name_ar ? attraction.name_ar : attraction.name,
      title_ar: attraction.name_ar,
      description: filters.language === 'ar' && attraction.description_ar ? attraction.description_ar : attraction.description,
      description_ar: attraction.description_ar,
      image_url: attraction.images?.[0],
      category: attraction.category,
      score: this.calculateRelevanceScore(attraction, filters.query)
    }));

    return { results, total: count || 0 };
  }

  private async searchTourismEvents(filters: SearchFilters): Promise<{ results: SearchResult[], total: number }> {
    let query = supabase
      .from('tourism_events')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply search query
    if (filters.query) {
      const searchQuery = `%${filters.query}%`;
      query = query.or(`title.ilike.${searchQuery},title_ar.ilike.${searchQuery},description.ilike.${searchQuery},description_ar.ilike.${searchQuery}`);
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Apply date filters
    if (filters.dateFrom) {
      query = query.gte('end_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('start_date', filters.dateTo);
    }

    // Apply location filter
    if (filters.location) {
      query = query.or(`location.ilike.%${filters.location}%,location_ar.ilike.%${filters.location}%,venue.ilike.%${filters.location}%,venue_ar.ilike.%${filters.location}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const results: SearchResult[] = (data || []).map((event: TourismEvent) => ({
      id: event.id,
      type: 'event' as const,
      title: filters.language === 'ar' && event.title_ar ? event.title_ar : event.title,
      title_ar: event.title_ar,
      description: filters.language === 'ar' && event.description_ar ? event.description_ar : event.description,
      description_ar: event.description_ar,
      image_url: event.image_url,
      date: event.start_date,
      category: event.category,
      score: this.calculateRelevanceScore(event, filters.query)
    }));

    return { results, total: count || 0 };
  }

  private calculateRelevanceScore(item: any, query?: string): number {
    if (!query) return 1;

    const searchTerms = query.toLowerCase().split(' ');
    let score = 0;

    // Check title matches (higher weight)
    const title = (item.title || item.name || '').toLowerCase();
    const titleAr = (item.title_ar || item.name_ar || '').toLowerCase();
    
    searchTerms.forEach(term => {
      if (title.includes(term)) score += 3;
      if (titleAr.includes(term)) score += 3;
    });

    // Check description matches (medium weight)
    const description = (item.description || item.summary || item.content || '').toLowerCase();
    const descriptionAr = (item.description_ar || item.summary_ar || item.content_ar || '').toLowerCase();
    
    searchTerms.forEach(term => {
      if (description.includes(term)) score += 1;
      if (descriptionAr.includes(term)) score += 1;
    });

    // Boost featured items
    if (item.is_featured) score += 2;

    return score;
  }

  private sortResults(results: SearchResult[], sortBy?: string): SearchResult[] {
    switch (sortBy) {
      case 'date':
        return results.sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA;
        });
      
      case 'popularity':
        // For now, use score as popularity metric
        return results.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      case 'relevance':
      default:
        return results.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  }

  private generateFacets(results: SearchResult[]) {
    const types: Record<string, number> = {};
    const categories: Record<string, number> = {};

    results.forEach(result => {
      // Count types
      types[result.type] = (types[result.type] || 0) + 1;

      // Count categories
      if (result.category) {
        categories[result.category] = (categories[result.category] || 0) + 1;
      }
    });

    return { types, categories };
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    // For now, return simple suggestions based on common searches
    // In production, this would use a more sophisticated suggestion engine
    const commonSearches = [
      'visa services',
      'tourist attractions',
      'government services',
      'events in dubai',
      'news today',
      'burj khalifa',
      'dubai mall',
      'emirates id',
      'driving license',
      'residence visa'
    ];

    return commonSearches
      .filter(search => search.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }

  private async recordSearchHistory(query: string) {
    if (!query) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('search_history').insert({
        user_id: user?.id,
        query,
        session_id: this.getSessionId()
      });
    } catch (error) {
      // Don't throw error for search history recording
      console.error('Failed to record search history:', error);
    }
  }

  private getSessionId(): string {
    // Get or create session ID from localStorage
    let sessionId = localStorage.getItem('search_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('search_session_id', sessionId);
    }
    return sessionId;
  }

  async getPopularSearches(limit = 10): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('query')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Count occurrences
      const searchCounts: Record<string, number> = {};
      (data || []).forEach(item => {
        searchCounts[item.query] = (searchCounts[item.query] || 0) + 1;
      });

      // Sort by count and return top queries
      return Object.entries(searchCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([query]) => query);
    } catch (error) {
      console.error('Failed to get popular searches:', error);
      return [];
    }
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('query')
        .ilike('query', `${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Remove duplicates
      const uniqueSuggestions = Array.from(new Set((data || []).map(item => item.query)));
      return uniqueSuggestions;
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }
}

export const searchService = SearchService.getInstance();