import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  ExternalLink,
  Share2,
  Bookmark,
  DollarSign,
  Clock,
  Phone,
  Globe,
  Navigation,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { TourismItem } from '@/shared/types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/shared/lib/utils'

const categoryConfig = {
  attraction: { color: 'bg-purple-100 text-purple-800', label: 'Attraction' },
  restaurant: { color: 'bg-orange-100 text-orange-800', label: 'Restaurant' },
  hotel: { color: 'bg-blue-100 text-blue-800', label: 'Hotel' },
  activity: { color: 'bg-green-100 text-green-800', label: 'Activity' },
}

export function TourismDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [item, setItem] = useState<TourismItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        // TODO: Replace with actual API call to fetch tourism item
        // const response = await supabase.from('tourism_items').select('*').eq('id', id).single()

        // Mock data for demonstration
        const mockItem: TourismItem = {
          id: id,
          type: 'tourism',
          title: 'Burj Khalifa',
          description:
            "The world's tallest building, offering breathtaking views of Dubai from its observation decks. An architectural marvel that stands as a symbol of Dubai's ambition and innovation.",
          imageUrl: '/icons/icon-512x512.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: 'attraction',
          location: {
            lat: 25.197525,
            lng: 55.274288,
            address: '1 Sheikh Mohammed bin Rashid Blvd, Dubai, UAE',
          },
          rating: 4.8,
          priceRange: 'AED 149 - AED 500',
          bookingUrl: 'https://www.burjkhalifa.ae/tickets',
        }

        setItem(mockItem)
      } catch (err: any) {
        setError(err.message || 'Failed to load tourism item')
      } finally {
        setIsLoading(false)
      }
    }

    fetchItem()
  }, [id])

  const handleShare = async () => {
    if (!item) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
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

  const handleDirections = () => {
    if (item?.location) {
      const { lat, lng } = item.location
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      window.open(url, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" text="Loading tourism information..." />
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Tourism Item Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            {error || 'The tourism information you are looking for could not be found.'}
          </p>
          <Button onClick={() => navigate('/tourism')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tourism
          </Button>
        </div>
      </div>
    )
  }

  const categoryStyle = categoryConfig[item.category]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/tourism')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tourism
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Badge className="gap-2 bg-green-100 text-green-800">
                <MapPin className="h-3 w-3" />
                Tourism
              </Badge>
              <Badge className={cn('gap-1', categoryStyle.color)}>{categoryStyle.label}</Badge>
              {item.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{item.rating}</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold leading-tight">{item.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{item.description}</p>
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
      {item.imageUrl && (
        <div className="mb-8">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-8 flex gap-3">
        {item.bookingUrl && (
          <Button size="lg" asChild>
            <a href={item.bookingUrl} target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-4 w-4" />
              Book Now
            </a>
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={handleDirections}>
          <Navigation className="mr-2 h-4 w-4" />
          Get Directions
        </Button>
      </div>

      {/* Content Body */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About This {categoryStyle.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-lg leading-relaxed">{item.description}</p>

              {/* Additional Information */}
              <div className="space-y-4">
                <Separator />

                <div>
                  <h3 className="mb-3 text-lg font-semibold">Location & Details</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Address</div>
                        <div className="text-muted-foreground">{item.location.address}</div>
                      </div>
                    </div>

                    {item.rating && (
                      <div className="flex items-start gap-2">
                        <Star className="mt-1 h-4 w-4 text-yellow-400" />
                        <div>
                          <div className="text-sm font-medium">Rating</div>
                          <div className="text-muted-foreground">{item.rating} out of 5</div>
                        </div>
                      </div>
                    )}

                    {item.priceRange && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="mt-1 h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Price Range</div>
                          <div className="text-muted-foreground">{item.priceRange}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Clock className="mt-1 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Operating Hours</div>
                        <div className="text-muted-foreground">Daily 8:30 AM - 11:00 PM</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map placeholder */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">Location Map</h3>
                  <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="mx-auto mb-2 h-8 w-8" />
                      <p>Interactive map will be displayed here</p>
                      <Button variant="link" onClick={handleDirections}>
                        Open in Google Maps
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">Category</div>
                <Badge className={cn('mt-1', categoryStyle.color)}>{categoryStyle.label}</Badge>
              </div>

              {item.rating && (
                <div>
                  <div className="text-sm font-medium">Rating</div>
                  <div className="mt-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < Math.floor(item.rating!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                    <span className="ml-1 text-sm text-muted-foreground">{item.rating} / 5</span>
                  </div>
                </div>
              )}

              {item.priceRange && (
                <div>
                  <div className="text-sm font-medium">Price Range</div>
                  <div className="text-muted-foreground">{item.priceRange}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium">Last Updated</div>
                <div className="text-muted-foreground">
                  {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.bookingUrl && (
                <Button className="w-full" asChild>
                  <a href={item.bookingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Book Online
                  </a>
                </Button>
              )}

              <Button variant="outline" className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                Call for Information
              </Button>

              <Button variant="outline" className="w-full">
                <Globe className="mr-2 h-4 w-4" />
                Visit Website
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Similar Places</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Similar {item.category}s in Dubai will be displayed here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TourismDetailPage
