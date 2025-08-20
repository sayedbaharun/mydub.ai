import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Search,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
// Removed unused UI imports
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { AttractionCard } from '../components/AttractionCard'
import { TourismMap } from '../components/TourismMap'
import { EventCalendar } from '../components/EventCalendar'
import { TourismService } from '../services/tourism.service'
import { Attraction, Event, TourismFilters } from '../types'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function TourismPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, i18n } = useTranslation('tourism')
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  // State
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  // Removed unused showFilters state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Filters
  const [filters, setFilters] = useState<TourismFilters>({
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    areas: searchParams.get('areas')?.split(',').filter(Boolean) || [],
    priceRange: {
      min: parseInt(searchParams.get('minPrice') || '1'),
      max: parseInt(searchParams.get('maxPrice') || '5')
    },
    rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
    features: searchParams.get('features')?.split(',').filter(Boolean) || [],
    search: searchParams.get('search') || ''
  })

  // Removed unused unique areas/features

  // Load attractions
  const loadAttractions = async () => {
    try {
      setLoading(true)
      const data = await TourismService.getAttractions(filters)
      setAttractions(data)
    } catch (error) {
      toast.error(t('loadError'))
      console.error('Error loading attractions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load events
  const loadEvents = async () => {
    try {
      const data = await TourismService.getUpcomingEvents(20)
      setEvents(data)
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  // Request user location on demand
  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.info(t('geolocationUnsupported', { defaultValue: 'Geolocation is not supported by your browser.' }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        toast.success(t('geolocationEnabled', { defaultValue: 'Location enabled for nearby results.' }))
      },
      (error) => {
        if (import.meta.env.VITE_VERBOSE_DEBUG === 'true') {
          console.warn('Geolocation error:', error)
        }
        // Graceful message without noisy console errors
        toast.info(t('geolocationDenied', { defaultValue: 'Location access denied or unavailable. You can still explore the map.' }))
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','))
    }
    if (filters.areas.length > 0) {
      params.set('areas', filters.areas.join(','))
    }
    if (filters.priceRange.min !== 1) {
      params.set('minPrice', filters.priceRange.min.toString())
    }
    if (filters.priceRange.max !== 5) {
      params.set('maxPrice', filters.priceRange.max.toString())
    }
    if (filters.rating) {
      params.set('rating', filters.rating.toString())
    }
    if (filters.features.length > 0) {
      params.set('features', filters.features.join(','))
    }
    if (filters.search) {
      params.set('search', filters.search)
    }

    setSearchParams(params)
  }, [filters, setSearchParams])

  // Load data on mount and filter change
  useEffect(() => {
    loadAttractions()
    loadEvents()
  }, [filters])

  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value
    }))
  }

  const handleNavigate = (attraction: Attraction) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${attraction.location.lat},${attraction.location.lng}`
    window.open(url, '_blank')
  }

  const handleEventSelect = (event: Event) => {
    if (event.bookingUrl) {
      window.open(event.bookingUrl, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Clean Header */}
        <div className="mb-12">
          <h1 className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-light text-midnight-black tracking-tight mb-2",
            isRTL && "text-right"
          )}>
            {t('title')}
          </h1>
          <p className={cn(
            "text-base text-gray-500",
            isRTL && "text-right"
          )}>
            {t('subtitle')}
          </p>
        </div>

        {/* Simple Tabs */}
        <Tabs defaultValue="attractions" className="space-y-8">
          <div className={cn(
            "flex gap-8 border-b border-gray-100 mb-8",
            isRTL && "flex-row-reverse"
          )}>
            <TabsList className="bg-transparent border-0 h-auto p-0">
              <TabsTrigger 
                value="attractions" 
                className="bg-transparent border-0 text-gray-600 data-[state=active]:text-midnight-black data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-midnight-black font-medium"
              >
                {t('attractions')}
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                className="bg-transparent border-0 text-gray-600 data-[state=active]:text-midnight-black data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-midnight-black font-medium ml-8"
              >
                {t('events')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Attractions Tab */}
          <TabsContent value="attractions" className="space-y-8">
            {/* Simple Search */}
            <div className={cn(
              "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between",
              isRTL && "sm:flex-row-reverse"
            )}>
              <div className="relative max-w-md">
                <Search className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400",
                  isRTL && "left-auto right-4"
                )} />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={cn(
                    "pl-12 h-12 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:border-gray-300 shadow-sm",
                    isRTL && "pl-4 pr-12"
                  )}
                />
              </div>
              
              {/* View Toggle */}
              <div className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <div className={cn(
                  'flex gap-1 bg-gray-50 p-1 rounded-lg',
                  isRTL && 'flex-row-reverse'
                )}>
                  <button
                    onClick={() => setView('grid')}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                      view === 'grid'
                        ? 'bg-white text-midnight-black shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {t('grid')}
                  </button>
                  <button
                    onClick={() => setView('map')}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                      view === 'map'
                        ? 'bg-white text-midnight-black shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {t('map')}
                  </button>
                </div>
                {!userLocation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestLocation}
                    className="ml-2"
                  >
                    {t('useMyLocation', { defaultValue: 'Use my location' })}
                  </Button>
                )}
              </div>
            </div>

            {/* Simple Category Filters */}
            <div className={cn(
              "flex flex-wrap gap-2 mb-8",
              isRTL && "flex-row-reverse justify-end"
            )}>
              {[
                { value: 'all', label: t('all') },
                { value: 'landmark', label: t('category.landmark') },
                { value: 'beach', label: t('category.beach') },
                { value: 'shopping', label: t('category.shopping') },
                { value: 'entertainment', label: t('category.entertainment') },
                { value: 'culture', label: t('category.culture') }
              ].map((category) => (
                <button
                  key={category.value}
                  onClick={() => {
                    if (category.value === 'all') {
                      setFilters(prev => ({ ...prev, categories: [] }))
                    } else {
                      setFilters(prev => ({
                        ...prev,
                        categories: filters.categories.includes(category.value)
                          ? filters.categories.filter(c => c !== category.value)
                          : [category.value]
                      }))
                    }
                  }}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                    (category.value === 'all' && filters.categories.length === 0) || 
                    filters.categories.includes(category.value)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Clean Content */}
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : view === 'grid' ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {attractions.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <p className="text-gray-500">{t('noAttractions')}</p>
                  </div>
                ) : (
                  attractions.map((attraction) => (
                    <AttractionCard
                      key={attraction.id}
                      attraction={attraction}
                      variant="default"
                      onViewDetails={setSelectedAttraction}
                      onNavigate={handleNavigate}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
                <TourismMap
                  attractions={attractions}
                  selectedAttraction={selectedAttraction}
                  onAttractionSelect={setSelectedAttraction}
                  userLocation={userLocation}
                />
              </div>
            )}
        </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-8">
            <EventCalendar
              events={events}
              onEventSelect={handleEventSelect}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}