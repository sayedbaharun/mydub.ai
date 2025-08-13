import { supabase } from '@/shared/lib/supabase'
import { API_SOURCES, getActiveAPISources } from '@/shared/config/api-sources.config'
import { RSS_FEEDS, getHighPriorityFeeds } from '@/shared/config/rss-feeds.config'
import type { APISource } from '@/shared/config/api-sources.config'
import type { RSSFeed } from '@/shared/config/rss-feeds.config'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  articles: Array<{
    title: string
    summary: string
    content: string
    category: string
    source_type: 'rss' | 'api'
    source_name: string
    url?: string
  }>
}

export class ArticleImportService {
  private static readonly RSS_PARSER_URL = 'https://api.rss2json.com/v1/api.json'
  
  static async importFromRSSFeeds(feeds?: RSSFeed[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      articles: [],
    }

    const feedsToImport = feeds || getHighPriorityFeeds()
    
    for (const feed of feedsToImport) {
      try {
        const articles = await this.fetchRSSFeed(feed)
        
        for (const article of articles) {
          try {
            const existingArticle = await this.checkDuplicateArticle(article.title, article.url)
            
            if (!existingArticle) {
              await supabase.from('news_articles').insert({
                title: article.title,
                summary: article.summary,
                content: article.content,
                category: article.category,
                status: 'submitted',
                author: article.source_name,
                published_at: article.published_at || new Date().toISOString(),
                url: article.url,
                image_url: article.featured_image,
                tags: article.tags || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              
              result.success++
              result.articles.push(article)
            }
          } catch (error) {
            result.failed++
            result.errors.push(`Failed to save article "${article.title}": ${error}`)
          }
        }
      } catch (error) {
        result.failed++
        result.errors.push(`Failed to fetch feed "${feed.name}": ${error}`)
      }
    }
    
    return result
  }

  static async importFromAPIs(sources?: APISource[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      articles: [],
    }

    const sourcesToImport = sources || getActiveAPISources()
    
    for (const source of sourcesToImport) {
      try {
        const articles = await this.fetchAPISource(source)
        
        for (const article of articles) {
          try {
            const existingArticle = await this.checkDuplicateArticle(article.title, article.url)
            
            if (!existingArticle) {
              await supabase.from('news_articles').insert({
                title: article.title,
                summary: article.summary,
                content: article.content,
                category: article.category,
                status: 'submitted',
                author: article.source_name,
                published_at: article.published_at || new Date().toISOString(),
                url: article.url,
                image_url: article.featured_image,
                tags: article.tags || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              
              result.success++
              result.articles.push(article)
            }
          } catch (error) {
            result.failed++
            result.errors.push(`Failed to save article "${article.title}": ${error}`)
          }
        }
      } catch (error) {
        result.failed++
        result.errors.push(`Failed to fetch API "${source.name}": ${error}`)
      }
    }
    
    return result
  }

  private static async fetchRSSFeed(feed: RSSFeed): Promise<any[]> {
    try {
      const response = await fetch(`${this.RSS_PARSER_URL}?rss_url=${encodeURIComponent(feed.url)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.status !== 'ok' || !data.items) {
        throw new Error('Invalid RSS feed response')
      }
      
      return data.items.slice(0, 10).map((item: any) => ({
        title: item.title,
        summary: item.description ? this.truncateText(this.stripHtml(item.description), 200) : '',
        content: item.content || item.description || '',
        category: feed.category,
        source_name: feed.name,
        url: item.link,
        featured_image: item.enclosure?.link || this.extractImageFromContent(item.content || item.description),
        tags: item.categories || [],
        published_at: item.pubDate,
      }))
    } catch (error) {
      console.error(`Error fetching RSS feed ${feed.name}:`, error)
      throw error
    }
  }

  private static async fetchAPISource(source: APISource): Promise<any[]> {
    const articles: any[] = []
    
    // For NewsAPI
    if (source.name === 'NewsAPI' && source.endpoints.length > 0) {
      const endpoint = source.endpoints[0]
      const url = new URL(`${source.baseUrl}${endpoint.path}`)
      
      // Add query parameters
      if (endpoint.parameters) {
        Object.entries(endpoint.parameters).forEach(([key, value]) => {
          url.searchParams.append(key, value.toString())
        })
      }
      
      const headers: HeadersInit = {
        ...endpoint.headers,
      }
      
      // Add authentication
      if (source.authentication.type === 'apiKey' && source.authentication.credentials?.key) {
        if (source.authentication.location === 'header' && source.authentication.parameterName) {
          headers[source.authentication.parameterName] = source.authentication.credentials.key
        } else if (source.authentication.location === 'query' && source.authentication.parameterName) {
          url.searchParams.append(source.authentication.parameterName, source.authentication.credentials.key)
        }
      }
      
      try {
        const response = await fetch(url.toString(), {
          method: endpoint.method,
          headers,
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        const items = endpoint.dataPath ? data[endpoint.dataPath] : data
        
        if (Array.isArray(items)) {
          items.slice(0, 10).forEach((item: any) => {
            articles.push({
              title: item.title,
              summary: item.description ? this.truncateText(item.description, 200) : '',
              content: item.content || item.description || '',
              category: this.mapAPICategory(source.agentTypes[0]),
              source_name: `${source.name} - ${item.source?.name || 'Unknown'}`,
              url: item.url,
              featured_image: item.urlToImage,
              tags: [],
              published_at: item.publishedAt,
            })
          })
        }
      } catch (error) {
        console.error(`Error fetching API source ${source.name}:`, error)
        throw error
      }
    }
    
    return articles
  }

  private static async checkDuplicateArticle(title: string, url?: string): Promise<boolean> {
    if (url) {
      const { data: urlMatch } = await supabase
        .from('news_articles')
        .select('id')
        .eq('url', url)
        .single()
      
      if (urlMatch) return true
    }
    
    // Check for similar titles (to avoid near-duplicates)
    const { data: titleMatch } = await supabase
      .from('news_articles')
      .select('id')
      .ilike('title', `%${title.substring(0, 50)}%`)
      .limit(1)
      .single()
    
    return !!titleMatch
  }

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '').trim()
  }

  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  private static extractImageFromContent(content: string): string | null {
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
    return imgMatch ? imgMatch[1] : null
  }

  private static mapAPICategory(agentType: string): string {
    const categoryMap: Record<string, string> = {
      news: 'news',
      business: 'business',
      lifestyle: 'lifestyle',
      tourism: 'tourism',
      weather: 'news',
    }
    return categoryMap[agentType] || 'news'
  }

  static async generateAIArticles(count: number = 5): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      articles: [],
    }

    // This is a placeholder for AI generation
    // In a real implementation, this would call your AI service
    const categories = ['news', 'business', 'lifestyle', 'tourism', 'technology']
    const topics = [
      'Dubai Expo 2025 preparations',
      'New sustainable transportation initiative',
      'Digital transformation in government services',
      'Tourism industry recovery',
      'Innovation in financial services',
    ]

    for (let i = 0; i < count; i++) {
      try {
        const category = categories[Math.floor(Math.random() * categories.length)]
        const topic = topics[Math.floor(Math.random() * topics.length)]
        
        const article = {
          title: `AI Generated: ${topic} - ${new Date().toLocaleDateString()}`,
          summary: `This is an AI-generated article about ${topic} in Dubai, covering the latest developments and future outlook.`,
          content: `<p>This is placeholder content for an AI-generated article about ${topic}.</p><p>In a real implementation, this would be generated by your AI service based on current trends, data analysis, and content templates.</p>`,
          category,
          source_type: 'ai' as const,
          source_name: 'AI Reporter',
          tags: [category, 'ai-generated', topic.split(' ')[0].toLowerCase()],
        }

        await supabase.from('news_articles').insert({
          title: article.title,
          summary: article.summary,
          content: article.content,
          category: article.category,
          status: 'submitted',
          author: article.source_name,
          published_at: new Date().toISOString(),
          tags: article.tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        result.success++
        result.articles.push(article)
      } catch (error) {
        result.failed++
        result.errors.push(`Failed to generate AI article: ${error}`)
      }
    }

    return result
  }
}