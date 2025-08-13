export interface ApprovalItem {
  id: string
  content_id: string
  content_type: 'news' | 'tourism' | 'government' | 'events' | 'practical'
  title: string
  title_ar?: string
  excerpt: string
  excerpt_ar?: string
  author: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  ai_agent?: {
    id: string
    name: string
    type: string
  }
  source?: {
    id: string
    name: string
    url?: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'scheduled'
  priority: 'high' | 'medium' | 'low'
  created_at: string
  updated_at: string
  scheduled_for?: string
  metadata?: {
    word_count?: number
    reading_time?: number
    tags?: string[]
    category?: string
    language?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
    quality_score?: number
  }
  preview_url?: string
  content?: {
    body: string
    body_ar?: string
    images?: Array<{
      url: string
      caption?: string
      alt?: string
    }>
  }
}

export interface ApprovalAction {
  action: 'approve' | 'reject' | 'edit' | 'schedule'
  item_id: string
  comments?: string
  scheduled_time?: string
  edited_content?: Partial<ApprovalItem>
}

export interface ApprovalStats {
  total: number
  pending: number
  approved_today: number
  rejected_today: number
  scheduled: number
  average_processing_time: number
}

export interface ApprovalFilter {
  status?: ApprovalItem['status']
  content_type?: ApprovalItem['content_type']
  priority?: ApprovalItem['priority']
  date_from?: string
  date_to?: string
  search?: string
  ai_agent?: string
  source?: string
}

export interface ApprovalQueue {
  items: ApprovalItem[]
  total: number
  page: number
  page_size: number
  filters: ApprovalFilter
}