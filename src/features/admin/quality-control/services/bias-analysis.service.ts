import { supabase } from '@/shared/lib/supabase'
import type { NewsArticle } from '@/features/news/types'

export interface BiasMetrics {
  // Gender representation
  genderDistribution: {
    male: number
    female: number
    neutral: number
    unknown: number
  }
  genderBalance: number // 0-100, where 100 is perfect balance

  // Nationality diversity
  nationalityDistribution: Record<string, number>
  nationalityDiversity: number // 0-100, higher is more diverse

  // Topic diversity
  topicDistribution: Record<string, number>
  topicConcentration: number // 0-100, lower is better (less concentrated)

  // Sentiment balance
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  sentimentBalance: number // 0-100, where 100 is perfect balance

  // Overall bias score
  overallBiasScore: number // 0-100, where 100 is least biased

  // Time range
  timeRange: {
    start: string
    end: string
  }

  // Sample size
  totalArticles: number
}

export interface BiasAlert {
  id: string
  type: 'gender' | 'nationality' | 'topic' | 'sentiment'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  threshold: number
  actualValue: number
  recommendations: string[]
  createdAt: string
}

export class BiasAnalysisService {
  /**
   * Analyze bias metrics for a given time period
   */
  static async analyzeBiasMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<BiasMetrics> {
    try {
      // Fetch articles from the time range
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select('*')
        .gte('published_at', startDate.toISOString())
        .lte('published_at', endDate.toISOString())
        .eq('status', 'published')

      if (error) throw error

      const newsArticles = articles as unknown as NewsArticle[]

      // Calculate gender distribution
      const genderDistribution = this.calculateGenderDistribution(newsArticles)
      const genderBalance = this.calculateGenderBalance(genderDistribution)

      // Calculate nationality diversity
      const nationalityDistribution = this.calculateNationalityDistribution(newsArticles)
      const nationalityDiversity = this.calculateNationalityDiversity(nationalityDistribution)

      // Calculate topic distribution
      const topicDistribution = this.calculateTopicDistribution(newsArticles)
      const topicConcentration = this.calculateTopicConcentration(topicDistribution)

      // Calculate sentiment balance
      const sentimentDistribution = this.calculateSentimentDistribution(newsArticles)
      const sentimentBalance = this.calculateSentimentBalance(sentimentDistribution)

      // Calculate overall bias score
      const overallBiasScore = this.calculateOverallBiasScore({
        genderBalance,
        nationalityDiversity,
        topicConcentration,
        sentimentBalance,
      })

      return {
        genderDistribution,
        genderBalance,
        nationalityDistribution,
        nationalityDiversity,
        topicDistribution,
        topicConcentration,
        sentimentDistribution,
        sentimentBalance,
        overallBiasScore,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        totalArticles: newsArticles.length,
      }
    } catch (error) {
      console.error('Error analyzing bias metrics:', error)
      throw error
    }
  }

  /**
   * Get current bias alerts
   */
  static async getBiasAlerts(severityFilter?: BiasAlert['severity'][]): Promise<BiasAlert[]> {
    try {
      // Analyze metrics for last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      const metrics = await this.analyzeBiasMetrics(startDate, endDate)
      const alerts: BiasAlert[] = []

      // Gender bias alerts
      if (metrics.genderBalance < 60) {
        alerts.push({
          id: `gender-${Date.now()}`,
          type: 'gender',
          severity: metrics.genderBalance < 40 ? 'critical' : metrics.genderBalance < 50 ? 'high' : 'medium',
          title: 'Gender Imbalance Detected',
          description: `Gender representation is ${metrics.genderBalance.toFixed(1)}% balanced (target: 60%+). Male: ${metrics.genderDistribution.male}, Female: ${metrics.genderDistribution.female}`,
          threshold: 60,
          actualValue: metrics.genderBalance,
          recommendations: [
            'Diversify source selection to include more female experts',
            'Review automated source discovery for gender bias',
            'Actively seek stories highlighting women\'s perspectives',
          ],
          createdAt: new Date().toISOString(),
        })
      }

      // Nationality diversity alerts
      if (metrics.nationalityDiversity < 50) {
        alerts.push({
          id: `nationality-${Date.now()}`,
          type: 'nationality',
          severity: metrics.nationalityDiversity < 30 ? 'critical' : metrics.nationalityDiversity < 40 ? 'high' : 'medium',
          title: 'Low Nationality Diversity',
          description: `Content is sourced from ${Object.keys(metrics.nationalityDistribution).length} nationalities. Diversity score: ${metrics.nationalityDiversity.toFixed(1)}% (target: 50%+)`,
          threshold: 50,
          actualValue: metrics.nationalityDiversity,
          recommendations: [
            'Expand international news sources',
            'Include more perspectives from underrepresented regions',
            'Balance local (UAE) with global content',
          ],
          createdAt: new Date().toISOString(),
        })
      }

      // Topic concentration alerts
      if (metrics.topicConcentration > 40) {
        const topTopics = Object.entries(metrics.topicDistribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([topic]) => topic)
          .join(', ')

        alerts.push({
          id: `topic-${Date.now()}`,
          type: 'topic',
          severity: metrics.topicConcentration > 60 ? 'critical' : metrics.topicConcentration > 50 ? 'high' : 'medium',
          title: 'Topic Concentration Too High',
          description: `${metrics.topicConcentration.toFixed(1)}% of articles focus on: ${topTopics}. Target: <40%`,
          threshold: 40,
          actualValue: metrics.topicConcentration,
          recommendations: [
            'Diversify topic coverage across categories',
            'Reduce focus on over-represented topics',
            'Explore underrepresented categories',
          ],
          createdAt: new Date().toISOString(),
        })
      }

      // Sentiment balance alerts
      if (metrics.sentimentBalance < 65) {
        alerts.push({
          id: `sentiment-${Date.now()}`,
          type: 'sentiment',
          severity: metrics.sentimentBalance < 50 ? 'critical' : metrics.sentimentBalance < 60 ? 'high' : 'medium',
          title: 'Sentiment Imbalance',
          description: `Sentiment is ${metrics.sentimentBalance.toFixed(1)}% balanced. Positive: ${metrics.sentimentDistribution.positive}, Negative: ${metrics.sentimentDistribution.negative}, Neutral: ${metrics.sentimentDistribution.neutral}`,
          threshold: 65,
          actualValue: metrics.sentimentBalance,
          recommendations: [
            'Balance positive and negative coverage',
            'Include more neutral, fact-based reporting',
            'Review AI sentiment detection accuracy',
          ],
          createdAt: new Date().toISOString(),
        })
      }

      // Filter by severity if specified
      if (severityFilter && severityFilter.length > 0) {
        return alerts.filter(alert => severityFilter.includes(alert.severity))
      }

      return alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
    } catch (error) {
      console.error('Error fetching bias alerts:', error)
      return []
    }
  }

  /**
   * Calculate gender distribution from articles
   */
  private static calculateGenderDistribution(articles: NewsArticle[]): BiasMetrics['genderDistribution'] {
    const distribution = {
      male: 0,
      female: 0,
      neutral: 0,
      unknown: 0,
    }

    articles.forEach(article => {
      // Extract gender from author metadata or content analysis
      // This is a simplified implementation - real implementation would use NLP
      const content = `${article.title} ${article.summary || ''}`.toLowerCase()

      // Simple heuristic: count gendered pronouns and names
      const maleIndicators = ['he ', 'his ', 'him ', 'mr ', 'prince ', 'sheikh ', 'king ']
      const femaleIndicators = ['she ', 'her ', 'hers ', 'ms ', 'mrs ', 'princess ', 'sheikha ', 'queen ']

      const maleCount = maleIndicators.reduce((sum, word) => sum + (content.match(new RegExp(word, 'g'))?.length || 0), 0)
      const femaleCount = femaleIndicators.reduce((sum, word) => sum + (content.match(new RegExp(word, 'g'))?.length || 0), 0)

      if (maleCount > femaleCount) {
        distribution.male++
      } else if (femaleCount > maleCount) {
        distribution.female++
      } else if (maleCount === 0 && femaleCount === 0) {
        distribution.neutral++
      } else {
        distribution.unknown++
      }
    })

    return distribution
  }

  /**
   * Calculate gender balance score (0-100)
   */
  private static calculateGenderBalance(distribution: BiasMetrics['genderDistribution']): number {
    const total = distribution.male + distribution.female
    if (total === 0) return 100 // Neutral content

    const ratio = Math.min(distribution.male, distribution.female) / Math.max(distribution.male, distribution.female)
    return Math.round(ratio * 100)
  }

  /**
   * Calculate nationality distribution
   */
  private static calculateNationalityDistribution(articles: NewsArticle[]): Record<string, number> {
    const distribution: Record<string, number> = {}

    articles.forEach(article => {
      // Extract nationalities from content
      // This is simplified - real implementation would use NER
      const content = `${article.title} ${article.summary || ''}`.toLowerCase()

      const nationalities = [
        'emirati', 'uae', 'dubai', 'abu dhabi',
        'british', 'american', 'indian', 'pakistani', 'filipino',
        'french', 'german', 'chinese', 'japanese', 'korean',
        'australian', 'canadian', 'saudi', 'egyptian', 'lebanese',
      ]

      nationalities.forEach(nationality => {
        if (content.includes(nationality)) {
          distribution[nationality] = (distribution[nationality] || 0) + 1
        }
      })
    })

    return distribution
  }

  /**
   * Calculate nationality diversity score (0-100)
   */
  private static calculateNationalityDiversity(distribution: Record<string, number>): number {
    const nationalities = Object.keys(distribution)
    if (nationalities.length === 0) return 0

    // Shannon diversity index adapted to 0-100 scale
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    let entropy = 0

    nationalities.forEach(nationality => {
      const p = distribution[nationality] / total
      entropy -= p * Math.log2(p)
    })

    // Normalize to 0-100 (assuming max diversity is log2(20) ≈ 4.32)
    return Math.min(100, Math.round((entropy / 4.32) * 100))
  }

  /**
   * Calculate topic distribution
   */
  private static calculateTopicDistribution(articles: NewsArticle[]): Record<string, number> {
    const distribution: Record<string, number> = {}

    articles.forEach(article => {
      const category = article.category || 'general'
      distribution[category] = (distribution[category] || 0) + 1
    })

    return distribution
  }

  /**
   * Calculate topic concentration (0-100, lower is better)
   */
  private static calculateTopicConcentration(distribution: Record<string, number>): number {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    if (total === 0) return 0

    // Calculate Herfindahl index (concentration)
    let herfindahl = 0
    Object.values(distribution).forEach(count => {
      const share = count / total
      herfindahl += share ** 2
    })

    // Convert to percentage (0-100)
    return Math.round(herfindahl * 100)
  }

  /**
   * Calculate sentiment distribution
   */
  private static calculateSentimentDistribution(articles: NewsArticle[]): BiasMetrics['sentimentDistribution'] {
    const distribution = {
      positive: 0,
      neutral: 0,
      negative: 0,
    }

    articles.forEach(article => {
      const sentiment = article.sentiment || 'neutral'
      distribution[sentiment]++
    })

    return distribution
  }

  /**
   * Calculate sentiment balance (0-100)
   */
  private static calculateSentimentBalance(distribution: BiasMetrics['sentimentDistribution']): number {
    const total = distribution.positive + distribution.neutral + distribution.negative
    if (total === 0) return 100

    // Ideal distribution: 30% positive, 50% neutral, 20% negative
    const ideal = { positive: 0.3, neutral: 0.5, negative: 0.2 }
    const actual = {
      positive: distribution.positive / total,
      neutral: distribution.neutral / total,
      negative: distribution.negative / total,
    }

    // Calculate deviation from ideal
    const deviation = Math.abs(actual.positive - ideal.positive) +
                     Math.abs(actual.neutral - ideal.neutral) +
                     Math.abs(actual.negative - ideal.negative)

    // Convert to balance score (0-100)
    return Math.max(0, Math.round(100 - (deviation * 100)))
  }

  /**
   * Calculate overall bias score (0-100)
   */
  private static calculateOverallBiasScore(components: {
    genderBalance: number
    nationalityDiversity: number
    topicConcentration: number
    sentimentBalance: number
  }): number {
    // Weighted average
    const weights = {
      genderBalance: 0.3,
      nationalityDiversity: 0.25,
      topicConcentration: 0.25, // Invert because lower is better
      sentimentBalance: 0.2,
    }

    return Math.round(
      components.genderBalance * weights.genderBalance +
      components.nationalityDiversity * weights.nationalityDiversity +
      (100 - components.topicConcentration) * weights.topicConcentration +
      components.sentimentBalance * weights.sentimentBalance
    )
  }
}
