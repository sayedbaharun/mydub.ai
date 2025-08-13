import { useRef, useState, useEffect, useCallback, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => ReactNode
  overscan?: number
  className?: string
  containerClassName?: string
  onScroll?: (scrollTop: number) => void
  estimatedItemHeight?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  containerClassName,
  onScroll,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Calculate item heights
  const getItemHeight = useCallback((index: number) => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight
  }, [itemHeight])

  // Calculate total height
  const totalHeight = items.reduce((acc, _, index) => {
    return acc + getItemHeight(index)
  }, 0)

  // Calculate visible range
  const getVisibleRange = useCallback(() => {
    let accumulatedHeight = 0
    let startIndex = 0
    let endIndex = items.length - 1

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i)
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
      accumulatedHeight += height
    }

    // Find end index
    accumulatedHeight = 0
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > containerHeight + scrollTop) {
        endIndex = Math.min(items.length - 1, i + overscan)
        break
      }
      accumulatedHeight += getItemHeight(i)
    }

    return { startIndex, endIndex }
  }, [items.length, scrollTop, containerHeight, overscan, getItemHeight])

  // Calculate offset for visible items
  const getItemOffset = useCallback((index: number) => {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i)
    }
    return offset
  }, [getItemHeight])

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }, [onScroll])

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const { startIndex, endIndex } = getVisibleRange()
  const visibleItems = items.slice(startIndex, endIndex + 1)

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', containerClassName)}
      onScroll={handleScroll}
    >
      <div
        className={cn('relative', className)}
        style={{ height: totalHeight }}
      >
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index
          const offset = getItemOffset(actualIndex)
          const height = getItemHeight(actualIndex)

          return (
            <div
              key={actualIndex}
              className="absolute left-0 right-0"
              style={{
                top: offset,
                height
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Hook for dynamic height virtual list
export function useVirtualList<T>({
  items,
  estimatedItemHeight = 50,
  containerRef,
  overscan = 3
}: {
  items: T[]
  estimatedItemHeight?: number
  containerRef: React.RefObject<HTMLElement>
  overscan?: number
}) {
  const [measurements, setMeasurements] = useState<Map<number, number>>(new Map())
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Get item height (measured or estimated)
  const getItemHeight = useCallback((index: number) => {
    return measurements.get(index) || estimatedItemHeight
  }, [measurements, estimatedItemHeight])

  // Measure item
  const measureItem = useCallback((index: number, element: HTMLElement | null) => {
    if (!element) return

    const height = element.getBoundingClientRect().height
    setMeasurements(prev => {
      const next = new Map(prev)
      next.set(index, height)
      return next
    })
  }, [])

  // Calculate total height
  const totalHeight = items.reduce((acc, _, index) => {
    return acc + getItemHeight(index)
  }, 0)

  // Calculate visible range
  const getVisibleRange = useCallback(() => {
    let accumulatedHeight = 0
    let startIndex = 0
    let endIndex = items.length - 1

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i)
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
      accumulatedHeight += height
    }

    // Find end index
    accumulatedHeight = 0
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > containerHeight + scrollTop) {
        endIndex = Math.min(items.length - 1, i + overscan)
        break
      }
      accumulatedHeight += getItemHeight(i)
    }

    return { startIndex, endIndex }
  }, [items.length, scrollTop, containerHeight, overscan, getItemHeight])

  // Update scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef])

  // Update container height
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateHeight = () => {
      setContainerHeight(container.clientHeight)
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [containerRef])

  return {
    totalHeight,
    visibleRange: getVisibleRange(),
    measureItem,
    getItemHeight,
    getItemOffset: (index: number) => {
      let offset = 0
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i)
      }
      return offset
    }
  }
}