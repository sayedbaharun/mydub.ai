/**
 * Bookmark Button Component
 * Reusable button for bookmarking content
 */

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/shared/components/ui/button'
import { bookmarkService } from '@/shared/services/bookmark.service'
import { useAuth } from '@/features/auth/context/AuthContext'
import { toast } from '@/shared/services/toast.service'
import { cn } from '@/shared/lib/utils'

interface BookmarkButtonProps {
  contentId: string
  contentType: 'article' | 'event' | 'place' | 'dining' | 'service'
  title: string
  description?: string
  imageUrl?: string
  url?: string
  variant?: 'default' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  onBookmarkChange?: (isBookmarked: boolean) => void
}

export function BookmarkButton({
  contentId,
  contentType,
  title,
  description,
  imageUrl,
  url,
  variant = 'ghost',
  size = 'md',
  showLabel = false,
  className,
  onBookmarkChange
}: BookmarkButtonProps) {
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check bookmark status on mount
  useEffect(() => {
    checkBookmarkStatus()
  }, [contentId, user?.id])

  const checkBookmarkStatus = async () => {
    try {
      const bookmarked = await bookmarkService.isBookmarked(contentId, user?.id)
      setIsBookmarked(bookmarked)
    } catch (error) {
      console.error('Error checking bookmark status:', error)
    }
  }

  const handleToggleBookmark = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const newStatus = await bookmarkService.toggleBookmark(
        {
          contentId,
          contentType,
          title,
          description,
          imageUrl,
          url
        },
        user?.id
      )

      setIsBookmarked(newStatus)
      onBookmarkChange?.(newStatus)

      // Show toast notification
      if (newStatus) {
        toast.success('Added to bookmarks', {
          action: {
            label: 'View All',
            onClick: () => window.location.href = '/bookmarks'
          }
        })
      } else {
        toast.info('Removed from bookmarks')
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast.error('Failed to update bookmark')
    } finally {
      setIsLoading(false)
    }
  }

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[size]

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleBookmark}
        disabled={isLoading}
        className={cn(
          'relative transition-colors',
          isBookmarked && 'text-blue-600 hover:text-blue-700',
          className
        )}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        <AnimatePresence mode="wait">
          {isBookmarked ? (
            <motion.div
              key="bookmarked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
            >
              <BookmarkCheck className={iconSize} fill="currentColor" />
            </motion.div>
          ) : (
            <motion.div
              key="not-bookmarked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
            >
              <Bookmark className={iconSize} />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleBookmark}
      disabled={isLoading}
      className={cn(
        'gap-2 transition-all',
        isBookmarked && variant === 'ghost' && 'text-blue-600 hover:text-blue-700',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isBookmarked ? (
          <motion.div
            key="bookmarked"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 180, scale: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <BookmarkCheck className={iconSize} fill="currentColor" />
            {showLabel && <span>Bookmarked</span>}
          </motion.div>
        ) : (
          <motion.div
            key="not-bookmarked"
            initial={{ rotate: 180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: -180, scale: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <Bookmark className={iconSize} />
            {showLabel && <span>Bookmark</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}