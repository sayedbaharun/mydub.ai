import { useState, useEffect } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ExternalLink,
  Search,
  Filter,
  CalendarDays,
  Ticket,
  Users,
  RefreshCw
} from 'lucide-react'
import { TourismService } from '@/features/tourism/services/tourism.service'
import { EventAggregatorService } from '@/shared/services/api/event-aggregator.service'
import { Event } from '@/features/tourism/types'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { format, addDays } from 'date-fns'
import { useStructuredData } from '@/hooks/useStructuredData'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('upcoming')
  
  // Add structured data for SEO
  useStructuredData('events')

  // Filter options
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'culture', label: 'Culture' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'art', label: 'Art & Exhibitions' },
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'music', label: 'Music & Concerts' },
    { value: 'family', label: 'Family & Kids' }
  ]

  const timeframes = [
    { value: 'upcoming', label: 'Upcoming Events' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'all', label: 'All Events' }
  ]

  // Load events
  const loadEvents = async () => {
    try {
      setLoading(true)
      let fetchedEvents: Event[] = []
      
      if (selectedTimeframe === 'upcoming') {
        fetchedEvents = await TourismService.getUpcomingEvents(50)
      } else {
                // Use aggregator service for multi-API events
        fetchedEvents = await EventAggregatorService.getAggregatedEvents(50)
      }

      // Apply search filter
      if (searchTerm) {
        fetchedEvents = fetchedEvents.filter(event =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.venue?.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Apply timeframe filter
      if (selectedTimeframe === 'this-week') {
        const weekFromNow = addDays(new Date(), 7)
        fetchedEvents = fetchedEvents.filter(event => {
          const eventDate = new Date(event.startDate)
          return eventDate <= weekFromNow
        })
      } else if (selectedTimeframe === 'this-month') {
        const monthFromNow = addDays(new Date(), 30)
        fetchedEvents = fetchedEvents.filter(event => {
          const eventDate = new Date(event.startDate)
          return eventDate <= monthFromNow
        })
      }

      setEvents(fetchedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [selectedCategory, selectedTimeframe, searchTerm])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      shopping: 'bg-purple-100 text-purple-700 border-purple-200',
      culture: 'bg-blue-100 text-blue-700 border-blue-200',
      food: 'bg-orange-100 text-orange-700 border-orange-200',
      art: 'bg-pink-100 text-pink-700 border-pink-200',
      sports: 'bg-green-100 text-green-700 border-green-200',
      entertainment: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      music: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      family: 'bg-teal-100 text-teal-700 border-teal-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy')
    }
    
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }

  const formatEventTime = (startDate: string) => {
    return format(new Date(startDate), 'h:mm a')
  }

  const handleEventClick = (event: Event) => {
    if (event.bookingUrl) {
      window.open(event.bookingUrl, '_blank')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-midnight-black">Dubai Events</h1>
          <p className="text-quartz-gray mt-2">Discover amazing events happening in Dubai</p>
        </div>
        <Button onClick={loadEvents} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-quartz-gray" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-full md:w-48">
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map((timeframe) => (
                <SelectItem key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarDays className="h-12 w-12 text-quartz-gray mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-midnight-black mb-2">No Events Found</h3>
          <p className="text-quartz-gray">Try adjusting your search or filter criteria</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-desert-gold/50"
              onClick={() => handleEventClick(event)}
            >
              <div className="p-6 space-y-4">
                {/* Event Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <Badge 
                      variant="outline"
                      className={`${getCategoryColor(event.category)} text-xs`}
                    >
                      {event.category}
                    </Badge>
                    {event.bookingUrl && (
                      <ExternalLink className="h-4 w-4 text-quartz-gray group-hover:text-ai-blue transition-colors" />
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-midnight-black group-hover:text-ai-blue transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-sm text-quartz-gray line-clamp-3">
                    {event.description}
                  </p>
                </div>

                {/* Event Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-quartz-gray">
                    <Calendar className="h-4 w-4 text-desert-gold" />
                    <span>{formatEventDate(event.startDate, event.endDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-quartz-gray">
                    <Clock className="h-4 w-4 text-desert-gold" />
                    <span>{formatEventTime(event.startDate)}</span>
                  </div>
                  
                  {event.venue && (
                    <div className="flex items-start gap-2 text-sm text-quartz-gray">
                      <MapPin className="h-4 w-4 text-desert-gold mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{event.venue.name}</span>
                    </div>
                  )}
                  
                  {event.price && (
                    <div className="flex items-center gap-2 text-sm">
                      <Ticket className="h-4 w-4 text-desert-gold" />
                      <span className={`font-medium ${event.price.isFree ? 'text-green-600' : 'text-midnight-black'}`}>
                        {event.price.isFree 
                          ? 'Free Event'
                          : `From ${event.price.currency} ${event.price.min}`
                        }
                      </span>
                    </div>
                  )}
                  
                  {event.organizer && (
                    <div className="flex items-center gap-2 text-sm text-quartz-gray">
                      <Users className="h-4 w-4 text-desert-gold" />
                      <span>{event.organizer}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.tags.slice(0, 3).map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {event.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                        +{event.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Events Summary */}
      {!loading && events.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-ai-blue/5 to-desert-gold/5 border border-ai-blue/20">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-midnight-black mb-2">
              Showing {events.length} event{events.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-quartz-gray">
              {selectedCategory !== 'all' 
                ? `Filtered by ${categories.find(c => c.value === selectedCategory)?.label}`
                : 'All categories'
              } • {timeframes.find(t => t.value === selectedTimeframe)?.label}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
} 