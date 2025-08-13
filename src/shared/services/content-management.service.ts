import { supabase } from '@/shared/lib/supabase'

// Types based on the database schema
export interface AIReporterAgent {
  id: string
  name: string
  type: 'news' | 'lifestyle' | 'business' | 'tourism' | 'weather'
  description: string
  config: Record<string, any>
  is_active: boolean
  last_run?: string
  created_at: string
  updated_at: string
}

export interface AgentSource {
  id: string
  agent_id: string
  name: string
  url: string
  type: 'rss' | 'api' | 'scraper' | 'manual'
  is_active: boolean
  config: Record<string, any>
  last_fetched?: string
  fetch_interval_minutes: number
  created_at: string
  updated_at: string
}

export interface ContentDraft {
  id: string
  pipeline_id: string
  article_data: {
    title: string
    content: string
    summary?: string
    images?: string[]
    category: string
    tags?: string[]
    metadata?: Record<string, any>
  }
  status: 'pending' | 'approved' | 'rejected' | 'edited'
  reviewer_notes?: string
  approved_by?: string
  published_at?: string
  published_article_id?: string
  auto_publish_at?: string
  rejection_reason?: string
  created_at: string
  reviewed_at?: string
}

export interface ContentPipeline {
  id: string
  task_id: string
  agent_id: string
  stage: 'fetched' | 'analyzed' | 'written' | 'reviewed' | 'queued'
  raw_content: Record<string, any>
  processed_content: Record<string, any>
  article_draft: Record<string, any>
  quality_score?: number
  relevance_score?: number
  metadata: Record<string, any>
  created_at: string
  processed_at?: string
}

export interface CategoryStats {
  category: string
  total_sources: number
  active_sources: number
  pending_drafts: number
  published_today: number
  total_published: number
  avg_quality_score?: number
}

/**
 * Content Management Service
 * Handles all content management operations including sources, drafts, and analytics
 */
export class ContentManagementService {
  /**
   * Get AI Reporter Agents by category
   */
  async getAgentsByCategory(category?: string): Promise<AIReporterAgent[]> {
    try {
      let query = supabase
        .from('ai_reporter_agents')
        .select('*')
        .order('created_at', { ascending: false })

      if (category) {
        // Map category names to agent types
        const categoryMap: Record<string, string> = {
          dining: 'lifestyle',
          experiences: 'tourism',
          nightlife: 'lifestyle',
          luxury: 'lifestyle',
          practical: 'news',
        }
        const agentType = categoryMap[category] || category
        query = query.eq('type', agentType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching agents:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAgentsByCategory:', error)
      return []
    }
  }

  /**
   * Update a source's details
   */
  async updateSource(sourceId: string, updates: Partial<AgentSource>): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_sources')
        .update(updates)
        .eq('id', sourceId)

      if (error) {
        console.error('Error updating source:', error)
      }
    } catch (error) {
      console.error('Error in updateSource:', error)
    }
  }

  /**
   * Test if a source is accessible and working
   */
  async testSource(sourceId: string): Promise<{ success: boolean; message: string; articlesFound?: number }> {
    try {
      // Get source details
      const { data: source, error } = await supabase
        .from('agent_sources')
        .select('*')
        .eq('id', sourceId)
        .single()

      if (error || !source) {
        return { success: false, message: 'Source not found' }
      }

      // For RSS feeds, try to fetch and parse
      if (source.type === 'rss') {
        try {
          // Simple RSS validation - in production you'd use a proper RSS parser
          const response = await fetch(source.url)

          if (!response.ok) {
            return {
              success: false,
              message: `HTTP ${response.status}: ${response.statusText}`,
            }
          }

          const text = await response.text()

          // Basic RSS validation
          if (!text.includes('<rss') && !text.includes('<feed')) {
            return {
              success: false,
              message: 'URL is not a valid RSS or Atom feed',
            }
          }

          // Count potential articles (very basic)
          const itemCount =
            (text.match(/<item/g) || []).length + (text.match(/<entry/g) || []).length

          // Update last_fetched timestamp
          await this.updateSource(sourceId, {
            last_fetched: new Date().toISOString(),
          })

          return {
            success: true,
            message: 'RSS feed is working correctly',
            articlesFound: itemCount,
          }
        } catch (fetchError) {
          return {
            success: false,
            message: 'Failed to connect to RSS feed: Network error',
          }
        }
      }

      // For other source types
      try {
        const response = await fetch(source.url)

        if (response.ok) {
          await this.updateSource(sourceId, {
            last_fetched: new Date().toISOString(),
          })

          return {
            success: true,
            message: 'Source is accessible',
            articlesFound: 0,
          }
        } else {
          return {
            success: false,
            message: `HTTP ${response.status}: ${response.statusText}`,
          }
        }
      } catch (fetchError) {
        return {
          success: false,
          message: 'Failed to connect: Network error',
        }
      }
    } catch (error) {
      console.error('Error testing source:', error)
      return { success: false, message: 'Internal error occurred' }
    }
  }
}

// Export singleton instance
export const contentManagementService = new ContentManagementService()
