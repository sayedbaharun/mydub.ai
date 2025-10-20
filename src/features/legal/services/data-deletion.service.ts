import { supabase } from '@/shared/lib/supabase'

export interface DataDeletionRequest {
  id: string
  user_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  request_date: string
  scheduled_deletion_date: string
  actual_deletion_date?: string
  reason?: string
  data_categories: string[]
  retention_period_days: number
  created_at: string
  updated_at: string
}

export interface DataDeletionPolicy {
  // Retention periods (in days)
  USER_PROFILE: number
  READING_HISTORY: number
  BOOKMARKS: number
  PREFERENCES: number
  CONSENT_RECORDS: number // Must keep for legal compliance (7 years)
  ANALYTICS: number
  ERROR_LOGS: number

  // Grace period before deletion (days)
  GRACE_PERIOD: number

  // Categories that can be deleted immediately
  IMMEDIATE_DELETION: string[]

  // Categories that require retention for legal compliance
  LEGAL_RETENTION: string[]
}

export class DataDeletionService {
  /**
   * UAE GDPR Compliance Data Retention Policy
   */
  static readonly POLICY: DataDeletionPolicy = {
    USER_PROFILE: 30, // 30 days after account deletion
    READING_HISTORY: 90, // 90 days rolling window
    BOOKMARKS: 365, // 1 year
    PREFERENCES: 180, // 6 months
    CONSENT_RECORDS: 2555, // 7 years (legal requirement)
    ANALYTICS: 730, // 2 years
    ERROR_LOGS: 90, // 90 days

    GRACE_PERIOD: 30, // 30 days grace period before permanent deletion

    IMMEDIATE_DELETION: ['reading_history', 'bookmarks', 'preferences'],

    LEGAL_RETENTION: ['consent_records', 'data_requests', 'compliance_logs'],
  }

  /**
   * Submit a data deletion request
   */
  static async requestDataDeletion(
    userId: string,
    reason?: string,
    dataCategories: string[] = ['all']
  ): Promise<DataDeletionRequest> {
    try {
      // Ensure user is authenticated
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.id || user.user.id !== userId) {
        throw new Error('Unauthorized: User ID mismatch')
      }

      // Calculate scheduled deletion date (30 days from now)
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + this.POLICY.GRACE_PERIOD)

      // Create deletion request
      const { data, error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          status: 'pending',
          request_date: new Date().toISOString(),
          scheduled_deletion_date: scheduledDate.toISOString(),
          reason,
          data_categories: dataCategories,
          retention_period_days: this.POLICY.GRACE_PERIOD,
        })
        .select()
        .single()

      if (error) throw error

      // Log compliance event
      await this.logComplianceEvent('deletion_requested', userId, {
        request_id: data.id,
        categories: dataCategories,
        scheduled_date: scheduledDate.toISOString(),
      })

      return data as unknown as DataDeletionRequest
    } catch (error) {
      console.error('Error requesting data deletion:', error)
      throw error
    }
  }

  /**
   * Cancel a pending data deletion request
   */
  static async cancelDeletionRequest(requestId: string, userId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.id || user.user.id !== userId) {
        throw new Error('Unauthorized')
      }

      // Get the request
      const { data: request, error: fetchError } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      // Can only cancel pending requests
      if (request.status !== 'pending') {
        throw new Error('Cannot cancel request that is already processing or completed')
      }

      // Update status to cancelled
      const { error: updateError } = await supabase
        .from('data_deletion_requests')
        .update({
          status: 'failed', // Using 'failed' to indicate cancelled
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Log compliance event
      await this.logComplianceEvent('deletion_cancelled', userId, {
        request_id: requestId,
      })
    } catch (error) {
      console.error('Error cancelling deletion request:', error)
      throw error
    }
  }

  /**
   * Get user's deletion requests
   */
  static async getUserDeletionRequests(userId: string): Promise<DataDeletionRequest[]> {
    try {
      const { data, error } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data as unknown as DataDeletionRequest[]) || []
    } catch (error) {
      console.error('Error fetching deletion requests:', error)
      return []
    }
  }

  /**
   * Process pending deletion requests (runs via cron job)
   */
  static async processPendingDeletions(): Promise<{
    processed: number
    successful: number
    failed: number
  }> {
    try {
      // Get all pending requests where scheduled date has passed
      const now = new Date().toISOString()
      const { data: requests, error } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_deletion_date', now)

      if (error) throw error

      let successful = 0
      let failed = 0

      for (const request of requests || []) {
        try {
          // Update status to processing
          await supabase
            .from('data_deletion_requests')
            .update({ status: 'processing' })
            .eq('id', request.id)

          // Execute deletion
          await this.executeDataDeletion(
            request.user_id,
            request.data_categories || ['all']
          )

          // Mark as completed
          await supabase
            .from('data_deletion_requests')
            .update({
              status: 'completed',
              actual_deletion_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', request.id)

          successful++

          // Log compliance event
          await this.logComplianceEvent('deletion_completed', request.user_id, {
            request_id: request.id,
            categories: request.data_categories,
          })
        } catch (err) {
          failed++
          console.error(`Failed to delete data for request ${request.id}:`, err)

          // Mark as failed
          await supabase
            .from('data_deletion_requests')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', request.id)
        }
      }

      return {
        processed: (requests || []).length,
        successful,
        failed,
      }
    } catch (error) {
      console.error('Error processing pending deletions:', error)
      return { processed: 0, successful: 0, failed: 0 }
    }
  }

  /**
   * Execute actual data deletion
   */
  private static async executeDataDeletion(
    userId: string,
    categories: string[]
  ): Promise<void> {
    const deleteAll = categories.includes('all')

    // Delete user data based on categories
    const deletionPromises = []

    if (deleteAll || categories.includes('reading_history')) {
      deletionPromises.push(
        supabase.from('user_article_views').delete().eq('user_id', userId)
      )
    }

    if (deleteAll || categories.includes('bookmarks')) {
      deletionPromises.push(
        supabase.from('bookmarks').delete().eq('user_id', userId)
      )
    }

    if (deleteAll || categories.includes('preferences')) {
      deletionPromises.push(
        supabase.from('user_preferences').delete().eq('user_id', userId)
      )
      deletionPromises.push(
        supabase.from('privacy_settings').delete().eq('user_id', userId)
      )
    }

    if (deleteAll || categories.includes('analytics')) {
      // Anonymize analytics data (don't delete for legal compliance)
      deletionPromises.push(
        supabase
          .from('analytics_events')
          .update({ user_id: 'anonymized' })
          .eq('user_id', userId)
      )
    }

    // Note: consent_records and compliance_logs are NOT deleted (legal retention)

    if (deleteAll) {
      // Delete user profile last
      deletionPromises.push(
        supabase.from('profiles').delete().eq('id', userId)
      )
    }

    await Promise.all(deletionPromises)
  }

  /**
   * Auto-cleanup old data based on retention policy
   */
  static async autoCleanupExpiredData(): Promise<{
    category: string
    deleted: number
  }[]> {
    const results: { category: string; deleted: number }[] = []

    try {
      // Cleanup reading history older than 90 days
      const readingHistoryCutoff = new Date()
      readingHistoryCutoff.setDate(readingHistoryCutoff.getDate() - this.POLICY.READING_HISTORY)

      const { error: readingError } = await supabase
        .from('user_article_views')
        .delete()
        .lt('created_at', readingHistoryCutoff.toISOString())

      if (!readingError) {
        results.push({ category: 'reading_history', deleted: 0 }) // Count not available
      }

      // Cleanup error logs older than 90 days
      const errorLogsCutoff = new Date()
      errorLogsCutoff.setDate(errorLogsCutoff.getDate() - this.POLICY.ERROR_LOGS)

      const { error: logsError } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', errorLogsCutoff.toISOString())

      if (!logsError) {
        results.push({ category: 'error_logs', deleted: 0 })
      }

      // Log cleanup event
      await this.logComplianceEvent('auto_cleanup_completed', undefined, {
        results,
        date: new Date().toISOString(),
      })

      return results
    } catch (error) {
      console.error('Error in auto cleanup:', error)
      return results
    }
  }

  /**
   * Get data retention status for user
   */
  static async getDataRetentionStatus(userId: string): Promise<{
    category: string
    count: number
    oldestRecord: string | null
    retentionDays: number
    willDeleteAfter: string | null
  }[]> {
    try {
      const status: {
        category: string
        count: number
        oldestRecord: string | null
        retentionDays: number
        willDeleteAfter: string | null
      }[] = []

      // Reading history
      const { data: readingHistory, error: rhError } = await supabase
        .from('user_article_views')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!rhError && readingHistory && readingHistory.length > 0) {
        const oldest = new Date(readingHistory[0].created_at)
        const deleteDate = new Date(oldest)
        deleteDate.setDate(deleteDate.getDate() + this.POLICY.READING_HISTORY)

        status.push({
          category: 'Reading History',
          count: readingHistory.length,
          oldestRecord: oldest.toISOString(),
          retentionDays: this.POLICY.READING_HISTORY,
          willDeleteAfter: deleteDate.toISOString(),
        })
      }

      // Bookmarks
      const { count: bookmarkCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (bookmarkCount && bookmarkCount > 0) {
        status.push({
          category: 'Bookmarks',
          count: bookmarkCount,
          oldestRecord: null,
          retentionDays: this.POLICY.BOOKMARKS,
          willDeleteAfter: null,
        })
      }

      return status
    } catch (error) {
      console.error('Error getting retention status:', error)
      return []
    }
  }

  /**
   * Log compliance event
   */
  private static async logComplianceEvent(
    eventType: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('compliance_audit_logs').insert({
        event_type: eventType,
        user_id: userId,
        metadata,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      // Silent fail - logging shouldn't block operations
      console.error('Error logging compliance event:', error)
    }
  }
}
