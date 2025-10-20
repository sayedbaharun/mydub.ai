/**
 * Social Sharing Service
 * Phase 3.3.1: One-click sharing to multiple platforms
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export type SharePlatform =
  | 'whatsapp'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'email'
  | 'copy'
  | 'native'

export interface ShareStats {
  articleId: string
  totalShares: number
  platformBreakdown: Record<SharePlatform, number>
  topReferrers: Array<{
    userId: string
    shareCount: number
    conversions: number
  }>
}

// =============================================================================
// Sharing Service
// =============================================================================

export class SharingService {
  /**
   * Share to WhatsApp (critical for Dubai market)
   */
  static async shareToWhatsApp(articleId: string, title: string, url: string): Promise<void> {
    const message = `📰 ${title}\n\nRead on MyDub.AI: ${url}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`

    await this.trackShare(articleId, 'whatsapp')
    window.open(whatsappUrl, '_blank')
  }

  /**
   * Share to Twitter/X
   */
  static async shareToTwitter(articleId: string, title: string, url: string): Promise<void> {
    const text = `${title}\n\n#Dubai #MyDubAI`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`

    await this.trackShare(articleId, 'twitter')
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  /**
   * Share to Facebook
   */
  static async shareToFacebook(articleId: string, url: string): Promise<void> {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

    await this.trackShare(articleId, 'facebook')
    window.open(facebookUrl, '_blank', 'width=550,height=420')
  }

  /**
   * Share to LinkedIn (professional tone)
   */
  static async shareToLinkedIn(articleId: string, title: string, url: string, summary?: string): Promise<void> {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

    await this.trackShare(articleId, 'linkedin')
    window.open(linkedInUrl, '_blank', 'width=550,height=420')
  }

  /**
   * Share via Email
   */
  static async shareViaEmail(articleId: string, title: string, url: string, summary?: string): Promise<void> {
    const subject = encodeURIComponent(`Check out: ${title}`)
    const body = encodeURIComponent(`I thought you might find this interesting:\n\n${title}\n\n${summary || ''}\n\nRead more: ${url}\n\nShared via MyDub.AI`)
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`

    await this.trackShare(articleId, 'email')
    window.location.href = mailtoUrl
  }

  /**
   * Copy link to clipboard
   */
  static async copyLink(articleId: string, url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url)
      await this.trackShare(articleId, 'copy')
      return true
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      return false
    }
  }

  /**
   * Native share (mobile)
   */
  static async nativeShare(articleId: string, title: string, url: string, text?: string): Promise<void> {
    if (!navigator.share) {
      throw new Error('Native share not supported')
    }

    try {
      await navigator.share({
        title,
        text: text || `Check out this article on MyDub.AI`,
        url,
      })

      await this.trackShare(articleId, 'native')
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error)
        throw error
      }
    }
  }

  /**
   * Track share event
   */
  private static async trackShare(articleId: string, platform: SharePlatform): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('article_shares').insert({
        article_id: articleId,
        user_id: user?.id || null,
        platform,
        created_at: new Date().toISOString(),
      })

      // Increment article share count
      await supabase.rpc('increment_share_count', {
        article_id: articleId,
      })
    } catch (error) {
      console.error('Error tracking share:', error)
      // Don't throw - sharing should work even if tracking fails
    }
  }

  /**
   * Get share analytics for an article
   */
  static async getShareAnalytics(articleId: string): Promise<ShareStats> {
    try {
      const { data, error } = await supabase
        .from('article_shares')
        .select('platform, user_id')
        .eq('article_id', articleId)

      if (error) throw error
      if (!data) {
        return {
          articleId,
          totalShares: 0,
          platformBreakdown: {} as Record<SharePlatform, number>,
          topReferrers: [],
        }
      }

      // Calculate platform breakdown
      const platformBreakdown = data.reduce((acc, share) => {
        acc[share.platform as SharePlatform] = (acc[share.platform as SharePlatform] || 0) + 1
        return acc
      }, {} as Record<SharePlatform, number>)

      // Calculate top referrers
      const userShares = data.reduce((acc, share) => {
        if (share.user_id) {
          acc[share.user_id] = (acc[share.user_id] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      const topReferrers = Object.entries(userShares)
        .map(([userId, shareCount]) => ({
          userId,
          shareCount,
          conversions: 0, // TODO: Track conversions from shared links
        }))
        .sort((a, b) => b.shareCount - a.shareCount)
        .slice(0, 10)

      return {
        articleId,
        totalShares: data.length,
        platformBreakdown,
        topReferrers,
      }
    } catch (error) {
      console.error('Error fetching share analytics:', error)
      return {
        articleId,
        totalShares: 0,
        platformBreakdown: {} as Record<SharePlatform, number>,
        topReferrers: [],
      }
    }
  }

  /**
   * Get user's sharing activity
   */
  static async getUserSharingActivity(userId: string): Promise<{
    totalShares: number
    sharesByPlatform: Record<SharePlatform, number>
    recentShares: Array<{
      articleId: string
      articleTitle: string
      platform: SharePlatform
      sharedAt: Date
    }>
  }> {
    try {
      const { data, error } = await supabase
        .from('article_shares')
        .select(`
          *,
          news_articles!inner(title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      if (!data) {
        return {
          totalShares: 0,
          sharesByPlatform: {} as Record<SharePlatform, number>,
          recentShares: [],
        }
      }

      const sharesByPlatform = data.reduce((acc, share) => {
        acc[share.platform as SharePlatform] = (acc[share.platform as SharePlatform] || 0) + 1
        return acc
      }, {} as Record<SharePlatform, number>)

      const recentShares = data.slice(0, 10).map(share => ({
        articleId: share.article_id,
        articleTitle: share.news_articles?.title || 'Unknown',
        platform: share.platform as SharePlatform,
        sharedAt: new Date(share.created_at),
      }))

      return {
        totalShares: data.length,
        sharesByPlatform,
        recentShares,
      }
    } catch (error) {
      console.error('Error fetching user sharing activity:', error)
      return {
        totalShares: 0,
        sharesByPlatform: {} as Record<SharePlatform, number>,
        recentShares: [],
      }
    }
  }

  /**
   * Check if native share is supported
   */
  static isNativeShareSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share
  }
}
