import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  Waves,
  Music,
  Martini,
  Sun,
  Moon,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Sparkles,
  PartyPopper,
  Camera,
  Umbrella,
  Wine,
  ArrowRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Venue {
  id: string
  name: string
  type: 'beach' | 'club' | 'bar' | 'lounge' | 'rooftop'
  location: string
  description: string
  image: string
  rating: number
  priceLevel: number
  features: string[]
  openTime?: string
  closeTime?: string
  bestFor?: string[]
  dresscode?: string
  trending?: boolean
  new?: boolean
}

export default function BeachNightlifePage() {
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState('all')

  const venues: Venue[] = [
    {
      id: '1',
      name: 'Nikki Beach Dubai',
      type: 'beach',
      location: 'Pearl Jumeirah',
      description: 'Iconic beach club with white décor, live DJs, and Mediterranean cuisine',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
      rating: 4.8,
      priceLevel: 4,
      features: ['Beach Access', 'Pool', 'Restaurant', 'Live DJ'],
      openTime: '11:00',
      closeTime: '02:00',
      bestFor: ['Day Parties', 'Brunch', 'Sunset Views'],
      dresscode: 'Beach Chic',
      trending: true,
    },
    {
      id: '2',
      name: 'White Dubai',
      type: 'club',
      location: 'Meydan Racecourse',
      description: 'Open-air rooftop club with panoramic views and international DJs',
      image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2',
      rating: 4.7,
      priceLevel: 5,
      features: ['Rooftop', 'VIP Tables', 'International DJs'],
      openTime: '23:00',
      closeTime: '04:00',
      bestFor: ['Dancing', 'VIP Experience', 'Special Events'],
      dresscode: 'Smart Elegant',
      new: true,
    },
    {
      id: '3',
      name: 'Zero Gravity',
      type: 'beach',
      location: 'Dubai Marina',
      description: 'Beach club by day, party venue by night with infinity pool',
      image: 'https://images.unsplash.com/photo-1519214605650-76a613ee3245',
      rating: 4.6,
      priceLevel: 3,
      features: ['Beach', 'Pool', 'Concerts', 'Sports Viewing'],
      openTime: '10:00',
      closeTime: '03:00',
      bestFor: ['Pool Parties', 'Live Events', 'Beach Days'],
      dresscode: 'Casual Beach',
    },
    {
      id: '4',
      name: 'Soho Garden',
      type: 'club',
      location: 'Meydan',
      description: 'Outdoor party destination with multiple venues and concepts',
      image: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1',
      rating: 4.5,
      priceLevel: 4,
      features: ['Multiple Venues', 'Outdoor', 'Live Performances'],
      openTime: '20:00',
      closeTime: '04:00',
      bestFor: ['Weekend Parties', 'Live Shows', 'Group Events'],
      dresscode: 'Trendy Casual',
      trending: true,
    },
  ]

  const upcomingEvents = [
    {
      id: '1',
      title: 'Ibiza Nights Pool Party',
      venue: 'Zero Gravity',
      date: 'Saturday, March 16',
      time: '14:00 - 23:00',
      price: 'AED 150',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    },
    {
      id: '2',
      title: 'Sunset Sessions with DJ Snake',
      venue: 'White Dubai',
      date: 'Friday, March 15',
      time: '18:00 - 03:00',
      price: 'AED 200',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    },
  ]

  const beachActivities = [
    { icon: Waves, title: 'Water Sports', description: 'Jet ski, paddleboard, kayaking' },
    { icon: Umbrella, title: 'Beach Lounging', description: 'Cabanas and day beds' },
    { icon: Camera, title: 'Sunset Views', description: 'Instagram-worthy spots' },
    { icon: Wine, title: 'Beach Dining', description: 'Fresh seafood and cocktails' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"
            alt="Dubai Beach and Nightlife"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        
        <div className="relative h-full flex items-end">
          <div className="container mx-auto px-4 pb-16">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-4">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                  <Sun className="h-3 w-3 mr-1" />
                  Day & Night
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium Experiences
                </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                Beach Clubs & Nightlife
              </h1>
              <p className="text-xl text-white/90 mb-8">
                From sun-soaked beach days to unforgettable nights. Experience Dubai's 
                world-class party scene where luxury meets the shore.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-white text-black hover:bg-white/90">
                  <Calendar className="h-5 w-5 mr-2" />
                  This Weekend
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
                  <MapPin className="h-5 w-5 mr-2" />
                  View Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Waves className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">15+</p>
              <p className="text-sm text-gray-600">Beach Clubs</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Music className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">30+</p>
              <p className="text-sm text-gray-600">Nightclubs</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">50+</p>
              <p className="text-sm text-gray-600">Top DJs Monthly</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <PartyPopper className="h-8 w-8 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold">100+</p>
              <p className="text-sm text-gray-600">Events Weekly</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="beach">Beach Clubs</TabsTrigger>
            <TabsTrigger value="nightlife">Nightlife</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-8">
            {/* Trending Now */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Trending This Week</h2>
                <Badge className="bg-orange-100 text-orange-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Hot Spots
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {venues.filter(v => v.trending || v.new).map((venue) => (
                  <Card key={venue.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48">
                      <img
                        src={venue.image}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                      {venue.trending && (
                        <Badge className="absolute top-4 left-4 bg-orange-500 text-white">
                          Trending
                        </Badge>
                      )}
                      {venue.new && (
                        <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                          New
                        </Badge>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <h3 className="text-white font-semibold">{venue.name}</h3>
                        <p className="text-white/80 text-sm">{venue.location}</p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{venue.rating}</span>
                        </div>
                        <div className="flex">
                          {Array.from({ length: venue.priceLevel }).map((_, i) => (
                            <DollarSign key={i} className="h-4 w-4 text-gray-800" />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {venue.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full" size="sm">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Beach Activities */}
            <div className="mb-12 bg-blue-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Beach Day Essentials</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {beachActivities.map((activity, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                      <activity.icon className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="font-semibold mb-1">{activity.title}</h3>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* All Venues */}
            <div>
              <h2 className="text-2xl font-bold mb-6">All Venues</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {venues.map((venue) => (
                  <Card key={venue.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={venue.image}
                          alt={venue.name}
                          className="w-32 h-32 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{venue.name}</h3>
                              <p className="text-gray-600 text-sm flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {venue.location}
                              </p>
                            </div>
                            <Badge variant={venue.type === 'beach' ? 'default' : 'secondary'}>
                              {venue.type === 'beach' ? <Sun className="h-3 w-3 mr-1" /> : <Moon className="h-3 w-3 mr-1" />}
                              {venue.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{venue.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {venue.openTime} - {venue.closeTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {venue.rating}
                              </span>
                            </div>
                            <Button size="sm">
                              Details <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="beach" className="mt-8">
            <div className="text-center py-12">
              <Waves className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <p className="text-gray-500">Beach clubs content coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="nightlife" className="mt-8">
            <div className="text-center py-12">
              <Music className="h-12 w-12 mx-auto mb-4 text-purple-500" />
              <p className="text-gray-500">Nightlife venues coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-48 h-full object-cover"
                      />
                      <CardContent className="p-6 flex-1">
                        <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                        <p className="text-gray-600 mb-4">{event.venue}</p>
                        <div className="space-y-2 text-sm">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {event.date}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </p>
                          <p className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {event.price}
                          </p>
                        </div>
                        <Button className="mt-4 w-full">Get Tickets</Button>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export { BeachNightlifePage }