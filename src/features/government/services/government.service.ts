import { supabase } from '@/shared/lib/supabase'
import { GovernmentUpdate, GovernmentFilters } from '../types'
import { getDepartmentById } from '../data/departments'
import { ESSENTIAL_SERVICES } from '../data/essential-services'

export class GovernmentService {
  // Get government services (updated to use actual table)
  static async getServices(filters?: GovernmentFilters) {
    let query = supabase
      .from('government_services')
      .select(`
        *,
        department:government_departments(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching government services:', error)
      return this.getMockGovernmentData()
    }

    return data || []
  }

  // Fallback mock data - using essential services for Phase 1
  static getMockGovernmentData() {
    return ESSENTIAL_SERVICES.map(service => ({
      id: service.id,
      title: service.title,
      title_ar: service.titleAr,
      description: service.description,
      description_ar: service.descriptionAr,
      category: service.category,
      department: {
        name: service.department,
        name_ar: service.departmentAr
      },
      fees: service.fees || 'Free',
      processing_time: service.processingTime || 'Varies',
      processing_time_ar: service.processingTimeAr || 'متغير',
      is_online: true,
      requirements: service.requirements || [],
      requirements_ar: service.requirementsAr || [],
      official_url: service.officialUrl,
      tips: service.tips || [],
      tips_ar: service.tipsAr || [],
      icon: service.icon
    }))
  }

  static async getUpdates(filters?: GovernmentFilters) {
    // For backwards compatibility, redirect to services
    return this.getServices(filters)
  }

  // Legacy method - kept for compatibility
  static async getLegacyUpdates(filters?: GovernmentFilters) {
    let query = supabase
      .from('government_updates')
      .select('*')
      .order('published_at', { ascending: false })

    // Apply filters (legacy support)
    if (filters) {
      if (filters.departments && filters.departments.length > 0) {
        query = query.in('department_id', filters.departments)
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories)
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }

      if (filters.dateRange?.start) {
        query = query.gte('published_at', filters.dateRange.start.toISOString())
      }

      if (filters.dateRange?.end) {
        query = query.lte('published_at', filters.dateRange.end.toISOString())
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }
    }

    const { data, error } = await query

    if (error) {
            return this.getMockGovernmentData()
    }

    // Transform data to include department details
    const updates: GovernmentUpdate[] = (data || []).map(update => ({
      ...update,
      department: getDepartmentById(update.department_id) || {
        id: update.department_id,
        name: 'Unknown Department',
        nameAr: 'دائرة غير معروفة',
        icon: 'Building',
        color: '#666666'
      },
      publishedAt: update.published_at,
      expiresAt: update.expires_at,
      viewCount: update.view_count || 0,
      isOfficial: update.is_official || true,
      tags: update.tags || []
    }))

    return updates
  }

  static async getUpdateById(id: string): Promise<GovernmentUpdate | null> {
    const { data, error } = await supabase
      .from('government_updates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null

    // Increment view count
    await supabase
      .from('government_updates')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)

    return {
      ...data,
      department: getDepartmentById(data.department_id) || {
        id: data.department_id,
        name: 'Unknown Department',
        nameAr: 'دائرة غير معروفة',
        icon: 'Building',
        color: '#666666'
      },
      publishedAt: data.published_at,
      expiresAt: data.expires_at,
      viewCount: data.view_count || 0,
      isOfficial: data.is_official || true,
      tags: data.tags || []
    }
  }

  static async getAttachments(updateId: string) {
    const { data, error } = await supabase
      .from('government_attachments')
      .select('*')
      .eq('update_id', updateId)

    if (error) throw error
    return data || []
  }

  static async downloadAttachment(attachmentId: string) {
    const { data, error } = await supabase
      .from('government_attachments')
      .select('url, name')
      .eq('id', attachmentId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Attachment not found')

    // For Supabase storage URLs
    if (data.url.includes('storage/v1/object')) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('government-documents')
        .download(data.url.split('/').pop() || '')

      if (downloadError) throw downloadError
      return { blob: fileData, filename: data.name }
    }

    // For external URLs
    const response = await fetch(data.url)
    const blob = await response.blob()
    return { blob, filename: data.name }
  }

  static async subscribeToUpdates(
    callback: (update: GovernmentUpdate) => void
  ) {
    const channel = supabase
      .channel('government-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'government_updates'
        },
        async (payload) => {
          const update = {
            ...payload.new,
            department: getDepartmentById(payload.new.department_id) || {
              id: payload.new.department_id,
              name: 'Unknown Department',
              nameAr: 'دائرة غير معروفة',
              icon: 'Building',
              color: '#666666'
            },
            publishedAt: payload.new.published_at,
            expiresAt: payload.new.expires_at,
            viewCount: payload.new.view_count || 0,
            isOfficial: payload.new.is_official || true,
            tags: payload.new.tags || []
          }
          callback(update as GovernmentUpdate)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}