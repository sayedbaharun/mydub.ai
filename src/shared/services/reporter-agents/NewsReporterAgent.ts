// News Reporter Agent - Specializes in government announcements, breaking news, and business updates

import { BaseReporterAgent } from './BaseReporterAgent'
import { ContentAnalyzer } from '@/shared/services/reporter-agents/utils/contentAnalyzer'
import { callOpenRouter, getModelForTask } from '@/shared/lib/ai-services'
import { supabase } from '@/shared/lib/supabase'
import {
  ReporterAgentConfig,
  ContentItem,
  ReporterSpecialty,
  DataSource,
  ContentStatus,
  WritingStyle,
  DEFAULT_SCHEDULE
} from '@/shared/services/reporter-agents/types/reporter.types'

export class NewsReporterAgent extends BaseReporterAgent {
  private static instance: NewsReporterAgent

  constructor() {
    const config: ReporterAgentConfig = {
      id: 'news-reporter-001',
      name: 'Dubai News Reporter',
      description: 'Specializes in government announcements, breaking news, and major business updates',
      specialty: ReporterSpecialty.NEWS,
      writingStyle: {
        tone: ['professional', 'authoritative', 'objective', 'clear'],
        voice: 'third-person',
        complexity: 'moderate',
        targetAudience: ['residents', 'business professionals', 'government officials'],
        customPrompts: [
          'Write in an authoritative news style similar to Gulf News or The National',
          'Lead with the most important information',
          'Include relevant government sources and official statements',
          'Maintain objectivity while providing context'
        ]
      },
      priorities: [
        'Government announcements and policy changes',
        'Breaking news and emergencies',
        'Major business developments',
        'Infrastructure updates',
        'Public safety information'
      ],
      sources: [
        {
          type: 'government',
          name: 'Dubai Media Office',
          url: 'https://mediaoffice.ae/en/rss',
          priority: 'high',
          refreshInterval: 15
        },
        {
          type: 'government',
          name: 'UAE Government Portal',
          url: 'https://u.ae/en/rss',
          priority: 'high',
          refreshInterval: 30
        },
        {
          type: 'api',
          name: 'NewsAPI - UAE',
          apiKey: process.env.NEWS_API_KEY,
          priority: 'medium',
          refreshInterval: 20,
          filters: [
            {
              field: 'country',
              operator: 'equals',
              value: 'ae'
            }
          ]
        },
        {
          type: 'rss',
          name: 'Gulf News',
          url: 'https://gulfnews.com/rss',
          priority: 'medium',
          refreshInterval: 30
        },
        {
          type: 'rss',
          name: 'The National',
          url: 'https://www.thenationalnews.com/rss',
          priority: 'medium',
          refreshInterval: 30
        }
      ],
      scheduleConfig: {
        ...DEFAULT_SCHEDULE,
        frequency: 'continuous',
        priority: 'real-time',
        times: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
      },
      learningEnabled: true,
      maxContentPerRun: 20
    }

    super(config)
  }

  static getInstance(): NewsReporterAgent {
    if (!NewsReporterAgent.instance) {
      NewsReporterAgent.instance = new NewsReporterAgent()
    }
    return NewsReporterAgent.instance
  }

  async fetchContent(): Promise<ContentItem[]> {
    const allContent: ContentItem[] = []

    // Fetch from each source
    for (const source of this.config.sources) {
      try {
        const content = await this.fetchFromSource(source)
        allContent.push(...content)
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
      }
    }

    // Remove duplicates and validate
    const validContent = await this.filterAndValidateContent(allContent)

    // Enrich content with metadata
    const enrichedContent = await Promise.all(
      validContent.map(item => ContentAnalyzer.enrichContent(item))
    )

    return enrichedContent
  }

  private async fetchFromSource(source: DataSource): Promise<ContentItem[]> {
    switch (source.type) {
      case 'government':
        return this.fetchGovernmentFeed(source)
      case 'api':
        return this.fetchFromNewsAPI(source)
      case 'rss':
        return this.fetchRSSFeed(source)
      default:
        return []
    }
  }

  private async fetchGovernmentFeed(source: DataSource): Promise<ContentItem[]> {
    if (!source.url) return []

    try {
      // Use Supabase Edge Function to fetch RSS
      const { data } = await supabase.functions.invoke('fetch-rss', {
        body: { url: source.url }
      })

      if (!data || !data.items) return []

      return data.items.map((item: any) => ({
        id: `${source.name}-${Date.now()}-${Math.random()}`,
        agentId: this.config.id,
        title: item.title,
        content: item.content || item.description,
        summary: item.description?.substring(0, 200),
        category: 'government',
        tags: ['government', 'official', 'announcement'],
        source: source,
        relevanceScore: 0,
        priorityScore: 0,
        publishedAt: new Date(item.pubDate || Date.now()),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: item.link,
          author: item.author || source.name
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error(`Failed to fetch government feed from ${source.name}:`, error)
      return []
    }
  }

  private async fetchFromNewsAPI(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      // Use Supabase Edge Function to proxy NewsAPI
      const { data } = await supabase.functions.invoke('fetch-news-api', {
        body: {
          apiKey: source.apiKey,
          query: 'Dubai OR UAE OR Emirates',
          country: 'ae',
          pageSize: 10
        }
      })

      if (!data || !data.articles) return []

      return data.articles.map((article: any) => ({
        id: `newsapi-${Date.now()}-${Math.random()}`,
        agentId: this.config.id,
        title: article.title,
        content: article.content || article.description,
        summary: article.description,
        category: 'news',
        tags: ['news', 'current affairs'],
        source: source,
        relevanceScore: 0,
        priorityScore: 0,
        publishedAt: new Date(article.publishedAt),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: article.url,
          author: article.author,
          imageUrls: article.urlToImage ? [article.urlToImage] : []
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error(`Failed to fetch from NewsAPI:`, error)
      return []
    }
  }

  private async fetchRSSFeed(source: DataSource): Promise<ContentItem[]> {
    if (!source.url) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-rss', {
        body: { url: source.url }
      })

      if (!data || !data.items) return []

      return data.items
        .filter((item: any) => this.isRelevantToNews(item))
        .map((item: any) => ({
          id: `${source.name}-${Date.now()}-${Math.random()}`,
          agentId: this.config.id,
          title: item.title,
          content: item.content || item.description,
          summary: item.description?.substring(0, 200),
          category: 'news',
          tags: this.extractNewsTags(item),
          source: source,
          relevanceScore: 0,
          priorityScore: 0,
          publishedAt: new Date(item.pubDate || Date.now()),
          fetchedAt: new Date(),
          metadata: {
            originalUrl: item.link,
            author: item.author || source.name,
            imageUrls: this.extractImageUrls(item)
          },
          status: ContentStatus.FETCHED
        }))
    } catch (error) {
      console.error(`Failed to fetch RSS feed from ${source.name}:`, error)
      return []
    }
  }

  private isRelevantToNews(item: any): boolean {
    const content = `${item.title} ${item.description}`.toLowerCase()
    
    // Check for news-related keywords
    const newsKeywords = [
      'announce', 'government', 'policy', 'minister', 'official',
      'breaking', 'update', 'report', 'statement', 'launch',
      'economy', 'business', 'trade', 'investment', 'development'
    ]

    return newsKeywords.some(keyword => content.includes(keyword))
  }

  private extractNewsTags(item: any): string[] {
    const tags = ['news']
    const content = `${item.title} ${item.description}`.toLowerCase()

    if (content.includes('government') || content.includes('minister')) {
      tags.push('government')
    }
    if (content.includes('business') || content.includes('economy')) {
      tags.push('business')
    }
    if (content.includes('breaking')) {
      tags.push('breaking-news')
    }

    return tags
  }

  private extractImageUrls(item: any): string[] {
    const images: string[] = []
    
    if (item.enclosure?.url) {
      images.push(item.enclosure.url)
    }
    
    // Extract images from content
    const imgRegex = /<img[^>]+src="([^">]+)"/g
    let match
    while ((match = imgRegex.exec(item.content || '')) !== null) {
      images.push(match[1])
    }

    return images
  }

  private async filterAndValidateContent(content: ContentItem[]): Promise<ContentItem[]> {
    // Remove duplicates
    const uniqueContent = this.removeDuplicates(content)

    // Validate each item
    const validContent: ContentItem[] = []
    for (const item of uniqueContent) {
      if (await this.validateContent(item)) {
        validContent.push(item)
      }
    }

    // Sort by publication date (newest first)
    return validContent.sort((a, b) => 
      b.publishedAt.getTime() - a.publishedAt.getTime()
    )
  }

  private removeDuplicates(content: ContentItem[]): ContentItem[] {
    const seen = new Set<string>()
    return content.filter(item => {
      const key = `${item.title}-${item.source.name}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  async generateArticle(content: ContentItem): Promise<string> {
    const prompt = `
      You are a professional news reporter for a Dubai-based news platform.
      
      Write a news article based on this source material:
      
      Title: ${content.title}
      Content: ${content.content}
      Source: ${content.source.name}
      Published: ${content.publishedAt.toISOString()}
      
      Guidelines:
      ${this.config.writingStyle.customPrompts?.join('\n')}
      
      Requirements:
      - Write in ${this.config.writingStyle.voice} voice
      - Target audience: ${this.config.writingStyle.targetAudience.join(', ')}
      - Tone: ${this.config.writingStyle.tone.join(', ')}
      - Include relevant context for Dubai residents
      - Fact-check and verify claims where possible
      - Length: 400-600 words
      - Include a compelling headline and lead paragraph
      
      Format the article with:
      - Headline
      - Lead paragraph (who, what, when, where, why)
      - Body paragraphs with supporting details
      - Context and background information
      - Implications for Dubai residents
      
      Do not add any markdown formatting or headers.
    `

    try {
      const article = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('creative')
      )

      return this.formatForPublication(article)
    } catch (error) {
      console.error('Failed to generate article:', error)
      throw error
    }
  }

  protected async calculateSpecialtyRelevance(content: ContentItem): Promise<number> {
    let score = 0

    // Check source priority
    if (content.source.priority === 'high') score += 0.3
    else if (content.source.priority === 'medium') score += 0.2

    // Check for news-specific indicators
    const contentLower = content.content.toLowerCase()
    
    // Government content gets highest relevance
    if (content.category === 'government' || contentLower.includes('government')) {
      score += 0.4
    }

    // Breaking news indicators
    const breakingIndicators = ['breaking', 'just in', 'urgent', 'alert', 'announced today']
    if (breakingIndicators.some(indicator => contentLower.includes(indicator))) {
      score += 0.3
    }

    // Business news relevance
    const businessTerms = ['economy', 'gdp', 'investment', 'market', 'trade', 'business']
    const businessMatches = businessTerms.filter(term => contentLower.includes(term)).length
    score += Math.min(businessMatches * 0.05, 0.2)

    return Math.min(score, 1)
  }

  async checkContentAppropriateness(content: ContentItem): Promise<boolean> {
    // News content should be factual and appropriate
    const inappropriateTerms = ['rumor', 'unconfirmed', 'speculation', 'allegedly']
    const contentLower = content.content.toLowerCase()
    
    // Check for unverified content
    if (inappropriateTerms.some(term => contentLower.includes(term))) {
      // Use AI to determine if the content is presented as fact or appropriately attributed
      const prompt = `
        Is this news content presenting unverified information as fact?
        
        Content: "${content.content.substring(0, 500)}..."
        
        Answer with only "yes" or "no".
      `

      try {
        const response = await callOpenRouter(
          [{ role: 'user', content: prompt }],
          getModelForTask('analysis')
        )

        return response.trim().toLowerCase() === 'no'
      } catch (error) {
        // If AI check fails, be conservative
        return false
      }
    }

    return super.checkContentAppropriateness(content)
  }
}