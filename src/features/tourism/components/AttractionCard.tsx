import { useState } from 'react'
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink,
  Navigation,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Attraction } from '../types'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

interface AttractionCardProps {
  attraction: Attraction
  onViewDetails?: (attraction: Attraction) => void
  onNavigate?: (attraction: Attraction) => void
  variant?: 'default' | 'compact' | 'featured'
}

export function AttractionCard({ 
  attraction, 
  onViewDetails,
  onNavigate,
  variant = 'default' 
}: AttractionCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsBookmarked(!isBookmarked)
    toast.success(
      isBookmarked 
        ? t('bookmarkRemoved') 
        : t('bookmarkAdded')
    )
  }

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNavigate?.(attraction)
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      landmark: '🏛️',
      beach: '🏖️',
      shopping: '🛍️',
      entertainment: '🎭',
      culture: '🎨',
      dining: '🍽️',
      adventure: '🎢',
      family: '👨‍👩‍👧‍👦'
    }
    return icons[category] || '📍'
  }

  const getPriceLevelDisplay = (level: number) => {
    if (level === 1) return { text: t('free'), color: 'text-green-600' }
    return {
      text: Array(level).fill('$').join(''),
      color: level <= 2 ? 'text-green-600' : level <= 3 ? 'text-yellow-600' : 'text-red-600'
    }
  }

  const isOpenNow = () => {
    if (!attraction.openingHours) return null
    
    const now = new Date()
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const hours = attraction.openingHours[day]
    
    if (!hours || hours.isClosed) return false
    if (hours.isOpen24Hours) return true
    
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [openHour, openMin] = hours.open.split(':').map(Number)
    const [closeHour, closeMin] = hours.close.split(':').map(Number)
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin
    
    return currentTime >= openTime && currentTime <= closeTime
  }

  if (variant === 'compact') {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onViewDetails?.(attraction)}
      >
        <CardContent className="p-4">
          <div className={cn(
            "flex gap-4",
            isRTL && "flex-row-reverse"
          )}>
            {attraction.images[0] && (
              <img
                src={attraction.images[0]}
                alt={attraction.name}
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "flex items-start justify-between gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <h3 className={cn(
                  "font-semibold truncate",
                  isRTL && "text-right"
                )}>
                  <span className="mr-2">{getCategoryIcon(attraction.category)}</span>
                  {isRTL ? attraction.nameAr : attraction.name}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBookmark}
                  className="h-8 w-8 shrink-0"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className={cn(
                "flex items-center gap-3 mt-1 text-sm text-muted-foreground",
                isRTL && "flex-row-reverse"
              )}>
                <div className={cn(
                  "flex items-center gap-1",
                  isRTL && "flex-row-reverse"
                )}>
                  <MapPin className="h-3 w-3" />
                  <span>{isRTL ? attraction.location.areaAr : attraction.location.area}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1",
                  isRTL && "flex-row-reverse"
                )}>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{attraction.rating}</span>
                </div>
                <span className={getPriceLevelDisplay(attraction.priceLevel).color}>
                  {getPriceLevelDisplay(attraction.priceLevel).text}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-lg transition-shadow",
        variant === 'featured' && "md:col-span-2 md:row-span-2"
      )}
      onClick={() => onViewDetails?.(attraction)}
    >
      {attraction.images[0] && (
        <div className="relative aspect-video">
          <img
            src={attraction.images[0]}
            alt={attraction.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 right-2">
            <div className={cn(
              "flex items-center justify-between",
              isRTL && "flex-row-reverse"
            )}>
              <Badge className="bg-white/90 text-black">
                {getCategoryIcon(attraction.category)} {t(`tourism.category.${attraction.category}`)}
              </Badge>
              {attraction.nearbyMetro && (
                <Badge variant="secondary" className="bg-white/90">
                  🚇 {attraction.nearbyMetro}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className={cn(
          "flex items-start justify-between gap-2",
          isRTL && "flex-row-reverse"
        )}>
          <h3 className={cn(
            "font-bold text-lg",
            variant === 'featured' && "text-xl",
            isRTL && "text-right"
          )}>
            {isRTL ? attraction.nameAr : attraction.name}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className="h-8 w-8 shrink-0"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className={cn(
          "flex items-center gap-3 text-sm text-muted-foreground mt-2",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn(
            "flex items-center gap-1",
            isRTL && "flex-row-reverse"
          )}>
            <MapPin className="h-3 w-3" />
            <span>{isRTL ? attraction.location.areaAr : attraction.location.area}</span>
          </div>
          <div className={cn(
            "flex items-center gap-1",
            isRTL && "flex-row-reverse"
          )}>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{attraction.rating} ({(attraction.reviewCount || 0).toLocaleString()})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className={cn(
          "text-sm text-muted-foreground line-clamp-2 mb-3",
          isRTL && "text-right"
        )}>
          {isRTL ? attraction.descriptionAr : attraction.description}
        </p>

        <div className={cn(
          "flex items-center justify-between mb-3",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            isRTL && "flex-row-reverse"
          )}>
            <div className={cn(
              "flex items-center gap-1",
              isRTL && "flex-row-reverse"
            )}>
              <DollarSign className="h-4 w-4" />
              <span className={getPriceLevelDisplay(attraction.priceLevel).color}>
                {getPriceLevelDisplay(attraction.priceLevel).text}
              </span>
            </div>
            {attraction.openingHours && (
              <div className={cn(
                "flex items-center gap-1",
                isRTL && "flex-row-reverse"
              )}>
                <Clock className="h-4 w-4" />
                <span className={cn(
                  "text-sm",
                  isOpenNow() ? "text-green-600" : "text-red-600"
                )}>
                  {isOpenNow() ? t('openNow') : t('closedNow')}
                </span>
              </div>
            )}
          </div>
        </div>

        {attraction.features && attraction.features.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mb-3",
            isRTL && "flex-row-reverse"
          )}>
            {attraction.features.slice(0, 3).map((feature) => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {attraction.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{attraction.features.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className={cn(
          "flex gap-2",
          isRTL && "flex-row-reverse"
        )}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigate}
            className={cn(
              "flex-1 gap-2",
              isRTL && "flex-row-reverse"
            )}
          >
            <Navigation className="h-4 w-4" />
                            {t('navigate')}
          </Button>
          {attraction.bookingUrl && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                window.open(attraction.bookingUrl, '_blank')
              }}
              className={cn(
                "flex-1 gap-2",
                isRTL && "flex-row-reverse"
              )}
            >
              <ExternalLink className="h-4 w-4" />
                              {t('book')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}