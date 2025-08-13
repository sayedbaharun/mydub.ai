export interface Department {
  id: string
  name: string
  nameAr: string
  icon: string
  color: string
}

export interface GovernmentUpdate {
  id: string
  title: string
  titleAr?: string
  content: string
  contentAr?: string
  department: Department
  category: 'announcement' | 'policy' | 'service' | 'alert'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  publishedAt: string
  expiresAt?: string
  attachments?: Attachment[]
  tags: string[]
  viewCount: number
  isOfficial: boolean
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: 'pdf' | 'doc' | 'image' | 'video'
  size: number
}

export interface GovernmentFilters {
  departments: string[]
  categories: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  priority?: string
  search?: string
}