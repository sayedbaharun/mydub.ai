/**
 * Real-Time Content Updates Service
 * Phase 2.3.1: WebSocket-based real-time content synchronization
 *
 * Features:
 * - Live article updates via Supabase Realtime
 * - Breaking news notifications
 * - Article modification tracking
 * - Connection state management
 * - Automatic reconnection
 * - Update batching and throttling
 */

import { supabase } from '@/shared/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export type UpdateType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface ContentUpdate {
  id: string
  type: UpdateType
  table: string
  timestamp: Date
  payload: any
  category?: string
  priority: 'high' | 'medium' | 'low'
}

export interface BreakingNewsUpdate extends ContentUpdate {
  title: string
  category: string
  isBreaking: boolean
  urgencyLevel: number
}

export type UpdateCallback = (update: ContentUpdate) => void
export type BreakingNewsCallback = (update: BreakingNewsUpdate) => void
export type ConnectionCallback = (status: 'connected' | 'disconnected' | 'reconnecting') => void

// =============================================================================
// Real-Time Updates Service
// =============================================================================

export class RealtimeUpdatesService {
  private static channels: Map<string, RealtimeChannel> = new Map()
  private static updateCallbacks: Set<UpdateCallback> = new Set()
  private static breakingNewsCallbacks: Set<BreakingNewsCallback> = new Set()
  private static connectionCallbacks: Set<ConnectionCallback> = new Set()
  private static updateQueue: ContentUpdate[] = []
  private static isProcessingQueue = false
  private static connectionStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected'

  private static readonly BATCH_DELAY_MS = 1000 // Batch updates every 1 second
  private static readonly MAX_QUEUE_SIZE = 100
  private static readonly RECONNECT_DELAY_MS = 3000

  /**
   * Initialize real-time updates for news articles
   */
  static startArticleUpdates(categories?: string[]): () => void {
    const channelName = categories ? `articles:${categories.join(',')}` : 'articles:all'

    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.log(`📡 Channel ${channelName} already active`)
      return () => this.stopChannel(channelName)
    }

    // Create new channel
    const channel = supabase.channel(channelName)

    // Subscribe to INSERT events (new articles)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'news_articles',
        filter: categories ? `category=in.(${categories.join(',')})` : undefined,
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        this.handleArticleChange('INSERT', payload)
      }
    )

    // Subscribe to UPDATE events (article edits)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'news_articles',
        filter: categories ? `category=in.(${categories.join(',')})` : undefined,
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        this.handleArticleChange('UPDATE', payload)
      }
    )

    // Subscribe to DELETE events (article removals)
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'news_articles',
        filter: categories ? `category=in.(${categories.join(',')})` : undefined,
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        this.handleArticleChange('DELETE', payload)
      }
    )

    // Subscribe to channel
    channel.subscribe((status) => {
      console.log(`📡 Channel ${channelName} status:`, status)

      switch (status) {
        case 'SUBSCRIBED':
          this.updateConnectionStatus('connected')
          console.log(`✅ Real-time updates active for: ${channelName}`)
          break
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
          this.updateConnectionStatus('reconnecting')
          console.warn(`⚠️ Channel ${channelName} error, reconnecting...`)
          setTimeout(() => this.startArticleUpdates(categories), this.RECONNECT_DELAY_MS)
          break
        case 'CLOSED':
          this.updateConnectionStatus('disconnected')
          console.log(`🔌 Channel ${channelName} closed`)
          break
      }
    })

    // Store channel
    this.channels.set(channelName, channel)

    // Return cleanup function
    return () => this.stopChannel(channelName)
  }

  /**
   * Handle article change events
   */
  private static handleArticleChange(
    type: UpdateType,
    payload: RealtimePostgresChangesPayload<any>
  ): void {
    const article = payload.new || payload.old

    const update: ContentUpdate = {
      id: article?.id || crypto.randomUUID(),
      type,
      table: 'news_articles',
      timestamp: new Date(),
      payload: article,
      category: article?.category,
      priority: this.determinePriority(article, type),
    }

    // Check if breaking news
    if (this.isBreakingNews(article)) {
      const breakingUpdate: BreakingNewsUpdate = {
        ...update,
        title: article.title,
        category: article.category,
        isBreaking: true,
        urgencyLevel: this.calculateUrgencyLevel(article),
      }
      this.notifyBreakingNews(breakingUpdate)
    }

    // Add to queue
    this.enqueueUpdate(update)
  }

  /**
   * Determine update priority
   */
  private static determinePriority(article: any, type: UpdateType): 'high' | 'medium' | 'low' {
    if (!article) return 'low'

    // High priority: Breaking news, new articles, urgent categories
    if (article.is_breaking || type === 'INSERT') {
      return 'high'
    }

    // Medium priority: Updates to published articles
    if (article.status === 'published' && type === 'UPDATE') {
      return 'medium'
    }

    // Low priority: Draft updates, deletions
    return 'low'
  }

  /**
   * Check if article qualifies as breaking news
   */
  private static isBreakingNews(article: any): boolean {
    if (!article) return false

    // Check explicit breaking news flag
    if (article.is_breaking === true) return true

    // Check for breaking news indicators
    const breakingKeywords = ['breaking', 'urgent', 'alert', 'just in', 'developing']
    const title = (article.title || '').toLowerCase()

    return breakingKeywords.some((keyword) => title.includes(keyword))
  }

  /**
   * Calculate urgency level for breaking news
   */
  private static calculateUrgencyLevel(article: any): number {
    let urgency = 5 // Base urgency

    if (article.is_breaking) urgency += 3
    if (article.category === 'breaking-news') urgency += 2
    if (article.ai_confidence_score >= 90) urgency += 1

    // Check recency (within last 30 minutes)
    if (article.published_at) {
      const minutesAgo = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60)
      if (minutesAgo <= 30) urgency += 2
    }

    return Math.min(10, urgency)
  }

  /**
   * Add update to queue
   */
  private static enqueueUpdate(update: ContentUpdate): void {
    this.updateQueue.push(update)

    // Prevent queue overflow
    if (this.updateQueue.length > this.MAX_QUEUE_SIZE) {
      console.warn('⚠️ Update queue overflow, removing oldest updates')
      this.updateQueue = this.updateQueue.slice(-this.MAX_QUEUE_SIZE)
    }

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processUpdateQueue()
    }
  }

  /**
   * Process update queue with batching
   */
  private static async processUpdateQueue(): Promise<void> {
    this.isProcessingQueue = true

    while (this.updateQueue.length > 0) {
      // Wait for batch delay
      await new Promise((resolve) => setTimeout(resolve, this.BATCH_DELAY_MS))

      // Get batch of updates
      const batch = this.updateQueue.splice(0, this.updateQueue.length)

      // Sort by priority (high → medium → low)
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      batch.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

      // Notify all callbacks
      for (const update of batch) {
        this.notifyUpdateCallbacks(update)
      }

      console.log(`📢 Processed ${batch.length} real-time updates`)
    }

    this.isProcessingQueue = false
  }

  /**
   * Notify update callbacks
   */
  private static notifyUpdateCallbacks(update: ContentUpdate): void {
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(update)
      } catch (error) {
        console.error('Error in update callback:', error)
      }
    })
  }

  /**
   * Notify breaking news callbacks
   */
  private static notifyBreakingNews(update: BreakingNewsUpdate): void {
    console.log('🚨 BREAKING NEWS:', update.title)

    this.breakingNewsCallbacks.forEach((callback) => {
      try {
        callback(update)
      } catch (error) {
        console.error('Error in breaking news callback:', error)
      }
    })
  }

  /**
   * Update connection status
   */
  private static updateConnectionStatus(
    status: 'connected' | 'disconnected' | 'reconnecting'
  ): void {
    if (this.connectionStatus === status) return

    this.connectionStatus = status
    console.log(`🔌 Connection status: ${status}`)

    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in connection callback:', error)
      }
    })
  }

  /**
   * Subscribe to content updates
   */
  static onUpdate(callback: UpdateCallback): () => void {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  /**
   * Subscribe to breaking news
   */
  static onBreakingNews(callback: BreakingNewsCallback): () => void {
    this.breakingNewsCallbacks.add(callback)
    return () => this.breakingNewsCallbacks.delete(callback)
  }

  /**
   * Subscribe to connection status changes
   */
  static onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)
    // Immediately notify of current status
    callback(this.connectionStatus)
    return () => this.connectionCallbacks.delete(callback)
  }

  /**
   * Stop specific channel
   */
  static stopChannel(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)
      console.log(`🔌 Stopped channel: ${channelName}`)
    }
  }

  /**
   * Stop all real-time updates
   */
  static stopAllUpdates(): void {
    this.channels.forEach((channel, name) => {
      channel.unsubscribe()
      console.log(`🔌 Stopped channel: ${name}`)
    })
    this.channels.clear()
    this.updateCallbacks.clear()
    this.breakingNewsCallbacks.clear()
    this.connectionCallbacks.clear()
    this.updateQueue = []
    this.updateConnectionStatus('disconnected')
    console.log('🔌 All real-time updates stopped')
  }

  /**
   * Get current connection status
   */
  static getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    return this.connectionStatus
  }

  /**
   * Get active channels
   */
  static getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }

  /**
   * Get update queue size
   */
  static getQueueSize(): number {
    return this.updateQueue.length
  }

  /**
   * Clear update queue
   */
  static clearQueue(): void {
    this.updateQueue = []
    console.log('🗑️ Update queue cleared')
  }
}
