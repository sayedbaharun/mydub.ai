/**
 * Personalization Service
 * Phase 3.1.2: AI-powered content recommendations
 */

import { supabase } from '@/shared/lib/supabase'
import { NewsArticle } from '@/features/news/types/news.types'
import { ProfileService } from '@/features/profiles/services/profile.service'

// =============================================================================
// Types
// =============================================================================

export interface PersonalizedFeedOptions {
  userId: string
  limit?: number
  offset?: number
  excludeRead?: boolean
}

export interface RecommendationScore {
  articleId: string
  score: number
  reasons: string[]
}

// =============================================================================
// Personalization Service
// =============================================================================

export class PersonalizationService {
  /**
   * Get personalized feed for user
   * Algorithm weights:
   * - Reading history: 40%
   * - Explicit preferences: 30%
   * - Location relevance: 20%
   * - Trending factor: 10%
   */
  static async getPersonalizedFeed(
    options: PersonalizedFeedOptions
  ): Promise<NewsArticle[]> {
    const { userId, limit = 20, offset = 0, excludeRead = false } = options

    try {
      // Get user profile and preferences
      const profile = await ProfileService.getProfile(userId)
      if (!profile) {
        // Fall back to latest articles if no profile
        return this.getLatestArticles(limit, offset)
      }

      // Get user's reading history
      const readingHistory = await ProfileService.getReadingHistory(userId, 100)
      const readArticleIds = readingHistory.map(h => h.articleId)

      // Get all published articles
      let query = supabase
        .from('news_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (excludeRead && readArticleIds.length > 0) {
        query = query.not('id', 'in', `(${readArticleIds.join(',')})`)
      }

      const { data: articles, error } = await query.limit(100) // Get more than needed for scoring

      if (error || !articles) {
        console.error('Error fetching articles for personalization:', error)
        return this.getLatestArticles(limit, offset)
      }

      // Score each article
      const scoredArticles = articles.map(article => ({
        article,
        ...this.scoreArticle(article, profile, readingHistory),
      }))

      // Sort by score and return top results
      return scoredArticles
        .sort((a, b) => b.score - a.score)
        .slice(offset, offset + limit)
        .map(scored => this.convertToNewsArticle(scored.article))
    } catch (error) {
      console.error('Error generating personalized feed:', error)
      return this.getLatestArticles(limit, offset)
    }
  }

  /**
   * Score an article for a user
   */
  private static scoreArticle(
    article: any,
    profile: any,
    readingHistory: any[]
  ): RecommendationScore {
    let score = 0
    const reasons: string[] = []

    // 1. Reading History Score (40% weight)
    const historyScore = this.calculateHistoryScore(article, readingHistory)
    score += historyScore * 0.4
    if (historyScore > 50) {
      reasons.push('Based on your reading history')
    }

    // 2. Preferences Score (30% weight)
    const prefScore = this.calculatePreferencesScore(article, profile)
    score += prefScore * 0.3
    if (prefScore > 50) {
      reasons.push('Matches your interests')
    }

    // 3. Location Score (20% weight)
    const locationScore = this.calculateLocationScore(article, profile)
    score += locationScore * 0.2
    if (locationScore > 50) {
      reasons.push('Local to your area')
    }

    // 4. Trending Score (10% weight)
    const trendingScore = this.calculateTrendingScore(article)
    score += trendingScore * 0.1
    if (trendingScore > 70) {
      reasons.push('Trending now')
    }

    // Apply time decay (prefer recent articles)
    const timeDecay = this.calculateTimeDecay(article.published_at)
    score *= timeDecay

    return {
      articleId: article.id,
      score: Math.round(score),
      reasons,
    }
  }

  /**
   * Calculate score based on reading history
   */
  private static calculateHistoryScore(article: any, readingHistory: any[]): number {
    if (readingHistory.length === 0) return 50 // Neutral score for new users

    // Count how many articles in same category user has read
    const categoryReads = readingHistory.filter(
      h => h.category === article.category
    ).length

    // Count articles with similar tags
    const articleTags = article.tags || []
    const tagMatches = readingHistory.filter(h => {
      const historyTags = h.tags || []
      return articleTags.some((tag: string) => historyTags.includes(tag))
    }).length

    // Calculate score (0-100)
    const categoryScore = Math.min((categoryReads / readingHistory.length) * 100, 70)
    const tagScore = Math.min((tagMatches / readingHistory.length) * 100, 30)

    return categoryScore + tagScore
  }

  /**
   * Calculate score based on user preferences
   */
  private static calculatePreferencesScore(article: any, profile: any): number {
    const preferences = profile.preferences || {}
    const preferredCategories = preferences.categories || []

    if (preferredCategories.length === 0) return 50 // Neutral if no preferences set

    // Check if article category matches preferences
    if (preferredCategories.includes(article.category)) {
      return 100
    }

    return 20 // Low score if not in preferred categories
  }

  /**
   * Calculate score based on location relevance
   */
  private static calculateLocationScore(article: any, profile: any): number {
    const userLocation = profile.location?.toLowerCase() || ''
    const articleContent = `${article.title} ${article.summary}`.toLowerCase()

    if (!userLocation) return 50 // Neutral if no location set

    // Check if user's neighborhood is mentioned in article
    if (articleContent.includes(userLocation)) {
      return 100
    }

    // Partial matches for related areas
    const locationKeywords = userLocation.split(' ')
    const matches = locationKeywords.filter(keyword =>
      articleContent.includes(keyword)
    ).length

    return matches > 0 ? 70 : 30
  }

  /**
   * Calculate trending score based on engagement metrics
   */
  private static calculateTrendingScore(article: any): number {
    // Use view count and comment count as engagement metrics
    const viewCount = article.view_count || 0
    const commentCount = article.comment_count || 0

    // Simple trending calculation
    const engagementScore = (viewCount * 0.7) + (commentCount * 0.3)

    // Normalize to 0-100
    return Math.min(engagementScore / 10, 100)
  }

  /**
   * Calculate time decay factor (prefer recent articles)
   */
  private static calculateTimeDecay(publishedAt: string): number {
    const now = new Date().getTime()
    const published = new Date(publishedAt).getTime()
    const hoursSincePublish = (now - published) / (1000 * 60 * 60)

    // Full score for articles < 6 hours old
    if (hoursSincePublish < 6) return 1.0

    // Decay gradually over 7 days
    if (hoursSincePublish < 168) {
      return 1.0 - (hoursSincePublish / 168) * 0.5 // 50% decay over 7 days
    }

    // Minimum 30% score for older articles
    return 0.3
  }

  /**
   * Get latest articles (fallback when personalization fails)
   */
  static async getLatestArticles(
    limit: number = 20,
    offset: number = 0
  ): Promise<NewsArticle[]> {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !data) {
      console.error('Error fetching latest articles:', error)
      return []
    }

    return data.map(article => this.convertToNewsArticle(article))
  }

  /**
   * Track user engagement for algorithm improvement
   */
  static async trackEngagement(
    userId: string,
    articleId: string,
    engagementType: 'view' | 'click' | 'share' | 'bookmark'
  ): Promise<void> {
    try {
      await supabase.from('user_engagement').insert({
        user_id: userId,
        article_id: articleId,
        engagement_type: engagementType,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  }

  /**
   * Update user preferences based on behavior
   */
  static async updatePreferencesFromBehavior(userId: string): Promise<void> {
    try {
      const readingHistory = await ProfileService.getReadingHistory(userId, 100)
      if (readingHistory.length < 10) return // Need minimum history

      // Analyze top categories
      const categoryCounts: Record<string, number> = {}
      readingHistory.forEach(entry => {
        const category = (entry as any).category
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1
        }
      })

      // Get top 5 categories
      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category]) => category)

      // Update preferences
      await ProfileService.updatePreferences(userId, {
        categories: topCategories,
      })
    } catch (error) {
      console.error('Error updating preferences from behavior:', error)
    }
  }

  /**
   * Convert database article to NewsArticle type
   */
  private static convertToNewsArticle(article: any): NewsArticle {
    return {
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      imageUrl: article.image_url,
      publishedAt: article.published_at,
      updatedAt: article.updated_at,
      status: article.status,
      aiGenerated: article.ai_generated || false,
      qualityScore: article.quality_score,
      viewCount: article.view_count || 0,
    }
  }
}
