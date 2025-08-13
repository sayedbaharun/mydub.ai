// Business Reporter Agent - Specializes in market updates, real estate, and economic news

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

export class BusinessReporterAgent extends BaseReporterAgent {
  private static instance: BusinessReporterAgent

  constructor() {
    const config: ReporterAgentConfig = {
      id: 'business-reporter-001',
      name: 'Dubai Business Reporter',
      description: 'Covers market updates, real estate trends, economic indicators, and business opportunities',
      specialty: ReporterSpecialty.BUSINESS,
      writingStyle: {
        tone: ['analytical', 'data-driven', 'insightful', 'professional'],
        voice: 'third-person',
        complexity: 'complex',
        targetAudience: ['investors', 'business owners', 'executives', 'entrepreneurs'],
        customPrompts: [
          'Write in a professional business journalism style',
          'Include relevant data, statistics, and market indicators',
          'Provide actionable insights for business decision-makers',
          'Connect local developments to global trends',
          'Highlight investment opportunities and risks'
        ]
      },
      priorities: [
        'Stock market and financial updates',
        'Real estate market trends',
        'New business regulations and policies',
        'Major corporate announcements',
        'Economic indicators and forecasts',
        'Investment opportunities',
        'Startup ecosystem news'
      ],
      sources: [
        {
          type: 'api',
          name: 'Dubai Financial Market',
          apiKey: process.env.DFM_API_KEY,
          priority: 'high',
          refreshInterval: 15
        },
        {
          type: 'api',
          name: 'Property Finder API',
          apiKey: process.env.PROPERTY_FINDER_API_KEY,
          priority: 'high',
          refreshInterval: 60
        },
        {
          type: 'government',
          name: 'Dubai Economy & Tourism',
          url: 'https://www.dubaieconomy.gov.ae/en/rss',
          priority: 'high',
          refreshInterval: 30
        },
        {
          type: 'rss',
          name: 'Arabian Business',
          url: 'https://www.arabianbusiness.com/rss',
          priority: 'medium',
          refreshInterval: 45
        },
        {
          type: 'rss',
          name: 'Gulf Business',
          url: 'https://gulfbusiness.com/feed/',
          priority: 'medium',
          refreshInterval: 45
        },
        {
          type: 'api',
          name: 'Bloomberg Middle East',
          apiKey: process.env.BLOOMBERG_API_KEY,
          priority: 'high',
          refreshInterval: 30
        }
      ],
      scheduleConfig: {
        ...DEFAULT_SCHEDULE,
        frequency: 'hourly',
        priority: 'high',
        times: ['06:00', '09:00', '14:00', '17:00'], // Market hours focus
        daysOfWeek: [0, 1, 2, 3, 4] // Sunday to Thursday (UAE business days)
      },
      learningEnabled: true,
      maxContentPerRun: 20
    }

    super(config)
  }

  static getInstance(): BusinessReporterAgent {
    if (!BusinessReporterAgent.instance) {
      BusinessReporterAgent.instance = new BusinessReporterAgent()
    }
    return BusinessReporterAgent.instance
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

    // Add market analysis on business days
    const today = new Date().getDay()
    if (today >= 0 && today <= 4) { // Sunday to Thursday
      const marketAnalysis = await this.generateMarketAnalysis()
      allContent.push(...marketAnalysis)
    }

    // Filter and validate
    const validContent = await this.filterAndValidateContent(allContent)

    // Enrich with business-specific metadata
    const enrichedContent = await Promise.all(
      validContent.map(item => this.enrichBusinessContent(item))
    )

    return enrichedContent
  }

  private async fetchFromSource(source: DataSource): Promise<ContentItem[]> {
    switch (source.name) {
      case 'Dubai Financial Market':
        return this.fetchMarketData(source)
      case 'Property Finder API':
        return this.fetchRealEstateData(source)
      case 'Bloomberg Middle East':
        return this.fetchFinancialNews(source)
      case 'Dubai Economy & Tourism':
        return this.fetchEconomicUpdates(source)
      default:
        return this.fetchBusinessRSS(source)
    }
  }

  private async fetchMarketData(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-market-data', {
        body: {
          apiKey: source.apiKey,
          exchange: 'DFM',
          includeIndices: true,
          includeSectors: true
        }
      })

      if (!data) return []

      const contents: ContentItem[] = []

      // Market summary
      if (data.marketSummary) {
        contents.push({
          id: `dfm-summary-${Date.now()}`,
          agentId: this.config.id,
          title: `Dubai Financial Market ${data.marketSummary.trend} - Index at ${data.marketSummary.index}`,
          content: this.createMarketSummaryContent(data.marketSummary),
          summary: `DFM index ${data.marketSummary.change > 0 ? 'up' : 'down'} ${Math.abs(data.marketSummary.changePercent)}%`,
          category: 'markets',
          tags: ['stock-market', 'dfm', 'trading', 'finance'],
          source: source,
          relevanceScore: 0,
          priorityScore: 0.9, // Market data is high priority
          publishedAt: new Date(),
          fetchedAt: new Date(),
          metadata: {
            customData: {
              marketData: data.marketSummary,
              isLive: true
            }
          },
          status: ContentStatus.FETCHED
        })
      }

      // Top movers
      if (data.topMovers) {
        contents.push({
          id: `dfm-movers-${Date.now()}`,
          agentId: this.config.id,
          title: 'Top Stock Movers on Dubai Financial Market',
          content: this.createMoversContent(data.topMovers),
          summary: `Leading gainers and losers in today's trading session`,
          category: 'markets',
          tags: ['stocks', 'trading', 'movers'],
          source: source,
          relevanceScore: 0,
          priorityScore: 0.8,
          publishedAt: new Date(),
          fetchedAt: new Date(),
          metadata: {
            customData: {
              topGainers: data.topMovers.gainers,
              topLosers: data.topMovers.losers
            }
          },
          status: ContentStatus.FETCHED
        })
      }

      return contents
    } catch (error) {
      console.error('Failed to fetch market data:', error)
      return []
    }
  }

  private async fetchRealEstateData(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-property-data', {
        body: {
          apiKey: source.apiKey,
          reportType: 'market-trends',
          areas: ['Downtown Dubai', 'Dubai Marina', 'Business Bay', 'JBR', 'Palm Jumeirah'],
          propertyTypes: ['apartment', 'villa', 'office', 'retail']
        }
      })

      if (!data || !data.trends) return []

      return data.trends.map((trend: any) => ({
        id: `property-${trend.area}-${Date.now()}`,
        agentId: this.config.id,
        title: `${trend.area} Property Market: ${trend.trend} in ${trend.propertyType} Prices`,
        content: this.createPropertyContent(trend),
        summary: `Average ${trend.propertyType} prices in ${trend.area} ${trend.changePercent > 0 ? 'up' : 'down'} ${Math.abs(trend.changePercent)}% YoY`,
        category: 'real-estate',
        tags: ['property', 'real-estate', trend.propertyType, trend.area.toLowerCase().replace(/\s+/g, '-')],
        source: source,
        relevanceScore: 0,
        priorityScore: 0,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          location: {
            name: trend.area,
            area: trend.area,
            emirate: 'Dubai'
          },
          customData: {
            pricePerSqFt: trend.avgPricePerSqFt,
            yearlyChange: trend.changePercent,
            transactionVolume: trend.transactions,
            rentalYield: trend.rentalYield
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch property data:', error)
      return []
    }
  }

  private async fetchFinancialNews(source: DataSource): Promise<ContentItem[]> {
    if (!source.apiKey) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-bloomberg-news', {
        body: {
          apiKey: source.apiKey,
          region: 'middle-east',
          topics: ['markets', 'economy', 'companies', 'energy'],
          location: 'Dubai'
        }
      })

      if (!data || !data.articles) return []

      return data.articles.map((article: any) => ({
        id: `bloomberg-${article.id}`,
        agentId: this.config.id,
        title: article.headline,
        content: article.body || article.summary,
        summary: article.summary,
        category: this.categorizeFinancialNews(article),
        tags: article.tags || ['finance', 'markets'],
        source: source,
        relevanceScore: 0,
        priorityScore: 0,
        publishedAt: new Date(article.publishedAt),
        fetchedAt: new Date(),
        metadata: {
          originalUrl: article.url,
          author: article.byline,
          imageUrls: article.images || [],
          customData: {
            tickers: article.tickers || [],
            sectors: article.sectors || []
          }
        },
        status: ContentStatus.FETCHED
      }))
    } catch (error) {
      console.error('Failed to fetch Bloomberg news:', error)
      return []
    }
  }

  private async fetchEconomicUpdates(source: DataSource): Promise<ContentItem[]> {
    if (!source.url) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-rss', {
        body: { url: source.url }
      })

      if (!data || !data.items) return []

      return data.items
        .filter((item: any) => this.isEconomicContent(item))
        .map((item: any) => ({
          id: `economy-${Date.now()}-${Math.random()}`,
          agentId: this.config.id,
          title: item.title,
          content: item.content || item.description,
          summary: item.description?.substring(0, 200),
          category: 'economy',
          tags: this.extractEconomicTags(item),
          source: source,
          relevanceScore: 0,
          priorityScore: 0,
          publishedAt: new Date(item.pubDate || Date.now()),
          fetchedAt: new Date(),
          metadata: {
            originalUrl: item.link,
            author: 'Dubai Economy & Tourism'
          },
          status: ContentStatus.FETCHED
        }))
    } catch (error) {
      console.error('Failed to fetch economic updates:', error)
      return []
    }
  }

  private async fetchBusinessRSS(source: DataSource): Promise<ContentItem[]> {
    if (!source.url) return []

    try {
      const { data } = await supabase.functions.invoke('fetch-rss', {
        body: { url: source.url }
      })

      if (!data || !data.items) return []

      return data.items
        .filter((item: any) => this.isBusinessContent(item))
        .map((item: any) => ({
          id: `${source.name}-${Date.now()}-${Math.random()}`,
          agentId: this.config.id,
          title: item.title,
          content: item.content || item.description,
          summary: item.description?.substring(0, 200),
          category: this.categorizeBusinessContent(item),
          tags: this.extractBusinessTags(item),
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

  private async generateMarketAnalysis(): Promise<ContentItem[]> {
    try {
      // Fetch latest market indicators
      const { data: indicators } = await supabase
        .from('market_indicators')
        .select('*')
        .eq('region', 'dubai')
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (!indicators) return []

      const prompt = `
        Generate a brief market analysis for Dubai based on these indicators:
        - GDP Growth: ${indicators.gdp_growth}%
        - Inflation: ${indicators.inflation}%
        - Employment: ${indicators.employment_rate}%
        - FDI: ${indicators.fdi_amount} billion AED
        
        Create a 200-word analysis highlighting:
        1. Key economic trends
        2. Market opportunities
        3. Potential risks
        4. Outlook for next quarter
        
        Write in a professional, data-driven style.
      `

      const analysis = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      return [{
        id: `market-analysis-${Date.now()}`,
        agentId: this.config.id,
        title: 'Dubai Economic Indicators: Quarterly Market Analysis',
        content: analysis,
        summary: 'AI-generated analysis of Dubai\'s latest economic indicators and market trends',
        category: 'analysis',
        tags: ['market-analysis', 'economy', 'indicators', 'forecast'],
        source: {
          type: 'api',
          name: 'AI Market Analyst',
          priority: 'medium',
          refreshInterval: 1440 // Daily
        },
        relevanceScore: 0.8,
        priorityScore: 0.7,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        metadata: {
          customData: {
            indicators,
            aiGenerated: true
          }
        },
        status: ContentStatus.FETCHED
      }]
    } catch (error) {
      console.error('Failed to generate market analysis:', error)
      return []
    }
  }

  private async enrichBusinessContent(content: ContentItem): Promise<ContentItem> {
    // Base enrichment
    let enriched = await ContentAnalyzer.enrichContent(content)

    // Add business-specific analysis
    if (content.category === 'markets') {
      enriched = await this.enrichMarketContent(enriched)
    } else if (content.category === 'real-estate') {
      enriched = await this.enrichPropertyContent(enriched)
    }

    // Add financial entities
    const financialEntities = await this.extractFinancialEntities(enriched.content)
    enriched.metadata.customData = {
      ...enriched.metadata.customData,
      financialEntities
    }

    return enriched
  }

  private async enrichMarketContent(content: ContentItem): Promise<ContentItem> {
    // Extract stock symbols and add current prices
    const symbols = await this.extractStockSymbols(content.content)
    
    if (symbols.length > 0) {
      const prices = await this.fetchStockPrices(symbols)
      content.metadata.customData = {
        ...content.metadata.customData,
        stockData: prices
      }
    }

    return content
  }

  private async enrichPropertyContent(content: ContentItem): Promise<ContentItem> {
    // Add comparative analysis
    const comparison = await this.generatePropertyComparison(content)
    content.metadata.customData = {
      ...content.metadata.customData,
      marketComparison: comparison
    }

    return content
  }

  async generateArticle(content: ContentItem): Promise<string> {
    const prompt = `
      You are a seasoned business journalist for Dubai's leading financial publication.
      
      Write a comprehensive business article from this content:
      
      Title: ${content.title}
      Category: ${content.category}
      Content: ${content.content}
      ${content.metadata.customData ? `Data: ${JSON.stringify(content.metadata.customData)}` : ''}
      
      Guidelines:
      ${this.config.writingStyle.customPrompts?.join('\n')}
      
      Requirements:
      - Write in ${this.config.writingStyle.voice} voice
      - Include relevant data and statistics
      - Provide context for market movements
      - Analyze implications for investors/businesses
      - Compare with regional/global trends where relevant
      - Length: 500-700 words
      
      Structure:
      - Lead with key data/development
      - Explain the context and significance
      - Analyze market/business implications
      - Include expert perspective (can be implied)
      - Conclude with outlook/actionable insights
      
      Ensure accuracy with financial data. Do not use markdown.
    `

    try {
      const article = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      return this.formatForPublication(article)
    } catch (error) {
      console.error('Failed to generate business article:', error)
      throw error
    }
  }

  protected async calculateSpecialtyRelevance(content: ContentItem): Promise<number> {
    let score = 0

    const contentLower = content.content.toLowerCase()

    // Business keywords
    const businessKeywords = [
      'market', 'stock', 'investment', 'economy', 'gdp', 'growth',
      'business', 'company', 'corporate', 'merger', 'acquisition',
      'real estate', 'property', 'development', 'construction',
      'finance', 'banking', 'fintech', 'startup', 'ipo', 'funding'
    ]

    const keywordMatches = businessKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length

    score += Math.min(keywordMatches * 0.08, 0.4)

    // Category bonus
    if (['markets', 'economy', 'real-estate', 'finance'].includes(content.category)) {
      score += 0.3
    }

    // Data richness bonus
    if (content.metadata.customData && Object.keys(content.metadata.customData).length > 3) {
      score += 0.2
    }

    // Source authority
    if (['government', 'api'].includes(content.source.type)) {
      score += 0.1
    }

    return Math.min(score, 1)
  }

  private createMarketSummaryContent(summary: any): string {
    return `
      Dubai Financial Market closed ${summary.trend} with the general index at ${summary.index} points, ${summary.change > 0 ? 'gaining' : 'losing'} ${Math.abs(summary.change)} points (${summary.changePercent}%).
      
      Trading volume reached ${summary.volume} shares worth AED ${summary.value} million across ${summary.trades} transactions.
      
      Market breadth: ${summary.advances} advancing, ${summary.declines} declining, ${summary.unchanged} unchanged.
      
      ${summary.sectorsPerformance ? `Sector performance: ${this.formatSectorPerformance(summary.sectorsPerformance)}` : ''}
    `.trim()
  }

  private createMoversContent(movers: any): string {
    let content = 'Top Gainers:\n'
    
    movers.gainers.slice(0, 5).forEach((stock: any) => {
      content += `${stock.symbol}: AED ${stock.price} (+${stock.changePercent}%)\n`
    })
    
    content += '\nTop Losers:\n'
    
    movers.losers.slice(0, 5).forEach((stock: any) => {
      content += `${stock.symbol}: AED ${stock.price} (${stock.changePercent}%)\n`
    })
    
    return content
  }

  private createPropertyContent(trend: any): string {
    return `
      ${trend.area} ${trend.propertyType} market shows ${trend.trend} trend with average prices ${trend.changePercent > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(trend.changePercent)}% year-over-year.
      
      Current average price per square foot: AED ${trend.avgPricePerSqFt}
      Transaction volume: ${trend.transactions} deals in the last quarter
      Average rental yield: ${trend.rentalYield}%
      
      Market analysis: ${trend.analysis || 'The area continues to attract investor interest with stable fundamentals.'}
    `.trim()
  }

  private formatSectorPerformance(sectors: any[]): string {
    return sectors
      .map(sector => `${sector.name} (${sector.change > 0 ? '+' : ''}${sector.changePercent}%)`)
      .join(', ')
  }

  private categorizeFinancialNews(article: any): string {
    const title = article.headline.toLowerCase()
    
    if (title.includes('market') || title.includes('stock') || title.includes('trading')) {
      return 'markets'
    } else if (title.includes('property') || title.includes('real estate')) {
      return 'real-estate'
    } else if (title.includes('economy') || title.includes('gdp') || title.includes('inflation')) {
      return 'economy'
    } else if (title.includes('company') || title.includes('merger') || title.includes('acquisition')) {
      return 'corporate'
    }
    
    return 'business'
  }

  private categorizeBusinessContent(item: any): string {
    const content = `${item.title} ${item.description}`.toLowerCase()
    
    if (content.includes('stock') || content.includes('market') || content.includes('trading')) {
      return 'markets'
    } else if (content.includes('property') || content.includes('real estate')) {
      return 'real-estate'
    } else if (content.includes('startup') || content.includes('funding') || content.includes('venture')) {
      return 'startups'
    } else if (content.includes('economy') || content.includes('gdp')) {
      return 'economy'
    }
    
    return 'business'
  }

  private isBusinessContent(item: any): boolean {
    const content = `${item.title} ${item.description}`.toLowerCase()
    return this.isEconomicContent(item) || 
           content.includes('business') ||
           content.includes('market') ||
           content.includes('investment') ||
           content.includes('company')
  }

  private isEconomicContent(item: any): boolean {
    const content = `${item.title} ${item.description}`.toLowerCase()
    const economicTerms = [
      'economy', 'economic', 'gdp', 'growth', 'inflation',
      'investment', 'trade', 'export', 'import', 'fdi',
      'policy', 'regulation', 'ministry', 'government'
    ]
    
    return economicTerms.some(term => content.includes(term))
  }

  private extractBusinessTags(item: any): string[] {
    const tags: string[] = ['business']
    const content = `${item.title} ${item.description}`.toLowerCase()
    
    const tagMap = {
      'ipo': ['ipo', 'listing'],
      'merger': ['merger', 'acquisition', 'm&a'],
      'real estate': ['property', 'real-estate'],
      'startup': ['startup', 'entrepreneurship'],
      'banking': ['finance', 'banking'],
      'oil': ['energy', 'oil-gas']
    }
    
    Object.entries(tagMap).forEach(([term, associatedTags]) => {
      if (content.includes(term)) {
        tags.push(...associatedTags)
      }
    })
    
    return [...new Set(tags)]
  }

  private extractEconomicTags(item: any): string[] {
    const tags: string[] = ['economy']
    const content = `${item.title} ${item.description}`.toLowerCase()
    
    if (content.includes('gdp')) tags.push('gdp')
    if (content.includes('inflation')) tags.push('inflation')
    if (content.includes('employment')) tags.push('employment')
    if (content.includes('trade')) tags.push('trade')
    if (content.includes('investment')) tags.push('investment')
    if (content.includes('policy')) tags.push('policy')
    
    return tags
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

  private async extractFinancialEntities(content: string): Promise<any> {
    try {
      const prompt = `
        Extract financial entities from this business content:
        "${content.substring(0, 1000)}"
        
        Find:
        - Company names
        - Stock symbols
        - Financial figures (with context)
        - Economic indicators
        
        Return as JSON array with type and value.
      `
      
      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )
      
      return JSON.parse(response)
    } catch (error) {
      return []
    }
  }

  private async extractStockSymbols(content: string): Promise<string[]> {
    // Simple regex for DFM stock symbols (usually 3-4 uppercase letters)
    const symbolRegex = /\b[A-Z]{3,4}\b/g
    const matches = content.match(symbolRegex) || []
    
    // Filter to known DFM symbols (would need actual list)
    const knownSymbols = ['EMAAR', 'DIB', 'DFM', 'DEWA', 'ENBD']
    return matches.filter(symbol => knownSymbols.includes(symbol))
  }

  private async fetchStockPrices(symbols: string[]): Promise<any> {
    // Mock implementation - would integrate with real API
    return symbols.map(symbol => ({
      symbol,
      price: (Math.random() * 10 + 1).toFixed(2),
      change: (Math.random() * 2 - 1).toFixed(2),
      changePercent: (Math.random() * 5 - 2.5).toFixed(2)
    }))
  }

  private async generatePropertyComparison(content: ContentItem): Promise<any> {
    const area = content.metadata.location?.area || 'Dubai'
    
    return {
      vsLastYear: `${area} property prices ${Math.random() > 0.5 ? 'up' : 'down'} ${(Math.random() * 20).toFixed(1)}% YoY`,
      vsOtherAreas: `${Math.random() > 0.5 ? 'Outperforming' : 'Underperforming'} Dubai average`,
      forecast: `Expected to ${Math.random() > 0.5 ? 'continue growth' : 'stabilize'} in next quarter`
    }
  }

  private async filterAndValidateContent(content: ContentItem[]): Promise<ContentItem[]> {
    // Remove duplicates
    const seen = new Set<string>()
    const unique = content.filter(item => {
      const key = `${item.title}-${item.source.name}`
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
    
    // Sort by priority and recency
    return valid.sort((a, b) => {
      // Prioritize market data during trading hours
      const now = new Date()
      const dubaiHour = now.getUTCHours() + 4 // Dubai is UTC+4
      const isTradingHours = dubaiHour >= 10 && dubaiHour <= 14
      
      if (isTradingHours) {
        if (a.category === 'markets' && b.category !== 'markets') return -1
        if (b.category === 'markets' && a.category !== 'markets') return 1
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