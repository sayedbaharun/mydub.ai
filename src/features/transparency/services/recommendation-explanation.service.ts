import type { NewsArticle } from '@/features/news/types'
import { SecureStorage } from '@/shared/lib/secure-storage'

interface RecommendationFactor {
  type: 'location' | 'trending' | 'history' | 'time' | 'language' | 'ai' | 'category' | 'freshness'
  title: string
  description: string
  weight: number // 0-100
}

interface RecommendationExplanation {
  primaryReason: RecommendationFactor
  contributingFactors: RecommendationFactor[]
  totalScore: number
}

export class RecommendationExplanationService {
  /**
   * Explain why a particular article was recommended to the user
   */
  static explainRecommendation(article: NewsArticle): RecommendationExplanation {
    const factors: RecommendationFactor[] = []

    // 1. Location-based recommendation (Dubai-centric content)
    const isLocalContent = this.isLocalContent(article)
    if (isLocalContent) {
      factors.push({
        type: 'location',
        title: 'You\'re in Dubai',
        description: 'This article covers local Dubai news and events relevant to your location.',
        weight: 35,
      })
    }

    // 2. Trending content
    if (article.isBreaking || article.viewCount > 1000) {
      factors.push({
        type: 'trending',
        title: 'Trending Now',
        description: `This article is popular with ${article.viewCount.toLocaleString()} views and high engagement.`,
        weight: 25,
      })
    }

    // 3. Reading history (category preference)
    const categoryPreference = this.getCategoryPreference(article.category)
    if (categoryPreference > 0) {
      factors.push({
        type: 'history',
        title: 'Based on Your Interests',
        description: `You've shown interest in ${article.category} content. This article matches your reading patterns.`,
        weight: categoryPreference,
      })
    }

    // 4. Time-based relevance
    const timeRelevance = this.getTimeRelevance(article)
    if (timeRelevance > 0) {
      factors.push({
        type: 'time',
        title: 'Timely Content',
        description: 'This article was published recently and contains timely information.',
        weight: timeRelevance,
      })
    }

    // 5. Language preference
    const languageMatch = this.getLanguageMatch(article)
    if (languageMatch > 0) {
      factors.push({
        type: 'language',
        title: 'Your Preferred Language',
        description: 'This article is available in your preferred language.',
        weight: languageMatch,
      })
    }

    // 6. AI-generated quality content
    if (article.aiMetadata && article.aiMetadata.confidenceScore >= 90) {
      factors.push({
        type: 'ai',
        title: 'High-Quality AI Content',
        description: `AI-verified with ${article.aiMetadata.confidenceScore}% confidence from ${article.aiMetadata.sourcesAnalyzed} sources.`,
        weight: 15,
      })
    }

    // 7. Freshness (new content prioritization)
    const freshnessScore = this.getFreshnessScore(article)
    if (freshnessScore > 0) {
      factors.push({
        type: 'freshness',
        title: 'Recently Published',
        description: 'Fresh content is prioritized to keep you updated with the latest news.',
        weight: freshnessScore,
      })
    }

    // Sort factors by weight (highest first)
    factors.sort((a, b) => b.weight - a.weight)

    // Primary reason is the highest weighted factor
    const primaryReason = factors[0] || {
      type: 'category' as const,
      title: 'General Interest',
      description: 'This article was selected from our curated news feed.',
      weight: 50,
    }

    // Contributing factors are the rest (up to 4)
    const contributingFactors = factors.slice(1, 5)

    // Calculate total score (for internal use)
    const totalScore = factors.reduce((sum, f) => sum + f.weight, 0)

    return {
      primaryReason,
      contributingFactors,
      totalScore,
    }
  }

  /**
   * Check if article is Dubai/UAE local content
   */
  private static isLocalContent(article: NewsArticle): boolean {
    const localKeywords = ['dubai', 'uae', 'emirates', 'abu dhabi', 'sharjah']
    const titleLower = article.title.toLowerCase()
    const summaryLower = (article.summary || '').toLowerCase()

    return localKeywords.some(keyword =>
      titleLower.includes(keyword) || summaryLower.includes(keyword)
    ) || article.category === 'dubai_life'
  }

  /**
   * Get user's category preference (0-30)
   */
  private static getCategoryPreference(category: string): number {
    try {
      const readingHistory = SecureStorage.getItem('reading_history') as string[] || []
      const categoryCount = readingHistory.filter(c => c === category).length
      const totalReads = readingHistory.length

      if (totalReads === 0) return 0

      const categoryRatio = categoryCount / totalReads

      // Scale to 0-30 range
      return Math.min(30, Math.round(categoryRatio * 100))
    } catch {
      return 0
    }
  }

  /**
   * Get time relevance score (0-20)
   */
  private static getTimeRelevance(article: NewsArticle): number {
    const now = new Date()
    const published = new Date(article.publishedAt)
    const ageInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60)

    // Articles published in last 6 hours get highest score
    if (ageInHours < 6) return 20
    if (ageInHours < 24) return 15
    if (ageInHours < 48) return 10
    if (ageInHours < 168) return 5 // 1 week

    return 0
  }

  /**
   * Get language match score (0-10)
   */
  private static getLanguageMatch(article: NewsArticle): number {
    try {
      const preferredLang = SecureStorage.getItem('preferred_language') as string || 'en'

      // If article has Arabic content and user prefers Arabic
      if (preferredLang === 'ar' && article.titleAr) {
        return 10
      }

      // If article has English content and user prefers English
      if (preferredLang === 'en' && !article.titleAr) {
        return 10
      }

      return 5 // Partial match
    } catch {
      return 0
    }
  }

  /**
   * Get freshness score (0-15)
   */
  private static getFreshnessScore(article: NewsArticle): number {
    const now = new Date()
    const published = new Date(article.publishedAt)
    const ageInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60)

    // Very fresh (< 3 hours)
    if (ageInHours < 3) return 15
    // Recent (< 12 hours)
    if (ageInHours < 12) return 10
    // Today (< 24 hours)
    if (ageInHours < 24) return 5

    return 0
  }

  /**
   * Track article view for future recommendations
   */
  static trackArticleView(article: NewsArticle): void {
    try {
      // Update reading history
      const history = (SecureStorage.getItem('reading_history') as string[]) || []
      history.push(article.category)

      // Keep only last 50 reads to avoid bloat
      const recentHistory = history.slice(-50)
      SecureStorage.setItem('reading_history', recentHistory)

      // Track timestamp
      const viewTimestamps = (SecureStorage.getItem('view_timestamps') as Record<string, string>) || {}
      viewTimestamps[article.id] = new Date().toISOString()
      SecureStorage.setItem('view_timestamps', viewTimestamps)
    } catch (error) {
      console.error('Error tracking article view:', error)
    }
  }

  /**
   * Clear user's recommendation data (for privacy)
   */
  static clearRecommendationData(): void {
    try {
      SecureStorage.removeItem('reading_history')
      SecureStorage.removeItem('view_timestamps')
      SecureStorage.removeItem('preferred_language')
    } catch (error) {
      console.error('Error clearing recommendation data:', error)
    }
  }

  /**
   * Get recommendation statistics (for user dashboard)
   */
  static getRecommendationStats(): {
    totalArticlesViewed: number
    topCategory: string
    readingStreak: number
    preferredLanguage: string
  } {
    try {
      const history = (SecureStorage.getItem('reading_history') as string[]) || []
      const preferredLang = (SecureStorage.getItem('preferred_language') as string) || 'en'

      // Calculate top category
      const categoryCounts = history.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topCategory = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'general'

      // Calculate reading streak (days with at least one article view)
      const viewTimestamps = (SecureStorage.getItem('view_timestamps') as Record<string, string>) || {}
      const uniqueDays = new Set(
        Object.values(viewTimestamps).map(ts => new Date(ts).toDateString())
      )
      const readingStreak = uniqueDays.size

      return {
        totalArticlesViewed: history.length,
        topCategory,
        readingStreak,
        preferredLanguage: preferredLang,
      }
    } catch {
      return {
        totalArticlesViewed: 0,
        topCategory: 'general',
        readingStreak: 0,
        preferredLanguage: 'en',
      }
    }
  }
}
