import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  Clock,
  MapPin,
  Calendar,
  Music,
  Utensils,
  PartyPopper,
  Star,
  TrendingUp,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { NewsService } from '@/features/news/services/news.service'
import { TourismService } from '@/features/tourism/services/tourism.service'
import { PracticalService } from '@/features/practical/services/practical.service'
import { useTranslation } from 'react-i18next'

interface EventCard {
  id: string
  title: string
  time: string
  location: string
  category: string
  price: string
  image: string
  trending?: boolean
  recommended?: boolean
}

export default function TodayPage() {
  const { t } = useTranslation('common')
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('evening')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<EventCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Determine time of day
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setTimeOfDay('morning')
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon')
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening')
    else setTimeOfDay('night')
  }, [])

  useEffect(() => {
    loadTodayEvents()
  }, [selectedDate])

  const loadTodayEvents = async () => {
    setLoading(true)
    try {
      // Load events from tourism service
      const tourismData = await TourismService.getEvents()
      
      // Transform to today's events format
      const todayEvents: EventCard[] = tourismData.slice(0, 8).map(event => ({
        id: event.id,
        title: event.title,
        time: new Date(event.startDate).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        location: event.venue,
        category: event.category,
        price: event.price.isFree ? 'Free' : `AED ${event.price.min}+`,
        image: event.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
        trending: Math.random() > 0.7,
        recommended: Math.random() > 0.6,
      }))

      setEvents(todayEvents)
    } catch (error) {
      console.error('Error loading today events:', error)
    } finally {
      setLoading(false)
    }
  }

  const timeGreeting = {
    morning: { icon: Sun, text: "Start Your Day Right", emoji: "☀️" },
    afternoon: { icon: Sun, text: "Afternoon Adventures", emoji: "🌤️" },
    evening: { icon: Moon, text: "Evening Experiences", emoji: "🌆" },
    night: { icon: Sparkles, text: "Dubai After Dark", emoji: "🌃" }
  }

  const categories = [
    { id: 'all', label: 'All Events', icon: Calendar },
    { id: 'dining', label: 'Dining', icon: Utensils },
    { id: 'entertainment', label: 'Entertainment', icon: Music },
    { id: 'nightlife', label: 'Nightlife', icon: PartyPopper },
  ]

  const TimeIcon = timeGreeting[timeOfDay].icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <TimeIcon className="h-8 w-8" />
              <h1 className="text-4xl md:text-5xl font-bold">
                {timeGreeting[timeOfDay].emoji} {timeGreeting[timeOfDay].text}
              </h1>
            </div>
            <p className="text-xl text-white/90 mb-8">
              Discover what's happening in Dubai right now. From dining to entertainment, 
              we've got your {timeOfDay} covered.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{events.length}</p>
                  <p className="text-sm text-white/80">Events Today</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">24°C</p>
                  <p className="text-sm text-white/80">Perfect Weather</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">15</p>
                  <p className="text-sm text-white/80">New This Week</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">8PM</p>
                  <p className="text-sm text-white/80">Peak Time</p>
                </CardContent>
              </Card>
            </div>

            {/* Date Selector */}
            <div className="flex gap-2 overflow-x-auto pb-4">
              {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                const date = new Date()
                date.setDate(date.getDate() + dayOffset)
                const isSelected = date.toDateString() === selectedDate.toDateString()
                
                return (
                  <Button
                    key={dayOffset}
                    variant={isSelected ? "default" : "outline"}
                    className={`min-w-[100px] ${
                      isSelected 
                        ? 'bg-white text-purple-900' 
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="text-center">
                      <p className="text-xs">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className="font-bold">{date.getDate()}</p>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1">
                <cat.icon className="h-4 w-4" />
                <span className="hidden md:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-8">
            {/* AI Picks Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">AI Picks for You</h2>
                <Badge className="bg-purple-100 text-purple-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Personalized
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter(e => e.recommended).slice(0, 3).map(event => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-4 left-4 bg-purple-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        AI Pick
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{event.category}</Badge>
                          <span className="font-semibold text-gray-900">{event.price}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Trending Now */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
                <Badge className="bg-orange-100 text-orange-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.filter(e => e.trending).map(event => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-32">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      {event.trending && (
                        <Badge className="absolute top-2 right-2 bg-orange-600 text-white">
                          Trending
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{event.title}</h3>
                      <p className="text-sm text-gray-600">{event.time} • {event.location}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-semibold">{event.price}</span>
                        <Button size="sm" variant="ghost">
                          View <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Events */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Events Today</h2>
              <div className="space-y-4">
                {events.map(event => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {event.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                                <Badge variant="secondary">{event.category}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">{event.price}</p>
                              <Button size="sm" className="mt-2">
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Other category tabs would have filtered content */}
          <TabsContent value="dining">
            <div className="text-center py-12">
              <p className="text-gray-500">Dining events coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="entertainment">
            <div className="text-center py-12">
              <p className="text-gray-500">Entertainment events coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="nightlife">
            <div className="text-center py-12">
              <p className="text-gray-500">Nightlife events coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}