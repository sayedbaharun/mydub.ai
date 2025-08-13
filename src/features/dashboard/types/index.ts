export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalContent: number
  pendingApprovals: number
  totalSessions: number
  avgSessionDuration: number
  topContent: ContentItem[]
  userGrowth: GrowthData[]
}

export interface GrowthData {
  date: string
  value: number
  change: number
}

export interface ContentItem {
  id: string
  title: string
  titleAr: string
  type: 'government' | 'news' | 'tourism' | 'event'
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published'
  author: User
  editor?: User
  createdAt: string
  updatedAt: string
  publishedAt?: string
  views: number
  likes: number
  shares: number
  metadata: {
    department?: string
    category?: string
    tags: string[]
    location?: {
      lat: number
      lng: number
      address: string
    }
  }
}

export interface User {
  id: string
  email: string
  fullName: string
  avatar?: string
  role: UserRole
  status: 'active' | 'inactive' | 'suspended'
  lastLogin?: string
  createdAt: string
  preferences: {
    language: string
    notifications: boolean
    interests: string[]
  }
}

export type UserRole = 'user' | 'subscriber' | 'curator' | 'editor' | 'admin'

export interface ApprovalRequest {
  id: string
  contentId: string
  content: ContentItem
  requestedBy: User
  requestedAt: string
  reviewedBy?: User
  reviewedAt?: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
}

export interface ActivityLog {
  id: string
  userId: string
  user: User
  action: string
  resource: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export interface ContentFilter {
  type?: ContentItem['type']
  status?: ContentItem['status']
  author?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  department?: string
  tags?: string[]
}

export interface UserFilter {
  role?: UserRole
  status?: User['status']
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface DashboardPermissions {
  canViewStats: boolean
  canManageContent: boolean
  canApproveContent: boolean
  canManageUsers: boolean
  canViewLogs: boolean
  canExportData: boolean
}

export interface ContentAnalytics {
  contentId: string
  views: number
  uniqueViews: number
  avgTimeSpent: number
  bounceRate: number
  shares: {
    facebook: number
    twitter: number
    whatsapp: number
    email: number
  }
  demographics: {
    age: Record<string, number>
    gender: Record<string, number>
    location: Record<string, number>
    language: Record<string, number>
  }
  devices: {
    desktop: number
    mobile: number
    tablet: number
  }
}

export interface NotificationTemplate {
  id: string
  name: string
  nameAr: string
  subject: string
  subjectAr: string
  body: string
  bodyAr: string
  type: 'email' | 'push' | 'sms'
  trigger: 'content_approved' | 'content_rejected' | 'user_registered' | 'custom'
  variables: string[]
  active: boolean
}