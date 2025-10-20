/**
 * Notifications Service
 * Phase 3.4.1: Real-time notifications system
 */

import { supabase } from '@/shared/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export type NotificationType =
  | 'breaking_news'
  | 'comment_reply'
  | 'mention'
  | 'upvote'
  | 'article_update'
  | 'welcome'
  | 'weekly_digest'
  | 'milestone'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  linkUrl: string | null
  data: any | null
  read: boolean
  createdAt: Date
}

export interface NotificationPreferences {
  userId: string
  pushEnabled: boolean
  emailEnabled: boolean
  breakingNewsPush: boolean
  commentRepliesPush: boolean
  mentionsPush: boolean
  upvotesPush: boolean
  weeklyDigestEmail: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

// =============================================================================
// Notifications Service
// =============================================================================

export class NotificationsService {
  private static channel: RealtimeChannel | null = null

  /**
   * Get user's notifications
   */
  static async getNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (unreadOnly) {
        query = query.eq('read', false)
      }

      const { data, error } = await query

      if (error) throw error
      if (!data) return []

      return data.map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        linkUrl: n.link_url,
        data: n.data,
        read: n.read,
        createdAt: new Date(n.created_at),
      }))
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        p_user_id: userId,
      })

      if (error) throw error
      return data || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase.rpc('mark_notification_read', {
        notification_id: notificationId,
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await supabase.rpc('mark_all_notifications_read', {
        p_user_id: userId,
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  /**
   * Create notification
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    linkUrl?: string,
    data?: any
  ): Promise<Notification | null> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          link_url: linkUrl || null,
          data: data || null,
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: notification.id,
        userId: notification.user_id,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        linkUrl: notification.link_url,
        data: notification.data,
        read: notification.read,
        createdAt: new Date(notification.created_at),
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  }

  /**
   * Get user's notification preferences
   */
  static async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If preferences don't exist, create defaults
        if (error.code === 'PGRST116') {
          return this.createDefaultPreferences(userId)
        }
        throw error
      }

      return {
        userId: data.user_id,
        pushEnabled: data.push_enabled,
        emailEnabled: data.email_enabled,
        breakingNewsPush: data.breaking_news_push,
        commentRepliesPush: data.comment_replies_push,
        mentionsPush: data.mentions_push,
        upvotesPush: data.upvotes_push,
        weeklyDigestEmail: data.weekly_digest_email,
        quietHoursEnabled: data.quiet_hours_enabled,
        quietHoursStart: data.quiet_hours_start,
        quietHoursEnd: data.quiet_hours_end,
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
      return null
    }
  }

  /**
   * Create default notification preferences
   */
  private static async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single()

    if (error) throw error

    return {
      userId: data.user_id,
      pushEnabled: data.push_enabled,
      emailEnabled: data.email_enabled,
      breakingNewsPush: data.breaking_news_push,
      commentRepliesPush: data.comment_replies_push,
      mentionsPush: data.mentions_push,
      upvotesPush: data.upvotes_push,
      weeklyDigestEmail: data.weekly_digest_email,
      quietHoursEnabled: data.quiet_hours_enabled,
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const dbUpdates: any = {}

      if (updates.pushEnabled !== undefined) dbUpdates.push_enabled = updates.pushEnabled
      if (updates.emailEnabled !== undefined) dbUpdates.email_enabled = updates.emailEnabled
      if (updates.breakingNewsPush !== undefined)
        dbUpdates.breaking_news_push = updates.breakingNewsPush
      if (updates.commentRepliesPush !== undefined)
        dbUpdates.comment_replies_push = updates.commentRepliesPush
      if (updates.mentionsPush !== undefined) dbUpdates.mentions_push = updates.mentionsPush
      if (updates.upvotesPush !== undefined) dbUpdates.upvotes_push = updates.upvotesPush
      if (updates.weeklyDigestEmail !== undefined)
        dbUpdates.weekly_digest_email = updates.weeklyDigestEmail
      if (updates.quietHoursEnabled !== undefined)
        dbUpdates.quiet_hours_enabled = updates.quietHoursEnabled
      if (updates.quietHoursStart !== undefined)
        dbUpdates.quiet_hours_start = updates.quietHoursStart
      if (updates.quietHoursEnd !== undefined) dbUpdates.quiet_hours_end = updates.quietHoursEnd

      const { error } = await supabase
        .from('notification_preferences')
        .update(dbUpdates)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): () => void {
    // Unsubscribe from existing channel if any
    if (this.channel) {
      supabase.removeChannel(this.channel)
    }

    // Create new channel for user's notifications
    this.channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification: Notification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            type: payload.new.type as NotificationType,
            title: payload.new.title,
            message: payload.new.message,
            linkUrl: payload.new.link_url,
            data: payload.new.data,
            read: payload.new.read,
            createdAt: new Date(payload.new.created_at),
          }
          callback(notification)
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel)
        this.channel = null
      }
    }
  }

  /**
   * Send breaking news notification to all users
   */
  static async sendBreakingNewsNotification(
    articleId: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      // Get all users with breaking news notifications enabled
      const { data: users } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('breaking_news_push', true)

      if (!users || users.length === 0) return

      // Create notifications for all users
      const notifications = users.map(user => ({
        user_id: user.user_id,
        type: 'breaking_news',
        title,
        message,
        link_url: `/news/${articleId}`,
        data: { article_id: articleId },
      }))

      const { error } = await supabase.from('notifications').insert(notifications)

      if (error) throw error
    } catch (error) {
      console.error('Error sending breaking news notification:', error)
      throw error
    }
  }
}
