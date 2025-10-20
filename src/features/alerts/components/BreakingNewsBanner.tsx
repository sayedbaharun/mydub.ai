/**
 * Breaking News Banner Component
 * Prominent banner for breaking news alerts
 */

import { useState, useEffect } from 'react'
import { X, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useRealtimeUpdates } from '@/features/realtime/hooks/useRealtimeUpdates'
import { cn } from '@/shared/lib/utils'
import { Link } from 'react-router-dom'

interface BreakingNewsBannerProps {
  className?: string
  autoHide?: boolean
  autoHideDelay?: number // milliseconds
}

export function BreakingNewsBanner({
  className,
  autoHide = false,
  autoHideDelay = 30000, // 30 seconds
}: BreakingNewsBannerProps) {
  const { breakingNews, clearBreakingNews } = useRealtimeUpdates()
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const currentNews = breakingNews[currentNewsIndex]

  // Show banner when breaking news arrives
  useEffect(() => {
    if (breakingNews.length > 0 && !isDismissed) {
      setIsVisible(true)

      // Auto-hide after delay
      if (autoHide && autoHideDelay) {
        const timer = setTimeout(() => {
          setIsVisible(false)
        }, autoHideDelay)

        return () => clearTimeout(timer)
      }
    }
  }, [breakingNews.length, isDismissed, autoHide, autoHideDelay])

  // Cycle through multiple breaking news
  useEffect(() => {
    if (breakingNews.length <= 1) return

    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % breakingNews.length)
    }, 10000) // Change every 10 seconds

    return () => clearInterval(interval)
  }, [breakingNews.length])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    clearBreakingNews()
  }

  const handleNext = () => {
    if (breakingNews.length > 1) {
      setCurrentNewsIndex((prev) => (prev + 1) % breakingNews.length)
    }
  }

  if (!currentNews || !isVisible) return null

  const urgencyColor = getUrgencyColor(currentNews.urgencyLevel)

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300',
        className
      )}
    >
      <div className={cn('border-b shadow-lg', urgencyColor.border, urgencyColor.bg)}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Breaking News Badge */}
            <div className="flex-shrink-0">
              <Badge className={cn('text-xs font-bold uppercase', urgencyColor.badge)}>
                <AlertCircle className="mr-1 h-3 w-3 animate-pulse" />
                Breaking News
              </Badge>
            </div>

            {/* News Content */}
            <div className="flex-1 min-w-0">
              <Link
                to={`/news/${currentNews.articleId}`}
                className="group block hover:opacity-80 transition-opacity"
              >
                <h3 className={cn('font-semibold text-sm line-clamp-1', urgencyColor.text)}>
                  {currentNews.title}
                </h3>
                {currentNews.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {currentNews.summary}
                  </p>
                )}
              </Link>
            </div>

            {/* Urgency Indicator */}
            <div className="flex-shrink-0 hidden sm:flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">Urgency:</span>
              <UrgencyMeter level={currentNews.urgencyLevel} />
            </div>

            {/* Multiple News Indicator */}
            {breakingNews.length > 1 && (
              <div className="flex-shrink-0 hidden md:flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentNewsIndex + 1} of {breakingNews.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleNext}
                  aria-label="Next breaking news"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* View Article Link */}
            <Link to={`/news/${currentNews.articleId}`}>
              <Button variant="outline" size="sm" className="h-8 gap-1 hidden lg:flex">
                Read More
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>

            {/* Dismiss Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss breaking news"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Urgency Meter Component
 */
function UrgencyMeter({ level }: { level: number }) {
  const getColor = () => {
    if (level >= 8) return 'bg-red-500'
    if (level >= 6) return 'bg-orange-500'
    if (level >= 4) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 w-1 rounded-full transition-all',
            i < level ? getColor() : 'bg-gray-300 dark:bg-gray-700'
          )}
        />
      ))}
    </div>
  )
}

/**
 * Get urgency-based color scheme
 */
function getUrgencyColor(level: number) {
  if (level >= 8) {
    // Critical (8-10)
    return {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-900',
      badge: 'bg-red-600 text-white',
      text: 'text-red-900 dark:text-red-100',
    }
  } else if (level >= 6) {
    // High (6-7)
    return {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-900',
      badge: 'bg-orange-600 text-white',
      text: 'text-orange-900 dark:text-orange-100',
    }
  } else if (level >= 4) {
    // Medium (4-5)
    return {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-900',
      badge: 'bg-yellow-600 text-white',
      text: 'text-yellow-900 dark:text-yellow-100',
    }
  } else {
    // Low (1-3)
    return {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-900',
      badge: 'bg-blue-600 text-white',
      text: 'text-blue-900 dark:text-blue-100',
    }
  }
}
