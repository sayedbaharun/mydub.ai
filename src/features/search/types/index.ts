export interface SearchQuery {
  query: string
  filters?: SearchFilters
  page?: number
  limit?: number
  sortBy?: SearchSortOption
  language?: string
}

export interface SearchFilters {
  type?: ContentType[]
  category?: string[]
  tags?: string[]
  location?: LocationFilter
  dateRange?: DateRange
  source?: string[]
  department?: string[]
  language?: string[]
  rating?: number
  verified?: boolean
}

export type ContentType = 'government' | 'news' | 'tourism' | 'event' | 'business' | 'practical'

export interface LocationFilter {
  lat?: number
  lng?: number
  radius?: number // in kilometers
  area?: string[]
  district?: string[]
}

export interface DateRange {
  from?: string
  to?: string
  preset?: 'today' | 'week' | 'month' | 'year'
}

export type SearchSortOption = 
  | 'relevance' 
  | 'date_desc' 
  | 'date_asc' 
  | 'popularity' 
  | 'rating'

export interface SearchResult {
  id: string
  type: ContentType
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  content?: string
  contentAr?: string
  url?: string
  thumbnail?: string
  author?: {
    id: string
    name: string
    avatar?: string
  }
  source?: {
    id: string
    name: string
    logo?: string
    verified: boolean
  }
  tags: string[]
  categories: string[]
  location?: {
    name: string
    nameAr: string
    coordinates?: {
      lat: number
      lng: number
    }
    district?: string
    area?: string
  }
  metadata: {
    views?: number
    likes?: number
    shares?: number
    rating?: number
    reviewCount?: number
    price?: {
      amount: number
      currency: string
    }
    duration?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    language?: string[]
  }
  highlights?: {
    title?: string[]
    description?: string[]
    content?: string[]
  }
  score: number
  publishedAt: string
  updatedAt: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  totalPages: number
  facets: SearchFacets
  suggestions: SearchSuggestion[]
  relatedSearches: string[]
  executionTime: number
}

export interface SearchFacets {
  types: FacetItem[]
  categories: FacetItem[]
  tags: FacetItem[]
  sources: FacetItem[]
  locations: FacetItem[]
  dateRanges: FacetItem[]
}

export interface FacetItem {
  value: string
  label: string
  labelAr: string
  count: number
}

export interface SearchSuggestion {
  id: string
  text: string
  textAr: string
  type: 'query' | 'category' | 'tag' | 'location'
  icon?: string
  metadata?: any
}

export interface SearchHistory {
  id: string
  userId: string
  query: string
  filters?: SearchFilters
  resultsCount: number
  clickedResults: string[]
  timestamp: string
}

export interface SavedSearch {
  id: string
  userId: string
  name: string
  nameAr: string
  query: string
  filters?: SearchFilters
  notifications: boolean
  createdAt: string
  lastRun?: string
  newResults?: number
}

export interface TrendingSearch {
  query: string
  queryAr: string
  count: number
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  category?: string
}

export interface SearchAnalytics {
  query: string
  impressions: number
  clicks: number
  ctr: number
  avgPosition: number
  exitRate: number
}

export interface AISearchContext {
  userIntent?: 'informational' | 'navigational' | 'transactional' | 'local'
  entities?: {
    locations?: string[]
    dates?: string[]
    people?: string[]
    organizations?: string[]
    topics?: string[]
  }
  sentiment?: 'positive' | 'neutral' | 'negative'
  language: string
  confidence: number
}