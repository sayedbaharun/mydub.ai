import { supabase } from '@/shared/lib/supabase'

export interface QualityIssueItem {
  id: string
  article_id: string
  action: 'approve' | 'flag' | 'reject' | 'revision'
  overall_score: number
  content_quality?: number
  grammar_score?: number
  readability_score?: number
  seo_score?: number
  brand_voice_score?: number
  cultural_sensitivity_score?: number
  factual_accuracy_score?: number
  image_quality_score?: number
  notes?: string
  reviewer_id?: string
  reviewed_at: string
  // Article details (joined)
  article_title?: string
  article_status?: string
  article_category?: string
  article_published_at?: string
}

export interface QualityMetrics {
  totalIssues: number
  avgQualityScore: number
  criticalIssues: number
  flaggedArticles: number
  rejectedArticles: number
  revisionRequests: number
  recentTrend: 'improving' | 'declining' | 'stable'
}

export interface QualityIssuesFilter {
  action?: 'flag' | 'reject' | 'revision' | 'all'
  scoreThreshold?: number
  dateFrom?: string
  dateTo?: string
  category?: string
  limit?: number
  offset?: number
}

export class QualityAlertsService {
  /**
   * Get all quality issues with optional filtering
   */
  static async getQualityIssues(filters: QualityIssuesFilter = {}): Promise<{
    items: QualityIssueItem[]
    total: number
  }> {
    try {
      let query = supabase
        .from('quality_reviews')
        .select(`
          id,
          article_id,
          action,
          overall_score,
          content_quality,
          grammar_score,
          readability_score,
          seo_score,
          brand_voice_score,
          cultural_sensitivity_score,
          factual_accuracy_score,
          image_quality_score,
          notes,
          reviewer_id,
          reviewed_at,
          news_articles!inner(
            title,
            status,
            category,
            published_at
          )
        `, { count: 'exact' })
        .order('reviewed_at', { ascending: false })

      // Apply filters
      if (filters.action && filters.action !== 'all') {
        query = query.eq('action', filters.action)
      }
      
      if (filters.scoreThreshold) {
        query = query.lt('overall_score', filters.scoreThreshold)
      }
      
      if (filters.dateFrom) {
        query = query.gte('reviewed_at', filters.dateFrom)
      }
      
      if (filters.dateTo) {
        query = query.lte('reviewed_at', filters.dateTo)
      }
      
      if (filters.category) {
        query = query.eq('news_articles.category', filters.category)
      }
      
      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      // Transform the data to flatten the nested article data
      const items: QualityIssueItem[] = (data || []).map(item => ({
        ...item,
        article_title: item.news_articles?.title,
        article_status: item.news_articles?.status,
        article_category: item.news_articles?.category,
        article_published_at: item.news_articles?.published_at,
        news_articles: undefined // Remove nested object
      }))

      return {
        items,
        total: count || 0
      }
    } catch (error) {
      console.error('Error fetching quality issues:', error)
      throw error
    }
  }

  /**
   * Get quality metrics summary
   */
  static async getQualityMetrics(): Promise<QualityMetrics> {
    try {
      // Get recent reviews (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentReviews, error } = await supabase
        .from('quality_reviews')
        .select('overall_score, action, reviewed_at')
        .gte('reviewed_at', thirtyDaysAgo.toISOString())

      if (error) {
        throw error
      }

      const reviews = recentReviews || []
      
      // Calculate metrics
      const totalIssues = reviews.filter(r => r.action !== 'approve').length
      const avgQualityScore = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length 
        : 0
      const criticalIssues = reviews.filter(r => r.overall_score < 70).length
      const flaggedArticles = reviews.filter(r => r.action === 'flag').length
      const rejectedArticles = reviews.filter(r => r.action === 'reject').length
      const revisionRequests = reviews.filter(r => r.action === 'revision').length

      // Calculate trend (comparing last 15 days vs previous 15 days)
      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

      const recentScores = reviews
        .filter(r => new Date(r.reviewed_at) >= fifteenDaysAgo)
        .map(r => r.overall_score)
      
      const olderScores = reviews
        .filter(r => new Date(r.reviewed_at) < fifteenDaysAgo)
        .map(r => r.overall_score)

      let recentTrend: 'improving' | 'declining' | 'stable' = 'stable'
      
      if (recentScores.length > 0 && olderScores.length > 0) {
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length
        const diff = recentAvg - olderAvg
        
        if (Math.abs(diff) > 5) {
          recentTrend = diff > 0 ? 'improving' : 'declining'
        }
      }

      return {
        totalIssues,
        avgQualityScore: Math.round(avgQualityScore * 100) / 100,
        criticalIssues,
        flaggedArticles,
        rejectedArticles,
        revisionRequests,
        recentTrend
      }
    } catch (error) {
      console.error('Error fetching quality metrics:', error)
      throw error
    }
  }

  /**
   * Get low-score articles that need attention
   */
  static async getLowScoreArticles(threshold: number = 80): Promise<QualityIssueItem[]> {
    const { items } = await this.getQualityIssues({
      scoreThreshold: threshold,
      limit: 50
    })
    return items
  }

  /**
   * Get flagged articles
   */
  static async getFlaggedArticles(): Promise<QualityIssueItem[]> {
    const { items } = await this.getQualityIssues({
      action: 'flag',
      limit: 50
    })
    return items
  }

  /**
   * Get articles needing revision
   */
  static async getRevisionRequests(): Promise<QualityIssueItem[]> {
    const { items } = await this.getQualityIssues({
      action: 'revision',
      limit: 50
    })
    return items
  }
}