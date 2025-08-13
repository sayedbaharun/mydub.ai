// Tourism Reporter Agent - Specializes in attractions, travel tips, and visitor information

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

export class TourismReporterAgent extends BaseReporterAgent {
  private static instance: TourismReporterAgent

  constructor() {
    const config: ReporterAgentConfig = {
      id: 'tourism-reporter-001',
      name: 'Dubai Tourism Reporter',
      description: 'Covers tourist attractions, travel tips, seasonal events, and visitor information',
      specialty: ReporterSpecialty.TOURISM,
      writingStyle: {
        tone: ['inspiring', 'informative', 'welcoming', 'adventurous'],
        voice: 'first-person',
        complexity: 'simple',
        targetAudience: ['tourists', 'visitors', 'travel enthusiasts', 'families'],
        customPrompts: [
          'Write in an inspiring travel guide style',
          'Paint vivid pictures of experiences and destinations',
          'Include practical tips and insider knowledge',
          'Highlight unique Dubai experiences',
          'Make readers want to explore and discover'
        ]
      },
      priorities: [
        'New attractions and experiences',
        'Seasonal events and festivals',
        'Travel advisories and tips',
        'Hidden gems and local secrets',
        'Family-friendly activities',
        'Cultural experiences',
        'Adventure and outdoor activities'
      ],
      sources: [
        {
          type: 'government',
          name: 'Visit Dubai Official',
          url: 'https://www.visitdubai.com/en/rss',
          priority: 'high',
          refreshInterval: 60
        },
        {
          type: 'api',
          name: 'TripAdvisor Dubai',
          apiKey: process.env.TRIPADVISOR_API_KEY,
          priority: 'high',
          refreshInterval: 120
        },
        {
          type: 'api',
          name: 'Dubai Tourism API',
          apiKey: process.env.DUBAI_TOURISM_API_KEY,
          priority: 'high',
          refreshInterval: 60
        },
        {
          type: 'rss',
          name: 'Dubai Calendar',
          url: 'https://dubaicalendar.ae/en/rss',
          priority: 'high',
          refreshInterval: 60
        },
        {
          type: 'social',
          name: 'Instagram Travel Dubai',
          priority: 'medium',
          refreshInterval: 60,
          filters: [
            {
              field: 'hashtags',
              operator: 'contains',
              value: '#VisitDubai'
            }
          ]
        },
        {
          type: 'api',
          name: 'Weather & Season API',
          apiKey: process.env.WEATHER_API_KEY,
          priority: 'medium',
          refreshInterval: 360
        }
      ],
      scheduleConfig: {
        ...DEFAULT_SCHEDULE,
        frequency: 'daily',
        priority: 'normal',
        times: ['08:00', '14:00', '18:00'], // Morning, afternoon, evening
        timezone: 'Asia/Dubai'
      },
      learningEnabled: true,
      maxContentPerRun: 15
    }

    super(config)
  }

  static getInstance(): TourismReporterAgent {
    if (!TourismReporterAgent.instance) {
      TourismReporterAgent.instance = new TourismReporterAgent()
    }
    return TourismReporterAgent.instance
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

    // Add seasonal content
    const seasonalContent = await this.generateSeasonalContent()
    allContent.push(...seasonalContent)

    // Filter and validate
    const validContent = await this.filterAndValidateContent(allContent)

    // Enrich with tourism-specific metadata
    const enrichedContent = await Promise.all(
      validContent.map(item => this.enrichTourismContent(item))
    )

    return enrichedContent
  }

  private async fetchFromSource(source: DataSource): Promise<ContentItem[]> {
    switch (source.name) {
      case 'Visit Dubai Official':
        return this.fetchOfficialTourismContent(source)
      case 'TripAdvisor Dubai':
        return this.fetchTripAdvisorContent(source)
      case 'Dubai Tourism API':
        return this.fetchTourismAPIContent(source)
      case 'Dubai Calendar':
        return this.fetchEventsCalendar(source)
      case 'Instagram Travel Dubai':
        return this.fetchTravelSocialContent(source)
      case 'Weather & Season API':
        return this.fetchSeasonalRecommendations(source)
      default:
        return []
    }
  }

  private async fetchOfficialTourismContent(source: DataSource): Promise<ContentItem[]> {
    if (!source.url) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-rss', {
        body: { url: source.url }
      })

      if (!data || !data.items) return []

      return data.items.map((item: any) => ({
        id: `visitdubai-${Date.now()}-${Math.random()}`,
        agentId: this.config.id,
        title: item.title,
        content: item.content || item.description,
        summary: item.description?.substring(0, 200),
        category: 'attractions',
        tags: ['official', 'tourism', ...this.extractTourismTags(item)],
        source: source,
        relevanceScore: 0,
        priorityScore: 0.8, // Official content gets high priority
        publishedAt: new Date(item.pubDate || Date.now()),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: item.link,
          author: 'Visit Dubai',
          imageUrls: this.extractImageUrls(item)
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch official tourism content:', error)
      return []
    }
  }

  private async fetchTripAdvisorContent(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-tripadvisor', {
        body: {
          apiKey: source.apiKey,
          location: 'Dubai',
          categories: ['attractions', 'tours', 'activities'],
          sortBy: 'ranking'
        }
      })

      if (!data || !data.attractions) return []

      return data.attractions.slice(0, 10).map((attraction: any) => ({
        id: `tripadvisor-${attraction.location_id}`,
        agentId: this.config.id,
        title: `${attraction.name} - Top Rated Dubai ${attraction.subcategory_type}`,
        content: this.createAttractionContent(attraction),
        summary: attraction.description?.substring(0, 200) || attraction.ranking_data?.ranking_string,
        category: 'attractions',
        tags: ['attraction', 'top-rated', ...attraction.subcategory_type_label.split(' ')],
        source: source,
        relevanceScore: 0,
        priorityScore: 0,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: attraction.web_url,
          imageUrls: attraction.photo?.images?.large?.url ? [attraction.photo.images.large.url] : [],
          location: {
            name: attraction.address_obj?.street1 || attraction.name,
            area: attraction.address_obj?.neighborhood || 'Dubai',
            coordinates: attraction.latitude && attraction.longitude ? {
              lat: parseFloat(attraction.latitude),
              lng: parseFloat(attraction.longitude)
            } : undefined
          },
          customData: {
            rating: attraction.rating,
            reviewCount: attraction.num_reviews,
            priceLevel: attraction.price_level,
            ranking: attraction.ranking_data?.ranking,
            awards: attraction.awards || []
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch TripAdvisor content:', error)
      return []
    }
  }

  private async fetchTourismAPIContent(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-dubai-tourism', {
        body: {
          apiKey: source.apiKey,
          contentTypes: ['attractions', 'experiences', 'tours'],
          languages: ['en', 'ar']
        }
      })

      if (!data || !data.items) return []

      return data.items.map((item: any) => ({
        id: `dubai-tourism-${item.id}`,
        agentId: this.config.id,
        title: item.title,
        content: item.description,
        summary: item.highlight || item.description.substring(0, 200),
        category: item.type || 'tourism',
        tags: item.tags || ['tourism', 'dubai'],
        source: source,
        relevanceScore: 0,
        priorityScore: 0,
        publishedAt: new Date(item.updated_at || Date.now()),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: item.url,
          imageUrls: item.images || [],
          location: {
            name: item.location_name,
            area: item.area,
            emirate: 'Dubai',
            coordinates: item.coordinates
          },
          customData: {
            duration: item.duration,
            bestTime: item.best_time_to_visit,
            accessibility: item.accessibility_features,
            languages: item.available_languages,
            bookingRequired: item.booking_required,
            priceRange: item.price_range
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch Dubai Tourism API content:', error)
      return []
    }
  }

  private async fetchEventsCalendar(source: DataSource): Promise<ContentItem[]> {
    if (!source.url) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-rss', {
        body: { url: source.url }
      })

      if (!data || !data.items) return []

      // Filter for upcoming events
      const upcomingEvents = data.items.filter((item: any) => {
        const eventDate = new Date(item.eventDate || item.pubDate)
        return eventDate > new Date()
      })

      return upcomingEvents.map((event: any) => ({
        id: `event-${Date.now()}-${Math.random()}`,
        agentId: this.config.id,
        title: event.title,
        content: event.content || event.description,
        summary: event.description?.substring(0, 200),
        category: 'events',
        tags: ['event', 'calendar', ...this.extractEventTags(event)],
        source: source,
        relevanceScore: 0,
        priorityScore: this.calculateEventPriority(event),
        publishedAt: new Date(event.pubDate || Date.now()),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: event.link,
          imageUrls: this.extractImageUrls(event),
          customData: {
            eventDate: event.eventDate,
            venue: event.venue,
            ticketInfo: event.ticketInfo
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch events calendar:', error)
      return []
    }
  }

  private async fetchTravelSocialContent(source: DataSource): Promise<ContentItem[]> {
    try {
      const { data } = await supabase.functions.invoke('fetch-social-travel', {
        body: {
          hashtags: ['#VisitDubai', '#MyDubai', '#DubaiTravel', '#DubaiTourism'],
          platforms: ['instagram'],
          minEngagement: 5000,
          mediaType: 'photo'
        }
      })

      if (!data || !data.posts) return []

      return data.posts
        .filter((post: any) => this.isTravelContent(post))
        .slice(0, 10)
        .map((post: any) => ({
          id: `social-travel-${post.id}`,
          agentId: this.config.id,
          title: this.extractTravelTitle(post),
          content: post.caption || '',
          summary: this.extractTravelHighlight(post),
          category: 'experiences',
          tags: ['social', 'travel', 'experience', ...this.extractHashtags(post.caption)],
          source: source,
          relevanceScore: 0,
          priorityScore: 0,
          publishedAt: new Date(post.created_at),
          fetchedAt: new Date(),
          metadata: {
            originalUrl: post.permalink,
            author: post.user.username,
            imageUrls: post.media_urls || [],
            location: post.location ? {
              name: post.location.name,
              area: post.location.address?.city || 'Dubai'
            } : undefined,
            customData: {
              engagement: post.like_count + post.comment_count,
              isInfluencer: post.user.follower_count > 10000
            }
          },
          status: ContentStatus.FETCHED
        }))
    } catch (error) {
      console.error('Failed to fetch travel social content:', error)
      return []
    }
  }

  private async fetchSeasonalRecommendations(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      // Get current weather and season data
      const { data: weather } = await supabase.functions.invoke('fetch-weather', {
        body: {
          apiKey: source.apiKey,
          location: 'Dubai',
          forecast: 7 // 7-day forecast
        }
      })

      if (!weather) return []

      // Generate seasonal recommendations based on weather
      const recommendations = await this.generateWeatherBasedRecommendations(weather)
      
      return recommendations
    } catch (error) {
      console.error('Failed to fetch seasonal recommendations:', error)
      return []
    }
  }

  private async generateSeasonalContent(): Promise<ContentItem[]> {
    const currentMonth = new Date().getMonth()
    const season = this.getCurrentSeason(currentMonth)
    
    try {
      const prompt = `
        Generate 3 unique Dubai tourism recommendations for ${season}.
        Consider the weather and what tourists would enjoy most.
        
        For each recommendation:
        - Title: Catchy, specific to Dubai
        - Description: 150-200 words
        - Category: indoor/outdoor/cultural/adventure
        - Best time: morning/afternoon/evening/night
        - Family-friendly: yes/no
        
        Format as JSON array.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('creative')
      )

      const recommendations = JSON.parse(response)
      
      return recommendations.map((rec: any, index: number) => ({
        id: `seasonal-${season}-${Date.now()}-${index}`,
        agentId: this.config.id,
        title: rec.title,
        content: rec.description,
        summary: rec.description.substring(0, 150),
        category: rec.category,
        tags: ['seasonal', season.toLowerCase(), rec.category],
        source: {
          type: 'api',
          name: 'AI Travel Curator',
          priority: 'medium',
          refreshInterval: 1440
        },
        relevanceScore: 0.8,
        priorityScore: 0.7,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          customData: {
            season,
            bestTime: rec.bestTime,
            familyFriendly: rec.familyFriendly,
            aiGenerated: true
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to generate seasonal content:', error)
      return []
    }
  }

  private async enrichTourismContent(content: ContentItem): Promise<ContentItem> {
    // Base enrichment
    let enriched = await ContentAnalyzer.enrichContent(content)

    // Add tourism-specific enrichment
    if (content.category === 'attractions') {
      enriched = await this.enrichAttractionContent(enriched)
    } else if (content.category === 'events') {
      enriched = await this.enrichEventContent(enriched)
    }

    // Add visitor tips
    const visitorTips = await this.generateVisitorTips(enriched)
    enriched.metadata.customData = {
      ...enriched.metadata.customData,
      visitorTips
    }

    // Add accessibility info
    const accessibility = await this.analyzeAccessibility(enriched)
    enriched.metadata.customData.accessibility = accessibility

    return enriched
  }

  private async enrichAttractionContent(content: ContentItem): Promise<ContentItem> {
    // Add nearby attractions
    const nearbyAttractions = await this.findNearbyAttractions(content)
    content.metadata.customData = {
      ...content.metadata.customData,
      nearbyAttractions
    }

    return content
  }

  private async enrichEventContent(content: ContentItem): Promise<ContentItem> {
    // Add transportation tips
    const transportTips = await this.generateTransportTips(content)
    content.metadata.customData = {
      ...content.metadata.customData,
      transportTips
    }

    return content
  }

  async generateArticle(content: ContentItem): Promise<string> {
    const prompt = `
      You are an enthusiastic travel writer for Dubai's premier tourism guide.
      
      Create an inspiring travel article from this content:
      
      Title: ${content.title}
      Category: ${content.category}
      Content: ${content.content}
      Location: ${content.metadata.location?.name || 'Dubai'}
      ${content.metadata.customData ? `Details: ${JSON.stringify(content.metadata.customData)}` : ''}
      
      Guidelines:
      ${this.config.writingStyle.customPrompts?.join('\n')}
      
      Requirements:
      - Write in ${this.config.writingStyle.voice} voice
      - Create a sense of wonder and discovery
      - Include practical visitor information
      - Highlight what makes this uniquely Dubai
      - Add personal touches and insider tips
      - Length: 400-600 words
      
      Structure:
      - Hook that captures the magic
      - Vivid description of the experience
      - Practical details (location, timing, cost)
      - Insider tips or local secrets
      - Why this is must-see/must-do
      - Call to action to explore
      
      Make it inspiring but informative. No markdown.
    `

    try {
      const article = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('creative')
      )

      return this.formatForPublication(article)
    } catch (error) {
      console.error('Failed to generate tourism article:', error)
      throw error
    }
  }

  protected async calculateSpecialtyRelevance(content: ContentItem): Promise<number> {
    let score = 0

    const contentLower = content.content.toLowerCase()

    // Tourism keywords
    const tourismKeywords = [
      'tourist', 'visit', 'attraction', 'landmark', 'experience',
      'adventure', 'explore', 'discover', 'travel', 'vacation',
      'sightseeing', 'tour', 'museum', 'beach', 'desert',
      'shopping', 'souk', 'mall', 'heritage', 'culture'
    ]

    const keywordMatches = tourismKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length

    score += Math.min(keywordMatches * 0.08, 0.4)

    // Category bonus
    if (['attractions', 'events', 'experiences', 'tourism'].includes(content.category)) {
      score += 0.3
    }

    // Rating/popularity bonus
    const rating = content.metadata.customData?.rating
    if (rating && rating >= 4.5) score += 0.2
    else if (rating && rating >= 4.0) score += 0.1

    // Official source bonus
    if (content.source.name.includes('Official') || content.source.type === 'government') {
      score += 0.1
    }

    return Math.min(score, 1)
  }

  private createAttractionContent(attraction: any): string {
    return `
      ${attraction.name} is ${attraction.ranking_data?.ranking_string || 'a must-visit Dubai attraction'}.
      
      ${attraction.description || ''}
      
      What visitors say: "${attraction.reviews?.[0]?.text?.substring(0, 200) || 'Highly recommended by travelers'}"
      
      Location: ${attraction.address || 'Dubai'}
      ${attraction.hours?.week_ranges ? `Opening hours: ${this.formatHours(attraction.hours.week_ranges)}` : ''}
      ${attraction.fee ? 'Admission fee required' : ''}
      
      Rating: ${attraction.rating}/5 based on ${attraction.num_reviews} reviews
    `.trim()
  }

  private formatHours(weekRanges: any[]): string {
    // Simplified hours formatting
    if (weekRanges.length > 0 && weekRanges[0].length > 0) {
      const hours = weekRanges[0][0]
      return `${hours.open_time} - ${hours.close_time}`
    }
    return 'Check website for hours'
  }

  private getCurrentSeason(month: number): string {
    // Dubai seasons
    if (month >= 10 || month <= 2) return 'Winter Season'
    if (month >= 3 && month <= 4) return 'Spring Season'
    if (month >= 5 && month <= 8) return 'Summer Season'
    return 'Autumn Season'
  }

  private async generateWeatherBasedRecommendations(weather: any): Promise<ContentItem[]> {
    const temp = weather.current.temp_c
    const isHot = temp > 35
    const isPleasant = temp >= 20 && temp <= 30

    const recommendations = []

    if (isHot) {
      recommendations.push({
        id: `weather-rec-indoor-${Date.now()}`,
        agentId: this.config.id,
        title: 'Beat the Heat: Best Indoor Attractions in Dubai',
        content: `With temperatures reaching ${temp}°C, explore Dubai's amazing indoor attractions including Dubai Mall, Ski Dubai, and the Dubai Aquarium.`,
        summary: 'Stay cool with indoor activities',
        category: 'recommendations',
        tags: ['weather', 'indoor', 'summer'],
        source: {
          type: 'api',
          name: 'Weather & Season API',
          priority: 'medium',
          refreshInterval: 360
        },
        relevanceScore: 0.9,
        priorityScore: 0.8,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          customData: {
            temperature: temp,
            condition: weather.current.condition.text
          }
        },
        status: ContentStatus.FETCHED
      })
    }

    if (isPleasant) {
      recommendations.push({
        id: `weather-rec-outdoor-${Date.now()}`,
        agentId: this.config.id,
        title: 'Perfect Weather for Outdoor Adventures',
        content: `Enjoy Dubai's beautiful ${temp}°C weather with outdoor activities like desert safaris, beach visits, and walking tours.`,
        summary: 'Ideal conditions for outdoor exploration',
        category: 'recommendations',
        tags: ['weather', 'outdoor', 'perfect-weather'],
        source: {
          type: 'api',
          name: 'Weather & Season API',
          priority: 'medium',
          refreshInterval: 360
        },
        relevanceScore: 0.9,
        priorityScore: 0.8,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          customData: {
            temperature: temp,
            condition: weather.current.condition.text
          }
        },
        status: ContentStatus.FETCHED
      })
    }

    return recommendations
  }

  private extractTourismTags(item: any): string[] {
    const tags: string[] = []
    const content = `${item.title} ${item.description}`.toLowerCase()

    const tagMap = {
      'beach': ['beach', 'waterfront', 'seaside'],
      'desert': ['desert', 'safari', 'dunes'],
      'shopping': ['shopping', 'mall', 'souk'],
      'culture': ['culture', 'heritage', 'traditional'],
      'family': ['family', 'kids', 'children'],
      'luxury': ['luxury', 'premium', 'vip'],
      'adventure': ['adventure', 'thrill', 'extreme']
    }

    Object.entries(tagMap).forEach(([key, terms]) => {
      if (terms.some(term => content.includes(term))) {
        tags.push(key)
      }
    })

    return tags
  }

  private extractEventTags(event: any): string[] {
    const tags: string[] = []
    const content = `${event.title} ${event.description}`.toLowerCase()

    if (content.includes('festival')) tags.push('festival')
    if (content.includes('concert')) tags.push('concert')
    if (content.includes('exhibition')) tags.push('exhibition')
    if (content.includes('sports')) tags.push('sports')
    if (content.includes('food')) tags.push('food-festival')

    return tags
  }

  private calculateEventPriority(event: any): number {
    let priority = 0.5

    // Upcoming events get higher priority
    const eventDate = new Date(event.eventDate || event.pubDate)
    const daysUntil = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)

    if (daysUntil <= 7) priority += 0.3
    else if (daysUntil <= 14) priority += 0.2
    else if (daysUntil <= 30) priority += 0.1

    // Major events
    const majorEventKeywords = ['festival', 'championship', 'expo', 'grand']
    if (majorEventKeywords.some(keyword => event.title.toLowerCase().includes(keyword))) {
      priority += 0.2
    }

    return Math.min(priority, 1)
  }

  private isTravelContent(post: any): boolean {
    const travelKeywords = ['travel', 'visit', 'explore', 'discover', 'tourism', 'vacation']
    const caption = post.caption?.toLowerCase() || ''
    
    return travelKeywords.some(keyword => caption.includes(keyword)) ||
           post.location?.name?.includes('Dubai')
  }

  private extractTravelTitle(post: any): string {
    const location = post.location?.name || 'Dubai'
    const firstLine = post.caption?.split('\n')[0] || ''
    
    if (firstLine.length > 50) {
      return `${location}: ${firstLine.substring(0, 47)}...`
    }
    
    return firstLine || `Discover ${location} with ${post.user.username}`
  }

  private extractTravelHighlight(post: any): string {
    const caption = post.caption || ''
    
    // Look for experience descriptions
    const experienceMatch = caption.match(/amazing|incredible|beautiful|stunning|must.?see|must.?visit/i)
    if (experienceMatch) {
      const startIndex = Math.max(0, experienceMatch.index! - 20)
      return caption.substring(startIndex, startIndex + 150) + '...'
    }
    
    return caption.substring(0, 150) + '...'
  }

  private extractHashtags(text: string): string[] {
    if (!text) return []
    const hashtagRegex = /#\w+/g
    const hashtags = text.match(hashtagRegex) || []
    return hashtags
      .map(tag => tag.substring(1).toLowerCase())
      .filter(tag => tag.length > 2 && tag.length < 20)
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

  private async generateVisitorTips(content: ContentItem): Promise<string[]> {
    try {
      const prompt = `
        Generate 3 practical visitor tips for this Dubai attraction/experience:
        "${content.title}"
        
        Consider: timing, crowds, photography, dress code, nearby amenities.
        Return as JSON array of strings.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      return JSON.parse(response)
    } catch (error) {
      return [
        'Visit early morning or late afternoon to avoid crowds',
        'Dress modestly and comfortably',
        'Book tickets online in advance for better rates'
      ]
    }
  }

  private async analyzeAccessibility(content: ContentItem): Promise<any> {
    const accessibility = {
      wheelchairAccessible: false,
      familyFriendly: false,
      seniorFriendly: false,
      publicTransport: false
    }

    const contentLower = content.content.toLowerCase()

    // Simple keyword-based analysis
    if (contentLower.includes('wheelchair') || contentLower.includes('accessible')) {
      accessibility.wheelchairAccessible = true
    }
    if (contentLower.includes('family') || contentLower.includes('children') || contentLower.includes('kids')) {
      accessibility.familyFriendly = true
    }
    if (contentLower.includes('senior') || contentLower.includes('elderly')) {
      accessibility.seniorFriendly = true
    }
    if (contentLower.includes('metro') || contentLower.includes('bus') || contentLower.includes('public transport')) {
      accessibility.publicTransport = true
    }

    return accessibility
  }

  private async findNearbyAttractions(content: ContentItem): Promise<any[]> {
    if (!content.metadata.location?.area) return []

    // Mock implementation - would query actual nearby attractions
    return [
      {
        name: 'Nearby Attraction 1',
        distance: '0.5 km',
        category: 'landmark'
      },
      {
        name: 'Nearby Restaurant',
        distance: '0.3 km',
        category: 'dining'
      }
    ]
  }

  private async generateTransportTips(content: ContentItem): Promise<string[]> {
    const location = content.metadata.location?.area || 'Dubai'
    
    return [
      `Take the Dubai Metro to the nearest station and use a taxi for the final stretch`,
      `Parking available at ${location} - arrive early during peak times`,
      `Consider using Careem or Uber for direct access`
    ]
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

    // Sort by relevance to tourists
    return valid.sort((a, b) => {
      // Prioritize highly rated attractions
      const ratingA = a.metadata.customData?.rating || 0
      const ratingB = b.metadata.customData?.rating || 0
      
      if (Math.abs(ratingA - ratingB) > 0.5) {
        return ratingB - ratingA
      }

      // Then by priority score
      if (Math.abs(a.priorityScore - b.priorityScore) > 0.1) {
        return b.priorityScore - a.priorityScore
      }

      // Finally by recency
      return b.publishedAt.getTime() - a.publishedAt.getTime()
    })
  }
}