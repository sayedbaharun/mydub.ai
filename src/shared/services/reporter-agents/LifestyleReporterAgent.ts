// Lifestyle Reporter Agent - Specializes in restaurants, events, nightlife, and entertainment

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
  DEFAULT_SCHEDULE
} from '@/shared/services/reporter-agents/types/reporter.types'

export class LifestyleReporterAgent extends BaseReporterAgent {
  private static instance: LifestyleReporterAgent

  constructor() {
    const config: ReporterAgentConfig = {
      id: 'lifestyle-reporter-001',
      name: 'Dubai Lifestyle Reporter',
      description: 'Covers restaurants, events, nightlife, entertainment, and cultural experiences',
      specialty: ReporterSpecialty.LIFESTYLE,
      writingStyle: {
        tone: ['vibrant', 'engaging', 'sophisticated', 'trendy', 'inclusive'],
        voice: 'first-person',
        complexity: 'simple',
        targetAudience: ['young professionals', 'tourists', 'expats', 'lifestyle enthusiasts'],
        customPrompts: [
          'Write in an engaging, lifestyle magazine style',
          'Use vivid descriptions to bring experiences to life',
          'Include practical details like prices, timings, and locations',
          'Appeal to both residents and visitors',
          'Highlight what makes each experience unique'
        ]
      },
      priorities: [
        'New restaurant and cafe openings',
        'Weekend events and festivals',
        'Nightlife and entertainment venues',
        'Cultural exhibitions and shows',
        'Exclusive experiences and pop-ups',
        'Fashion and shopping events'
      ],
      sources: [
        {
          type: 'api',
          name: 'Eventbrite Dubai',
          apiKey: process.env.EVENTBRITE_API_KEY,
          priority: 'high',
          refreshInterval: 60,
          filters: [
            {
              field: 'location',
              operator: 'contains',
              value: 'Dubai'
            }
          ]
        },
        {
          type: 'social',
          name: 'Instagram Dubai Lifestyle',
          priority: 'medium',
          refreshInterval: 30,
          filters: [
            {
              field: 'hashtags',
              operator: 'contains',
              value: '#DubaiLifestyle'
            }
          ]
        },
        {
          type: 'api',
          name: 'Zomato Dubai',
          apiKey: process.env.ZOMATO_API_KEY,
          priority: 'high',
          refreshInterval: 120
        },
        {
          type: 'rss',
          name: 'TimeOut Dubai',
          url: 'https://www.timeoutdubai.com/rss',
          priority: 'high',
          refreshInterval: 60
        },
        {
          type: 'rss',
          name: 'WhatsOn Dubai',
          url: 'https://whatson.ae/dubai/feed/',
          priority: 'medium',
          refreshInterval: 60
        }
      ],
      scheduleConfig: {
        ...DEFAULT_SCHEDULE,
        frequency: 'daily',
        priority: 'high',
        times: ['10:00', '16:00', '19:00'], // Morning, afternoon, evening
        daysOfWeek: [0, 3, 4, 5, 6] // Focus on Wed-Sun (weekend in Dubai)
      },
      learningEnabled: true,
      maxContentPerRun: 15
    }

    super(config)
  }

  static getInstance(): LifestyleReporterAgent {
    if (!LifestyleReporterAgent.instance) {
      LifestyleReporterAgent.instance = new LifestyleReporterAgent()
    }
    return LifestyleReporterAgent.instance
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

    // Add special weekend content on Thursdays
    if (new Date().getDay() === 4) { // Thursday
      const weekendContent = await this.fetchWeekendHighlights()
      allContent.push(...weekendContent)
    }

    // Filter and validate
    const validContent = await this.filterAndValidateContent(allContent)

    // Enrich with lifestyle-specific metadata
    const enrichedContent = await Promise.all(
      validContent.map(item => this.enrichLifestyleContent(item))
    )

    return enrichedContent
  }

  private async fetchFromSource(source: DataSource): Promise<ContentItem[]> {
    switch (source.name) {
      case 'Eventbrite Dubai':
        return this.fetchEventbriteEvents(source)
      case 'Zomato Dubai':
        return this.fetchRestaurantUpdates(source)
      case 'Instagram Dubai Lifestyle':
        return this.fetchSocialContent(source)
      case 'TimeOut Dubai':
      case 'WhatsOn Dubai':
        return this.fetchLifestyleRSS(source)
      default:
        return []
    }
  }

  private async fetchEventbriteEvents(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-eventbrite', {
        body: {
          apiKey: source.apiKey,
          location: 'Dubai',
          categories: ['music', 'food-drink', 'arts', 'fashion', 'nightlife'],
          timeRange: 'this_week'
        }
      })

      if (!data || !data.events) return []

      return data.events.map((event: any) => ({
        id: `eventbrite-${event.id}`,
        agentId: this.config.id,
        title: event.name.text,
        content: event.description.text || event.summary,
        summary: event.summary || event.name.text,
        category: 'events',
        tags: this.extractEventTags(event),
        source: source,
        relevanceScore: 0,
        priorityScore: 0,
        publishedAt: new Date(event.created),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: event.url,
          imageUrls: event.logo ? [event.logo.url] : [],
          location: {
            name: event.venue?.name || 'Dubai',
            area: event.venue?.address?.city || 'Dubai'
          },
          customData: {
            startTime: event.start.local,
            endTime: event.end.local,
            price: event.is_free ? 'Free' : 'Ticketed',
            capacity: event.capacity
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch Eventbrite events:', error)
      return []
    }
  }

  private async fetchRestaurantUpdates(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-restaurant-updates', {
        body: {
          apiKey: source.apiKey,
          city: 'Dubai',
          categories: ['newly_opened', 'trending', 'top_rated']
        }
      })

      if (!data || !data.restaurants) return []

      return data.restaurants.map((restaurant: any) => ({
        id: `zomato-${restaurant.id}`,
        agentId: this.config.id,
        title: `${restaurant.name} - ${restaurant.tagline || 'New Dubai Dining Experience'}`,
        content: this.createRestaurantContent(restaurant),
        summary: restaurant.highlights?.join(', ') || restaurant.cuisines,
        category: 'dining',
        tags: ['restaurant', 'dining', ...restaurant.cuisines.split(', ')],
        source: source,
        relevanceScore: 0,
        priorityScore: 0,
        publishedAt: new Date(restaurant.date_opened || Date.now()),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: restaurant.url,
          imageUrls: restaurant.photos || [],
          location: {
            name: restaurant.location.locality,
            area: restaurant.location.city
          },
          customData: {
            cuisine: restaurant.cuisines,
            priceRange: restaurant.price_range,
            rating: restaurant.user_rating.aggregate_rating,
            timings: restaurant.timings
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch restaurant updates:', error)
      return []
    }
  }

  private async fetchSocialContent(source: DataSource): Promise<ContentItem[]> {
    try {
      // Use social media aggregator Edge Function
      const { data } = await supabase.functions.invoke('fetch-social-lifestyle', {
        body: {
          hashtags: ['#DubaiLifestyle', '#MyDubai', '#DubaiEvents', '#DubaiFoodie'],
          platforms: ['instagram', 'tiktok'],
          minEngagement: 1000
        }
      })

      if (!data || !data.posts) return []

      return data.posts
        .filter((post: any) => this.isRelevantLifestyleContent(post))
        .map((post: any) => ({
          id: `social-${post.id}`,
          agentId: this.config.id,
          title: this.extractTitleFromSocial(post),
          content: post.caption || post.text,
          summary: post.caption?.substring(0, 150) || '',
          category: 'social',
          tags: this.extractHashtags(post.caption),
          source: source,
          relevanceScore: 0,
          priorityScore: 0,
          publishedAt: new Date(post.created_at),
          fetchedAt: new Date(),
          metadata: {
            originalUrl: post.permalink,
            author: post.user.username,
            imageUrls: post.media_urls || [],
            customData: {
              platform: post.platform,
              engagement: post.like_count + post.comment_count,
              isVerified: post.user.is_verified
            }
          },
          status: ContentStatus.FETCHED
        }))
    } catch (error) {
      console.error('Failed to fetch social content:', error)
      return []
    }
  }

  private async fetchLifestyleRSS(source: DataSource): Promise<ContentItem[]> {
    if (!source.url) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-rss', {
        body: { url: source.url }
      })

      if (!data || !data.items) return []

      return data.items
        .filter((item: any) => this.isLifestyleContent(item))
        .map((item: any) => ({
          id: `${source.name}-${Date.now()}-${Math.random()}`,
          agentId: this.config.id,
          title: item.title,
          content: item.content || item.description,
          summary: item.description?.substring(0, 200),
          category: this.categorizeLifestyleContent(item),
          tags: this.extractLifestyleTags(item),
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
      console.error(`Failed to fetch RSS from ${source.name}:`, error)
      return []
    }
  }

  private async fetchWeekendHighlights(): Promise<ContentItem[]> {
    // Create a special weekend roundup
    const weekendEvents = await this.generateWeekendRoundup()
    return weekendEvents
  }

  private async generateWeekendRoundup(): Promise<ContentItem[]> {
    try {
      const prompt = `
        Generate 3 exciting weekend activity ideas for Dubai this weekend.
        Include a mix of dining, entertainment, and outdoor activities.
        
        For each activity, provide:
        - Title (catchy and appealing)
        - Description (100-150 words)
        - Category (dining/entertainment/outdoor/culture)
        - Location area
        - Price range
        
        Format as JSON array.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('creative')
      )

      const activities = JSON.parse(response)
      
      return activities.map((activity: any, index: number) => ({
        id: `weekend-${Date.now()}-${index}`,
        agentId: this.config.id,
        title: activity.title,
        content: activity.description,
        summary: activity.description.substring(0, 100),
        category: activity.category,
        tags: ['weekend', 'featured', activity.category],
        source: {
          type: 'api',
          name: 'AI Weekend Curator',
          priority: 'high',
          refreshInterval: 168 // Weekly
        },
        relevanceScore: 0.9,
        priorityScore: 0.9,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          location: {
            name: activity.location,
            area: activity.location
          },
          customData: {
            priceRange: activity.priceRange,
            aiGenerated: true
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to generate weekend roundup:', error)
      return []
    }
  }

  private async enrichLifestyleContent(content: ContentItem): Promise<ContentItem> {
    // Base enrichment
    let enriched = await ContentAnalyzer.enrichContent(content)

    // Add lifestyle-specific enrichment
    if (content.category === 'dining') {
      enriched = await this.enrichDiningContent(enriched)
    } else if (content.category === 'events') {
      enriched = await this.enrichEventContent(enriched)
    }

    // Add trending score
    const trendingScore = await this.calculateTrendingScore(enriched)
    enriched.metadata.customData = {
      ...enriched.metadata.customData,
      trendingScore
    }

    return enriched
  }

  private async enrichDiningContent(content: ContentItem): Promise<ContentItem> {
    // Add cuisine analysis, price insights, etc.
    const cuisineAnalysis = await this.analyzeCuisine(content.content)
    content.metadata.customData = {
      ...content.metadata.customData,
      cuisineAnalysis
    }
    return content
  }

  private async enrichEventContent(content: ContentItem): Promise<ContentItem> {
    // Add event type, expected audience, etc.
    const eventAnalysis = await this.analyzeEventType(content.content)
    content.metadata.customData = {
      ...content.metadata.customData,
      eventAnalysis
    }
    return content
  }

  async generateArticle(content: ContentItem): Promise<string> {
    const prompt = `
      You are a vibrant lifestyle reporter for Dubai's trendiest lifestyle platform.
      
      Create an engaging lifestyle article from this content:
      
      Title: ${content.title}
      Category: ${content.category}
      Content: ${content.content}
      Location: ${content.metadata.location?.name || 'Dubai'}
      ${content.metadata.customData ? `Details: ${JSON.stringify(content.metadata.customData)}` : ''}
      
      Guidelines:
      ${this.config.writingStyle.customPrompts?.join('\n')}
      
      Requirements:
      - Write in ${this.config.writingStyle.voice} voice
      - Make it sound exclusive and exciting
      - Include practical details (location, timing, price)
      - Add a personal touch or recommendation
      - Use sensory descriptions
      - Length: 350-500 words
      
      Structure:
      - Catchy opening that creates FOMO
      - Vivid description of the experience
      - Practical information seamlessly woven in
      - Why this is must-try/must-visit
      - Call to action
      
      Do not use markdown formatting.
    `

    try {
      const article = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('creative')
      )

      return this.formatForPublication(article)
    } catch (error) {
      console.error('Failed to generate lifestyle article:', error)
      throw error
    }
  }

  protected async calculateSpecialtyRelevance(content: ContentItem): Promise<number> {
    let score = 0

    const contentLower = content.content.toLowerCase()

    // Lifestyle keywords
    const lifestyleKeywords = [
      'restaurant', 'cafe', 'dining', 'brunch', 'nightlife', 'club', 'bar',
      'event', 'festival', 'concert', 'exhibition', 'opening', 'launch',
      'fashion', 'shopping', 'spa', 'wellness', 'beach', 'pool'
    ]

    const keywordMatches = lifestyleKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length

    score += Math.min(keywordMatches * 0.1, 0.4)

    // Category bonus
    if (['dining', 'events', 'entertainment', 'nightlife'].includes(content.category)) {
      score += 0.3
    }

    // Trending content bonus
    if (content.metadata.customData?.trendingScore > 0.7) {
      score += 0.2
    }

    // Social proof bonus
    const engagement = content.metadata.customData?.engagement || 0
    if (engagement > 10000) score += 0.2
    else if (engagement > 1000) score += 0.1

    return Math.min(score, 1)
  }

  private isLifestyleContent(item: any): boolean {
    const content = `${item.title} ${item.description}`.toLowerCase()
    const lifestyleTerms = [
      'restaurant', 'dining', 'brunch', 'cafe', 'bar', 'nightlife',
      'event', 'festival', 'concert', 'party', 'opening',
      'fashion', 'style', 'trend', 'shopping',
      'spa', 'wellness', 'fitness', 'beach', 'leisure'
    ]

    return lifestyleTerms.some(term => content.includes(term))
  }

  private isRelevantLifestyleContent(post: any): boolean {
    const minEngagement = 500
    return post.like_count + post.comment_count >= minEngagement
  }

  private categorizeLifestyleContent(item: any): string {
    const content = `${item.title} ${item.description}`.toLowerCase()

    if (content.includes('restaurant') || content.includes('dining') || content.includes('food')) {
      return 'dining'
    } else if (content.includes('event') || content.includes('festival') || content.includes('concert')) {
      return 'events'
    } else if (content.includes('night') || content.includes('club') || content.includes('party')) {
      return 'nightlife'
    } else if (content.includes('fashion') || content.includes('shopping')) {
      return 'fashion'
    } else if (content.includes('spa') || content.includes('wellness') || content.includes('fitness')) {
      return 'wellness'
    }

    return 'lifestyle'
  }

  private extractEventTags(event: any): string[] {
    const tags = ['event']
    
    if (event.category) tags.push(event.category.toLowerCase())
    if (event.is_free) tags.push('free')
    if (event.format) tags.push(event.format.toLowerCase())
    
    return tags
  }

  private extractLifestyleTags(item: any): string[] {
    const tags: string[] = []
    const content = `${item.title} ${item.description}`.toLowerCase()

    const tagMap = {
      'new opening': ['new', 'opening'],
      'limited time': ['limited', 'exclusive'],
      'happy hour': ['happy-hour', 'deals'],
      'ladies night': ['ladies-night'],
      'brunch': ['brunch', 'weekend'],
      'rooftop': ['rooftop', 'views'],
      'beachside': ['beach', 'outdoor']
    }

    Object.entries(tagMap).forEach(([phrase, associatedTags]) => {
      if (content.includes(phrase)) {
        tags.push(...associatedTags)
      }
    })

    return [...new Set(tags)]
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#\w+/g
    const hashtags = text.match(hashtagRegex) || []
    return hashtags.map(tag => tag.substring(1).toLowerCase())
  }

  private extractTitleFromSocial(post: any): string {
    // Extract a title from social media post
    const caption = post.caption || post.text || ''
    const firstLine = caption.split('\n')[0]
    
    if (firstLine.length > 80) {
      return firstLine.substring(0, 77) + '...'
    }
    
    return firstLine || `${post.user.username}'s Dubai Experience`
  }

  private createRestaurantContent(restaurant: any): string {
    return `
      ${restaurant.name} brings ${restaurant.cuisines} cuisine to ${restaurant.location.locality}.
      
      ${restaurant.description || ''}
      
      Highlights: ${restaurant.highlights?.join(', ') || 'Contemporary dining experience'}
      
      Location: ${restaurant.location.address}
      Timings: ${restaurant.timings}
      Price Range: ${restaurant.currency}${restaurant.average_cost_for_two} for two
      
      ${restaurant.user_rating ? `Rated ${restaurant.user_rating.aggregate_rating}/5 by diners` : ''}
    `.trim()
  }

  private extractImageUrls(item: any): string[] {
    const images: string[] = []
    
    if (item.enclosure?.url) {
      images.push(item.enclosure.url)
    }
    
    const imgRegex = /<img[^>]+src="([^">]+)"/g
    let match
    while ((match = imgRegex.exec(item.content || '')) !== null) {
      images.push(match[1])
    }

    return images
  }

  private async calculateTrendingScore(content: ContentItem): Promise<number> {
    let score = 0

    // Recency boost
    const ageInHours = (Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60)
    if (ageInHours < 24) score += 0.3
    else if (ageInHours < 48) score += 0.2
    else if (ageInHours < 72) score += 0.1

    // Social engagement
    const engagement = content.metadata.customData?.engagement || 0
    if (engagement > 10000) score += 0.4
    else if (engagement > 5000) score += 0.3
    else if (engagement > 1000) score += 0.2

    // Exclusive/limited keywords
    const exclusiveTerms = ['exclusive', 'limited', 'pop-up', 'one-night', 'special']
    const hasExclusive = exclusiveTerms.some(term => 
      content.content.toLowerCase().includes(term)
    )
    if (hasExclusive) score += 0.3

    return Math.min(score, 1)
  }

  private async analyzeCuisine(content: string): Promise<any> {
    try {
      const prompt = `
        Analyze the cuisine type and dining style from this content:
        "${content.substring(0, 500)}"
        
        Return JSON with:
        - cuisineType: main cuisine category
        - diningStyle: casual/fine-dining/fast-casual/cafe
        - priceExpectation: budget/moderate/expensive/luxury
        - uniqueFeatures: array of standout features
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      return JSON.parse(response)
    } catch (error) {
      return {
        cuisineType: 'International',
        diningStyle: 'Casual',
        priceExpectation: 'Moderate',
        uniqueFeatures: []
      }
    }
  }

  private async analyzeEventType(content: string): Promise<any> {
    try {
      const prompt = `
        Analyze this event content and categorize it:
        "${content.substring(0, 500)}"
        
        Return JSON with:
        - eventType: concert/festival/exhibition/party/workshop/other
        - targetAudience: array of audience types
        - dressCode: casual/smart-casual/formal/themed
        - expectedSize: intimate/medium/large/massive
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      return JSON.parse(response)
    } catch (error) {
      return {
        eventType: 'other',
        targetAudience: ['general'],
        dressCode: 'smart-casual',
        expectedSize: 'medium'
      }
    }
  }

  private async filterAndValidateContent(content: ContentItem[]): Promise<ContentItem[]> {
    // Remove duplicates
    const seen = new Set<string>()
    const unique = content.filter(item => {
      const key = `${item.title}-${item.category}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Validate
    const valid: ContentItem[] = []
    for (const item of unique) {
      if (await this.validateContent(item)) {
        valid.push(item)
      }
    }

    // Sort by trending score and recency
    return valid.sort((a, b) => {
      const trendingA = a.metadata.customData?.trendingScore || 0
      const trendingB = b.metadata.customData?.trendingScore || 0
      
      if (Math.abs(trendingA - trendingB) > 0.2) {
        return trendingB - trendingA
      }
      
      return b.publishedAt.getTime() - a.publishedAt.getTime()
    })
  }
}