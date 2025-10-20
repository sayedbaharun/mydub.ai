/**
 * Content Flagging Service
 * Phase 3.6.1: User-reported content with AI pre-screening
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export type FlagType =
  | 'misinformation'
  | 'spam'
  | 'hate_speech'
  | 'harassment'
  | 'inappropriate'
  | 'duplicate'
  | 'off_topic'
  | 'other'

export type FlagSeverity = 'low' | 'medium' | 'high' | 'critical'
export type FlagStatus = 'pending' | 'approved' | 'rejected' | 'auto_resolved'

export interface ContentFlag {
  id: string
  articleId: string | null
  commentId: string | null
  reporterId: string | null
  flagType: FlagType
  reason: string
  severity: FlagSeverity
  status: FlagStatus
  aiConfidence: number | null
  aiAnalysis: any | null
  reviewedBy: string | null
  reviewedAt: Date | null
  resolutionNotes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FlagStatistics {
  id: string
  contentType: 'article' | 'comment'
  contentId: string
  totalFlags: number
  uniqueReporters: number
  misinformationCount: number
  spamCount: number
  hateSpeechCount: number
  harassmentCount: number
  inappropriateCount: number
  autoHidden: boolean
  autoHiddenAt: Date | null
  updatedAt: Date
}

export interface PendingFlag {
  flagId: string
  contentType: 'article' | 'comment'
  contentId: string
  flagType: FlagType
  severity: FlagSeverity
  reporterCount: number
  aiConfidence: number | null
  createdAt: Date
}

// =============================================================================
// Flagging Service
// =============================================================================

export class FlaggingService {
  /**
   * Report article for moderation
   */
  static async flagArticle(
    articleId: string,
    flagType: FlagType,
    reason: string
  ): Promise<ContentFlag | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user can flag (rate limiting)
      const canFlag = await this.canUserFlag(user.id, articleId, null)
      if (!canFlag) {
        throw new Error('You have already flagged this content or exceeded the rate limit')
      }

      // AI pre-screening
      const { aiConfidence, aiAnalysis, severity } = await this.aiPreScreen(
        flagType,
        reason,
        'article',
        articleId
      )

      const { data, error } = await supabase
        .from('content_flags')
        .insert({
          article_id: articleId,
          reporter_id: user.id,
          flag_type: flagType,
          reason,
          severity,
          ai_confidence: aiConfidence,
          ai_analysis: aiAnalysis,
        })
        .select()
        .single()

      if (error) throw error

      return this.mapFlag(data)
    } catch (error) {
      console.error('Error flagging article:', error)
      throw error
    }
  }

  /**
   * Report comment for moderation
   */
  static async flagComment(
    commentId: string,
    flagType: FlagType,
    reason: string
  ): Promise<ContentFlag | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user can flag (rate limiting)
      const canFlag = await this.canUserFlag(user.id, null, commentId)
      if (!canFlag) {
        throw new Error('You have already flagged this content or exceeded the rate limit')
      }

      // AI pre-screening
      const { aiConfidence, aiAnalysis, severity } = await this.aiPreScreen(
        flagType,
        reason,
        'comment',
        commentId
      )

      const { data, error } = await supabase
        .from('content_flags')
        .insert({
          comment_id: commentId,
          reporter_id: user.id,
          flag_type: flagType,
          reason,
          severity,
          ai_confidence: aiConfidence,
          ai_analysis: aiAnalysis,
        })
        .select()
        .single()

      if (error) throw error

      return this.mapFlag(data)
    } catch (error) {
      console.error('Error flagging comment:', error)
      throw error
    }
  }

  /**
   * AI pre-screening of flag
   */
  private static async aiPreScreen(
    flagType: FlagType,
    reason: string,
    contentType: 'article' | 'comment',
    contentId: string
  ): Promise<{ aiConfidence: number; aiAnalysis: any; severity: FlagSeverity }> {
    try {
      // Get content text
      let contentText = ''
      if (contentType === 'article') {
        const { data } = await supabase
          .from('news_articles')
          .select('title, content')
          .eq('id', contentId)
          .single()
        if (data) {
          contentText = `${data.title}\n${data.content}`
        }
      } else {
        const { data } = await supabase
          .from('comments')
          .select('content')
          .eq('id', contentId)
          .single()
        if (data) {
          contentText = data.content
        }
      }

      // Simple keyword-based AI pre-screening
      const analysis = this.simpleAIAnalysis(flagType, reason, contentText)

      return {
        aiConfidence: analysis.confidence,
        aiAnalysis: analysis,
        severity: analysis.severity,
      }
    } catch (error) {
      console.error('Error in AI pre-screening:', error)
      // Return default values on error
      return {
        aiConfidence: 0.5,
        aiAnalysis: { error: 'AI analysis failed' },
        severity: 'medium',
      }
    }
  }

  /**
   * Simple keyword-based AI analysis
   * TODO: Replace with actual AI/ML model in production
   */
  private static simpleAIAnalysis(
    flagType: FlagType,
    reason: string,
    contentText: string
  ): { confidence: number; severity: FlagSeverity; keywords: string[] } {
    const lowerContent = contentText.toLowerCase()
    const lowerReason = reason.toLowerCase()

    // Keyword patterns for different flag types
    const patterns: Record<FlagType, string[]> = {
      misinformation: ['false', 'fake', 'hoax', 'misleading', 'debunked'],
      spam: ['click here', 'buy now', 'limited time', 'act fast', 'free money'],
      hate_speech: ['hate', 'racist', 'discriminat', 'slur'],
      harassment: ['threat', 'bully', 'attack', 'harass'],
      inappropriate: ['explicit', 'nsfw', 'graphic'],
      duplicate: ['repost', 'duplicate', 'already posted'],
      off_topic: ['unrelated', 'off topic', 'irrelevant'],
      other: [],
    }

    const keywords = patterns[flagType] || []
    let matchCount = 0

    // Count keyword matches in content
    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        matchCount++
      }
    })

    // Check reason for additional context
    keywords.forEach(keyword => {
      if (lowerReason.includes(keyword)) {
        matchCount++
      }
    })

    // Calculate confidence (0.0 to 1.0)
    const baseConfidence = 0.5
    const keywordBoost = Math.min(matchCount * 0.15, 0.4)
    const confidence = Math.min(baseConfidence + keywordBoost, 1.0)

    // Determine severity
    let severity: FlagSeverity = 'medium'
    if (flagType === 'hate_speech' || flagType === 'harassment') {
      severity = confidence > 0.7 ? 'critical' : 'high'
    } else if (flagType === 'misinformation') {
      severity = confidence > 0.8 ? 'high' : 'medium'
    } else if (flagType === 'spam' || flagType === 'duplicate') {
      severity = 'low'
    }

    return {
      confidence: Number(confidence.toFixed(2)),
      severity,
      keywords: keywords.filter(k => lowerContent.includes(k) || lowerReason.includes(k)),
    }
  }

  /**
   * Check if user can flag content
   */
  private static async canUserFlag(
    userId: string,
    articleId: string | null,
    commentId: string | null
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_user_flag_content', {
        p_user_id: userId,
        p_article_id: articleId,
        p_comment_id: commentId,
      })

      if (error) throw error
      return data as boolean
    } catch (error) {
      console.error('Error checking flag eligibility:', error)
      return false
    }
  }

  /**
   * Get flag statistics for content
   */
  static async getFlagStatistics(
    contentType: 'article' | 'comment',
    contentId: string
  ): Promise<FlagStatistics | null> {
    try {
      const { data, error } = await supabase
        .from('flag_statistics')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        id: data.id,
        contentType: data.content_type as 'article' | 'comment',
        contentId: data.content_id,
        totalFlags: data.total_flags,
        uniqueReporters: data.unique_reporters,
        misinformationCount: data.misinformation_count,
        spamCount: data.spam_count,
        hateSpeechCount: data.hate_speech_count,
        harassmentCount: data.harassment_count,
        inappropriateCount: data.inappropriate_count,
        autoHidden: data.auto_hidden,
        autoHiddenAt: data.auto_hidden_at ? new Date(data.auto_hidden_at) : null,
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error('Error fetching flag statistics:', error)
      return null
    }
  }

  /**
   * Get pending flags for moderation (admin/moderator only)
   */
  static async getPendingFlags(limit: number = 50): Promise<PendingFlag[]> {
    try {
      const { data, error } = await supabase.rpc('get_pending_flags', {
        p_limit: limit,
      })

      if (error) throw error
      if (!data) return []

      return data.map((flag: any) => ({
        flagId: flag.flag_id,
        contentType: flag.content_type as 'article' | 'comment',
        contentId: flag.content_id,
        flagType: flag.flag_type as FlagType,
        severity: flag.severity as FlagSeverity,
        reporterCount: flag.reporter_count,
        aiConfidence: flag.ai_confidence,
        createdAt: new Date(flag.created_at),
      }))
    } catch (error) {
      console.error('Error fetching pending flags:', error)
      return []
    }
  }

  /**
   * Approve flag (moderator action)
   */
  static async approveFlag(
    flagId: string,
    resolutionNotes?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.rpc('approve_flag', {
        p_flag_id: flagId,
        p_moderator_id: user.id,
        p_resolution_notes: resolutionNotes || null,
      })
    } catch (error) {
      console.error('Error approving flag:', error)
      throw error
    }
  }

  /**
   * Reject flag (moderator action)
   */
  static async rejectFlag(
    flagId: string,
    resolutionNotes?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.rpc('reject_flag', {
        p_flag_id: flagId,
        p_moderator_id: user.id,
        p_resolution_notes: resolutionNotes || null,
      })
    } catch (error) {
      console.error('Error rejecting flag:', error)
      throw error
    }
  }

  /**
   * Map database flag to ContentFlag
   */
  private static mapFlag(data: any): ContentFlag {
    return {
      id: data.id,
      articleId: data.article_id,
      commentId: data.comment_id,
      reporterId: data.reporter_id,
      flagType: data.flag_type as FlagType,
      reason: data.reason,
      severity: data.severity as FlagSeverity,
      status: data.status as FlagStatus,
      aiConfidence: data.ai_confidence,
      aiAnalysis: data.ai_analysis,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : null,
      resolutionNotes: data.resolution_notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}
