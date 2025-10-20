/**
 * useRealtimeUpdates Hook
 * React hook for consuming real-time content updates
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  RealtimeUpdatesService,
  type ContentUpdate,
  type BreakingNewsUpdate,
} from '../services/realtime-updates.service'

export interface UseRealtimeUpdatesOptions {
  categories?: string[]
  enabled?: boolean
  onUpdate?: (update: ContentUpdate) => void
  onBreakingNews?: (update: BreakingNewsUpdate) => void
}

export interface UseRealtimeUpdatesReturn {
  updates: ContentUpdate[]
  breakingNews: BreakingNewsUpdate[]
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  isConnected: boolean
  clearUpdates: () => void
  clearBreakingNews: () => void
}

/**
 * Hook for real-time content updates
 */
export function useRealtimeUpdates(
  options: UseRealtimeUpdatesOptions = {}
): UseRealtimeUpdatesReturn {
  const { categories, enabled = true, onUpdate, onBreakingNews } = options

  const [updates, setUpdates] = useState<ContentUpdate[]>([])
  const [breakingNews, setBreakingNews] = useState<BreakingNewsUpdate[]>([])
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'reconnecting'
  >('disconnected')

  const unsubscribeRef = useRef<(() => void)[]>([])

  // Handle update callback
  const handleUpdate = useCallback(
    (update: ContentUpdate) => {
      setUpdates((prev) => [update, ...prev].slice(0, 50)) // Keep last 50 updates

      // Call custom callback if provided
      if (onUpdate) {
        onUpdate(update)
      }
    },
    [onUpdate]
  )

  // Handle breaking news callback
  const handleBreakingNews = useCallback(
    (update: BreakingNewsUpdate) => {
      setBreakingNews((prev) => [update, ...prev].slice(0, 10)) // Keep last 10 breaking news

      // Call custom callback if provided
      if (onBreakingNews) {
        onBreakingNews(update)
      }
    },
    [onBreakingNews]
  )

  // Handle connection status change
  const handleConnectionChange = useCallback(
    (status: 'connected' | 'disconnected' | 'reconnecting') => {
      setConnectionStatus(status)
    },
    []
  )

  // Clear updates
  const clearUpdates = useCallback(() => {
    setUpdates([])
  }, [])

  // Clear breaking news
  const clearBreakingNews = useCallback(() => {
    setBreakingNews([])
  }, [])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!enabled) {
      // Cleanup if disabled
      unsubscribeRef.current.forEach((fn) => fn())
      unsubscribeRef.current = []
      return
    }

    // Subscribe to updates
    const unsubUpdate = RealtimeUpdatesService.onUpdate(handleUpdate)
    const unsubBreaking = RealtimeUpdatesService.onBreakingNews(handleBreakingNews)
    const unsubConnection = RealtimeUpdatesService.onConnectionChange(handleConnectionChange)
    const unsubChannel = RealtimeUpdatesService.startArticleUpdates(categories)

    // Store unsubscribe functions
    unsubscribeRef.current = [unsubUpdate, unsubBreaking, unsubConnection, unsubChannel]

    // Cleanup on unmount
    return () => {
      unsubscribeRef.current.forEach((fn) => fn())
      unsubscribeRef.current = []
    }
  }, [categories, enabled, handleUpdate, handleBreakingNews, handleConnectionChange])

  return {
    updates,
    breakingNews,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    clearUpdates,
    clearBreakingNews,
  }
}
