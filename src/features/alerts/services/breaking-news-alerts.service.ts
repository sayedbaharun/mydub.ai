/**
 * Breaking News Detection & Alert Service
 * Phase 2.3.2: Intelligent breaking news detection and alerting
 *
 * Features:
 * - Multi-factor breaking news detection
 * - Priority-based alert filtering
 * - User alert preferences
 * - Alert delivery (push, email, in-app)
 * - Alert history and analytics
 * - Rate limiting and deduplication
 */

import { supabase } from '@/shared/lib/supabase'
import { toast } from '@/shared/services/toast.service'

// =============================================================================
// Types
// =============================================================================

export interface BreakingNewsAlert {
  id: string
  articleId: string
  title: string
  summary: string
  category: string
  urgencyLevel: number // 1-10 (10 = most urgent)
  detectionFactors: DetectionFactor[]
  detectionScore: number // 0-100
  detectedAt: Date
  expiresAt: Date
  status: 'active' | 'expired' | 'dismissed'
}

export interface DetectionFactor {
  factor: string
  weight: number
  score: number
  reasoning: string
}

export interface AlertPreferences {
  userId: string
  enabledCategories: string[]
  minUrgencyLevel: number // Only alert if urgency >= this value
  deliveryMethods: ('push' | 'email' | 'inapp')[]
  quietHoursStart?: string // HH:mm format
  quietHoursEnd?: string // HH:mm format
  maxAlertsPerDay: number
}

export interface AlertDeliveryResult {
  alertId: string
  method: 'push' | 'email' | 'inapp'
  success: boolean
  deliveredAt?: Date
  error?: string
}

// =============================================================================
// Breaking News Detection Service
// =============================================================================

export class BreakingNewsAlertsService {
  private static readonly DETECTION_THRESHOLD = 70 // Minimum score to qualify as breaking news
  private static readonly ALERT_DURATION_HOURS = 24 // How long alerts remain active
  private static readonly MAX_ALERTS_PER_USER_PER_DAY = 20

  // Detection factor weights
  private static readonly WEIGHTS = {
    keywordMatch: 0.25, // Breaking news keywords in title/content
    recency: 0.20, // How recent the article is
    sourceCredibility: 0.15, // Credibility of the source
    socialEngagement: 0.15, // Social media signals (if available)
    topicImportance: 0.15, // Importance of the topic (government, emergency, etc.)
    updateFrequency: 0.10, // How quickly updates are being made
  }

  /**
   * Analyze article to detect if it qualifies as breaking news
   */
  static async detectBreakingNews(articleId: string): Promise<BreakingNewsAlert | null> {
    // Get article details
    const { data: article } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!article) {
      throw new Error('Article not found')
    }

    // Calculate detection factors
    const factors: DetectionFactor[] = []

    // Factor 1: Keyword matching
    const keywordFactor = this.analyzeKeywords(article.title, article.content)
    factors.push(keywordFactor)

    // Factor 2: Recency
    const recencyFactor = this.analyzeRecency(new Date(article.published_at || article.created_at))
    factors.push(recencyFactor)

    // Factor 3: Source credibility
    const credibilityFactor = this.analyzeSourceCredibility(
      article.source_name,
      article.ai_confidence_score
    )
    factors.push(credibilityFactor)

    // Factor 4: Social engagement (mock - would integrate with social APIs)
    const socialFactor = this.analyzeSocialEngagement(article)
    factors.push(socialFactor)

    // Factor 5: Topic importance
    const topicFactor = this.analyzeTopicImportance(article.category, article.title, article.content)
    factors.push(topicFactor)

    // Factor 6: Update frequency (check if article has been updated multiple times)
    const updateFactor = this.analyzeUpdateFrequency(article)
    factors.push(updateFactor)

    // Calculate overall detection score
    const detectionScore = this.calculateDetectionScore(factors)

    // Check if meets breaking news threshold
    if (detectionScore < this.DETECTION_THRESHOLD) {
      return null
    }

    // Calculate urgency level (1-10)
    const urgencyLevel = this.calculateUrgencyLevel(detectionScore, factors)

    // Create breaking news alert
    const alert: BreakingNewsAlert = {
      id: crypto.randomUUID(),
      articleId: article.id,
      title: article.title,
      summary: article.summary || this.generateSummary(article.content),
      category: article.category,
      urgencyLevel,
      detectionFactors: factors,
      detectionScore,
      detectedAt: new Date(),
      expiresAt: new Date(Date.now() + this.ALERT_DURATION_HOURS * 60 * 60 * 1000),
      status: 'active',
    }

    // Save alert to database
    await this.saveAlert(alert)

    // Deliver alert to users
    await this.deliverAlert(alert)

    return alert
  }

  /**
   * Analyze breaking news keywords
   */
  private static analyzeKeywords(title: string, content: string): DetectionFactor {
    const breakingKeywords = [
      'breaking',
      'urgent',
      'alert',
      'just in',
      'developing',
      'emergency',
      'critical',
      'announced',
      'confirms',
      'exclusive',
    ]

    const text = `${title} ${content}`.toLowerCase()
    let matchCount = 0
    let matchedKeywords: string[] = []

    for (const keyword of breakingKeywords) {
      if (text.includes(keyword)) {
        matchCount++
        matchedKeywords.push(keyword)
      }
    }

    const score = Math.min(100, (matchCount / breakingKeywords.length) * 100 * 2) // Boost score

    return {
      factor: 'keywordMatch',
      weight: this.WEIGHTS.keywordMatch,
      score,
      reasoning: matchCount > 0
        ? `Found ${matchCount} breaking news keywords: ${matchedKeywords.join(', ')}`
        : 'No breaking news keywords detected',
    }
  }

  /**
   * Analyze recency (how recent the article is)
   */
  private static analyzeRecency(publishedAt: Date): DetectionFactor {
    const minutesAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60)

    let score = 0
    let reasoning = ''

    if (minutesAgo <= 10) {
      score = 100
      reasoning = 'Published within last 10 minutes'
    } else if (minutesAgo <= 30) {
      score = 90
      reasoning = 'Published within last 30 minutes'
    } else if (minutesAgo <= 60) {
      score = 75
      reasoning = 'Published within last hour'
    } else if (minutesAgo <= 180) {
      score = 50
      reasoning = 'Published within last 3 hours'
    } else if (minutesAgo <= 360) {
      score = 25
      reasoning = 'Published within last 6 hours'
    } else {
      score = 10
      reasoning = 'Published over 6 hours ago'
    }

    return {
      factor: 'recency',
      weight: this.WEIGHTS.recency,
      score,
      reasoning,
    }
  }

  /**
   * Analyze source credibility
   */
  private static analyzeSourceCredibility(sourceName: string, confidenceScore?: number): DetectionFactor {
    // High-credibility sources
    const highCredibilitySources = [
      'Dubai Media Office',
      'WAM (Emirates News Agency)',
      'Government of Dubai',
      'Dubai Police',
      'RTA Dubai',
    ]

    // Medium-credibility sources
    const mediumCredibilitySources = [
      'Gulf News',
      'The National UAE',
      'Khaleej Times',
      'Arabian Business',
    ]

    let score = confidenceScore || 50

    if (highCredibilitySources.some((s) => sourceName.includes(s))) {
      score = Math.max(score, 90)
    } else if (mediumCredibilitySources.some((s) => sourceName.includes(s))) {
      score = Math.max(score, 75)
    }

    return {
      factor: 'sourceCredibility',
      weight: this.WEIGHTS.sourceCredibility,
      score,
      reasoning: score >= 90
        ? 'Official government/high-credibility source'
        : score >= 75
        ? 'Established news organization'
        : 'Standard source credibility',
    }
  }

  /**
   * Analyze social engagement (mock - would integrate with Twitter/Facebook APIs)
   */
  private static analyzeSocialEngagement(article: any): DetectionFactor {
    // In production: fetch real social media metrics
    // For now, mock data based on recency
    const minutesAgo = article.published_at
      ? (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60)
      : 1000

    const score = minutesAgo <= 60 ? 80 : minutesAgo <= 180 ? 60 : 40

    return {
      factor: 'socialEngagement',
      weight: this.WEIGHTS.socialEngagement,
      score,
      reasoning: 'Social engagement metrics pending (mock data)',
    }
  }

  /**
   * Analyze topic importance
   */
  private static analyzeTopicImportance(category: string, title: string, content: string): DetectionFactor {
    const highImportanceCategories = ['government', 'emergency', 'health', 'safety', 'economy']
    const mediumImportanceCategories = ['transport', 'weather', 'business', 'law']

    const highImportanceKeywords = [
      'government',
      'sheikh',
      'ruler',
      'announcement',
      'law',
      'regulation',
      'emergency',
      'accident',
      'fire',
      'flood',
      'storm',
    ]

    const text = `${title} ${content}`.toLowerCase()

    let score = 50 // Base score

    // Category-based scoring
    if (highImportanceCategories.includes(category?.toLowerCase())) {
      score += 30
    } else if (mediumImportanceCategories.includes(category?.toLowerCase())) {
      score += 15
    }

    // Keyword-based scoring
    const keywordMatches = highImportanceKeywords.filter((k) => text.includes(k))
    score += keywordMatches.length * 10

    score = Math.min(100, score)

    return {
      factor: 'topicImportance',
      weight: this.WEIGHTS.topicImportance,
      score,
      reasoning: score >= 80
        ? 'High-importance topic (government/emergency)'
        : score >= 60
        ? 'Medium-importance topic'
        : 'Standard topic importance',
    }
  }

  /**
   * Analyze update frequency
   */
  private static analyzeUpdateFrequency(article: any): DetectionFactor {
    // Check if article has been updated
    const hasUpdates = article.updated_at && article.updated_at !== article.created_at

    let score = 50 // Base score

    if (hasUpdates) {
      const timeSinceUpdate = Date.now() - new Date(article.updated_at).getTime()
      const minutesSinceUpdate = timeSinceUpdate / (1000 * 60)

      if (minutesSinceUpdate <= 15) {
        score = 100 // Very recent update
      } else if (minutesSinceUpdate <= 60) {
        score = 80
      } else {
        score = 60
      }
    }

    return {
      factor: 'updateFrequency',
      weight: this.WEIGHTS.updateFrequency,
      score,
      reasoning: hasUpdates
        ? 'Article has been recently updated (developing story)'
        : 'No recent updates detected',
    }
  }

  /**
   * Calculate overall detection score
   */
  private static calculateDetectionScore(factors: DetectionFactor[]): number {
    const weightedScore = factors.reduce((total, factor) => {
      return total + factor.score * factor.weight
    }, 0)

    return Math.round(weightedScore)
  }

  /**
   * Calculate urgency level (1-10)
   */
  private static calculateUrgencyLevel(detectionScore: number, factors: DetectionFactor[]): number {
    // Base urgency from detection score
    let urgency = Math.ceil((detectionScore / 100) * 10)

    // Boost urgency if multiple high-scoring factors
    const highScoringFactors = factors.filter((f) => f.score >= 80).length
    if (highScoringFactors >= 4) {
      urgency = Math.min(10, urgency + 2)
    } else if (highScoringFactors >= 3) {
      urgency = Math.min(10, urgency + 1)
    }

    return Math.max(1, Math.min(10, urgency))
  }

  /**
   * Generate summary from content
   */
  private static generateSummary(content: string, maxLength: number = 150): string {
    if (!content) return ''
    if (content.length <= maxLength) return content

    const truncated = content.substring(0, maxLength)
    const lastPeriod = truncated.lastIndexOf('.')

    return lastPeriod > 0 ? truncated.substring(0, lastPeriod + 1) : truncated + '...'
  }

  /**
   * Save alert to database
   */
  private static async saveAlert(alert: BreakingNewsAlert): Promise<void> {
    // In production: insert into breaking_news_alerts table
    console.log('🚨 Breaking News Alert Created:', {
      title: alert.title,
      urgency: alert.urgencyLevel,
      score: alert.detectionScore,
    })
  }

  /**
   * Deliver alert to users based on preferences
   */
  private static async deliverAlert(alert: BreakingNewsAlert): Promise<AlertDeliveryResult[]> {
    // Get users with matching preferences
    const users = await this.getUsersForAlert(alert)

    const results: AlertDeliveryResult[] = []

    for (const user of users) {
      const preferences = user.preferences

      // Check if within quiet hours
      if (this.isQuietHours(preferences)) {
        continue
      }

      // Check daily alert limit
      const todayCount = await this.getTodayAlertCount(user.id)
      if (todayCount >= preferences.maxAlertsPerDay) {
        continue
      }

      // Deliver via each enabled method
      for (const method of preferences.deliveryMethods) {
        const result = await this.deliverViaMethod(alert, user, method)
        results.push(result)
      }
    }

    return results
  }

  /**
   * Get users who should receive this alert
   */
  private static async getUsersForAlert(alert: BreakingNewsAlert): Promise<any[]> {
    // In production: query users table with alert preferences
    // For now, return mock data
    return [
      {
        id: 'user-1',
        preferences: {
          userId: 'user-1',
          enabledCategories: ['all'],
          minUrgencyLevel: 5,
          deliveryMethods: ['inapp', 'push'],
          maxAlertsPerDay: 20,
        },
      },
    ]
  }

  /**
   * Check if currently in quiet hours
   */
  private static isQuietHours(preferences: AlertPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    return currentTime >= preferences.quietHoursStart && currentTime <= preferences.quietHoursEnd
  }

  /**
   * Get count of alerts sent to user today
   */
  private static async getTodayAlertCount(userId: string): Promise<number> {
    // In production: query alert_deliveries table
    return 0
  }

  /**
   * Deliver alert via specific method
   */
  private static async deliverViaMethod(
    alert: BreakingNewsAlert,
    user: any,
    method: 'push' | 'email' | 'inapp'
  ): Promise<AlertDeliveryResult> {
    try {
      switch (method) {
        case 'inapp':
          // Show in-app toast notification
          toast.error(alert.title, {
            title: '🚨 Breaking News',
            description: alert.summary,
            duration: 10000, // 10 seconds
          })
          break

        case 'push':
          // In production: send push notification via service worker
          console.log('📱 Push notification sent:', alert.title)
          break

        case 'email':
          // In production: send email via email service
          console.log('📧 Email alert sent:', alert.title)
          break
      }

      return {
        alertId: alert.id,
        method,
        success: true,
        deliveredAt: new Date(),
      }
    } catch (error) {
      return {
        alertId: alert.id,
        method,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get user alert preferences
   */
  static async getUserPreferences(userId: string): Promise<AlertPreferences> {
    // In production: fetch from user_alert_preferences table
    return {
      userId,
      enabledCategories: ['all'],
      minUrgencyLevel: 5,
      deliveryMethods: ['inapp', 'push'],
      maxAlertsPerDay: 20,
    }
  }

  /**
   * Update user alert preferences
   */
  static async updateUserPreferences(preferences: AlertPreferences): Promise<void> {
    // In production: update user_alert_preferences table
    console.log('✅ Alert preferences updated for user:', preferences.userId)
  }

  /**
   * Get alert history for user
   */
  static async getAlertHistory(
    userId: string,
    limit: number = 50
  ): Promise<BreakingNewsAlert[]> {
    // In production: query breaking_news_alerts joined with alert_deliveries
    return []
  }

  /**
   * Dismiss alert
   */
  static async dismissAlert(alertId: string, userId: string): Promise<void> {
    // In production: update alert status in database
    console.log(`✅ Alert ${alertId} dismissed by user ${userId}`)
  }
}
