import { supabase } from '@/shared/lib/supabase'
import { Attraction, Event, TourismFilters } from '../types'
import { DUBAI_ATTRACTIONS } from '../data/attractions'

export class TourismService {
  // Get attractions from database with fallback to local data
  static async getAttractions(filters?: TourismFilters): Promise<Attraction[]> {
    try {
      let query = supabase
        .from('tourism_attractions')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })

      // Apply filters if provided
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters?.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching attractions from database:', error)
        return this.getMockAttractions(filters)
      }

      // Transform database data to match UI expectations
      const dbAttractions = (data || []).map(attraction => ({
        id: attraction.id,
        name: attraction.name,
        nameAr: attraction.name_ar,
        description: attraction.description,
        descriptionAr: attraction.description_ar,
        category: attraction.category,
        location: {
          lat: parseFloat(attraction.location_lat || '0'),
          lng: parseFloat(attraction.location_lng || '0'),
          address: attraction.address || '',
          addressAr: attraction.address_ar || '',
          area: this.extractAreaFromAddress(attraction.address),
          areaAr: this.extractAreaFromAddress(attraction.address_ar || attraction.address)
        },
        rating: parseFloat(attraction.rating || '0'),
        reviewCount: attraction.review_count || 0,
        priceLevel: this.mapPriceLevel(attraction.admission_fee),
        images: attraction.images || [],
        features: this.mapFeatures(attraction),
        openingHours: attraction.opening_hours || {},
        contact: {
          phone: attraction.contact_phone,
          website: attraction.website,
          email: attraction.contact_email
        },
        isFeatured: attraction.is_featured || false,
        tags: attraction.tags || []
      }))

      return dbAttractions.length > 0 ? dbAttractions : this.getMockAttractions(filters)
    } catch (error) {
      console.error('Error in getAttractions:', error)
      return this.getMockAttractions(filters)
    }
  }

  // Helper methods for data transformation
  static extractAreaFromAddress(address: string): string {
    if (!address) return 'Dubai'
    if (address.includes('Downtown')) return 'Downtown Dubai'
    if (address.includes('Marina')) return 'Dubai Marina'
    if (address.includes('JBR')) return 'JBR'
    if (address.includes('Palm')) return 'Palm Jumeirah'
    if (address.includes('DIFC')) return 'DIFC'
    return 'Dubai'
  }

  static mapPriceLevel(fee: number): 1 | 2 | 3 | 4 | 5 {
    if (fee === 0) return 1
    if (fee <= 50) return 2
    if (fee <= 150) return 3
    if (fee <= 300) return 4
    return 5
  }

  static mapFeatures(attraction: any): string[] {
    const features = []
    if (attraction.has_parking) features.push('parking')
    if (attraction.is_wheelchair_accessible) features.push('wheelchair-accessible')
    if (attraction.has_restaurant) features.push('restaurant')
    if (attraction.has_gift_shop) features.push('gift-shop')
    if (attraction.category === 'shopping') features.push('shopping')
    if (attraction.category === 'entertainment') features.push('entertainment')
    return features
  }

  // Fallback to local data
  static getMockAttractions(filters?: TourismFilters): Promise<Attraction[]> {
    let attractions = [...DUBAI_ATTRACTIONS]

    if (filters) {
      // Category filter
      if (filters.categories.length > 0) {
        attractions = attractions.filter(a => 
          filters.categories.includes(a.category)
        )
      }

      // Area filter
      if (filters.areas.length > 0) {
        attractions = attractions.filter(a => 
          filters.areas.includes(a.location.area)
        )
      }

      // Price range filter
      if (filters.priceRange) {
        attractions = attractions.filter(a => 
          a.priceLevel >= filters.priceRange.min && 
          a.priceLevel <= filters.priceRange.max
        )
      }

      // Rating filter
      if (filters.rating !== undefined) {
        attractions = attractions.filter(a => a.rating >= (filters.rating || 0))
      }

      // Features filter
      if (filters.features.length > 0) {
        attractions = attractions.filter(a => 
          filters.features.every(feature => a.features.includes(feature))
        )
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        attractions = attractions.filter(a => 
          a.name.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower) ||
          a.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }
    }

    return Promise.resolve(attractions)
  }

  // Get events from database
  static async getEvents(filters?: TourismFilters): Promise<Event[]> {
    try {
      let query = supabase
        .from('tourism_events')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true })

      // Apply filters if provided
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters?.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching events from database:', error)
        return this.getMockEvents(filters)
      }

      // Transform database data to match UI expectations
      const dbEvents = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        titleAr: event.title_ar,
        description: event.description,
        descriptionAr: event.description_ar,
        category: event.category,
        startDate: event.start_date,
        endDate: event.end_date,
        venue: {
          name: event.venue,
          nameAr: event.venue_ar,
          location: {
            lat: 25.276987,
            lng: 55.296249,
            address: event.location,
            addressAr: event.location_ar
          }
        },
        organizer: event.organizer,
        price: {
          currency: 'AED',
          min: parseFloat(event.ticket_price || '0'),
          max: parseFloat(event.ticket_price || '0'),
          isFree: parseFloat(event.ticket_price || '0') === 0
        },
        bookingUrl: event.ticket_url,
        imageUrl: event.image_url,
        tags: event.tags || []
      }))

      return dbEvents.length > 0 ? dbEvents : this.getMockEvents(filters)
    } catch (error) {
      console.error('Error in getEvents:', error)
      return this.getMockEvents(filters)
    }
  }

  // Mock events data
  static getMockEvents(_filters?: TourismFilters): Promise<Event[]> {
    const mockEvents: Event[] = [
      {
        id: 'mock-event-1',
        title: 'Dubai Food Festival 2024',
        titleAr: 'مهرجان دبي للطعام 2024',
        description: 'A month-long celebration of culinary excellence featuring restaurants across Dubai',
        descriptionAr: 'احتفال يستمر شهراً بالتميز الطهي يضم مطاعم في جميع أنحاء دبي',
        category: 'festival',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-02-29T23:59:59Z',
        venue: {
          name: 'Multiple venues',
          nameAr: 'أماكن متعددة',
          location: {
            lat: 25.276987,
            lng: 55.296249,
            address: 'Various locations across Dubai',
            addressAr: 'مواقع مختلفة في جميع أنحاء دبي'
          }
        },
        organizer: 'Dubai Tourism',
        price: {
          currency: 'AED',
          min: 0,
          max: 0,
          isFree: true
        },
        bookingUrl: 'https://www.dubaifoodfestival.com',
        imageUrl: 'https://picsum.photos/800/600?random=20',
        tags: ['festival', 'food', 'culture', 'Dubai']
      }
    ]

    return Promise.resolve(mockEvents)
  }

  static async getAttractionById(id: string): Promise<Attraction | null> {
    // In production, fetch from Supabase
    return DUBAI_ATTRACTIONS.find(a => a.id === id) || null
  }

  static async getEventsByDateRange(
    startDate?: Date,
    endDate?: Date,
    category?: string
  ): Promise<Event[]> {
    let query = supabase
      .from('tourism_events')
      .select('*')
      .order('start_date', { ascending: true })

    if (startDate) {
      query = query.gte('start_date', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('start_date', endDate.toISOString())
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  }

  static async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('tourism_events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async getUpcomingEvents(limit = 10): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('tourism_events')
        .select('*')
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching upcoming events:', error)
        return this.getMockEvents()
      }

      // Transform database data to match UI expectations
      const dbEvents = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        titleAr: event.title_ar,
        description: event.description,
        descriptionAr: event.description_ar,
        category: event.category,
        startDate: event.start_date,
        endDate: event.end_date,
        venue: {
          name: event.venue || event.location,
          nameAr: event.venue_ar || event.location_ar,
          location: {
            lat: 25.276987,
            lng: 55.296249,
            address: event.location,
            addressAr: event.location_ar
          }
        },
        organizer: event.organizer,
        price: {
          currency: 'AED',
          min: parseFloat(event.ticket_price || '0'),
          max: parseFloat(event.ticket_price || '0'),
          isFree: parseFloat(event.ticket_price || '0') === 0
        },
        bookingUrl: event.ticket_url,
        imageUrl: event.image_url,
        tags: event.tags || []
      }))

      return dbEvents.length > 0 ? dbEvents : this.getMockEvents()
    } catch (error) {
      console.error('Error in getUpcomingEvents:', error)
      return this.getMockEvents()
    }
  }

  static async searchAttractions(query: string): Promise<Attraction[]> {
    const searchLower = query.toLowerCase()
    return DUBAI_ATTRACTIONS.filter(attraction =>
      attraction.name.toLowerCase().includes(searchLower) ||
      attraction.nameAr.includes(query) ||
      attraction.description.toLowerCase().includes(searchLower) ||
      attraction.location.area.toLowerCase().includes(searchLower) ||
      attraction.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  static async getNearbyAttractions(
    lat: number,
    lng: number,
    radiusKm = 5
  ): Promise<Attraction[]> {
    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371 // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      return R * c
    }

    return DUBAI_ATTRACTIONS.filter(attraction => {
      const distance = calculateDistance(
        lat, lng,
        attraction.location.lat,
        attraction.location.lng
      )
      return distance <= radiusKm
    }).sort((a, b) => {
      const distA = calculateDistance(lat, lng, a.location.lat, a.location.lng)
      const distB = calculateDistance(lat, lng, b.location.lat, b.location.lng)
      return distA - distB
    })
  }

  static async getPopularAttractions(limit = 10): Promise<Attraction[]> {
    return [...DUBAI_ATTRACTIONS]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, limit)
  }

  static async getAttractionsByPriceLevel(level: number): Promise<Attraction[]> {
    return DUBAI_ATTRACTIONS.filter(a => a.priceLevel === level)
  }

  static async subscribeToEvents(
    callback: (event: Event) => void
  ) {
    const channel = supabase
      .channel('tourism-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tourism_events'
        },
        (payload) => {
          callback(payload.new as Event)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  static getUniqueAreas(): string[] {
    const areas = new Set<string>()
    DUBAI_ATTRACTIONS.forEach(attraction => {
      areas.add(attraction.location.area)
    })
    return Array.from(areas).sort()
  }

  static getUniqueFeatures(): string[] {
    const features = new Set<string>()
    DUBAI_ATTRACTIONS.forEach(attraction => {
      attraction.features.forEach(feature => features.add(feature))
    })
    return Array.from(features).sort()
  }
}