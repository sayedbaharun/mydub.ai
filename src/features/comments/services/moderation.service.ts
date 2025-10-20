/**
 * Comment Moderation Service
 * Phase 3.2.2: Auto-moderation, spam detection, and moderator tools
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface ModerationRule {
  id: string
  ruleType: 'profanity' | 'spam' | 'external_link' | 'rate_limit'
  severity: 'low' | 'medium' | 'high'
  action: 'flag' | 'hold' | 'auto_reject'
  enabled: boolean
}

export interface ModerationQueue {
  id: string
  commentId: string
  userId: string
  articleId: string
  content: string
  flagReason: string
  flaggedBy: string[]
  flagCount: number
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: string | null
  reviewedAt: Date | null
  createdAt: Date
}

export interface UserTrustScore {
  userId: string
  score: number // 0-100
  commentCount: number
  flaggedCount: number
  approvedCount: number
  lastFlagDate: Date | null
}

// =============================================================================
// Profanity and Spam Lists
// =============================================================================

const PROFANITY_LIST = [
  // Common profanity patterns (replace with actual list in production)
  'badword1', 'badword2', // Placeholder - use real profanity filter lib
]

const SPAM_KEYWORDS = [
  'buy now',
  'click here',
  'free money',
  'limited offer',
  'act now',
  'guaranteed',
  'earn money fast',
  'work from home',
  'weight loss',
]

const EXTERNAL_LINK_PATTERN = /https?:\/\/(?!mydub\.ai)/gi

// =============================================================================
// Moderation Service
// =============================================================================

export class ModerationService {
  /**
   * Check comment content for violations
   */
  static async checkComment(content: string, userId: string): Promise<{
    shouldFlag: boolean
    shouldHold: boolean
    shouldReject: boolean
    reasons: string[]
  }> {
    const reasons: string[] = []
    let shouldFlag = false
    let shouldHold = false
    let shouldReject = false

    // 1. Check profanity
    const hasProfanity = this.containsProfanity(content)
    if (hasProfanity) {
      reasons.push('Contains profanity')
      shouldFlag = true
    }

    // 2. Check spam keywords
    const hasSpam = this.containsSpam(content)
    if (hasSpam) {
      reasons.push('Contains spam keywords')
      shouldFlag = true
    }

    // 3. Check external links
    const hasExternalLinks = EXTERNAL_LINK_PATTERN.test(content)
    if (hasExternalLinks) {
      reasons.push('Contains external links')
      shouldFlag = true
    }

    // 4. Check user trust score
    const trustScore = await this.getUserTrustScore(userId)
    if (trustScore.score < 50) {
      reasons.push('Low trust score - requires review')
      shouldHold = true
    }

    // 5. Check rate limiting
    const isRateLimited = await this.checkRateLimit(userId)
    if (isRateLimited) {
      reasons.push('Rate limit exceeded (max 5 comments per minute)')
      shouldReject = true
    }

    return {
      shouldFlag,
      shouldHold,
      shouldReject,
      reasons,
    }
  }

  /**
   * Check for profanity
   */
  private static containsProfanity(content: string): boolean {
    const lowerContent = content.toLowerCase()
    return PROFANITY_LIST.some(word => lowerContent.includes(word))
  }

  /**
   * Check for spam keywords
   */
  private static containsSpam(content: string): boolean {
    const lowerContent = content.toLowerCase()
    return SPAM_KEYWORDS.some(keyword => lowerContent.includes(keyword))
  }

  /**
   * Get user's trust score
   */
  static async getUserTrustScore(userId: string): Promise<UserTrustScore> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('created_at')
        .eq('user_id', userId)
        .single()

      // Get comment stats
      const { data: comments } = await supabase
        .from('comments')
        .select('id, is_flagged, is_approved')
        .eq('user_id', userId)

      if (!comments) {
        return {
          userId,
          score: 50, // Default score for new users
          commentCount: 0,
          flaggedCount: 0,
          approvedCount: 0,
          lastFlagDate: null,
        }
      }

      const commentCount = comments.length
      const flaggedCount = comments.filter(c => c.is_flagged).length
      const approvedCount = comments.filter(c => c.is_approved).length

      // Calculate trust score
      // Start at 50, +5 for each approved comment, -10 for each flag
      let score = 50
      score += approvedCount * 5
      score -= flaggedCount * 10

      // Account age bonus (max +20 points for 6+ months)
      if (profile?.created_at) {
        const accountAge = Date.now() - new Date(profile.created_at).getTime()
        const monthsOld = accountAge / (1000 * 60 * 60 * 24 * 30)
        score += Math.min(monthsOld * 3.33, 20)
      }

      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score))

      return {
        userId,
        score: Math.round(score),
        commentCount,
        flaggedCount,
        approvedCount,
        lastFlagDate: null,
      }
    } catch (error) {
      console.error('Error getting trust score:', error)
      return {
        userId,
        score: 50,
        commentCount: 0,
        flaggedCount: 0,
        approvedCount: 0,
        lastFlagDate: null,
      }
    }
  }

  /**
   * Check if user is rate limited
   */
  private static async checkRateLimit(userId: string): Promise<boolean> {
    try {
      // Check comments in last minute
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()

      const { data, error } = await supabase
        .from('comments')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', oneMinuteAgo)

      if (error) throw error

      return (data?.length || 0) >= 5
    } catch (error) {
      console.error('Error checking rate limit:', error)
      return false
    }
  }

  /**
   * Get moderation queue
   */
  static async getModerationQueue(): Promise<ModerationQueue[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          news_articles!inner(title)
        `)
        .or('is_flagged.eq.true,is_approved.eq.false')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      if (!data) return []

      return data.map(item => ({
        id: item.id,
        commentId: item.id,
        userId: item.user_id,
        articleId: item.article_id,
        content: item.content,
        flagReason: item.is_flagged ? 'Community flagged' : 'Pending review',
        flaggedBy: [],
        flagCount: item.is_flagged ? 1 : 0,
        status: item.is_approved ? 'approved' : 'pending',
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date(item.created_at),
      }))
    } catch (error) {
      console.error('Error fetching moderation queue:', error)
      return []
    }
  }

  /**
   * Approve comment
   */
  static async approveComment(commentId: string, moderatorId: string): Promise<void> {
    try {
      await supabase
        .from('comments')
        .update({
          is_approved: true,
          is_flagged: false,
        })
        .eq('id', commentId)
    } catch (error) {
      console.error('Error approving comment:', error)
      throw error
    }
  }

  /**
   * Reject comment
   */
  static async rejectComment(commentId: string, moderatorId: string): Promise<void> {
    try {
      await supabase
        .from('comments')
        .update({
          is_deleted: true,
          is_approved: false,
          content: '[removed by moderator]',
        })
        .eq('id', commentId)
    } catch (error) {
      console.error('Error rejecting comment:', error)
      throw error
    }
  }

  /**
   * Shadow ban user
   */
  static async shadowBanUser(userId: string): Promise<void> {
    try {
      // Mark all future comments as needing approval
      await supabase
        .from('user_profiles')
        .update({
          preferences: {
            shadow_banned: true,
          },
        })
        .eq('user_id', userId)

      // Flag all existing comments
      await supabase
        .from('comments')
        .update({
          is_approved: false,
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error shadow banning user:', error)
      throw error
    }
  }

  /**
   * Get moderation stats
   */
  static async getModerationStats(): Promise<{
    pendingReview: number
    flaggedComments: number
    averageReviewTime: number
    autoRejected24h: number
  }> {
    try {
      const { data: pending } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('is_approved', false)

      const { data: flagged } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('is_flagged', true)

      return {
        pendingReview: pending?.length || 0,
        flaggedComments: flagged?.length || 0,
        averageReviewTime: 0, // TODO: Calculate from moderation logs
        autoRejected24h: 0, // TODO: Track auto-rejections
      }
    } catch (error) {
      console.error('Error getting moderation stats:', error)
      return {
        pendingReview: 0,
        flaggedComments: 0,
        averageReviewTime: 0,
        autoRejected24h: 0,
      }
    }
  }
}
