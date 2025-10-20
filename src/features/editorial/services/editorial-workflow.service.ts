/**
 * Editorial Workflow Automation Service
 * Phase 2.4.1: Automated content workflow management
 *
 * Features:
 * - State machine for article lifecycle (draft → review → publish)
 * - Automatic state transitions based on conditions
 * - Approval routing and notifications
 * - Workflow analytics and tracking
 * - Rejection handling and revision loops
 * - Scheduled publishing support
 */

import { supabase } from '@/shared/lib/supabase'
import { toast } from '@/shared/services/toast.service'

// =============================================================================
// Types
// =============================================================================

export type WorkflowState =
  | 'draft'
  | 'pending_review'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'scheduled'
  | 'published'
  | 'archived'

export type WorkflowAction =
  | 'submit_for_review'
  | 'assign_reviewer'
  | 'approve'
  | 'reject'
  | 'request_revision'
  | 'resubmit'
  | 'schedule'
  | 'publish'
  | 'unpublish'
  | 'archive'

export interface WorkflowTransition {
  id: string
  articleId: string
  fromState: WorkflowState
  toState: WorkflowState
  action: WorkflowAction
  performedBy: string
  performedAt: Date
  reason?: string
  metadata?: Record<string, any>
}

export interface ApprovalRule {
  id: string
  name: string
  conditions: ApprovalCondition[]
  requiredApprovers: number
  approverRoles: string[]
  autoApproveThreshold?: number // Auto-approve if quality score >= this
}

export interface ApprovalCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
  value: any
}

export interface WorkflowNotification {
  id: string
  articleId: string
  recipientId: string
  type: 'assignment' | 'approval' | 'rejection' | 'revision_request' | 'published'
  title: string
  message: string
  actionUrl: string
  sentAt: Date
  readAt?: Date
}

export interface WorkflowAnalytics {
  totalArticles: number
  byState: Record<WorkflowState, number>
  avgTimeInReview: number // hours
  avgTimeToPublish: number // hours
  approvalRate: number // percentage
  revisionRate: number // percentage
  bottlenecks: Array<{
    state: WorkflowState
    count: number
    avgDuration: number
  }>
}

// =============================================================================
// Editorial Workflow Service
// =============================================================================

export class EditorialWorkflowService {
  /**
   * Valid state transitions map
   */
  private static readonly ALLOWED_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
    draft: ['pending_review'],
    pending_review: ['in_review', 'draft'],
    in_review: ['approved', 'rejected', 'revision_requested'],
    approved: ['scheduled', 'published', 'revision_requested'],
    rejected: ['draft', 'archived'],
    revision_requested: ['draft', 'pending_review'],
    scheduled: ['published', 'draft'],
    published: ['archived'],
    archived: [],
  }

  /**
   * Auto-approve threshold (quality score)
   */
  private static readonly AUTO_APPROVE_THRESHOLD = 90

  /**
   * Transition article to new state
   */
  static async transitionArticle(
    articleId: string,
    action: WorkflowAction,
    performedBy: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<WorkflowTransition> {
    // Get current article state
    const { data: article } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!article) {
      throw new Error('Article not found')
    }

    const currentState = article.status as WorkflowState
    const newState = this.getNextState(currentState, action)

    // Validate transition
    if (!this.isValidTransition(currentState, newState)) {
      throw new Error(`Invalid transition: ${currentState} → ${newState}`)
    }

    // Perform pre-transition checks
    await this.performPreTransitionChecks(article, newState)

    // Update article state
    await supabase
      .from('news_articles')
      .update({
        status: newState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId)

    // Create transition record
    const transition: WorkflowTransition = {
      id: crypto.randomUUID(),
      articleId,
      fromState: currentState,
      toState: newState,
      action,
      performedBy,
      performedAt: new Date(),
      reason,
      metadata,
    }

    await this.saveTransition(transition)

    // Perform post-transition actions
    await this.performPostTransitionActions(article, transition)

    // Send notifications
    await this.sendTransitionNotifications(article, transition)

    return transition
  }

  /**
   * Determine next state based on action
   */
  private static getNextState(currentState: WorkflowState, action: WorkflowAction): WorkflowState {
    const transitionMap: Record<WorkflowAction, WorkflowState> = {
      submit_for_review: 'pending_review',
      assign_reviewer: 'in_review',
      approve: 'approved',
      reject: 'rejected',
      request_revision: 'revision_requested',
      resubmit: 'pending_review',
      schedule: 'scheduled',
      publish: 'published',
      unpublish: 'draft',
      archive: 'archived',
    }

    return transitionMap[action]
  }

  /**
   * Check if transition is valid
   */
  private static isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
    const allowedStates = this.ALLOWED_TRANSITIONS[from] || []
    return allowedStates.includes(to)
  }

  /**
   * Perform pre-transition validation checks
   */
  private static async performPreTransitionChecks(article: any, newState: WorkflowState): Promise<void> {
    switch (newState) {
      case 'pending_review':
        // Check if article has minimum required content
        if (!article.title || article.title.length < 10) {
          throw new Error('Article title too short (minimum 10 characters)')
        }
        if (!article.content || article.content.length < 100) {
          throw new Error('Article content too short (minimum 100 characters)')
        }
        break

      case 'approved':
        // Check if article meets approval criteria
        if (article.ai_confidence_score < 60) {
          throw new Error('Article quality score too low for approval')
        }
        break

      case 'published':
        // Check if all required fields are present
        if (!article.title || !article.content || !article.category) {
          throw new Error('Article missing required fields for publishing')
        }
        break
    }
  }

  /**
   * Perform post-transition actions
   */
  private static async performPostTransitionActions(
    article: any,
    transition: WorkflowTransition
  ): Promise<void> {
    switch (transition.toState) {
      case 'pending_review':
        // Auto-assign reviewer based on category
        await this.autoAssignReviewer(article)
        break

      case 'approved':
        // Check if should auto-publish
        if (this.shouldAutoPublish(article)) {
          await this.transitionArticle(article.id, 'publish', 'system', 'Auto-published after approval')
        }
        break

      case 'published':
        // Update published_at timestamp
        await supabase
          .from('news_articles')
          .update({
            published_at: new Date().toISOString(),
          })
          .eq('id', article.id)

        // Trigger breaking news detection
        // (would integrate with BreakingNewsAlertsService)
        break

      case 'archived':
        // Set archived_at timestamp
        await supabase
          .from('news_articles')
          .update({
            archived_at: new Date().toISOString(),
          })
          .eq('id', article.id)
        break
    }
  }

  /**
   * Auto-assign reviewer to article
   */
  private static async autoAssignReviewer(article: any): Promise<void> {
    // In production: implement smart reviewer assignment
    // - Consider reviewer workload
    // - Match expertise (category)
    // - Round-robin distribution
    // - Availability checking

    console.log(`📋 Auto-assigned reviewer for article: ${article.title}`)

    // For now, just log
    // In production:
    // const reviewer = await this.selectBestReviewer(article.category)
    // await this.transitionArticle(article.id, 'assign_reviewer', 'system', undefined, { reviewerId: reviewer.id })
  }

  /**
   * Check if article should be auto-published
   */
  private static shouldAutoPublish(article: any): boolean {
    // Auto-publish if:
    // 1. Quality score is very high (>= 90)
    // 2. Is from highly credible source
    // 3. No manual review flag set

    if (article.ai_confidence_score >= this.AUTO_APPROVE_THRESHOLD) {
      return true
    }

    return false
  }

  /**
   * Send notifications for state transition
   */
  private static async sendTransitionNotifications(
    article: any,
    transition: WorkflowTransition
  ): Promise<void> {
    const notifications: WorkflowNotification[] = []

    switch (transition.toState) {
      case 'pending_review':
        // Notify editors
        notifications.push({
          id: crypto.randomUUID(),
          articleId: article.id,
          recipientId: 'editor-pool', // In production: get actual editor IDs
          type: 'assignment',
          title: 'New Article Awaiting Review',
          message: `"${article.title}" has been submitted for review`,
          actionUrl: `/admin/editorial/review/${article.id}`,
          sentAt: new Date(),
        })
        break

      case 'approved':
        // Notify author
        notifications.push({
          id: crypto.randomUUID(),
          articleId: article.id,
          recipientId: article.created_by || 'unknown',
          type: 'approval',
          title: 'Article Approved',
          message: `Your article "${article.title}" has been approved`,
          actionUrl: `/articles/${article.id}`,
          sentAt: new Date(),
        })
        break

      case 'rejected':
        // Notify author
        notifications.push({
          id: crypto.randomUUID(),
          articleId: article.id,
          recipientId: article.created_by || 'unknown',
          type: 'rejection',
          title: 'Article Rejected',
          message: `Your article "${article.title}" has been rejected. ${transition.reason || ''}`,
          actionUrl: `/admin/editorial/review/${article.id}`,
          sentAt: new Date(),
        })
        break

      case 'revision_requested':
        // Notify author
        notifications.push({
          id: crypto.randomUUID(),
          articleId: article.id,
          recipientId: article.created_by || 'unknown',
          type: 'revision_request',
          title: 'Revision Requested',
          message: `Revisions requested for "${article.title}": ${transition.reason || 'Please review editor comments'}`,
          actionUrl: `/admin/editorial/review/${article.id}`,
          sentAt: new Date(),
        })
        break

      case 'published':
        // Notify author and editors
        notifications.push({
          id: crypto.randomUUID(),
          articleId: article.id,
          recipientId: article.created_by || 'unknown',
          type: 'published',
          title: 'Article Published',
          message: `Your article "${article.title}" is now live!`,
          actionUrl: `/news/${article.id}`,
          sentAt: new Date(),
        })
        break
    }

    // Save and send notifications
    for (const notification of notifications) {
      await this.sendNotification(notification)
    }
  }

  /**
   * Send notification
   */
  private static async sendNotification(notification: WorkflowNotification): Promise<void> {
    // In production: save to database and send via email/push
    console.log('📬 Notification sent:', notification.title)

    // Show toast for in-app notifications
    toast.success(notification.message, {
      title: notification.title,
    })
  }

  /**
   * Save transition to database
   */
  private static async saveTransition(transition: WorkflowTransition): Promise<void> {
    // In production: insert into workflow_transitions table
    console.log('🔄 Workflow transition:', {
      from: transition.fromState,
      to: transition.toState,
      action: transition.action,
    })
  }

  /**
   * Get article workflow history
   */
  static async getWorkflowHistory(articleId: string): Promise<WorkflowTransition[]> {
    // In production: query workflow_transitions table
    return []
  }

  /**
   * Get workflow analytics
   */
  static async getWorkflowAnalytics(days: number = 30): Promise<WorkflowAnalytics> {
    const { data: articles } = await supabase
      .from('news_articles')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (!articles) {
      return {
        totalArticles: 0,
        byState: {} as any,
        avgTimeInReview: 0,
        avgTimeToPublish: 0,
        approvalRate: 0,
        revisionRate: 0,
        bottlenecks: [],
      }
    }

    // Count by state
    const byState: Record<WorkflowState, number> = {} as any
    articles.forEach((article) => {
      const state = article.status as WorkflowState
      byState[state] = (byState[state] || 0) + 1
    })

    // Calculate metrics
    const totalArticles = articles.length
    const published = byState.published || 0
    const rejected = byState.rejected || 0
    const revisionRequested = byState.revision_requested || 0

    const approvalRate = totalArticles > 0 ? ((published + (byState.approved || 0)) / totalArticles) * 100 : 0
    const revisionRate = totalArticles > 0 ? (revisionRequested / totalArticles) * 100 : 0

    // Identify bottlenecks (states with most articles)
    const bottlenecks = Object.entries(byState)
      .map(([state, count]) => ({
        state: state as WorkflowState,
        count,
        avgDuration: 24, // Mock - would calculate actual duration
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return {
      totalArticles,
      byState,
      avgTimeInReview: 12, // Mock - hours
      avgTimeToPublish: 48, // Mock - hours
      approvalRate,
      revisionRate,
      bottlenecks,
    }
  }

  /**
   * Get articles by workflow state
   */
  static async getArticlesByState(
    state: WorkflowState,
    limit: number = 20
  ): Promise<any[]> {
    const { data } = await supabase
      .from('news_articles')
      .select('*')
      .eq('status', state)
      .order('created_at', { ascending: false })
      .limit(limit)

    return data || []
  }

  /**
   * Bulk approve articles (e.g., for high-quality automated content)
   */
  static async bulkApprove(articleIds: string[], approvedBy: string): Promise<number> {
    let successCount = 0

    for (const articleId of articleIds) {
      try {
        await this.transitionArticle(articleId, 'approve', approvedBy, 'Bulk approval')
        successCount++
      } catch (error) {
        console.error(`Failed to approve ${articleId}:`, error)
      }
    }

    return successCount
  }

  /**
   * Schedule article for future publishing
   */
  static async scheduleArticle(
    articleId: string,
    publishAt: Date,
    scheduledBy: string
  ): Promise<void> {
    await this.transitionArticle(articleId, 'schedule', scheduledBy, undefined, { publishAt })

    // In production: set up scheduled job/cron to publish at specified time
    console.log(`📅 Article scheduled for publishing at ${publishAt.toISOString()}`)
  }
}
