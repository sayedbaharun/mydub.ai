import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  Share2,
  Bookmark,
  ExternalLink,
  Clock,
  Eye,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { TextToSpeechPlayer } from '@/shared/components/accessibility/TextToSpeechPlayer'
import { BaseContent, GovernmentUpdate, NewsArticle, TourismItem } from '@/shared/types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/shared/lib/utils'

const contentTypeConfig = {
  government: {
    icon: Building,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    label: 'Government Update',
  },
  news: {
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'News Article',
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
    icon: Clock,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Traffic Update',
  },
  weather: {
    icon: Clock,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    label: 'Weather Update',
  },
}

export function ContentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [content, setContent] = useState<BaseContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        // TODO: Replace with actual API call
        // For now, we'll create a mock content item
        const mockContent: BaseContent = {
          id: id,
          type: 'news',
          title: 'Sample Content Title',
          description:
            'This is a sample content description that shows what a detailed content page would look like. In the actual implementation, this would be fetched from the Supabase database.',
          imageUrl: '/icons/icon-512x512.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setContent(mockContent)
      } catch (err: any) {
        setError(err.message || 'Failed to load content')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [id])

  const handleShare = async () => {
    if (!content) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // TODO: Save bookmark to user preferences
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" text="Loading content..." />
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Content Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            {error || 'The content you are looking for could not be found.'}
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const config = contentTypeConfig[content.type]
  const Icon = config.icon

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Badge className={cn('gap-2', config.bgColor, config.color)}>
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight">{content.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBookmark}>
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Image */}
      {content.imageUrl && (
        <div className="mb-8">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <img
              src={content.imageUrl}
              alt={content.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Text-to-Speech Player */}
      <div className="mb-8">
        <TextToSpeechPlayer
          text={`${content.title}. ${content.description}`}
          title={content.title}
          language="en"
          showFullControls={true}
        />
      </div>

      {/* Content Body */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{content.description}</p>

              {/* Type-specific content */}
              {content.type === 'government' && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold">Department Information</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{(content as GovernmentUpdate).department || 'General'}</span>
                  </div>
                  {(content as GovernmentUpdate).documentUrl && (
                    <div className="mt-4">
                      <Button variant="outline" asChild>
                        <a
                          href={(content as GovernmentUpdate).documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Official Document
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {content.type === 'news' && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold">Article Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Source:</span>
                      <span>{(content as NewsArticle).source || 'Unknown'}</span>
                    </div>
                    {(content as NewsArticle).author && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Author:</span>
                        <span>{(content as NewsArticle).author}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Published:</span>
                      <span>
                        {formatDistanceToNow(
                          new Date((content as NewsArticle).publishedAt || content.createdAt),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  </div>

                  {(content as NewsArticle).fullContent && (
                    <div className="mt-6">
                      <Separator className="mb-4" />
                      <div className="prose prose-sm max-w-none">
                        <p>{(content as NewsArticle).fullContent}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {content.type === 'tourism' && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold">Location & Details</h3>
                  {(content as TourismItem).location && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{(content as TourismItem).location.address}</span>
                      </div>
                      {(content as TourismItem).rating && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Rating:</span>
                          <span>{(content as TourismItem).rating}/5</span>
                        </div>
                      )}
                      {(content as TourismItem).priceRange && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Price Range:</span>
                          <span>{(content as TourismItem).priceRange}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(content as TourismItem).bookingUrl && (
                    <div className="mt-4">
                      <Button asChild>
                        <a
                          href={(content as TourismItem).bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Book Now
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-muted-foreground">
                    {new Date(content.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-muted-foreground">
                    {new Date(content.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Views</div>
                  <div className="text-muted-foreground">Coming soon</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Related content recommendations will be displayed here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ContentDetailPage
