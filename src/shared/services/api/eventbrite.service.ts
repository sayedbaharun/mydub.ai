import { Event } from '@/features/tourism/types'

interface EventbriteEvent {
  id: string
  name: {
    text: string
    html: string
  }
  description: {
    text: string
    html: string
  }
  start: {
    timezone: string
    local: string
    utc: string
  }
  end: {
    timezone: string
    local: string
    utc: string
  }
  venue: {
    id: string
    name: string
    address: {
      address_1: string
      address_2: string
      city: string
      region: string
      postal_code: string
      country: string
    }
  } | null
  organizer: {
    id: string
    name: string
    description: {
      text: string
    }
  }
  category: {
    id: string
    name: string
    short_name: string
  } | null
  logo: {
    url: string
  } | null
  ticket_availability: {
    has_available_tickets: boolean
    minimum_ticket_price: {
      currency: string
      value: number
      major_value: string
      display: string
    } | null
  }
  url: string
  is_free: boolean
  tags: string[]
}

interface EventbriteResponse {
  events: EventbriteEvent[]
  pagination: {
    object_count: number
    page_number: number
    page_size: number
    page_count: number
    has_more_items: boolean
  }
}

export class EventbriteService {
  private static readonly BASE_URL = 'https://www.eventbriteapi.com/v3'
  private static readonly TOKEN = import.meta.env.VITE_EVENTBRITE_TOKEN
  
  private static async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    try {
      const url = new URL(`${this.BASE_URL}${endpoint}`)
      
      // Add auth token
      url.searchParams.append('token', this.TOKEN)
      
      // Add additional parameters
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Eventbrite API request failed:', error)
      throw error
    }
  }

  private static mapEventbriteToEvent(ebEvent: EventbriteEvent): Event {
    return {
      id: `eventbrite-${ebEvent.id}`,
      title: ebEvent.name.text,
      titleAr: ebEvent.name.text, // TODO: Add translation service
      description: ebEvent.description.text || ebEvent.name.text,
      descriptionAr: ebEvent.description.text || ebEvent.name.text, // TODO: Add translation
      category: this.mapCategory(ebEvent.category?.short_name || 'other') as any,
      startDate: ebEvent.start.utc,
      endDate: ebEvent.end.utc,
      venue: {
        name: ebEvent.venue?.name || 'TBA',
        nameAr: ebEvent.venue?.name || 'TBA', // TODO: Add translation
        location: {
          lat: 25.276987, // Default Dubai coordinates
          lng: 55.296249,
          address: ebEvent.venue ? this.formatAddress(ebEvent.venue.address) : 'Dubai, UAE',
          addressAr: ebEvent.venue ? this.formatAddress(ebEvent.venue.address) : 'دبي، الإمارات العربية المتحدة'
        }
      },
      organizer: ebEvent.organizer.name,
      price: {
        currency: ebEvent.ticket_availability.minimum_ticket_price?.currency || 'AED',
        min: ebEvent.ticket_availability.minimum_ticket_price?.value || 0,
        max: ebEvent.ticket_availability.minimum_ticket_price?.value || 0,
        isFree: ebEvent.is_free
      },
      bookingUrl: ebEvent.url,
      imageUrl: ebEvent.logo?.url,
      tags: ebEvent.tags || []
    }
  }

  private static mapCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'business': 'business',
      'food-and-drink': 'food',
      'health': 'health',
      'music': 'music',
      'arts': 'art',
      'film-and-media': 'entertainment',
      'sports-and-fitness': 'sports',
      'travel-and-outdoor': 'tourism',
      'community': 'culture',
      'education': 'education',
      'family-and-kids': 'family',
      'fashion': 'fashion',
      'government': 'government',
      'hobbies': 'leisure',
      'home-and-lifestyle': 'lifestyle',
      'auto-boat-and-air': 'automotive',
      'charity-and-causes': 'charity',
      'religion-and-spirituality': 'spiritual',
      'school-activities': 'education',
      'science-and-tech': 'technology',
      'holiday': 'celebration',
      'other': 'other'
    }
    return categoryMap[category] || 'entertainment'
  }

  private static formatAddress(address: any): string {
    if (!address) return 'Dubai, UAE'
    
    const parts = [
      address.address_1,
      address.address_2,
      address.city,
      address.region,
      address.country
    ].filter(Boolean)
    
    return parts.join(', ') || 'Dubai, UAE'
  }

  private static isDubaiEvent(event: EventbriteEvent): boolean {
    if (!event.venue?.address) return false
    
    const address = event.venue.address
    const locationText = [
      address.city,
      address.region,
      address.country,
      event.venue.name,
      event.name.text,
      event.description.text
    ].join(' ').toLowerCase()

    const dubaiKeywords = [
      'dubai',
      'uae',
      'united arab emirates',
      'emirates',
      'middle east',
      'gulf'
    ]

    return dubaiKeywords.some(keyword => locationText.includes(keyword))
  }

  static async fetchDubaiEvents(limit = 50): Promise<Event[]> {
    try {
      // Search for events in Dubai
      const params = {
        'location.address': 'Dubai, UAE',
        'location.within': '50km', // 50km radius from Dubai
        'expand': 'venue,organizer,category,ticket_availability',
        'status': 'live',
        'order_by': 'start_asc',
        'page_size': limit.toString(),
        'start_date.range_start': new Date().toISOString()
      }

      const response = await this.makeRequest<EventbriteResponse>('/events/search/', params)
      
      // Filter for Dubai events and map to our format
      const dubaiEvents = response.events
        .filter(event => this.isDubaiEvent(event))
        .map(event => this.mapEventbriteToEvent(event))
        .slice(0, limit)

      return dubaiEvents

    } catch (error) {
      console.error('❌ Failed to fetch Eventbrite events:', error)
      return []
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/users/me/')
      return true
    } catch (error) {
      console.error('❌ Eventbrite API connection failed:', error)
      return false
    }
  }
} 