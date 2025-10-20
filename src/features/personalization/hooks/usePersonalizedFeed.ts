/**
 * usePersonalizedFeed Hook
 * React hook for personalized content recommendations
 */

import { useEffect, useState } from 'react'
import { PersonalizationService } from '../services/personalization.service'
import { NewsArticle } from '@/features/news/types/news.types'
import { supabase } from '@/shared/lib/supabase'

export type FeedMode = 'personalized' | 'latest'

interface UsePersonalizedFeedOptions {
  mode?: FeedMode
  limit?: number
  excludeRead?: boolean
}

export function usePersonalizedFeed(options: UsePersonalizedFeedOptions = {}) {
  const { mode = 'latest', limit = 20, excludeRead = false } = options

  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    loadFeed()
  }, [mode, excludeRead])

  const loadFeed = async (loadMore = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentOffset = loadMore ? offset : 0

      let newArticles: NewsArticle[] = []

      if (mode === 'personalized') {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          newArticles = await PersonalizationService.getPersonalizedFeed({
            userId: user.id,
            limit,
            offset: currentOffset,
            excludeRead,
          })
        } else {
          // Fall back to latest if not authenticated
          newArticles = await PersonalizationService.getLatestArticles(limit, currentOffset)
        }
      } else {
        // Latest mode
        newArticles = await PersonalizationService.getLatestArticles(limit, currentOffset)
      }

      if (loadMore) {
        setArticles(prev => [...prev, ...newArticles])
      } else {
        setArticles(newArticles)
      }

      setHasMore(newArticles.length === limit)
      setOffset(currentOffset + newArticles.length)
    } catch (err) {
      setError(err as Error)
      console.error('Error loading feed:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFeed(true)
    }
  }

  const refresh = () => {
    setOffset(0)
    loadFeed(false)
  }

  const trackView = async (articleId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await PersonalizationService.trackEngagement(user.id, articleId, 'view')
    }
  }

  const trackClick = async (articleId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await PersonalizationService.trackEngagement(user.id, articleId, 'click')
    }
  }

  const trackShare = async (articleId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await PersonalizationService.trackEngagement(user.id, articleId, 'share')
    }
  }

  return {
    articles,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    trackView,
    trackClick,
    trackShare,
  }
}
