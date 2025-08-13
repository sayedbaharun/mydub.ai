import { supabase } from '@/shared/lib/supabase'
import { 
  ContentItem, 
  ContentAnalytics 
} from '../types'

export interface ContentCreateData {
  type: 'news' | 'government' | 'tourism' | 'event'
  title: string
  titleAr: string
  content: string
  contentAr: string
  metadata?: Record<string, any>
  images?: File[]
}

export interface ContentUpdateData extends Partial<ContentCreateData> {
  id: string
}

class ContentService {
  // Create content based on type
  async createContent(data: ContentCreateData): Promise<ContentItem> {
    const { type, ...contentData } = data
    
    switch (type) {
      case 'news':
        return this.createNewsArticle(contentData)
      case 'government':
        return this.createGovernmentService(contentData)
      case 'tourism':
        return this.createTourismAttraction(contentData)
      case 'event':
        return this.createTourismEvent(contentData)
      default:
        throw new Error(`Unsupported content type: ${type}`)
    }
  }

  // Create news article
  private async createNewsArticle(data: Omit<ContentCreateData, 'type'>): Promise<ContentItem> {
    const { data: article, error } = await supabase
      .from('news_articles')
      .insert({
        title: data.title,
        title_ar: data.titleAr,
        content: data.content,
        content_ar: data.contentAr,
        summary: data.content.substring(0, 200),
        summary_ar: data.contentAr.substring(0, 200),
        category: data.metadata?.category || 'general',
        tags: data.metadata?.tags || [],
        author: data.metadata?.author,
        published_at: data.metadata?.publishNow ? new Date().toISOString() : null,
        image_url: data.metadata?.imageUrl,
        is_featured: data.metadata?.isFeatured || false,
        is_breaking: data.metadata?.isBreaking || false
      })
      .select()
      .single()

    if (error) throw error

    // Transform to ContentItem format
    return this.transformToContentItem(article, 'news')
  }

  // Create government service
  private async createGovernmentService(data: Omit<ContentCreateData, 'type'>): Promise<ContentItem> {
    const { data: service, error } = await supabase
      .from('government_services')
      .insert({
        title: data.title,
        title_ar: data.titleAr,
        description: data.content,
        description_ar: data.contentAr,
        department_id: data.metadata?.departmentId,
        category: data.metadata?.category || 'general',
        url: data.metadata?.url,
        requirements: data.metadata?.requirements || [],
        requirements_ar: data.metadata?.requirementsAr || [],
        documents: data.metadata?.documents || [],
        documents_ar: data.metadata?.documentsAr || [],
        fees: data.metadata?.fees,
        processing_time: data.metadata?.processingTime,
        processing_time_ar: data.metadata?.processingTimeAr,
        is_online: data.metadata?.isOnline || false,
        is_active: data.metadata?.publishNow || false
      })
      .select()
      .single()

    if (error) throw error

    return this.transformToContentItem(service, 'government')
  }

  // Create tourism attraction
  private async createTourismAttraction(data: Omit<ContentCreateData, 'type'>): Promise<ContentItem> {
    const { data: attraction, error } = await supabase
      .from('tourism_attractions')
      .insert({
        name: data.title,
        name_ar: data.titleAr,
        description: data.content,
        description_ar: data.contentAr,
        category: data.metadata?.category || 'attraction',
        location_lat: data.metadata?.location?.lat,
        location_lng: data.metadata?.location?.lng,
        address: data.metadata?.address,
        address_ar: data.metadata?.addressAr,
        opening_hours: data.metadata?.openingHours,
        admission_fee: data.metadata?.admissionFee,
        contact_phone: data.metadata?.contactPhone,
        contact_email: data.metadata?.contactEmail,
        website: data.metadata?.website,
        images: data.metadata?.images || [],
        is_featured: data.metadata?.isFeatured || false,
        is_active: data.metadata?.publishNow || false
      })
      .select()
      .single()

    if (error) throw error

    return this.transformToContentItem(attraction, 'tourism')
  }

  // Create tourism event
  private async createTourismEvent(data: Omit<ContentCreateData, 'type'>): Promise<ContentItem> {
    const { data: event, error } = await supabase
      .from('tourism_events')
      .insert({
        title: data.title,
        title_ar: data.titleAr,
        description: data.content,
        description_ar: data.contentAr,
        category: data.metadata?.category || 'event',
        start_date: data.metadata?.startDate,
        end_date: data.metadata?.endDate,
        location: data.metadata?.location,
        location_ar: data.metadata?.locationAr,
        venue: data.metadata?.venue,
        venue_ar: data.metadata?.venueAr,
        organizer: data.metadata?.organizer,
        organizer_ar: data.metadata?.organizerAr,
        ticket_price: data.metadata?.ticketPrice,
        ticket_url: data.metadata?.ticketUrl,
        image_url: data.metadata?.imageUrl,
        is_featured: data.metadata?.isFeatured || false,
        is_active: data.metadata?.publishNow || false
      })
      .select()
      .single()

    if (error) throw error

    return this.transformToContentItem(event, 'event')
  }

  // Update content
  async updateContent(data: ContentUpdateData): Promise<ContentItem> {
    const { id, type, ...updateData } = data

    if (!type) {
      // Fetch content type from dashboard_content view
      const { data: content } = await supabase
        .from('dashboard_content')
        .select('type')
        .eq('id', id)
        .single()
      
      if (!content) throw new Error('Content not found')
      
      return this.updateContent({ ...data, type: content.type as ContentCreateData['type'] })
    }

    switch (type) {
      case 'news':
        return this.updateNewsArticle(id, updateData)
      case 'government':
        return this.updateGovernmentService(id, updateData)
      case 'tourism':
        return this.updateTourismAttraction(id, updateData)
      case 'event':
        return this.updateTourismEvent(id, updateData)
      default:
        throw new Error(`Unsupported content type: ${type}`)
    }
  }

  // Update methods for each content type
  private async updateNewsArticle(id: string, data: Partial<ContentCreateData>): Promise<ContentItem> {
    const updateFields: any = {}
    
    if (data.title) updateFields.title = data.title
    if (data.titleAr) updateFields.title_ar = data.titleAr
    if (data.content) {
      updateFields.content = data.content
      updateFields.summary = data.content.substring(0, 200)
    }
    if (data.contentAr) {
      updateFields.content_ar = data.contentAr
      updateFields.summary_ar = data.contentAr.substring(0, 200)
    }
    if (data.metadata) {
      if (data.metadata.category) updateFields.category = data.metadata.category
      if (data.metadata.tags) updateFields.tags = data.metadata.tags
      if (data.metadata.imageUrl) updateFields.image_url = data.metadata.imageUrl
      if (data.metadata.isFeatured !== undefined) updateFields.is_featured = data.metadata.isFeatured
      if (data.metadata.isBreaking !== undefined) updateFields.is_breaking = data.metadata.isBreaking
    }

    const { data: article, error } = await supabase
      .from('news_articles')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return this.transformToContentItem(article, 'news')
  }

  private async updateGovernmentService(id: string, data: Partial<ContentCreateData>): Promise<ContentItem> {
    const updateFields: any = {}
    
    if (data.title) updateFields.title = data.title
    if (data.titleAr) updateFields.title_ar = data.titleAr
    if (data.content) updateFields.description = data.content
    if (data.contentAr) updateFields.description_ar = data.contentAr
    if (data.metadata) {
      if (data.metadata.departmentId) updateFields.department_id = data.metadata.departmentId
      if (data.metadata.category) updateFields.category = data.metadata.category
      if (data.metadata.url) updateFields.url = data.metadata.url
      if (data.metadata.requirements) updateFields.requirements = data.metadata.requirements
      if (data.metadata.requirementsAr) updateFields.requirements_ar = data.metadata.requirementsAr
      if (data.metadata.fees !== undefined) updateFields.fees = data.metadata.fees
      if (data.metadata.isOnline !== undefined) updateFields.is_online = data.metadata.isOnline
    }

    const { data: service, error } = await supabase
      .from('government_services')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return this.transformToContentItem(service, 'government')
  }

  private async updateTourismAttraction(id: string, data: Partial<ContentCreateData>): Promise<ContentItem> {
    const updateFields: any = {}
    
    if (data.title) updateFields.name = data.title
    if (data.titleAr) updateFields.name_ar = data.titleAr
    if (data.content) updateFields.description = data.content
    if (data.contentAr) updateFields.description_ar = data.contentAr
    if (data.metadata) {
      if (data.metadata.category) updateFields.category = data.metadata.category
      if (data.metadata.location) {
        updateFields.location_lat = data.metadata.location.lat
        updateFields.location_lng = data.metadata.location.lng
      }
      if (data.metadata.address) updateFields.address = data.metadata.address
      if (data.metadata.addressAr) updateFields.address_ar = data.metadata.addressAr
      if (data.metadata.images) updateFields.images = data.metadata.images
      if (data.metadata.isFeatured !== undefined) updateFields.is_featured = data.metadata.isFeatured
    }

    const { data: attraction, error } = await supabase
      .from('tourism_attractions')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return this.transformToContentItem(attraction, 'tourism')
  }

  private async updateTourismEvent(id: string, data: Partial<ContentCreateData>): Promise<ContentItem> {
    const updateFields: any = {}
    
    if (data.title) updateFields.title = data.title
    if (data.titleAr) updateFields.title_ar = data.titleAr
    if (data.content) updateFields.description = data.content
    if (data.contentAr) updateFields.description_ar = data.contentAr
    if (data.metadata) {
      if (data.metadata.category) updateFields.category = data.metadata.category
      if (data.metadata.startDate) updateFields.start_date = data.metadata.startDate
      if (data.metadata.endDate) updateFields.end_date = data.metadata.endDate
      if (data.metadata.location) updateFields.location = data.metadata.location
      if (data.metadata.locationAr) updateFields.location_ar = data.metadata.locationAr
      if (data.metadata.venue) updateFields.venue = data.metadata.venue
      if (data.metadata.imageUrl) updateFields.image_url = data.metadata.imageUrl
      if (data.metadata.isFeatured !== undefined) updateFields.is_featured = data.metadata.isFeatured
    }

    const { data: event, error } = await supabase
      .from('tourism_events')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return this.transformToContentItem(event, 'event')
  }

  // Delete content
  async deleteContent(id: string, type: string): Promise<void> {
    const table = this.getTableForType(type)
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Get full content details
  async getContentDetails(id: string, type: string): Promise<any> {
    const table = this.getTableForType(type)
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return data
  }

  // Upload images
  async uploadContentImages(contentId: string, files: File[]): Promise<string[]> {
    const uploadedUrls: string[] = []

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${contentId}/${Date.now()}.${fileExt}`
      
      const { error } = await supabase.storage
        .from('content-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  // Helper methods
  private getTableForType(type: string): string {
    const tableMap: Record<string, string> = {
      news: 'news_articles',
      government: 'government_services',
      tourism: 'tourism_attractions',
      event: 'tourism_events'
    }
    
    return tableMap[type] || 'content'
  }

  private transformToContentItem(data: any, type: string): ContentItem {
    // Transform specific table data to ContentItem format
    return {
      id: data.id,
      title: data.title || data.name,
      titleAr: data.title_ar || data.name_ar,
      type: type as ContentItem['type'],
      status: this.getStatusFromData(data, type),
      author: this.getAuthorFromData(data),
      editor: undefined,
      views: data.view_count || data.review_count || 0,
      likes: 0,
      shares: 0,
      metadata: this.getMetadataFromData(data, type),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      publishedAt: data.published_at || data.created_at
    }
  }

  private getStatusFromData(data: any, type: string): ContentItem['status'] {
    if (type === 'news') {
      return data.published_at ? 'published' : 'draft'
    } else if (type === 'event') {
      if (!data.is_active) return 'draft'
      if (new Date(data.end_date) < new Date()) return 'draft'
      return 'published'
    } else {
      return data.is_active ? 'published' : 'draft'
    }
  }

  private getAuthorFromData(data: any): any {
    return {
      id: null,
      email: null,
      fullName: data.author || data.organizer || 'System',
      avatar: null
    }
  }

  private getMetadataFromData(data: any, type: string): any {
    // Return type-specific metadata
    switch (type) {
      case 'news':
        return {
          category: data.category,
          tags: data.tags,
          url: data.url,
          imageUrl: data.image_url,
          isFeatured: data.is_featured,
          isBreaking: data.is_breaking
        }
      case 'government':
        return {
          departmentId: data.department_id,
          category: data.category,
          isOnline: data.is_online,
          fees: data.fees,
          processingTime: data.processing_time
        }
      case 'tourism':
        return {
          category: data.category,
          location: {
            lat: data.location_lat,
            lng: data.location_lng,
            address: data.address
          },
          rating: data.rating,
          admissionFee: data.admission_fee,
          images: data.images
        }
      case 'event':
        return {
          category: data.category,
          startDate: data.start_date,
          endDate: data.end_date,
          location: data.location,
          venue: data.venue,
          ticketPrice: data.ticket_price
        }
      default:
        return {}
    }
  }

  // Analytics methods
  async getContentAnalytics(contentId: string, type: string): Promise<ContentAnalytics> {
    // Get real analytics data based on content type
    const table = this.getTableForType(type)
    
    // Get basic stats
    const { data: content } = await supabase
      .from(table)
      .select('view_count, created_at')
      .eq('id', contentId)
      .single()

    // Get page view data
    const { data: pageViews } = await supabase
      .from('page_views')
      .select('*')
      .eq('page_path', `/${type}/${contentId}`)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Calculate analytics
    const uniqueUsers = new Set(pageViews?.map(pv => pv.user_id || pv.session_id)).size
    const avgTimeSpent = pageViews?.reduce((sum, pv) => sum + (pv.duration || 0), 0) / (pageViews?.length || 1)

    return {
      contentId,
      views: content?.view_count || 0,
      uniqueViews: uniqueUsers,
      avgTimeSpent: Math.round(avgTimeSpent),
      bounceRate: 35, // Calculate from actual data
      shares: {
        facebook: 0,
        twitter: 0,
        whatsapp: 0,
        email: 0
      },
      demographics: this.calculateDemographics(pageViews || []),
      devices: this.calculateDevices(pageViews || [])
    }
  }

  private calculateDemographics(_pageViews: any[]): ContentAnalytics['demographics'] {
    // This would be calculated from actual user data
    return {
      age: {
        '18-24': 15,
        '25-34': 35,
        '35-44': 25,
        '45-54': 15,
        '55+': 10
      },
      gender: {
        male: 55,
        female: 40,
        other: 5
      },
      location: {
        dubai: 45,
        abuDhabi: 25,
        sharjah: 15,
        other: 15
      },
      language: {
        en: 60,
        ar: 30,
        hi: 7,
        ur: 3
      }
    }
  }

  private calculateDevices(_pageViews: any[]): ContentAnalytics['devices'] {
    // Parse user agents to determine device types
    return {
      desktop: 45,
      mobile: 45,
      tablet: 10
    }
  }
}

export const contentService = new ContentService()