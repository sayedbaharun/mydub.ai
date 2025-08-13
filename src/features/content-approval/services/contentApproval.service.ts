import { supabase } from '@/shared/lib/supabase'
import { 
  ApprovalItem, 
  ApprovalAction, 
  ApprovalStats, 
  ApprovalFilter, 
  ApprovalQueue 
} from '../types'
import { ARTICLE_STATUSES, type ArticleStatus } from '@/shared/types/article-status'

// Last updated: 2025-01-06 to fix processApprovalAction
export const contentApprovalService = {
  // Get approval queue with filtering and pagination
  async getApprovalQueue(
    page: number = 1,
    pageSize: number = 20,
    filters?: ApprovalFilter
  ): Promise<ApprovalQueue> {
    try {
      // Use articles table with pending status for approval queue
      let query = supabase
        .from('articles')
        .select(`
          *,
          author:author_id(id, full_name, email, avatar_url)
        `, { count: 'exact' })
        .in('status', [ARTICLE_STATUSES.IN_REVIEW, ARTICLE_STATUSES.SUBMITTED])

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.content_type) {
        query = query.eq('category', filters.content_type)
      }
      if (filters?.priority) {
        // Articles don't have priority, skip this filter
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,title_ar.ilike.%${filters.search}%`)
      }

      // Add pagination
      const offset = (page - 1) * pageSize
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Transform articles to approval items format
      const items: ApprovalItem[] = (data || []).map(article => ({
        id: article.id,
        title: article.title,
        title_ar: article.title_ar,
        excerpt: article.summary,  // Map summary to excerpt
        excerpt_ar: article.summary_ar,
        content: {
          body: article.content,
          body_ar: article.content_ar
        },
        content_type: article.category || 'news',
        status: article.status === 'pending_review' ? 'pending' : article.status,
        priority: 'medium',
        created_at: article.created_at,
        updated_at: article.updated_at,
        author: article.author,
        metadata: {
          source_name: article.source_name,
          tags: article.tags,
          featured_image: article.featured_image
        }
      }))

      return {
        items,
        total: count || 0,
        page,
        pageSize
      }
    } catch (error) {
      console.error('Error fetching approval queue:', error)
      return {
        items: [],
        total: 0,
        page,
        pageSize
      }
    }
  },

  // Get a single item for approval
  async getApprovalItem(itemId: string): Promise<ApprovalItem | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:author_id(id, full_name, email, avatar_url)
        `)
        .eq('id', itemId)
        .single()

      if (error) throw error

      if (!data) return null

      // Transform to approval item format
      return {
        id: data.id,
        title: data.title,
        title_ar: data.title_ar,
        excerpt: data.summary,  // Map summary to excerpt
        excerpt_ar: data.summary_ar,
        content: {
          body: data.content,
          body_ar: data.content_ar
        },
        content_type: data.category || 'news',
        status: data.status === 'pending_review' ? 'pending' : data.status,
        priority: 'medium',
        created_at: data.created_at,
        updated_at: data.updated_at,
        author: data.author,
        metadata: {
          source_name: data.source_name,
          tags: data.tags,
          featured_image: data.featured_image
        }
      }
    } catch (error) {
      console.error('Error fetching approval item:', error)
      return null
    }
  },

  // Approve content using RPC function
  async approveContent(
    itemId: string, 
    notes?: string,
    publishImmediately: boolean = false
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { error } = await supabase.rpc('approve_article', {
      _article_id: itemId,
      _approver_id: user.user.id,
      _publish_immediately: publishImmediately,
      _comments: notes
    })

    if (error) throw error
  },

  // Reject content using RPC function
  async rejectContent(
    itemId: string, 
    reason: string,
    notes?: string
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { error } = await supabase.rpc('reject_article', {
      _article_id: itemId,
      _approver_id: user.user.id,
      _reason: reason,
      _comments: notes
    })

    if (error) throw error
  },

  // Schedule content for publishing
  async scheduleContent(
    itemId: string, 
    scheduledDate: Date,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .update({
        status: ARTICLE_STATUSES.SCHEDULED,
        published_at: scheduledDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)

    if (error) throw error
  },

  // Edit and approve content
  async editAndApprove(
    itemId: string,
    editedContent: Partial<ApprovalItem>,
    notes?: string
  ): Promise<void> {
    // Update the content with edits
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        title: editedContent.title,
        title_ar: editedContent.title_ar,
        summary: editedContent.excerpt,
        summary_ar: editedContent.excerpt_ar,
        content: editedContent.content?.body || editedContent.content,
        content_ar: editedContent.content?.body_ar || editedContent.content_ar,
        status: ARTICLE_STATUSES.APPROVED,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)

    if (updateError) throw updateError
  },

  // Publish approved content
  async publishContent(itemId: string): Promise<void> {
    // Get the content details
    const { data: content, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', itemId)
      .single()

    if (error) throw error
    if (!content) throw new Error('Content not found')

    // Update status to published
    await supabase
      .from('articles')
      .update({ 
        status: ARTICLE_STATUSES.PUBLISHED, 
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
  },

  // Get approval statistics
  async getApprovalStats(): Promise<ApprovalStats> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get counts for different statuses
      const [
        { count: total },
        { count: pending },
        { count: approved },
        { count: rejected },
        { count: scheduled }
      ] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('articles').select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('updated_at', today.toISOString()),
        supabase.from('articles').select('*', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('updated_at', today.toISOString()),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
      ])

      return {
        total: total || 0,
        pending: pending || 0,
        approved_today: approved || 0,
        rejected_today: rejected || 0,
        scheduled: scheduled || 0,
        average_processing_time: 0, // Would need to calculate from timestamps
        approval_rate: total ? ((approved || 0) / (total || 1)) * 100 : 0
      }
    } catch (error) {
      console.error('Error fetching approval stats:', error)
      return {
        total: 0,
        pending: 0,
        approved_today: 0,
        rejected_today: 0,
        scheduled: 0,
        average_processing_time: 0,
        approval_rate: 0
      }
    }
  },

  // Bulk actions
  async bulkAction(
    itemIds: string[], 
    action: ApprovalAction, 
    notes?: string
  ): Promise<void> {
    try {
      let updates: any = {
        updated_at: new Date().toISOString()
      }

      switch (action) {
        case 'approve':
          updates.status = 'approved'
          break
        case 'reject':
          updates.status = 'rejected'
          break
        case 'schedule':
          updates.status = 'scheduled'
          break
        case 'publish':
          updates.status = 'published'
          updates.published_at = new Date().toISOString()
          break
      }

      const { error } = await supabase
        .from('articles')
        .update(updates)
        .in('id', itemIds)

      if (error) throw error
    } catch (error) {
      console.error('Error performing bulk action:', error)
      throw error
    }
  },

  // Process approval action (for compatibility with existing code)
  async processApprovalAction(
    action: any,
    userId?: string
  ): Promise<void> {
    try {
      // Handle different action formats
      if (typeof action === 'object' && action.item_id) {
        // Object format with item_id and action
        const { item_id, action: actionType, notes, publish_immediately, scheduled_date, reason } = action
        
        switch (actionType) {
          case 'approve':
            await this.approveContent(item_id, notes, publish_immediately)
            break
          case 'reject':
            await this.rejectContent(item_id, reason || 'Rejected by reviewer', notes)
            break
          case 'schedule':
            const schedDate = scheduled_date ? new Date(scheduled_date) : new Date()
            await this.scheduleContent(item_id, schedDate, notes)
            break
          case 'publish':
            await this.publishContent(item_id)
            break
          default:
            throw new Error(`Unknown action type: ${actionType}`)
        }
      } else if (typeof action === 'string') {
        // Simple string action - would need item_id separately
        throw new Error('String action format not supported - need item_id')
      }
    } catch (error) {
      console.error('Error processing approval action:', error)
      throw error
    }
  }
}