/**
 * Bookmark Card Component
 * Display a single bookmarked item
 */

import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { OptimizedImage } from '@/shared/components/OptimizedImage'
import { Bookmark } from '@/shared/services/bookmark.service'
import { ExternalLink, Trash2, Calendar, FileText } from 'lucide-react'
import { toast } from '@/shared/services/toast.service'
import { cn } from '@/shared/lib/utils'

interface BookmarkCardProps {
  bookmark: Bookmark
  onRemove: (contentId: string) => void
}

const contentTypeConfig = {
  article: {
    icon: FileText,
    label: 'Article',
    linkPrefix: '/news/'
  },
  event: {
    icon: Calendar,
    label: 'Event',
    linkPrefix: '/events/'
  },
  place: {
    icon: MapPin,
    label: 'Place',
    linkPrefix: '/places/'
  },
  dining: {
    icon: UtensilsCrossed,
    label: 'Restaurant',
    linkPrefix: '/dining/'
  },
  service: {
    icon: Building,
    label: 'Service',
    linkPrefix: '/services/'
  }
}

import { MapPin, UtensilsCrossed, Building } from 'lucide-react'

export function BookmarkCard({ bookmark, onRemove }: BookmarkCardProps) {
  const config = contentTypeConfig[bookmark.contentType]
  const Icon = config.icon

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await onRemove(bookmark.contentId)
      toast.success('Bookmark removed')
    } catch (error) {
      toast.error('Failed to remove bookmark')
    }
  }

  const contentLink = bookmark.url || `${config.linkPrefix}${bookmark.contentId}`
  const isExternal = bookmark.url?.startsWith('http')

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <Link
        to={isExternal ? '#' : contentLink}
        onClick={isExternal ? (e) => {
          e.preventDefault()
          window.open(bookmark.url, '_blank', 'noopener,noreferrer')
        } : undefined}
        className="block"
      >
        {bookmark.imageUrl && (
          <div className="relative aspect-video overflow-hidden bg-gray-100">
            <OptimizedImage
              src={bookmark.imageUrl}
              alt={bookmark.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 left-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                "bg-white/90 backdrop-blur-sm text-gray-700"
              )}>
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
            </div>
          </div>
        )}
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {bookmark.title}
          </h3>
          
          {bookmark.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {bookmark.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
            </span>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isExternal && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRemove}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Remove bookmark"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}