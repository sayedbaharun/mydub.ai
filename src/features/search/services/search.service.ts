import { supabase } from '@/shared/lib/supabase'
import {
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchSuggestion,
  SearchHistory,
  SavedSearch,
  TrendingSearch,
  SearchFacets,
} from '../types'

// Generate search suggestions based on partial query
const generateSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  // Mock suggestions - in production, this would use a proper suggestion engine
  const mockSuggestions = [
    { text: 'restaurants in Dubai Marina', type: 'query' as const },
    { text: 'visa requirements', type: 'query' as const },
    { text: 'Dubai Metro map', type: 'query' as const },
    { text: 'beaches near me', type: 'query' as const },
    { text: 'government services', type: 'category' as const },
    { text: 'tourist attractions', type: 'category' as const },
    { text: 'Downtown Dubai', type: 'location' as const },
    { text: 'Jumeirah Beach', type: 'location' as const }
  ]

  return mockSuggestions
    .filter(s => s.text.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)
    .map((s, i) => ({
      id: `suggestion-${i}`,
      text: s.text,
      textAr: s.text, // Mock Arabic translation
      type: s.type,
      icon: s.type === 'location' ? '📍' : s.type === 'category' ? '📁' : '🔍'
    }))
}

export const searchService = {
  // Main search function with AI enhancement
  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now()

    // Mock search results - in production, this would query multiple data sources
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'tourism',
        title: 'Burj Khalifa - World\'s Tallest Building',
        titleAr: 'برج خليفة - أطول مبنى في العالم',
        description: 'Visit the iconic Burj Khalifa, the world\'s tallest building with breathtaking views of Dubai.',
        descriptionAr: 'قم بزيارة برج خليفة الشهير، أطول مبنى في العالم مع إطلالات خلابة على دبي.',
        thumbnail: 'https://example.com/burj-khalifa.jpg',
        tags: ['tourism', 'landmark', 'downtown'],
        categories: ['Attractions', 'Architecture'],
        location: {
          name: 'Downtown Dubai',
          nameAr: 'وسط مدينة دبي',
          coordinates: { lat: 25.1972, lng: 55.2744 },
          district: 'Downtown',
          area: 'Downtown Dubai'
        },
        metadata: {
          views: 15420,
          likes: 3200,
          rating: 4.8,
          reviewCount: 2150,
          price: { amount: 150, currency: 'AED' }
        },
        score: 0.95,
        publishedAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        type: 'government',
        title: 'How to Apply for UAE Visa',
        titleAr: 'كيفية التقدم للحصول على تأشيرة دولة الإمارات',
        description: 'Complete guide on UAE visa application process, requirements, and fees.',
        descriptionAr: 'دليل شامل حول عملية طلب تأشيرة دولة الإمارات والمتطلبات والرسوم.',
        tags: ['visa', 'immigration', 'government'],
        categories: ['Government Services', 'Immigration'],
        metadata: {
          views: 8500,
          likes: 450
        },
        score: 0.88,
        publishedAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z'
      }
    ]

    // Generate facets
    const facets: SearchFacets = {
      types: [
        { value: 'tourism', label: 'Tourism', labelAr: 'السياحة', count: 45 },
        { value: 'government', label: 'Government', labelAr: 'الحكومة', count: 23 },
        { value: 'news', label: 'News', labelAr: 'الأخبار', count: 67 }
      ],
      categories: [
        { value: 'attractions', label: 'Attractions', labelAr: 'المعالم السياحية', count: 34 },
        { value: 'services', label: 'Services', labelAr: 'الخدمات', count: 28 }
      ],
      tags: [
        { value: 'visa', label: 'Visa', labelAr: 'تأشيرة', count: 15 },
        { value: 'tourism', label: 'Tourism', labelAr: 'سياحة', count: 45 }
      ],
      sources: [
        { value: 'gov.ae', label: 'Government Portal', labelAr: 'البوابة الحكومية', count: 23 }
      ],
      locations: [
        { value: 'downtown', label: 'Downtown Dubai', labelAr: 'وسط دبي', count: 18 }
      ],
      dateRanges: [
        { value: 'today', label: 'Today', labelAr: 'اليوم', count: 5 },
        { value: 'week', label: 'This Week', labelAr: 'هذا الأسبوع', count: 23 }
      ]
    }

    // Generate related searches
    const relatedSearches = [
      'Dubai tourist visa requirements',
      'Best time to visit Burj Khalifa',
      'Dubai Metro to Downtown',
      'Hotels near Burj Khalifa'
    ]

    return {
      results: mockResults,
      total: 127,
      page: searchQuery.page || 1,
      totalPages: 13,
      facets,
      suggestions: await generateSuggestions(searchQuery.query),
      relatedSearches,
      executionTime: Date.now() - startTime
    }
  },

  // Get search suggestions
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (query.length < 2) return []
    return generateSuggestions(query)
  },

  // Save search to history
  async saveSearchHistory(userId: string, query: SearchQuery, resultsCount: number): Promise<void> {
    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        query: query.query,
        filters: query.filters,
        results_count: resultsCount,
        clicked_results: []
      })

    if (error) throw error
  },

  // Get user's search history
  async getSearchHistory(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  // Track clicked search result
  async trackSearchClick(historyId: string, resultId: string): Promise<void> {
    const { data: history } = await supabase
      .from('search_history')
      .select('clicked_results')
      .eq('id', historyId)
      .single()

    if (history) {
      const clickedResults = history.clicked_results || []
      clickedResults.push(resultId)

      await supabase
        .from('search_history')
        .update({ clicked_results: clickedResults })
        .eq('id', historyId)
    }
  },

  // Save a search for notifications
  async saveSearch(userId: string, name: string, query: SearchQuery): Promise<SavedSearch> {
    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: userId,
        name,
        name_ar: name, // Mock Arabic translation
        query: query.query,
        filters: query.filters,
        notifications: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get user's saved searches
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Delete saved search
  async deleteSavedSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId)

    if (error) throw error
  },

  // Get trending searches
  async getTrendingSearches(limit: number = 10): Promise<TrendingSearch[]> {
    // Mock trending searches - in production, this would analyze search logs
    return [
      {
        query: 'Dubai Frame tickets',
        queryAr: 'تذاكر برواز دبي',
        count: 1250,
        trend: 'up' as const,
        changePercent: 15.5,
        category: 'tourism'
      },
      {
        query: 'UAE National Day events',
        queryAr: 'فعاليات اليوم الوطني الإماراتي',
        count: 980,
        trend: 'up' as const,
        changePercent: 45.2,
        category: 'events'
      },
      {
        query: 'Golden visa requirements',
        queryAr: 'متطلبات التأشيرة الذهبية',
        count: 750,
        trend: 'stable' as const,
        changePercent: 2.1,
        category: 'government'
      }
    ].slice(0, limit)
  },

  // Get search analytics
  async getSearchAnalytics(queries: string[]): Promise<Record<string, any>> {
    // Mock analytics - in production, this would aggregate real data
    const analytics: Record<string, any> = {}
    
    queries.forEach(query => {
      analytics[query] = {
        impressions: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 100) + 10,
        ctr: Math.random() * 0.2 + 0.05,
        avgPosition: Math.random() * 5 + 1,
        exitRate: Math.random() * 0.5 + 0.2
      }
    })

    return analytics
  },

  // Clear search history
  async clearSearchHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  },

  // Track search for analytics
  async trackSearch(query: string, resultsCount: number): Promise<void> {
    // Mock implementation - in production, this would log to analytics
      },

  // Track click on search result
  async trackClick(resultId: string, query: string): Promise<void> {
    // Mock implementation - in production, this would log to analytics
      }
}