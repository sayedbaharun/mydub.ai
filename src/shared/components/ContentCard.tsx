import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { CompactTTSButton } from '@/shared/components/accessibility/CompactTTSButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Bookmark,
  Share2,
  MoreVertical,
  Calendar,
  MapPin,
  Building,
  Newspaper,
  Cloud,
  Car,
  Flag,
  ExternalLink,
} from 'lucide-react'
import { BaseContent, GovernmentUpdate, NewsArticle, TourismItem } from '@/shared/types'
import { cn } from '@/shared/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface ContentCardProps {
  content: BaseContent
  className?: string
  variant?: 'default' | 'compact' | 'featured'
}

const contentTypeConfig = {
  government: {
    icon: Building,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    label: 'Government',
  },
  news: {
    icon: Newspaper,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'News',
  },
  event: {
    icon: Calendar,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Event',
  },
  tourism: {
    icon: MapPin,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Tourism',
  },
  traffic: {
    icon: Car,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Traffic',
  },
  weather: {
    icon: Cloud,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    label: 'Weather',
  },
}

export function ContentCard({ content, className, variant = 'default' }: ContentCardProps) {
  const { t } = useTranslation()
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  const config = contentTypeConfig[content.type]
  const Icon = config.icon

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // TODO: Save bookmark to user preferences
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description,
          url: window.location.origin + `/content/${content.id}`,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/content/${content.id}`)
      // TODO: Show toast notification
    }
  }

  const getContentLink = () => {
    switch (content.type) {
      case 'government':
        return `/government/${content.id}`
      case 'news':
        return `/news/${content.id}`
      case 'tourism':
        return `/tourism/${content.id}`
      default:
        return `/content/${content.id}`
    }
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded', config.bgColor)}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <Link to={getContentLink()} className="hover:underline">
            <h4 className="font-medium line-clamp-2">{content.title}</h4>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      'hover:shadow-lg transition-shadow overflow-hidden',
      variant === 'featured' && 'md:col-span-2 lg:col-span-2',
      className
    )}>
      {/* Image */}
      {content.imageUrl && (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={content.imageUrl}
            alt={content.title}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2">
            <Badge className={cn('gap-1', config.bgColor, config.color)}>
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link to={getContentLink()}>
              <CardTitle className="line-clamp-2 hover:underline">
                {content.title}
              </CardTitle>
            </Link>
            <CardDescription className="mt-1">
              {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBookmark}>
                <Bookmark className={cn('mr-2 h-4 w-4', isBookmarked && 'fill-current')} />
                {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={getContentLink()}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground line-clamp-3">
          {content.description}
        </p>

        {/* Type-specific content */}
        {content.type === 'government' && (content as GovernmentUpdate).department && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{(content as GovernmentUpdate).department}</span>
          </div>
        )}

        {content.type === 'news' && (content as NewsArticle).source && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span>{(content as NewsArticle).source}</span>
          </div>
        )}

        {content.type === 'tourism' && (content as TourismItem).location && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{(content as TourismItem).location.address}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <CompactTTSButton
              text={`${content.title}. ${content.description}`}
              title={content.title}
              language="en"
              variant="ghost"
              size="sm"
              showLabel={true}
            />
            <Button variant="ghost" size="sm" onClick={handleBookmark}>
              <Bookmark className={cn('h-4 w-4 mr-2', isBookmarked && 'fill-current')} />
              {isBookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}