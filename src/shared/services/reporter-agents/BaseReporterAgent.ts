// Base Reporter Agent Class - Abstract implementation for all reporter agents

import { supabase } from '@/shared/lib/supabase'
import { callOpenRouter, getModelForTask } from '@/shared/lib/ai-services'
import {
  ReporterAgentInterface,
  ReporterAgentConfig,
  ContentItem,
  ContentAnalysis,
  ReporterFeedback,
  AgentLearningData,
  ReporterPerformance,
  ScheduleConfig,
  ContentStatus,
  RELEVANCE_THRESHOLD,
  PRIORITY_THRESHOLD,
  QUALITY_THRESHOLD,
  DUBAI_KEYWORDS
} from '@/shared/services/reporter-agents/types/reporter.types'

export abstract class BaseReporterAgent implements ReporterAgentInterface {
  protected config: ReporterAgentConfig
  protected learningData: AgentLearningData | null = null
  protected isInitialized = false

  constructor(config: ReporterAgentConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    try {
      // Load existing learning data
      const { data } = await supabase
        .from('agent_learning_data')
        .select('*')
        .eq('agent_id', this.config.id)
        .single()

      if (data) {
        this.learningData = data
      } else {
        // Initialize with defaults
        this.learningData = {
          agentId: this.config.id,
          successfulPatterns: [],
          failedPatterns: [],
          preferredSources: [],
          optimalSchedule: this.config.scheduleConfig,
          contentPreferences: {
            preferredLength: { min: 300, max: 1500, optimal: 800 },
            topKeywords: [],
            avoidKeywords: [],
            bestPerformingTopics: [],
            audienceEngagementFactors: []
          }
        }
      }

      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize ${this.config.name}:`, error)
      throw error
    }
  }

  // Abstract methods that each reporter must implement
  abstract fetchContent(): Promise<ContentItem[]>
  abstract generateArticle(content: ContentItem): Promise<string>

  async analyzeContent(content: ContentItem): Promise<ContentAnalysis> {
    const relevanceScore = await this.calculateRelevance(content)
    const priorityScore = await this.calculatePriority(content)
    const qualityScore = await this.calculateQuality(content)

    const analysis: ContentAnalysis = {
      relevanceScore,
      priorityScore,
      qualityScore,
      reasons: [],
      suggestions: []
    }

    // Add analysis reasons
    if (relevanceScore >= RELEVANCE_THRESHOLD) {
      analysis.reasons.push(`High relevance to ${this.config.specialty} content`)
    }
    if (priorityScore >= PRIORITY_THRESHOLD) {
      analysis.reasons.push('High priority based on current trends')
    }
    if (qualityScore >= QUALITY_THRESHOLD) {
      analysis.reasons.push('Meets quality standards')
    }

    // Generate suggestions using AI
    const suggestions = await this.generateSuggestions(content, analysis)
    analysis.suggestions = suggestions

    return analysis
  }

  async calculateRelevance(content: ContentItem): Promise<number> {
    // Base relevance calculation
    let score = 0

    // Check for Dubai-related keywords
    const contentText = `${content.title} ${content.content}`.toLowerCase()
    const dubaiKeywordCount = DUBAI_KEYWORDS.filter(keyword => 
      contentText.includes(keyword)
    ).length
    score += Math.min(dubaiKeywordCount * 0.1, 0.3)

    // Check specialty-specific keywords
    const specialtyScore = await this.calculateSpecialtyRelevance(content)
    score += specialtyScore * 0.4

    // Use AI for semantic relevance
    const aiScore = await this.calculateAIRelevance(content)
    score += aiScore * 0.3

    return Math.min(score, 1)
  }

  async calculatePriority(content: ContentItem): Promise<number> {
    let score = 0

    // Recency factor
    const ageInHours = (Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60)
    if (ageInHours < 1) score += 0.3
    else if (ageInHours < 6) score += 0.2
    else if (ageInHours < 24) score += 0.1

    // Source priority
    const source = this.config.sources.find(s => s.name === content.source.name)
    if (source) {
      if (source.priority === 'high') score += 0.3
      else if (source.priority === 'medium') score += 0.2
      else if (source.priority === 'low') score += 0.1
    }

    // Trending topics check
    const isTrending = await this.checkIfTrending(content)
    if (isTrending) score += 0.3

    // Learning-based priority
    if (this.learningData?.contentPreferences.topKeywords) {
      const hasTopKeywords = this.learningData.contentPreferences.topKeywords.some(
        keyword => content.content.toLowerCase().includes(keyword)
      )
      if (hasTopKeywords) score += 0.1
    }

    return Math.min(score, 1)
  }

  protected async calculateQuality(content: ContentItem): Promise<number> {
    let score = 0

    // Length check
    const wordCount = content.content.split(' ').length
    if (wordCount >= 300 && wordCount <= 1500) score += 0.2

    // Structure check (has title, content, summary)
    if (content.title && content.content && content.summary) score += 0.2

    // Media check
    if (content.metadata.imageUrls && content.metadata.imageUrls.length > 0) score += 0.1

    // Source reliability
    const sourceReliability = await this.getSourceReliability(content.source.name)
    score += sourceReliability * 0.3

    // AI quality assessment
    const aiQuality = await this.assessContentQuality(content)
    score += aiQuality * 0.2

    return Math.min(score, 1)
  }

  async learnFromFeedback(feedback: ReporterFeedback): Promise<void> {
    if (!this.learningData) return

    try {
      // Fetch the content item
      const { data: content } = await supabase
        .from('ai_content')
        .select('*')
        .eq('id', feedback.contentId)
        .single()

      if (!content) return

      // Update patterns based on feedback
      if (feedback.rating >= 4) {
        // Success pattern
        this.updateSuccessPatterns(content, feedback)
      } else if (feedback.rating <= 2) {
        // Failed pattern
        this.updateFailedPatterns(content, feedback)
      }

      // Update preferences
      if (feedback.improvements && feedback.improvements.length > 0) {
        this.updateContentPreferences(feedback.improvements)
      }

      // Save updated learning data
      await this.saveLearningData()
    } catch (error) {
      console.error('Error learning from feedback:', error)
    }
  }

  async updatePreferences(data: AgentLearningData): Promise<void> {
    this.learningData = data
    await this.saveLearningData()
  }

  async getPerformanceMetrics(): Promise<ReporterPerformance> {
    const { data: metrics } = await supabase
      .from('agent_performance')
      .select('*')
      .eq('agent_id', this.config.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (metrics) {
      return metrics
    }

    // Return default metrics
    return {
      agentId: this.config.id,
      totalContentFetched: 0,
      totalContentPublished: 0,
      averageRelevanceScore: 0,
      averagePriorityScore: 0,
      topPerformingCategories: [],
      feedbackScore: 0,
      lastRunTime: new Date(),
      nextScheduledRun: new Date(),
      errors: []
    }
  }

  async optimizeSchedule(): Promise<ScheduleConfig> {
    if (!this.learningData) return this.config.scheduleConfig

    // Analyze performance by time of day
    const { data: performanceByHour } = await supabase
      .from('content_performance')
      .select('published_at, engagement_score')
      .eq('agent_id', this.config.id)
      .order('engagement_score', { ascending: false })
      .limit(100)

    if (!performanceByHour || performanceByHour.length === 0) {
      return this.config.scheduleConfig
    }

    // Find optimal publishing times
    const hourlyPerformance = new Map<number, number[]>()
    performanceByHour.forEach(item => {
      const hour = new Date(item.published_at).getHours()
      if (!hourlyPerformance.has(hour)) {
        hourlyPerformance.set(hour, [])
      }
      hourlyPerformance.get(hour)!.push(item.engagement_score)
    })

    // Calculate average performance by hour
    const topHours = Array.from(hourlyPerformance.entries())
      .map(([hour, scores]) => ({
        hour,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3)
      .map(item => `${item.hour.toString().padStart(2, '0')}:00`)

    return {
      ...this.config.scheduleConfig,
      times: topHours
    }
  }

  async validateContent(content: ContentItem): Promise<boolean> {
    // Check for required fields
    if (!content.title || !content.content || !content.source) {
      return false
    }

    // Check content length
    const wordCount = content.content.split(' ').length
    if (wordCount < 100) {
      return false
    }

    // Check for spam or inappropriate content
    const isAppropriate = await this.checkContentAppropriateness(content)
    if (!isAppropriate) {
      return false
    }

    // Check for Dubai relevance
    const relevanceScore = await this.calculateRelevance(content)
    if (relevanceScore < 0.3) {
      return false
    }

    return true
  }

  shouldPublish(analysis: ContentAnalysis): boolean {
    return (
      analysis.relevanceScore >= RELEVANCE_THRESHOLD &&
      analysis.priorityScore >= PRIORITY_THRESHOLD &&
      analysis.qualityScore >= QUALITY_THRESHOLD
    )
  }

  formatForPublication(content: string): string {
    // Add formatting for publication
    let formatted = content

    // Ensure proper paragraph breaks
    formatted = formatted.replace(/\n\n+/g, '\n\n')

    // Add source attribution if not present
    if (!formatted.includes('Source:') && !formatted.includes('source:')) {
      formatted += '\n\n---\n\nGenerated by AI Reporter'
    }

    return formatted
  }

  // Protected helper methods
  protected abstract calculateSpecialtyRelevance(content: ContentItem): Promise<number>
  
  protected async calculateAIRelevance(content: ContentItem): Promise<number> {
    try {
      const prompt = `
        Analyze the relevance of this content for a ${this.config.specialty} reporter in Dubai.
        
        Title: ${content.title}
        Content: ${content.content.substring(0, 500)}...
        
        Rate the relevance from 0 to 1, considering:
        1. Local Dubai relevance
        2. ${this.config.specialty} category fit
        3. Audience interest
        4. Timeliness
        
        Return only a number between 0 and 1.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      const score = parseFloat(response.trim())
      return isNaN(score) ? 0.5 : Math.min(Math.max(score, 0), 1)
    } catch (error) {
      console.error('AI relevance calculation failed:', error)
      return 0.5
    }
  }

  protected async checkIfTrending(content: ContentItem): Promise<boolean> {
    // Check against trending topics in database
    const { data: trending } = await supabase
      .from('trending_topics')
      .select('keywords')
      .eq('location', 'dubai')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (!trending) return false

    const contentLower = content.content.toLowerCase()
    return trending.some(topic => 
      topic.keywords.some((keyword: string) => contentLower.includes(keyword.toLowerCase()))
    )
  }

  protected async getSourceReliability(sourceName: string): Promise<number> {
    const reliableScores: Record<string, number> = {
      'government': 1.0,
      'official': 0.9,
      'verified': 0.8,
      'news': 0.7,
      'social': 0.5,
      'unknown': 0.3
    }

    // Check source type
    for (const [type, score] of Object.entries(reliableScores)) {
      if (sourceName.toLowerCase().includes(type)) {
        return score
      }
    }

    return 0.5
  }

  protected async assessContentQuality(content: ContentItem): Promise<number> {
    try {
      const prompt = `
        Assess the quality of this content for publication:
        
        Title: ${content.title}
        Content: ${content.content.substring(0, 1000)}...
        
        Consider:
        1. Grammar and spelling
        2. Clarity and coherence
        3. Factual accuracy
        4. Professional tone
        5. Value to readers
        
        Rate from 0 to 1. Return only the number.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      const score = parseFloat(response.trim())
      return isNaN(score) ? 0.5 : Math.min(Math.max(score, 0), 1)
    } catch (error) {
      console.error('AI quality assessment failed:', error)
      return 0.5
    }
  }

  protected async generateSuggestions(content: ContentItem, analysis: ContentAnalysis): Promise<string[]> {
    const suggestions: string[] = []

    if (analysis.relevanceScore < RELEVANCE_THRESHOLD) {
      suggestions.push('Consider adding more Dubai-specific context or local angles')
    }

    if (analysis.priorityScore < PRIORITY_THRESHOLD) {
      suggestions.push('Content may be outdated or from low-priority source')
    }

    if (analysis.qualityScore < QUALITY_THRESHOLD) {
      suggestions.push('Content needs editing for grammar, clarity, or structure')
    }

    return suggestions
  }

  protected async checkContentAppropriateness(content: ContentItem): Promise<boolean> {
    // Use content moderation service
    try {
      const { data } = await supabase.functions.invoke('content-moderation', {
        body: { content: content.content }
      })

      return data?.appropriate ?? true
    } catch (error) {
      console.error('Content moderation check failed:', error)
      return true // Default to allowing content if check fails
    }
  }

  protected updateSuccessPatterns(content: any, feedback: ReporterFeedback): void {
    if (!this.learningData) return

    // Extract successful patterns
    const keywords = this.extractKeywords(content.content)
    const topicCategory = content.category

    // Update or add pattern
    const existingPattern = this.learningData.successfulPatterns.find(
      p => p.type === topicCategory
    )

    if (existingPattern) {
      existingPattern.frequency++
      existingPattern.successRate = 
        (existingPattern.successRate * (existingPattern.frequency - 1) + feedback.rating) / 
        existingPattern.frequency
      existingPattern.examples.push(content.title)
    } else {
      this.learningData.successfulPatterns.push({
        type: topicCategory,
        frequency: 1,
        successRate: feedback.rating,
        examples: [content.title]
      })
    }

    // Update top keywords
    keywords.forEach(keyword => {
      if (!this.learningData!.contentPreferences.topKeywords.includes(keyword)) {
        this.learningData!.contentPreferences.topKeywords.push(keyword)
      }
    })
  }

  protected updateFailedPatterns(content: any, feedback: ReporterFeedback): void {
    if (!this.learningData) return

    // Similar to success patterns but for failures
    const keywords = this.extractKeywords(content.content)
    
    keywords.forEach(keyword => {
      if (!this.learningData!.contentPreferences.avoidKeywords.includes(keyword)) {
        this.learningData!.contentPreferences.avoidKeywords.push(keyword)
      }
    })
  }

  protected updateContentPreferences(improvements: string[]): void {
    if (!this.learningData) return

    // Parse improvements and update preferences
    improvements.forEach(improvement => {
      if (improvement.includes('length')) {
        // Adjust preferred length based on feedback
        if (improvement.includes('shorter')) {
          this.learningData!.contentPreferences.preferredLength.optimal *= 0.9
        } else if (improvement.includes('longer')) {
          this.learningData!.contentPreferences.preferredLength.optimal *= 1.1
        }
      }
    })
  }

  protected extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase().split(/\s+/)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10)
  }

  protected async saveLearningData(): Promise<void> {
    if (!this.learningData) return

    try {
      await supabase
        .from('agent_learning_data')
        .upsert({
          ...this.learningData,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to save learning data:', error)
    }
  }
}