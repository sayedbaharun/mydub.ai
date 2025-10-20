import { NewsArticle, NewsFilters, NewsSource } from '../types'
import { contentDistributionService } from '../../../shared/services/content-distribution.service'
import { ExternalAPIsService } from '../../../shared/services/external-apis'
import { supabase } from '../../../shared/lib/supabase'

export class NewsService {
  // Feature flags (Vite env)
  private static ENABLE_LOCAL = import.meta.env.VITE_ENABLE_LOCAL_NEWS === 'true'
  private static ENABLE_MOCKS = import.meta.env.VITE_ENABLE_NEWS_MOCKS === 'true'
  private static ENABLE_EXTERNAL = import.meta.env.VITE_ENABLE_NEWS_API === 'true'

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

  // Create a stable ID for external API articles using URL hash
  private static externalId(externalArticle: any): string {
    const key: string = externalArticle?.url || externalArticle?.link || externalArticle?.title || ''
    const str = String(key)
    // djb2 hash
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i)
      hash = hash & 0xffffffff
    }
    // Ensure positive and to base36 for compactness
    const id = Math.abs(hash).toString(36)
    return `news-api-${id}`
  }

  // Normalize category to allowed union values
  private static normalizeCategory(input?: string): NewsArticle['category'] {
    const allowed: NewsArticle['category'][] = [
      'local',
      'business',
      'technology',
      'sports',
      'entertainment',
      'lifestyle',
      'opinion',
      'general'
    ]
    const v = (input || '').toLowerCase() as NewsArticle['category']
    return allowed.includes(v) ? v : 'general'
  }

  // Dubai filters
  private static isDubaiText(text?: string): boolean {
    if (!text) return false
    const t = text.toLowerCase()
    return t.includes('dubai') || t.includes('uae') || t.includes('united arab emirates')
  }

  private static isDubaiArticle(article: NewsArticle): boolean {
    return (
      NewsService.isDubaiText(article.title) ||
      NewsService.isDubaiText(article.summary) ||
      NewsService.isDubaiText(article.content) ||
      (article.tags || []).some(tag => NewsService.isDubaiText(tag)) ||
      article.category === 'local'
    )
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
      category: this.normalizeCategory(article.category),
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
        .from('news_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50)

      // Handle categories filter (array)
      if (filters?.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories)
      }

      if (filters?.search) {
        const searchTerm = filters.search
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`)
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
          category: this.normalizeCategory(article.category),
          tags: article.tags || [],
          viewCount: article.view_count || 0,
          sentiment: 'neutral' as const,
          isBreaking: article.is_breaking_news || false,
          isFeatured: article.is_featured || false,
          hasVideo: false,
          readTime: Math.ceil(article.content.replace(/<[^>]*>/g, '').split(' ').length / 200)
        } as NewsArticle))

        // Always return database articles if we have any (Dubai-only)
        return formattedArticles.filter(a => NewsService.isDubaiArticle(a))
      }

      // Try to get real news from NewsAPI as fallback (only when enabled)
      const newsApiData = NewsService.ENABLE_EXTERNAL
        ? await ExternalAPIsService.fetchDubaiNews()
        : null
      
      if (newsApiData && newsApiData.articles && newsApiData.articles.length > 0) {
        // Convert NewsAPI articles to our format
        const apiArticles: NewsArticle[] = newsApiData.articles
          .map((external: any) => this.convertExternalArticle(external))
          .map((a, index) => ({
            ...a,
            isFeatured: index < 3,
            viewCount: Math.floor(Math.random() * 1000) + 100
          } as NewsArticle))
        
        // Optionally include local articles from content distribution
        let combinedArticles: NewsArticle[] = [...apiArticles]
        if (NewsService.ENABLE_LOCAL) {
          const allArticles = contentDistributionService.getAllArticles()
          const localArticles: NewsArticle[] = allArticles.map(article => this.convertToNewsArticle(article))
          combinedArticles = [...apiArticles, ...localArticles]
        }
        
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
        
        // Dubai-only
        return combinedArticles.filter(a => NewsService.isDubaiArticle(a))
      } else {
        // Fallback to local content if API fails (only when enabled)
        if (NewsService.ENABLE_LOCAL) {
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
          
          // Dubai-only
          return filteredArticles.filter(a => NewsService.isDubaiArticle(a))
        }
        // If local disabled, return empty list instead of local fallback
        return []
      }
    } catch (error) {
      console.error('Error getting articles:', error)
      // Only use mock data when explicitly enabled
      if (NewsService.ENABLE_MOCKS) {
        return this.getMockNewsData(filters?.search || 'Dubai UAE')
      }
      return []
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
      category: this.normalizeCategory(dbArticle.category),
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
    // Derive substantive content/summary and strip truncation markers like "[+123 chars]"
    const rawContent = externalArticle.content || externalArticle.description || externalArticle.title || ''
    const rawSummary = externalArticle.description || externalArticle.title || ''
    const stripTruncation = (s: string) => s.replace(/\s*\[\+\d+\s*chars?\]\s*$/i, '').trim()
    const contentText = stripTruncation(rawContent)
    const summaryText = stripTruncation(rawSummary) || stripTruncation(externalArticle.title || '')

    return {
      id: this.externalId(externalArticle),
      title: externalArticle.title,
      titleAr: externalArticle.title,
      content: contentText,
      contentAr: contentText,
      summary: summaryText,
      summaryAr: summaryText,
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
      category: 'general',
      tags: ['Dubai', 'UAE'],
      viewCount: 0,
      sentiment: 'neutral',
      isBreaking: false,
      isFeatured: false,
      hasVideo: false,
      readTime: Math.ceil((contentText || summaryText).split(' ').length / 200) || 1
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