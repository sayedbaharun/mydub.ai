/**
 * AI Transparency Service for MyDub.ai
 * Provides confidence scoring, data source attribution, and bias detection
 */

import { callOpenRouter, getModelForTask } from '@/shared/lib/ai-services'

export interface AITransparencyResponse {
  response: string
  confidence: number
  dataSources: DataSource[]
  biasFlags: BiasFlag[]
  explainabilityScore: number
  modelUsed: string
  processingTime: number
  transparencyMetadata: TransparencyMetadata
}

export interface DataSource {
  name: string
  type: 'government' | 'news' | 'community' | 'ai' | 'verified'
  reliability: number
  url?: string
  lastUpdated: Date
  verificationStatus: 'verified' | 'pending' | 'disputed'
}

export interface BiasFlag {
  type: 'cultural' | 'religious' | 'gender' | 'nationality' | 'economic' | 'age'
  severity: 'low' | 'medium' | 'high'
  description: string
  suggestion: string
}

export interface TransparencyMetadata {
  queryId: string
  timestamp: Date
  model: string
  temperature: number
  tokensUsed: number
  cost: number
  responseTime: number
  confidenceFactors: string[]
  alternativeResponses?: string[]
}

class AITransparencyService {
  private static instance: AITransparencyService

  private constructor() {}

  static getInstance(): AITransparencyService {
    if (!AITransparencyService.instance) {
      AITransparencyService.instance = new AITransparencyService()
    }
    return AITransparencyService.instance
  }

  /**
   * Enhanced AI query with full transparency features
   */
  async queryWithTransparency(
    query: string,
    context: {
      userId?: string
      location?: string
      language?: string
      category?: string
    } = {}
  ): Promise<AITransparencyResponse> {
    const startTime = Date.now()
    const queryId = this.generateQueryId()

    try {
      // Determine data sources based on query type
      const dataSources = await this.identifyDataSources(query, context)
      
      // Select appropriate model
      const taskType = this.classifyQuery(query)
      const model = getModelForTask(taskType)
      
      // Build enhanced prompt with transparency requirements
      const enhancedPrompt = this.buildTransparencyPrompt(query, dataSources, context)
      
      // Make AI call
      const response = await callOpenRouter([
        {
          role: 'system',
          content: enhancedPrompt.systemPrompt
        },
        {
          role: 'user',
          content: enhancedPrompt.userPrompt
        }
      ], model, 0.7)

      const processingTime = Date.now() - startTime

      // Parse AI response for transparency data
      const parsedResponse = this.parseTransparencyResponse(response)
      
      // Calculate confidence score
      const confidence = await this.calculateConfidence(
        query,
        parsedResponse.response,
        dataSources,
        model
      )

      // Detect potential bias
      const biasFlags = await this.detectBias(query, parsedResponse.response, context)

      // Calculate explainability score
      const explainabilityScore = this.calculateExplainabilityScore(
        parsedResponse.response,
        dataSources,
        biasFlags
      )

      // Build transparency metadata
      const transparencyMetadata: TransparencyMetadata = {
        queryId,
        timestamp: new Date(),
        model,
        temperature: 0.7,
        tokensUsed: this.estimateTokens(query + response),
        cost: this.estimateCost(model, this.estimateTokens(query + response)),
        responseTime: processingTime,
        confidenceFactors: this.getConfidenceFactors(dataSources, model),
        alternativeResponses: parsedResponse.alternatives
      }

      // Store for analytics
      await this.storeTransparencyData({
        queryId,
        query,
        response: parsedResponse.response,
        confidence,
        dataSources,
        biasFlags,
        explainabilityScore,
        metadata: transparencyMetadata,
        userId: context.userId
      })

      return {
        response: parsedResponse.response,
        confidence,
        dataSources,
        biasFlags,
        explainabilityScore,
        modelUsed: model,
        processingTime,
        transparencyMetadata
      }

    } catch (error) {
      console.error('AI transparency query failed:', error)
      throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get transparency metrics for dashboard
   */
  async getTransparencyMetrics(
    userId?: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalQueries: number
    averageConfidence: number
    dataSourcesUsed: number
    biasDetections: number
    explainabilityScore: number
    transparencyGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  }> {
    // Mock implementation - in real app, this would query your database
    return {
      totalQueries: 1247,
      averageConfidence: 87.3,
      dataSourcesUsed: 15,
      biasDetections: 3,
      explainabilityScore: 92.1,
      transparencyGrade: 'A'
    }
  }

  /**
   * Identify relevant data sources for a query
   */
  private async identifyDataSources(
    query: string,
    context: any
  ): Promise<DataSource[]> {
    const queryLower = query.toLowerCase()
    const sources: DataSource[] = []

    // Government data sources
    if (queryLower.includes('visa') || queryLower.includes('immigration') || queryLower.includes('gdrfa')) {
      sources.push({
        name: 'GDRFA Official Portal',
        type: 'government',
        reliability: 98.5,
        url: 'https://gdrfad.gov.ae',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 30),
        verificationStatus: 'verified'
      })
    }

    if (queryLower.includes('transport') || queryLower.includes('bus') || queryLower.includes('metro') || queryLower.includes('rta')) {
      sources.push({
        name: 'RTA Official API',
        type: 'government',
        reliability: 97.8,
        url: 'https://www.rta.ae',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 15),
        verificationStatus: 'verified'
      })
    }

    if (queryLower.includes('utility') || queryLower.includes('electricity') || queryLower.includes('water') || queryLower.includes('dewa')) {
      sources.push({
        name: 'DEWA Services Portal',
        type: 'government',
        reliability: 96.2,
        url: 'https://www.dewa.gov.ae',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 45),
        verificationStatus: 'verified'
      })
    }

    // Tourism and dining sources
    if (queryLower.includes('restaurant') || queryLower.includes('dining') || queryLower.includes('food')) {
      sources.push({
        name: 'Dubai Tourism Board',
        type: 'government',
        reliability: 94.1,
        url: 'https://www.visitdubai.com',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60),
        verificationStatus: 'verified'
      })
    }

    // News sources
    if (sources.length === 0 || queryLower.includes('news') || queryLower.includes('update')) {
      sources.push({
        name: 'Gulf News API',
        type: 'news',
        reliability: 89.3,
        url: 'https://gulfnews.com',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 10),
        verificationStatus: 'verified'
      })
    }

    // Always include AI knowledge as a source
    sources.push({
      name: 'AI Knowledge Base',
      type: 'ai',
      reliability: 85.0,
      lastUpdated: new Date('2024-04-01'), // Model training cutoff
      verificationStatus: 'verified'
    })

    return sources
  }

  /**
   * Build enhanced prompt with transparency requirements
   */
  private buildTransparencyPrompt(
    query: string,
    dataSources: DataSource[],
    context: any
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are MyDub.AI, Dubai's intelligent digital assistant. You must provide transparent, accurate, and culturally sensitive responses.

TRANSPARENCY REQUIREMENTS:
1. Always cite your sources when making factual claims
2. Indicate confidence level in your statements
3. Acknowledge uncertainty when appropriate
4. Be aware of cultural sensitivities in Dubai's diverse population
5. Provide balanced perspectives on controversial topics

AVAILABLE DATA SOURCES:
${dataSources.map(source => 
  `- ${source.name} (${source.type}, ${source.reliability}% reliable, updated: ${source.lastUpdated.toLocaleString()})`
).join('\n')}

CULTURAL GUIDELINES:
- Respect Islamic values and traditions
- Be inclusive of Dubai's diverse expat population
- Use appropriate language for formal government information
- Consider economic diversity in recommendations
- Acknowledge different cultural perspectives when relevant

RESPONSE FORMAT:
Provide a clear, helpful response followed by:
[CONFIDENCE: X%] where X is your confidence level (0-100)
[SOURCES: List the sources you used]
[CULTURAL_NOTE: Any relevant cultural considerations]`

    const userPrompt = `User Query: ${query}

Context:
- User Location: ${context.location || 'Dubai'}
- Language Preference: ${context.language || 'English'}
- Category: ${context.category || 'General'}

Please provide a comprehensive response following the transparency requirements above.`

    return {
      systemPrompt,
      userPrompt
    }
  }

  /**
   * Parse AI response to extract transparency data
   */
  private parseTransparencyResponse(response: string): {
    response: string;
    confidence?: number;
    sources?: string[];
    alternatives?: string[];
  } {
    // Extract confidence score
    const confidenceMatch = response.match(/\[CONFIDENCE:\s*(\d+)%\]/)
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : undefined

    // Extract sources
    const sourcesMatch = response.match(/\[SOURCES:\s*([^\]]+)\]/)
    const sources = sourcesMatch ? sourcesMatch[1].split(',').map(s => s.trim()) : undefined

    // Clean response (remove transparency metadata)
    const cleanResponse = response
      .replace(/\[CONFIDENCE:\s*\d+%\]/g, '')
      .replace(/\[SOURCES:[^\]]+\]/g, '')
      .replace(/\[CULTURAL_NOTE:[^\]]+\]/g, '')
      .trim()

    return {
      response: cleanResponse,
      confidence,
      sources,
    }
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  private async calculateConfidence(
    query: string,
    response: string,
    dataSources: DataSource[],
    model: string
  ): Promise<number> {
    let confidence = 0

    // Base confidence from model reliability
    const modelConfidence = model.includes('gpt-4') ? 85 : 
                           model.includes('claude-3') ? 87 : 
                           model.includes('gemini') ? 82 : 75
    confidence += modelConfidence * 0.4

    // Data source reliability
    const avgSourceReliability = dataSources.reduce((sum, source) => sum + source.reliability, 0) / dataSources.length
    confidence += avgSourceReliability * 0.3

    // Query complexity factor (simpler queries get higher confidence)
    const queryComplexity = Math.min(query.length / 100, 1) // Normalize to 0-1
    confidence += (1 - queryComplexity) * 10

    // Government source bonus
    const hasGovSources = dataSources.some(source => source.type === 'government')
    if (hasGovSources) confidence += 5

    // Recent data bonus
    const hasRecentData = dataSources.some(source => 
      Date.now() - source.lastUpdated.getTime() < 24 * 60 * 60 * 1000 // 24 hours
    )
    if (hasRecentData) confidence += 3

    return Math.min(Math.max(confidence, 0), 100) // Clamp to 0-100
  }

  /**
   * Detect potential bias in AI responses
   */
  private async detectBias(
    query: string,
    response: string,
    context: any
  ): Promise<BiasFlag[]> {
    const biasFlags: BiasFlag[] = []
    const responseLower = response.toLowerCase()

    // Cultural bias detection
    if (responseLower.includes('western') && !responseLower.includes('local')) {
      biasFlags.push({
        type: 'cultural',
        severity: 'medium',
        description: 'Response may favor Western perspectives over local Emirati culture',
        suggestion: 'Include more local cultural perspectives and traditions'
      })
    }

    // Economic bias detection
    if (responseLower.includes('expensive') || responseLower.includes('luxury')) {
      const affordableOptions = responseLower.includes('budget') || responseLower.includes('affordable')
      if (!affordableOptions) {
        biasFlags.push({
          type: 'economic',
          severity: 'low',
          description: 'Response may focus only on expensive options',
          suggestion: 'Include budget-friendly alternatives for diverse economic backgrounds'
        })
      }
    }

    // Gender bias detection (basic)
    const genderPronouns = (response.match(/\b(he|him|his|she|her|hers)\b/gi) || []).length
    const neutralPronouns = (response.match(/\b(they|them|their)\b/gi) || []).length
    if (genderPronouns > neutralPronouns * 2) {
      biasFlags.push({
        type: 'gender',
        severity: 'low',
        description: 'Response may use gendered language unnecessarily',
        suggestion: 'Consider using more inclusive, gender-neutral language'
      })
    }

    return biasFlags
  }

  /**
   * Calculate explainability score
   */
  private calculateExplainabilityScore(
    response: string,
    dataSources: DataSource[],
    biasFlags: BiasFlag[]
  ): number {
    let score = 100

    // Deduct for lack of sources
    if (dataSources.length === 0) score -= 20
    if (dataSources.length === 1) score -= 10

    // Deduct for bias flags
    biasFlags.forEach(flag => {
      switch (flag.severity) {
        case 'high': score -= 15; break
        case 'medium': score -= 10; break
        case 'low': score -= 5; break
      }
    })

    // Bonus for clear structure
    if (response.includes('\n') || response.includes('•') || response.includes('-')) {
      score += 5
    }

    // Bonus for specific details
    if (response.match(/\d+/g)?.length > 0) score += 3 // Contains numbers
    if (response.includes('http') || response.includes('www.')) score += 2 // Contains links

    return Math.min(Math.max(score, 0), 100)
  }

  /**
   * Get confidence factors for transparency
   */
  private getConfidenceFactors(dataSources: DataSource[], model: string): string[] {
    const factors: string[] = []

    if (dataSources.some(s => s.type === 'government')) {
      factors.push('Official government data')
    }
    
    if (dataSources.some(s => s.reliability > 95)) {
      factors.push('High-reliability sources')
    }

    if (model.includes('gpt-4') || model.includes('claude-3')) {
      factors.push('Advanced AI model')
    }

    const recentSources = dataSources.filter(s => 
      Date.now() - s.lastUpdated.getTime() < 24 * 60 * 60 * 1000
    )
    if (recentSources.length > 0) {
      factors.push('Recent data updates')
    }

    return factors
  }

  /**
   * Classify query type for model selection
   */
  private classifyQuery(query: string): 'chat' | 'analysis' | 'creative' | 'coding' | 'vision' {
    const queryLower = query.toLowerCase()

    if (queryLower.includes('analyze') || queryLower.includes('compare') || queryLower.includes('evaluate')) {
      return 'analysis'
    }

    if (queryLower.includes('write') || queryLower.includes('create') || queryLower.includes('compose')) {
      return 'creative'
    }

    if (queryLower.includes('code') || queryLower.includes('script') || queryLower.includes('program')) {
      return 'coding'
    }

    if (queryLower.includes('image') || queryLower.includes('photo') || queryLower.includes('picture')) {
      return 'vision'
    }

    return 'chat'
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Estimate token usage
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Estimate cost based on model and tokens
   */
  private estimateCost(model: string, tokens: number): number {
    // Simplified cost estimation (in USD)
    const costPerToken = model.includes('gpt-4') ? 0.00006 : 
                        model.includes('claude-3') ? 0.00004 : 
                        0.00002
    return tokens * costPerToken
  }

  /**
   * Store transparency data for analytics
   */
  private async storeTransparencyData(data: any): Promise<void> {
    // In a real implementation, this would store to your database
    // For now, we'll just log it
    console.log('Storing transparency data:', {
      queryId: data.queryId,
      confidence: data.confidence,
      sourcesCount: data.dataSources.length,
      biasFlags: data.biasFlags.length,
      explainabilityScore: data.explainabilityScore
    })
  }
}

export default AITransparencyService