import { useEffect, useRef, useState } from 'react'
import {  Navigation, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Attraction } from '../types'
import { useTranslation } from 'react-i18next'

interface TourismMapProps {
  attractions: Attraction[]
  selectedAttraction?: Attraction | null
  onAttractionSelect?: (attraction: Attraction) => void
  userLocation?: { lat: number; lng: number } | null
  className?: string
}

// Placeholder map component - in production, use Google Maps or Mapbox
export function TourismMap({
  attractions,
  selectedAttraction,
  onAttractionSelect,
  userLocation,
  className
}: TourismMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [hoveredAttraction, setHoveredAttraction] = useState<string | null>(null)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  // In production, initialize Google Maps or Mapbox here
  useEffect(() => {
    if (!mapRef.current) return

    // Placeholder for map initialization
    }, [attractions])

  // Update map when selected attraction changes
  useEffect(() => {
    if (selectedAttraction) {
      // Center map on selected attraction
      }
  }, [selectedAttraction])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      landmark: '#3B82F6',
      beach: '#06B6D4',
      shopping: '#8B5CF6',
      entertainment: '#EC4899',
      culture: '#F59E0B',
      dining: '#10B981',
      adventure: '#EF4444',
      family: '#6366F1'
    }
    return colors[category] || '#6B7280'
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

  return (
    <div className={cn("relative w-full h-full rounded-lg overflow-hidden", className)}>
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-full bg-gray-100 dark:bg-gray-800"
      >
        {/* Placeholder Map Background */}
        <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
          {/* Grid overlay for visual effect */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          
          {/* Placeholder markers */}
          <div className="absolute inset-0">
            {attractions.map((attraction) => {
              // Calculate position based on lat/lng (simplified for demo)
              const x = ((attraction.location.lng - 55.1) / 0.3) * 100
              const y = ((25.3 - attraction.location.lat) / 0.3) * 100
              
              return (
                <div
                  key={attraction.id}
                  className={cn(
                    "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all",
                    selectedAttraction?.id === attraction.id && "z-20",
                    hoveredAttraction === attraction.id && "z-10"
                  )}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onMouseEnter={() => setHoveredAttraction(attraction.id)}
                  onMouseLeave={() => setHoveredAttraction(null)}
                  onClick={() => onAttractionSelect?.(attraction)}
                >
                  {/* Marker */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all",
                      selectedAttraction?.id === attraction.id 
                        ? "w-12 h-12 ring-4 ring-white dark:ring-gray-800" 
                        : hoveredAttraction === attraction.id && "w-11 h-11"
                    )}
                    style={{ backgroundColor: getCategoryColor(attraction.category) }}
                  >
                    <span className="text-lg">{getCategoryIcon(attraction.category)}</span>
                  </div>
                  
                  {/* Tooltip */}
                  {(hoveredAttraction === attraction.id || selectedAttraction?.id === attraction.id) && (
                    <Card className={cn(
                      "absolute bottom-full mb-2 p-2 min-w-[200px] shadow-xl",
                      isRTL ? "right-0" : "left-0"
                    )}>
                      <p className={cn(
                        "font-semibold text-sm",
                        isRTL && "text-right"
                      )}>
                        {isRTL ? attraction.nameAr : attraction.name}
                      </p>
                      <p className={cn(
                        "text-xs text-muted-foreground",
                        isRTL && "text-right"
                      )}>
                        {isRTL ? attraction.location.areaAr : attraction.location.area}
                      </p>
                    </Card>
                  )}
                </div>
              )
            })}
            
            {/* User location marker */}
            {userLocation && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
                style={{
                  left: `${((userLocation.lng - 55.1) / 0.3) * 100}%`,
                  top: `${((25.3 - userLocation.lat) / 0.3) * 100}%`
                }}
              >
                <div className="relative">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping absolute" />
                  <div className="w-4 h-4 bg-blue-500 rounded-full relative" />
                </div>
              </div>
            )}
          </div>
          
          {/* Map Controls */}
          <div className={cn(
            "absolute top-4 right-4 flex flex-col gap-2",
            isRTL && "right-auto left-4"
          )}>
            <Button
              size="icon"
              variant="secondary"
              className="bg-white dark:bg-gray-800 shadow-md"
              onClick={() => {}}
            >
              <span className="text-lg">+</span>
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="bg-white dark:bg-gray-800 shadow-md"
              onClick={() => {}}
            >
              <span className="text-lg">−</span>
            </Button>
            {userLocation && (
              <Button
                size="icon"
                variant="secondary"
                className="bg-white dark:bg-gray-800 shadow-md"
                onClick={() => {}}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Legend */}
          <Card className={cn(
            "absolute bottom-4 left-4 p-3 max-w-xs",
            isRTL && "left-auto right-4"
          )}>
            <h4 className={cn(
              "font-semibold text-sm mb-2",
              isRTL && "text-right"
            )}>
              {t('mapLegend')}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries({
                landmark: t('category.landmark'),
                beach: t('category.beach'),
                shopping: t('category.shopping'),
                entertainment: t('category.entertainment')
              }).map(([key, label]) => (
                <div 
                  key={key}
                  className={cn(
                    "flex items-center gap-2",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(key) }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Selected Attraction Info */}
          {selectedAttraction && (
            <Card className={cn(
              "absolute top-4 left-4 p-4 max-w-sm shadow-xl",
              isRTL && "left-auto right-4"
            )}>
              <div className={cn(
                "flex items-start justify-between gap-2 mb-2",
                isRTL && "flex-row-reverse"
              )}>
                <h3 className={cn(
                  "font-bold text-lg",
                  isRTL && "text-right"
                )}>
                  {isRTL ? selectedAttraction.nameAr : selectedAttraction.name}
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onAttractionSelect?.(null as any)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className={cn(
                "text-sm text-muted-foreground mb-3",
                isRTL && "text-right"
              )}>
                {isRTL ? selectedAttraction.location.addressAr : selectedAttraction.location.address}
              </p>
              <div className={cn(
                "flex gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "flex-1 gap-2",
                    isRTL && "flex-row-reverse"
                  )}
                  onClick={() => {
                    // Open in Google Maps
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedAttraction.location.lat},${selectedAttraction.location.lng}`
                    window.open(url, '_blank')
                  }}
                >
                  <Navigation className="h-4 w-4" />
                  {t('getDirections')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}