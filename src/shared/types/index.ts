// User types
export type UserRole = 'user' | 'curator' | 'editor' | 'admin'
export type UserType = 'resident' | 'tourist' | 'business'

export interface User {
  id: string
  email: string
  fullName?: string
  avatar?: string
  role: UserRole
  userType: UserType
  language: string
  createdAt: string
  updatedAt: string
}

// Auth types
export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

// Language types
export type Language = 'en' | 'ar' | 'hi' | 'ur'

export interface LanguageOption {
  code: Language
  name: string
  nativeName: string
  flag: string
  rtl: boolean
}

// Content types
export type ContentType = 'government' | 'news' | 'event' | 'tourism' | 'traffic' | 'weather'

export interface BaseContent {
  id: string
  type: ContentType
  title: string
  description: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface GovernmentUpdate extends BaseContent {
  type: 'government'
  department: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  documentUrl?: string
}

export interface NewsArticle extends BaseContent {
  type: 'news'
  source: string
  author?: string
  publishedAt: string
  fullContent: string
  summary?: string
  category: string
}

export interface TourismItem extends BaseContent {
  type: 'tourism'
  category: 'attraction' | 'restaurant' | 'hotel' | 'activity'
  location: {
    lat: number
    lng: number
    address: string
  }
  rating?: number
  priceRange?: string
  bookingUrl?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  error: string | null
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}