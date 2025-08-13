import { supabase } from '@/shared/lib/supabase'
import { contentService } from './content.service'
import { ContentAutomationService } from '@/shared/services/content-automation.service'
import {
  DashboardStats,
  ContentItem,
  User,
  ApprovalRequest,
  ActivityLog,
  ContentFilter,
  UserFilter,
  ContentAnalytics,
  UserRole
} from '../types'

export const dashboardService = {
  // Dashboard Stats - Now with real data
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      // Get content stats from dashboard_content view
      const { count: totalContent } = await supabase
        .from('dashboard_content')
        .select('*', { count: 'exact', head: true })

      const { count: pendingApprovals } = await supabase
        .from('dashboard_content')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get real session stats from page_views
      const { data: sessionData } = await supabase
        .from('page_views')
        .select('session_id, duration')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const uniqueSessions = new Set(sessionData?.map(s => s.session_id) || []).size
      const avgDuration = (sessionData?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0) / (sessionData?.length || 1)

      // Get top content from view
      const { data: topContent } = await supabase
        .from('dashboard_content')
        .select('*')
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(5)

      // Get user growth data
      const userGrowth = await this.getUserGrowthData()

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalContent: totalContent || 0,
        pendingApprovals: pendingApprovals || 0,
        totalSessions: uniqueSessions,
        avgSessionDuration: Math.round(avgDuration),
        topContent: topContent || [],
        userGrowth
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Return mock data if tables don't exist yet
      return {
        totalUsers: 3,
        activeUsers: 2,
        totalContent: 1,
        pendingApprovals: 0,
        totalSessions: 10,
        avgSessionDuration: 180,
        topContent: [],
        userGrowth: Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return {
            date: date.toISOString().split('T')[0],
            value: Math.floor(Math.random() * 5),
            change: 0
          }
        })
      }
    }
  },

  // Get user growth data from actual registrations
  async getUserGrowthData() {
    const { data } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at')

    // Group by day
    const growthByDay = new Map<string, number>()
    
    data?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      growthByDay.set(date, (growthByDay.get(date) || 0) + 1)
    })

    // Create array for last 7 days
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split('T')[0]
      const count = growthByDay.get(dateStr) || 0
      
      return {
        date: dateStr,
        value: count,
        change: 0 // Calculate percentage change if needed
      }
    })
  },

  // Content Management - Now uses the view
  async getContent(filter?: ContentFilter): Promise<{ data: ContentItem[]; count: number }> {
    let query = supabase
      .from('dashboard_content')
      .select('*', { count: 'exact' })

    if (filter?.type) {
      query = query.eq('type', filter.type)
    }
    if (filter?.status) {
      query = query.eq('status', filter.status)
    }
    if (filter?.author) {
      query = query.eq('author_id', filter.author)
    }
    if (filter?.dateFrom) {
      query = query.gte('created_at', filter.dateFrom)
    }
    if (filter?.dateTo) {
      query = query.lte('created_at', filter.dateTo)
    }
    if (filter?.search) {
      query = query.or(`title.ilike.%${filter.search}%,title_ar.ilike.%${filter.search}%`)
    }
    if (filter?.department) {
      query = query.eq('metadata->department_id', filter.department)
    }
    if (filter?.tags && filter.tags.length > 0) {
      query = query.contains('metadata->tags', filter.tags)
    }

    const { data, count, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching content:', error)
      // Return empty array if table doesn't exist
      return { data: [], count: 0 }
    }
    return { data: data || [], count: count || 0 }
  },

  // Update content status using the stored function
  async updateContentStatus(
    contentId: string,
    status: ContentItem['status'],
    editorId: string,
    comments?: string
  ): Promise<void> {
    // First get the content type
    const { data: content } = await supabase
      .from('dashboard_content')
      .select('type')
      .eq('id', contentId)
      .single()

    if (!content) throw new Error('Content not found')

    // Call the stored function
    const { data, error } = await supabase
      .rpc('update_content_status', {
        p_content_id: contentId,
        p_content_type: content.type,
        p_status: status,
        p_editor_id: editorId,
        p_comments: comments
      })

    if (error) throw error
    if (!data?.success) throw new Error(data?.error || 'Failed to update status')
  },

  // Delete content
  async deleteContent(contentId: string, userId: string): Promise<void> {
    // Get content type first
    const { data: content } = await supabase
      .from('dashboard_content')
      .select('type')
      .eq('id', contentId)
      .single()

    if (!content) throw new Error('Content not found')

    // Delete from appropriate table
    await contentService.deleteContent(contentId, content.type)

    // Log the activity
    await this.logActivity({
      userId,
      action: 'content_deleted',
      resource: 'content',
      resourceId: contentId,
      details: { type: content.type }
    })
  },

  // Create new content
  async createContent(data: any, userId: string): Promise<ContentItem> {
    const content = await contentService.createContent({
      ...data,
      metadata: { ...data.metadata, authorId: userId }
    })

    await this.logActivity({
      userId,
      action: 'content_created',
      resource: 'content',
      resourceId: content.id,
      details: { type: data.type }
    })

    return content
  },

  // Update existing content
  async updateContent(data: any, userId: string): Promise<ContentItem> {
    const content = await contentService.updateContent(data)

    await this.logActivity({
      userId,
      action: 'content_updated',
      resource: 'content',
      resourceId: content.id,
      details: { type: data.type }
    })

    return content
  },

  // User Management
  async getUsers(filter?: UserFilter): Promise<{ data: User[]; count: number }> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    if (filter?.role) {
      query = query.eq('role', filter.role)
    }
    if (filter?.status) {
      query = query.eq('status', filter.status)
    }
    if (filter?.search) {
      query = query.or(`email.ilike.%${filter.search}%,full_name.ilike.%${filter.search}%`)
    }
    if (filter?.dateFrom) {
      query = query.gte('created_at', filter.dateFrom)
    }
    if (filter?.dateTo) {
      query = query.lte('created_at', filter.dateTo)
    }

    const { data, count, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  async updateUserRole(userId: string, role: UserRole, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) throw error

    await this.logActivity({
      userId: adminId,
      action: 'user_role_updated',
      resource: 'user',
      resourceId: userId,
      details: { newRole: role }
    })
  },

  async updateUserStatus(
    userId: string,
    status: User['status'],
    adminId: string,
    reason?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)

    if (error) throw error

    await this.logActivity({
      userId: adminId,
      action: `user_${status}`,
      resource: 'user',
      resourceId: userId,
      details: { reason }
    })
  },

  // Approval Workflow
  async getApprovalRequests(): Promise<ApprovalRequest[]> {
    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        *,
        content:content_id(*),
        requestedBy:requested_by(*),
        reviewedBy:reviewed_by(*)
      `)
      .order('requested_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async createApprovalRequest(contentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('approval_requests')
      .insert({
        content_id: contentId,
        requested_by: userId,
        status: 'pending'
      })

    if (error) throw error
  },

  async reviewApprovalRequest(
    requestId: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    comments?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('approval_requests')
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        comments
      })
      .eq('id', requestId)

    if (error) throw error
  },

  // Activity Logs
  async getActivityLogs(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data: ActivityLog[]; count: number }> {
    const { data, count, error } = await supabase
      .from('activity_logs')
      .select('*, user:user_id(*)', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  async logActivity(activity: Omit<ActivityLog, 'id' | 'user' | 'timestamp'>): Promise<void> {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        ...activity,
        timestamp: new Date().toISOString()
      })

    if (error) throw error
  },

  // Get content analytics
  async getContentAnalytics(contentId: string): Promise<ContentAnalytics> {
    // Get content type first
    const { data: content } = await supabase
      .from('dashboard_content')
      .select('type')
      .eq('id', contentId)
      .single()

    if (!content) throw new Error('Content not found')

    return contentService.getContentAnalytics(contentId, content.type)
  },

  // Export functionality
  async exportData(type: 'users' | 'content' | 'logs', format: 'csv' | 'json'): Promise<Blob> {
    let data: any[] = []

    switch (type) {
      case 'users': {
        const { data: users } = await this.getUsers()
        data = users
        break
      }
      case 'content': {
        const { data: content } = await this.getContent()
        data = content
        break
      }
      case 'logs': {
        const { data: logs } = await this.getActivityLogs(1000)
        data = logs
        break
      }
    }

    if (format === 'json') {
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    } else {
      // Convert to CSV
      const headers = Object.keys(data[0] || {})
      const csv = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header]
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value
          }).join(',')
        )
      ].join('\n')

      return new Blob([csv], { type: 'text/csv' })
    }
  },

  // Content Automation Management
  async getScheduledContent(filters?: {
    content_type?: string
    status?: string
    date_from?: string
    date_to?: string
  }) {
    return await ContentAutomationService.getScheduledContent(filters)
  },

  async scheduleContent(contentData: any, userId: string) {
    const scheduled = await ContentAutomationService.scheduleContent({
      ...contentData,
      author_id: userId
    })

    await this.logActivity({
      userId,
      action: 'content_scheduled',
      resource: 'content',
      resourceId: scheduled.id,
      details: { content_type: scheduled.content_type }
    })

    return scheduled
  },

  async processScheduledContent() {
    return await ContentAutomationService.processScheduledContent()
  },

  // Content Templates Management
  async getContentTemplates(contentType?: string) {
    return await ContentAutomationService.getTemplates(contentType)
  },

  async createContentTemplate(templateData: any, userId: string) {
    const template = await ContentAutomationService.createTemplate({
      ...templateData,
      created_by: userId
    })

    await this.logActivity({
      userId,
      action: 'template_created',
      resource: 'template',
      resourceId: template.id,
      details: { content_type: template.content_type }
    })

    return template
  },

  // Automation Statistics
  async getAutomationStats() {
    return await ContentAutomationService.getAutomationStats()
  },

  // Start Automation Services
  async startAutomation() {
    await ContentAutomationService.startAutomatedProcessing()
  },

  // Get real content distribution by type
  async getContentDistribution(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('dashboard_content')
        .select('type')
        .eq('status', 'published')

      if (error) throw error

      // Count by type
      const typeCount = new Map<string, number>()
      data?.forEach(item => {
        const type = item.type || 'other'
        typeCount.set(type, (typeCount.get(type) || 0) + 1)
      })

      // Convert to chart format with colors
      const colorMap: Record<string, string> = {
        'news': '#3B82F6',
        'tourism': '#10B981', 
        'government': '#F59E0B',
        'events': '#EF4444',
        'practical': '#8B5CF6',
        'other': '#6B7280'
      }

      return Array.from(typeCount.entries()).map(([type, value]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value,
        color: colorMap[type] || '#6B7280'
      }))
    } catch (error) {
      console.error('Error fetching content distribution:', error)
      return []
    }
  },

  // Get device analytics from page_views
  async getDeviceStats(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('page_views')
        .select('user_agent, session_id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error

      // Analyze user agents to determine device types
      const deviceCount = new Map<string, Set<string>>()
      const sessionCount = new Map<string, number>()

      data?.forEach(view => {
        const userAgent = view.user_agent || ''
        let deviceType = 'Desktop'
        
        if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
          if (/iPad/i.test(userAgent)) {
            deviceType = 'Tablet'
          } else {
            deviceType = 'Mobile'
          }
        }

        // Count unique users by session
        if (!deviceCount.has(deviceType)) {
          deviceCount.set(deviceType, new Set())
        }
        deviceCount.get(deviceType)?.add(view.session_id)
        
        // Count total sessions
        sessionCount.set(deviceType, (sessionCount.get(deviceType) || 0) + 1)
      })

      // Convert to chart format
      return Array.from(deviceCount.entries()).map(([device, sessions]) => ({
        name: device,
        users: sessions.size,
        sessions: sessionCount.get(device) || 0
      }))
    } catch (error) {
      console.error('Error fetching device stats:', error)
      return []
    }
  }
}