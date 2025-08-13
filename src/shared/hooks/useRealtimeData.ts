import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseRealtimeDataOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
}

interface BaseRecord {
  id?: string | number
  [key: string]: any
}

export function useRealtimeData<T extends BaseRecord = BaseRecord>({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeDataOptions) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase.from(table).select('*')

      if (filter) {
        // Parse filter string (e.g., "status=eq.active")
        const [column, operator, value] = filter.split(/[=.]/)
        query = query.filter(column, operator, value)
      }

      const { data: result, error: fetchError } = await query

      if (fetchError) throw fetchError

      setData(result || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [table, filter])

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      switch (eventType) {
        case 'INSERT':
          setData((prev) => [...prev, newRecord as T])
          onInsert?.(newRecord)
          break

        case 'UPDATE':
          setData((prev) =>
            prev.map((item) => (item.id === newRecord?.id ? (newRecord as T) : item))
          )
          onUpdate?.(newRecord)
          break

        case 'DELETE':
          setData((prev) => prev.filter((item) => item.id !== oldRecord?.id))
          onDelete?.(oldRecord)
          break
      }
    },
    [onInsert, onUpdate, onDelete]
  )

  // Set up realtime subscription
  useEffect(() => {
    fetchData()

    // Create channel
    const channelName = `realtime:${table}:${Date.now()}`
    const newChannel = supabase.channel(channelName)

    // Subscribe to changes - using the correct event type
    const postgresChangesFilter = {
      event: event as any,
      schema: 'public',
      table: table,
    }

    if (event === '*') {
      newChannel
        .on(
          'postgres_changes' as any,
          { event: 'INSERT', schema: 'public', table },
          handleRealtimeUpdate
        )
        .on(
          'postgres_changes' as any,
          { event: 'UPDATE', schema: 'public', table },
          handleRealtimeUpdate
        )
        .on(
          'postgres_changes' as any,
          { event: 'DELETE', schema: 'public', table },
          handleRealtimeUpdate
        )
    } else {
      newChannel.on('postgres_changes' as any, postgresChangesFilter, handleRealtimeUpdate)
    }

    // Subscribe to the channel
    newChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Channel successfully subscribed
      }
    })

    setChannel(newChannel)

    // Cleanup
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [table, event, filter, fetchData, handleRealtimeUpdate])

  // Refresh data manually
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refresh,
    channel,
  }
}

// Hook for specific content types
export function useRealtimeContent(contentType?: string) {
  const filter = contentType ? `type=eq.${contentType}` : undefined

  return useRealtimeData({
    table: 'content',
    filter,
    onInsert: (payload) => {
      // Could show a toast notification here
    },
    onUpdate: (payload) => {},
  })
}

// Hook for real-time notifications
export function useRealtimeNotifications(userId: string) {
  return useRealtimeData({
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => {
      // Show notification toast
    },
  })
}
