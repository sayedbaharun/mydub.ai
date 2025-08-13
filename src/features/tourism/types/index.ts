export interface Attraction {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  category: 'landmark' | 'beach' | 'shopping' | 'entertainment' | 'culture' | 'dining' | 'adventure' | 'family'
  location: {
    lat: number
    lng: number
    address: string
    addressAr: string
    area: string
    areaAr: string
  }
  images: string[]
  rating: number
  reviewCount: number
  priceLevel: 1 | 2 | 3 | 4 | 5 // 1 = Free, 5 = Very Expensive
  openingHours?: OpeningHours
  contact?: {
    phone?: string
    website?: string
    email?: string
  }
  features: string[]
  bookingUrl?: string
  popularTimes?: PopularTimes
  nearbyMetro?: string
  tags: string[]
}

export interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    isOpen24Hours?: boolean
    isClosed?: boolean
  }
}

export interface PopularTimes {
  [key: string]: number[] // 24 hour array with popularity 0-100
}

export interface Event {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  category: 'festival' | 'concert' | 'sports' | 'exhibition' | 'conference' | 'family' | 'cultural'
  startDate: string
  endDate: string
  venue: {
    name: string
    nameAr: string
    location: {
      lat: number
      lng: number
      address: string
      addressAr: string
    }
  }
  imageUrl?: string
  price?: {
    currency: string
    min?: number
    max?: number
    isFree?: boolean
  }
  bookingUrl?: string
  organizer: string
  tags: string[]
}

export interface TourismFilters {
  categories: string[]
  areas: string[]
  priceRange: {
    min: number
    max: number
  }
  rating?: number
  features: string[]
  search?: string
}

export interface MapMarker {
  id: string
  position: {
    lat: number
    lng: number
  }
  type: 'attraction' | 'event' | 'restaurant' | 'hotel'
  title: string
  category: string
}