import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void | Promise<void>
}

export function useInfiniteScroll({
  threshold = 0.1,
  rootMargin = '100px',
  hasMore,
  isLoading,
  onLoadMore,
}: UseInfiniteScrollOptions) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      setIsIntersecting(target.isIntersecting)
    },
    []
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold,
      rootMargin,
    })

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleObserver, threshold, rootMargin])

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore()
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore])

  return { loadMoreRef, isIntersecting }
}

// Alternative hook using scroll position
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: 0,
    direction: 'down' as 'up' | 'down',
  })
  const previousScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const direction = currentScrollY > previousScrollY.current ? 'down' : 'up'
      
      setScrollPosition({
        x: window.scrollX,
        y: currentScrollY,
        direction,
      })
      
      previousScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return scrollPosition
}

// Hook for detecting when user is near bottom of page
export function useNearBottom(offset = 100) {
  const [isNearBottom, setIsNearBottom] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const clientHeight = window.innerHeight
      
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < offset)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [offset])

  return isNearBottom
}