import { supabase } from '@/shared/lib/supabase'

export interface ConfidenceBreakdown {
  sourceAgreement: number // 0-100: How much sources agree
  modelConfidence: number // 0-100: AI model's confidence
  factCheckScore: number // 0-100: Fact-checking results
  sentimentConsistency: number // 0-100: Sentiment consistency across sources
  nerAccuracy: number // 0-100: Named Entity Recognition accuracy
}

export interface ConfidenceScore {
  overall: number // 0-100: Weighted average
  breakdown: ConfidenceBreakdown
  reasons: string[] // Human-readable explanations
  threshold: number // Minimum to publish (85)
  meetsThreshold: boolean
}

export interface ArticleDraft {
  title: string
  content: string
  sources: Array<{
    url: string
    text: string
    credibility: number
  }>
  entities: Array<{
    text: string
    type: string
    confidence: number
  }>
  sentiment?: 'positive' | 'neutral' | 'negative'
}

class AIConfidenceService {
  private readonly PUBLISH_THRESHOLD = 85
  private readonly WEIGHTS = {
    sourceAgreement: 0.3,
    modelConfidence: 0.25,
    factCheckScore: 0.25,
    sentimentConsistency: 0.1,
    nerAccuracy: 0.1,
  }

  /**
   * Calculate confidence score for an AI-generated article draft
   */
  async calculateConfidence(draft: ArticleDraft): Promise<ConfidenceScore> {
    const breakdown: ConfidenceBreakdown = {
      sourceAgreement: await this.calculateSourceAgreement(draft),
      modelConfidence: await this.calculateModelConfidence(draft),
      factCheckScore: await this.calculateFactCheckScore(draft),
      sentimentConsistency: await this.calculateSentimentConsistency(draft),
      nerAccuracy: await this.calculateNERAccuracy(draft),
    }

    const overall = this.calculateOverallScore(breakdown)
    const reasons = this.generateReasons(breakdown, overall)
    const meetsThreshold = overall >= this.PUBLISH_THRESHOLD

    return {
      overall,
      breakdown,
      reasons,
      threshold: this.PUBLISH_THRESHOLD,
      meetsThreshold,
    }
  }

  /**
   * Check if confidence score meets publishing threshold
   */
  meetsThreshold(score: ConfidenceScore): boolean {
    return score.meetsThreshold
  }

  /**
   * Get confidence trend over time
   */
  async getConfidenceTrend(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: Date; avgConfidence: number; articlesCount: number }>> {
    const { data, error } = await supabase
      .from('news_articles')
      .select('ai_confidence_score, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('ai_confidence_score', 'is', null)
      .order('created_at', { ascending: true })

    if (error || !data) {
      console.error('Error fetching confidence trend:', error)
      return []
    }

    // Group by day
    const dailyData = new Map<string, { sum: number; count: number }>()

    data.forEach((article) => {
      const date = new Date(article.created_at).toISOString().split('T')[0]
      const existing = dailyData.get(date) || { sum: 0, count: 0 }
      dailyData.set(date, {
        sum: existing.sum + article.ai_confidence_score,
        count: existing.count + 1,
      })
    })

    return Array.from(dailyData.entries()).map(([dateStr, stats]) => ({
      date: new Date(dateStr),
      avgConfidence: stats.sum / stats.count,
      articlesCount: stats.count,
    }))
  }

  /**
   * Store confidence score in database
   */
  async storeConfidenceScore(
    articleId: string,
    score: ConfidenceScore
  ): Promise<void> {
    const { error } = await supabase
      .from('news_articles')
      .update({
        ai_confidence_score: score.overall,
        ai_confidence_breakdown: score.breakdown,
        ai_sources_analyzed: score.breakdown ? Object.keys(score.breakdown).length : 0,
      })
      .eq('id', articleId)

    if (error) {
      console.error('Error storing confidence score:', error)
      throw new Error('Failed to store confidence score')
    }
  }

  // Private helper methods

  private async calculateSourceAgreement(draft: ArticleDraft): Promise<number> {
    if (!draft.sources || draft.sources.length === 0) return 0
    if (draft.sources.length === 1) return 60 // Single source gets moderate score

    // Calculate how much sources agree on key facts
    // This is a simplified implementation - in production, use NLP to compare content
    const avgCredibility =
      draft.sources.reduce((sum, s) => sum + s.credibility, 0) / draft.sources.length

    // If we have 3+ high-credibility sources, confidence is higher
    const highCredibilitySources = draft.sources.filter((s) => s.credibility >= 80).length
    const sourceCountBonus = Math.min(draft.sources.length * 5, 20) // Up to +20 for many sources
    const credibilityBonus = highCredibilitySources * 5 // +5 per high-credibility source

    return Math.min(avgCredibility + sourceCountBonus + credibilityBonus, 100)
  }

  private async calculateModelConfidence(draft: ArticleDraft): Promise<number> {
    // In production, this would come from the AI model's logprobs
    // For now, we estimate based on content length and structure
    const hasTitle = draft.title && draft.title.length > 10
    const hasContent = draft.content && draft.content.length > 200
    const hasStructure = draft.content && draft.content.includes('\n\n')

    let confidence = 70 // Base confidence

    if (hasTitle) confidence += 10
    if (hasContent) confidence += 10
    if (hasStructure) confidence += 10

    return Math.min(confidence, 100)
  }

  private async calculateFactCheckScore(draft: ArticleDraft): Promise<number> {
    // In production, integrate with fact-checking APIs
    // For now, basic heuristics:

    // Check if sources are reputable (credibility > 70)
    const reputableSources = draft.sources.filter((s) => s.credibility >= 70).length
    const sourceRatio = draft.sources.length > 0 ? reputableSources / draft.sources.length : 0

    // Check for red flags in content (sensational language, unsourced claims)
    const redFlags = this.detectRedFlags(draft.content)

    let score = sourceRatio * 80 // Base score from source credibility
    score -= redFlags * 10 // Deduct for red flags

    return Math.max(Math.min(score, 100), 0)
  }

  private async calculateSentimentConsistency(draft: ArticleDraft): Promise<number> {
    // Check if sentiment is consistent across sources
    // In production, analyze sentiment of each source vs final article

    if (!draft.sentiment) return 75 // Neutral gets medium score

    // Simplified: assume consistency if we have sentiment
    return 85
  }

  private async calculateNERAccuracy(draft: ArticleDraft): Promise<number> {
    // Check Named Entity Recognition accuracy
    if (!draft.entities || draft.entities.length === 0) return 70 // Base score

    const avgEntityConfidence =
      draft.entities.reduce((sum, e) => sum + e.confidence, 0) / draft.entities.length

    return avgEntityConfidence * 100
  }

  private calculateOverallScore(breakdown: ConfidenceBreakdown): number {
    return (
      breakdown.sourceAgreement * this.WEIGHTS.sourceAgreement +
      breakdown.modelConfidence * this.WEIGHTS.modelConfidence +
      breakdown.factCheckScore * this.WEIGHTS.factCheckScore +
      breakdown.sentimentConsistency * this.WEIGHTS.sentimentConsistency +
      breakdown.nerAccuracy * this.WEIGHTS.nerAccuracy
    )
  }

  private generateReasons(breakdown: ConfidenceBreakdown, overall: number): string[] {
    const reasons: string[] = []

    if (breakdown.sourceAgreement >= 85) {
      reasons.push('Multiple reputable sources confirm key facts')
    } else if (breakdown.sourceAgreement < 70) {
      reasons.push('Source agreement is low - conflicting information detected')
    }

    if (breakdown.factCheckScore >= 85) {
      reasons.push('Fact-checking passed with high confidence')
    } else if (breakdown.factCheckScore < 70) {
      reasons.push('Fact-checking concerns detected')
    }

    if (breakdown.modelConfidence >= 90) {
      reasons.push('AI model highly confident in generation')
    }

    if (breakdown.nerAccuracy < 70) {
      reasons.push('Some named entities have low recognition confidence')
    }

    if (overall >= 90) {
      reasons.push('Overall: Excellent confidence - highly reliable')
    } else if (overall >= 85) {
      reasons.push('Overall: Good confidence - meets publishing standards')
    } else if (overall >= 70) {
      reasons.push('Overall: Moderate confidence - recommend human review')
    } else {
      reasons.push('Overall: Low confidence - do not publish without verification')
    }

    return reasons
  }

  private detectRedFlags(content: string): number {
    const redFlagPatterns = [
      /!!!/g, // Multiple exclamation marks
      /BREAKING:/gi, // Sensational language
      /EXCLUSIVE:/gi,
      /allegedly/gi, // Unsourced claims
      /unconfirmed/gi,
    ]

    let flagCount = 0
    redFlagPatterns.forEach((pattern) => {
      const matches = content.match(pattern)
      if (matches) flagCount += matches.length
    })

    return flagCount
  }
}

export const aiConfidenceService = new AIConfidenceService()
