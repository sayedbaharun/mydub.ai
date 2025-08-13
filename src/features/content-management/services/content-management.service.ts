import { supabase } from '@/shared/lib/supabase'

export interface CategoryStats {
  category: string
  total_sources: number
  active_sources: number
  pending_drafts: number
  published_today: number
  total_published: number
}

export interface ContentSource {
  id: string
  category: string
  name: string
  url: string
  type: 'rss' | 'api' | 'web'
  is_active: boolean
  check_frequency: number
  last_checked: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface DraftContent {
  id: string
  category: string
  title: string
  content: string
  summary: string
  source_id: string
  source_url: string | null
  ai_generated: boolean
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected'
  created_at: string
  updated_at: string
}

class ContentManagementService {
  async getCategoryStats(): Promise<CategoryStats[]> {
    try {
      // Get stats for all categories
      const { data, error } = await supabase
        .from('content_stats')
        .select('*')
        .order('category')

      if (error) throw error

      // If no data, return default stats
      if (!data || data.length === 0) {
        return this.getDefaultStats()
      }

      return data.map(stat => ({
        category: stat.category,
        total_sources: stat.total_sources || 0,
        active_sources: stat.active_sources || 0,
        pending_drafts: stat.pending_drafts || 0,
        published_today: stat.published_today || 0,
        total_published: stat.total_published || 0,
      }))
    } catch (error) {
      console.error('Error fetching category stats:', error)
      // Return default stats on error
      return this.getDefaultStats()
    }
  }

  async getSourcesByCategory(category: string): Promise<ContentSource[]> {
    try {
      const { data, error } = await supabase
        .from('content_sources')
        .select('*')
        .eq('category', category)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sources:', error)
      return []
    }
  }

  async getDraftsByCategory(category: string): Promise<DraftContent[]> {
    try {
      const { data, error } = await supabase
        .from('draft_content')
        .select('*')
        .eq('category', category)
        .in('status', ['draft', 'pending_review'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching drafts:', error)
      return []
    }
  }

  async getPublishedByCategory(category: string): Promise<DraftContent[]> {
    try {
      const { data, error } = await supabase
        .from('draft_content')
        .select('*')
        .eq('category', category)
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching published content:', error)
      return []
    }
  }

  async createSource(source: Omit<ContentSource, 'id' | 'created_at' | 'updated_at'>): Promise<ContentSource | null> {
    try {
      const { data, error } = await supabase
        .from('content_sources')
        .insert([source])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating source:', error)
      return null
    }
  }

  async updateSource(id: string, updates: Partial<ContentSource>): Promise<ContentSource | null> {
    try {
      const { data, error } = await supabase
        .from('content_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating source:', error)
      return null
    }
  }

  async deleteSource(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_sources')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting source:', error)
      return false
    }
  }

  async updateContentStatus(id: string, status: DraftContent['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('draft_content')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating content status:', error)
      return false
    }
  }

  private getDefaultStats(): CategoryStats[] {
    return [
      {
        category: 'dining',
        total_sources: 12,
        active_sources: 10,
        pending_drafts: 5,
        published_today: 3,
        total_published: 145,
      },
      {
        category: 'experiences',
        total_sources: 8,
        active_sources: 8,
        pending_drafts: 3,
        published_today: 2,
        total_published: 89,
      },
      {
        category: 'nightlife',
        total_sources: 6,
        active_sources: 5,
        pending_drafts: 2,
        published_today: 1,
        total_published: 67,
      },
      {
        category: 'luxury',
        total_sources: 10,
        active_sources: 9,
        pending_drafts: 4,
        published_today: 2,
        total_published: 112,
      },
      {
        category: 'practical',
        total_sources: 15,
        active_sources: 14,
        pending_drafts: 8,
        published_today: 5,
        total_published: 234,
      },
    ]
  }
}

export const contentManagementService = new ContentManagementService()