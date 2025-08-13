import { NewsArticle, NewsFilters, NewsSource } from '../types'
import { contentDistributionService } from '../../../shared/services/content-distribution.service'
import { ExternalAPIsService } from '../../../shared/services/external-apis'
import { supabase } from '../../../shared/lib/supabase'

export class NewsService {
  // Helper function to fix broken image URLs
  private static fixImageUrl(imageUrl?: string): string {
    if (!imageUrl) {
      return 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&h=600&fit=crop&auto=format&q=80'
    }
    
    // Handle relative paths from news_articles directory
    if (imageUrl.startsWith('images/')) {
      // Convert relative path to public directory path
      return `/news_articles_images/${imageUrl.replace('images/', '')}`
    }
    
    // Handle full mydub.ai image URLs that might be broken
    if (imageUrl.includes('mydub.ai/images/')) {
      return 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&h=600&fit=crop&auto=format&q=80'
    }
    
    // Return the URL as-is if it's already a full URL
    return imageUrl
  }

  // Convert our article format to NewsArticle format
  private static convertToNewsArticle(article: any): NewsArticle {
    return {
      id: article.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: article.headline,
      titleAr: article.headline, // Would need translation service
      content: article.content,
      contentAr: article.content, // Would need translation service
      summary: article.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      summaryAr: article.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      source: {
        id: 'mydub-ai',
        name: 'MyDub.AI',
        nameAr: 'ماي دبي الذكي',
        logo: null,
        website: 'https://mydub.ai',
        credibility: 0.95
      },
      author: article.author,
      publishedAt: article.publish_date,
      updatedAt: article.publish_date,
      url: `/news/${article.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      imageUrl: this.fixImageUrl(article.image_path),
      category: article.category.toLowerCase(),
      tags: [article.category.toLowerCase()],
      viewCount: Math.floor(Math.random() * 1000) + 100,
      sentiment: 'positive',
      isBreaking: false,
      isFeatured: true,
      hasVideo: false,
      readTime: Math.ceil(article.content.replace(/<[^>]*>/g, '').split(' ').length / 200)
    }
  }

  // Get articles from our content distribution system and external APIs
  static async getArticles(filters?: NewsFilters): Promise<NewsArticle[]> {
    try {
      // First, try to get articles from our database
      let query = supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50)

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,summary.ilike.%${filters.searchQuery}%`)
      }

      const { data: dbArticles, error } = await query

      if (!error && dbArticles && dbArticles.length > 0) {
        // Convert database articles to NewsArticle format
        const formattedArticles = dbArticles.map(article => ({
          id: article.id,
          title: article.title,
          titleAr: article.title_ar || article.title,
          content: article.content,
          contentAr: article.content_ar || article.content,
          summary: article.summary,
          summaryAr: article.summary_ar || article.summary,
          source: {
            id: 'mydub-ai',
            name: 'MyDub.AI',
            nameAr: 'ماي دبي',
            logo: null,
            website: 'https://mydub.ai',
            credibility: 0.95
          },
          author: 'Editorial Team',
          publishedAt: article.published_at,
          updatedAt: article.updated_at,
          url: `/news/${article.slug || article.id}`,
          imageUrl: this.fixImageUrl(article.featured_image),
          category: article.category,
          tags: article.tags || [],
          viewCount: article.view_count || 0,
          sentiment: 'neutral',
          isBreaking: article.is_breaking_news || false,
          isFeatured: article.is_featured || false,
          hasVideo: false,
          readTime: Math.ceil(article.content.replace(/<[^>]*>/g, '').split(' ').length / 200)
        }))

        // If we have database articles, prioritize them
        if (formattedArticles.length >= 10) {
          return formattedArticles
        }
      }

      // Try to get real news from NewsAPI as fallback
      const newsApiData = await ExternalAPIsService.fetchDubaiNews()
      
      if (newsApiData && newsApiData.articles && newsApiData.articles.length > 0) {
        // Convert NewsAPI articles to our format
        const apiArticles = newsApiData.articles.map((article, index) => ({
          id: `news-api-${index}-${Date.now()}`,
          title: article.title,
          titleAr: article.title, // Would need translation
          content: article.content || article.description || '',
          contentAr: article.content || article.description || '', // Would need translation
          summary: article.description || article.title,
          summaryAr: article.description || article.title,
          source: {
            id: article.source.name.toLowerCase().replace(/\s+/g, '-'),
            name: article.source.name,
            nameAr: article.source.name,
            logo: null,
            website: article.url,
            credibility: 0.8
          },
          author: 'News Desk',
          publishedAt: article.publishedAt,
          updatedAt: article.publishedAt,
          url: article.url,
          imageUrl: this.fixImageUrl(article.urlToImage),
          category: 'news',
          tags: ['Dubai', 'UAE', 'news'],
          viewCount: Math.floor(Math.random() * 1000) + 100,
          sentiment: 'neutral',
          isBreaking: false,
          isFeatured: index < 3,
          hasVideo: false,
          readTime: Math.ceil((article.content || article.description || '').split(' ').length / 200)
        }))
        
        // Also get articles from content distribution
        const allArticles = contentDistributionService.getAllArticles()
        const localArticles = allArticles.map(article => this.convertToNewsArticle(article))
        
        // Combine both sources, with API articles first
        let combinedArticles = [...apiArticles, ...localArticles]
        
        // Apply filters if provided
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase()
          combinedArticles = combinedArticles.filter(article =>
            article.title.toLowerCase().includes(searchLower) ||
            article.content.toLowerCase().includes(searchLower)
          )
        }
        
        if (filters?.categories && filters.categories.length > 0) {
          combinedArticles = combinedArticles.filter(article =>
            filters.categories.includes(article.category)
          )
        }
        
        // Sort by publish date (newest first)
        combinedArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        
        return combinedArticles
      } else {
        // Fallback to local content if API fails
        const allArticles = contentDistributionService.getAllArticles()
        const newsArticles = allArticles.map(article => this.convertToNewsArticle(article))
        
        // Apply filters if provided
        let filteredArticles = newsArticles
        
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase()
          filteredArticles = filteredArticles.filter(article =>
            article.title.toLowerCase().includes(searchLower) ||
            article.content.toLowerCase().includes(searchLower)
          )
        }
        
        if (filters?.categories && filters.categories.length > 0) {
          filteredArticles = filteredArticles.filter(article =>
            filters.categories.includes(article.category)
          )
        }
        
        // Sort by publish date (newest first)
        filteredArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        
        return filteredArticles
      }
    } catch (error) {
      console.error('Error getting articles:', error)
      return this.getMockNewsData(filters?.search || 'Dubai UAE')
    }
  }

  // Get trending articles
  static async getTrendingArticles(limit: number = 5): Promise<NewsArticle[]> {
    try {
      const allArticles = await this.getArticles()
      
      // Sort by view count and return top articles
      return allArticles
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting trending articles:', error)
      return this.getMockNewsData('Dubai UAE').slice(0, limit)
    }
  }

  // Get article by ID
  static async getArticleById(id: string): Promise<NewsArticle | null> {
    try {
      const allArticles = await this.getArticles()
      return allArticles.find(article => article.id === id) || null
    } catch (error) {
      console.error('Error getting article by ID:', error)
      return null
    }
  }

  // Mock news data for fallback when APIs fail
  static getMockNewsData(query: string): NewsArticle[] {
    const dubaiMockNews: NewsArticle[] = [
      {
        id: 'mock-1',
        title: 'Dubai Metro Green Line Extension Opens New Stations',
        titleAr: 'افتتاح محطات جديدة في امتداد الخط الأخضر لمترو دبي',
        content: 'Dubai Roads and Transport Authority (RTA) has officially opened three new stations on the Green Line extension, improving connectivity across the emirate.',
        contentAr: 'افتتحت هيئة الطرق والمواصلات في دبي رسمياً ثلاث محطات جديدة في امتداد الخط الأخضر، مما يحسن الاتصال عبر الإمارة.',
        summary: 'New metro stations enhance public transport connectivity in Dubai.',
        summaryAr: 'محطات مترو جديدة تعزز اتصال وسائل النقل العام في دبي.',
        source: {
          id: 'rta-dubai',
          name: 'RTA Dubai',
          nameAr: 'هيئة الطرق والمواصلات دبي',
          logo: null,
          website: 'https://www.rta.ae',
          credibility: 0.9
        },
        author: 'RTA Communications',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/mock-metro-news',
        imageUrl: 'https://picsum.photos/400/300?random=1',
        category: 'local',
        tags: ['metro', 'public transport', 'infrastructure'],
        viewCount: 245,
        sentiment: 'positive',
        isBreaking: false,
        isFeatured: true,
        hasVideo: false,
        readTime: 3
      },
      {
        id: 'mock-2',
        title: 'Dubai Shopping Festival 2024 Breaks Tourism Records',
        titleAr: 'مهرجان دبي للتسوق 2024 يحطم الأرقام القياسية السياحية',
        content: 'The annual Dubai Shopping Festival has attracted record numbers of international visitors, boosting the emirate\'s retail and tourism sectors.',
        contentAr: 'جذب مهرجان دبي للتسوق السنوي أعداداً قياسية من الزوار الدوليين، مما عزز قطاعي التجزئة والسياحة في الإمارة.',
        summary: 'Record-breaking visitor numbers during Dubai Shopping Festival.',
        summaryAr: 'أرقام قياسية من الزوار خلال مهرجان دبي للتسوق.',
        source: {
          id: 'dubai-tourism',
          name: 'Dubai Tourism',
          nameAr: 'هيئة دبي للسياحة',
          logo: null,
          website: 'https://www.dubaitourism.ae',
          credibility: 0.95
        },
        author: 'Tourism Board',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/mock-shopping-festival',
        imageUrl: 'https://picsum.photos/400/300?random=2',
        category: 'lifestyle',
        tags: ['shopping', 'festival', 'tourism', 'retail'],
        viewCount: 1532,
        sentiment: 'positive',
        isBreaking: false,
        isFeatured: true,
        hasVideo: true,
        readTime: 4
      },
      {
        id: 'mock-3',
        title: 'New Smart Government Services Launched by Dubai Municipality',
        titleAr: 'بلدية دبي تطلق خدمات حكومية ذكية جديدة',
        content: 'Dubai Municipality has introduced new digital services allowing residents to complete various municipal transactions online through the Dubai Now app.',
        contentAr: 'أطلقت بلدية دبي خدمات رقمية جديدة تسمح للمقيمين بإكمال معاملات بلدية مختلفة عبر الإنترنت من خلال تطبيق دبي الآن.',
        summary: 'Enhanced digital government services now available through Dubai Now app.',
        summaryAr: 'خدمات حكومية رقمية محسنة متاحة الآن عبر تطبيق دبي الآن.',
        source: {
          id: 'dubai-municipality',
          name: 'Dubai Municipality',
          nameAr: 'بلدية دبي',
          logo: null,
          website: 'https://www.dm.gov.ae',
          credibility: 0.98
        },
        author: 'DM Digital Team',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/mock-gov-services',
        imageUrl: 'https://picsum.photos/400/300?random=3',
        category: 'local',
        tags: ['government', 'digital services', 'municipality', 'app'],
        viewCount: 892,
        sentiment: 'positive',
        isBreaking: false,
        isFeatured: false,
        hasVideo: false,
        readTime: 2
      }
    ]

    // Filter mock data based on query if provided
    if (query && query !== 'Dubai UAE') {
      const queryLower = query.toLowerCase()
      return dubaiMockNews.filter(article => 
        article.title.toLowerCase().includes(queryLower) ||
        article.content.toLowerCase().includes(queryLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(queryLower))
      )
    }

    return dubaiMockNews
  }

  // Get news sources
  static async getSources(): Promise<NewsSource[]> {
    return [
      {
        id: 'mydub-ai',
        name: 'MyDub.AI',
        nameAr: 'ماي دبي الذكي',
        logo: null,
        website: 'https://mydub.ai',
        credibility: 0.95
      }
    ]
  }

  // Convert database article to NewsArticle format
  private static convertDatabaseArticle(dbArticle: any): NewsArticle {
    return {
      id: dbArticle.id,
      title: dbArticle.title,
      titleAr: dbArticle.title_ar || dbArticle.title,
      content: dbArticle.content,
      contentAr: dbArticle.content_ar || dbArticle.content,
      summary: dbArticle.summary,
      summaryAr: dbArticle.summary_ar || dbArticle.summary,
      source: {
        id: dbArticle.source_id || 'mydub-ai',
        name: dbArticle.source_name || 'MyDub.AI',
        nameAr: dbArticle.source_name_ar || 'ماي دبي',
        logo: null,
        website: dbArticle.source_url || 'https://mydub.ai',
        credibility: 0.9
      },
      author: dbArticle.author || 'News Desk',
      publishedAt: dbArticle.published_at,
      updatedAt: dbArticle.updated_at,
      url: dbArticle.url || `/news/${dbArticle.id}`,
      imageUrl: this.fixImageUrl(dbArticle.image_url),
      category: dbArticle.category || 'general',
      tags: dbArticle.tags || [],
      viewCount: dbArticle.view_count || 0,
      sentiment: dbArticle.sentiment || 'neutral',
      isBreaking: dbArticle.is_breaking || false,
      isFeatured: dbArticle.is_featured || false,
      hasVideo: dbArticle.has_video || false,
      readTime: dbArticle.read_time || 3
    }
  }

  // Convert external API article to NewsArticle format
  private static convertExternalArticle(externalArticle: any): NewsArticle {
    return {
      id: `external-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: externalArticle.title,
      titleAr: externalArticle.title,
      content: externalArticle.content || externalArticle.description || '',
      contentAr: externalArticle.content || externalArticle.description || '',
      summary: externalArticle.description || externalArticle.title,
      summaryAr: externalArticle.description || externalArticle.title,
      source: {
        id: externalArticle.source?.name?.toLowerCase().replace(/\s+/g, '-') || 'external',
        name: externalArticle.source?.name || 'External Source',
        nameAr: externalArticle.source?.name || 'مصدر خارجي',
        logo: null,
        website: externalArticle.url,
        credibility: 0.7
      },
      author: 'News Desk',
      publishedAt: externalArticle.publishedAt,
      updatedAt: externalArticle.publishedAt,
      url: externalArticle.url,
      imageUrl: this.fixImageUrl(externalArticle.urlToImage),
      category: 'news',
      tags: ['Dubai', 'UAE'],
      viewCount: 0,
      sentiment: 'neutral',
      isBreaking: false,
      isFeatured: false,
      hasVideo: false,
      readTime: Math.ceil((externalArticle.content || externalArticle.description || '').split(' ').length / 200)
    }
  }

  // Subscribe to real-time article updates
  static async subscribeToArticles(
    callback: (article: NewsArticle) => void
  ): Promise<() => void> {
    // Subscribe to database changes
    const channel = supabase
      .channel('news-articles')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles'
        },
        (payload) => {
          const article = this.convertDatabaseArticle(payload.new)
          callback(article)
        }
      )
      .subscribe()
    
    // Also subscribe to external API updates
    const externalUnsubscribe = ExternalAPIsService.subscribeToNewsUpdates((externalArticle) => {
      const article = this.convertExternalArticle(externalArticle)
      callback(article)
    })
    
    // Return combined unsubscribe function
    return () => {
      supabase.removeChannel(channel)
      externalUnsubscribe()
    }
  }

  // Sync news from external APIs to database
  static async syncNewsFromAPI(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      await ExternalAPIsService.syncNewsToDatabase(supabase)
      return {
        success: true,
        synced: 0, // Would need to track this in syncNewsToDatabase
        errors: []
      }
    } catch (error) {
      console.error('News sync failed:', error)
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  // Validate API configuration
  static validateConfiguration(): {
    hasExternalAPIs: boolean;
    hasDatabase: boolean;
    hasContentDistribution: boolean;
    recommendations: string[];
  } {
    const apiConfig = ExternalAPIsService.validateAPIConfiguration()
    const recommendations: string[] = []
    
    if (!apiConfig.newsAPI) {
      recommendations.push('Configure VITE_NEWS_API_KEY for real-time news updates')
    }
    
    if (!apiConfig.weatherAPI) {
      recommendations.push('Configure VITE_OPENWEATHER_API_KEY for weather data')
    }
    
    return {
      hasExternalAPIs: apiConfig.newsAPI || false,
      hasDatabase: true, // Supabase is configured
      hasContentDistribution: true,
      recommendations
    }
  }

  // Clear news cache
  static clearCache(): void {
    // Clear the cache in ExternalAPIsService
    // Since the cache is private, we'll need to add a method there
  }

  // Get cache statistics
  static getCacheStats(): { size: number; entries: string[] } {
    // Return basic stats for now
    return {
      size: 0,
      entries: []
    }
  }
}