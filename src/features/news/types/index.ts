export interface NewsSource {
  id: string
  name: string
  nameAr: string
  logo: string | null
  website: string
  credibility: number
}

export interface NewsArticle {
  id: string
  title: string
  titleAr?: string
  summary: string
  summaryAr?: string
  content: string
  contentAr?: string
  source: NewsSource
  category: 'local' | 'business' | 'technology' | 'sports' | 'entertainment' | 'lifestyle' | 'opinion' | 'general'
  author?: string
  publishedAt: string | Date
  updatedAt?: string | Date
  imageUrl?: string
  videoUrl?: string
  tags: string[]
  viewCount: number
  readTime: number // in minutes
  aiSummary?: string
  aiSummaryAr?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  relatedArticles?: string[]
  url?: string
  isBreaking?: boolean
  isFeatured?: boolean
  hasVideo?: boolean
  aiMetadata?: {
    sourcesAnalyzed: number
    confidenceScore: number
    humanReviewed: boolean
    generatedAt: Date
  }
}

export interface NewsFilters {
  sources: string[]
  categories: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  search?: string
  hasVideo?: boolean
  sentiment?: string
}