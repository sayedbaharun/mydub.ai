import { supabase } from '@/shared/lib/supabase'
import { 
  AIAgent, 
  ContentSource, 
  AgentMetrics, 
  AIReporterDashboard 
} from '../types'

export const aiReporterService = {
  // Get all AI agents
  async getAgents(): Promise<AIAgent[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('name')

      if (error) throw error

      // Fetch performance metrics for each agent
      const agentsWithMetrics = await Promise.all(
        (data || []).map(async (agent) => {
          const metrics = await this.getAgentPerformance(agent.id)
          return {
            ...agent,
            performance: metrics
          }
        })
      )

      return agentsWithMetrics
    } catch (error) {
      console.error('Error fetching AI agents:', error)
      throw error
    }
  },

  // Get single agent details
  async getAgent(agentId: string): Promise<AIAgent | null> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single()

      if (error) throw error

      const performance = await this.getAgentPerformance(agentId)
      return {
        ...data,
        performance
      }
    } catch (error) {
      console.error('Error fetching agent:', error)
      throw error
    }
  },

  // Get agent performance metrics
  async getAgentPerformance(agentId: string): Promise<AIAgent['performance']> {
    try {
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Get article counts
      const [
        { count: articlesGenerated },
        { count: articlesApproved },
        { data: qualityScores },
        { count: errorsLast24h }
      ] = await Promise.all([
        supabase.from('ai_generated_content')
          .select('*', { count: 'exact', head: true })
          .eq('ai_agent_id', agentId),
        supabase.from('ai_generated_content')
          .select('*', { count: 'exact', head: true })
          .eq('ai_agent_id', agentId)
          .eq('status', 'approved'),
        supabase.from('ai_generated_content')
          .select('metadata->quality_score')
          .eq('ai_agent_id', agentId)
          .not('metadata->quality_score', 'is', null),
        supabase.from('agent_errors')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agentId)
          .gte('created_at', last24h.toISOString())
      ])

      // Calculate metrics
      const approvalRate = articlesGenerated > 0 
        ? (articlesApproved / articlesGenerated) * 100 
        : 0

      const scores = qualityScores?.map(item => 
        parseFloat(item.metadata?.quality_score || '0')
      ) || []
      
      const averageQualityScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0

      // Get last active time
      const { data: lastActivity } = await supabase
        .from('ai_generated_content')
        .select('created_at')
        .eq('ai_agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Calculate uptime (simplified - would need actual monitoring data)
      const uptimePercentage = 99.5 // Placeholder

      return {
        articles_generated: articlesGenerated || 0,
        articles_approved: articlesApproved || 0,
        approval_rate: Math.round(approvalRate * 100) / 100,
        average_quality_score: Math.round(averageQualityScore * 100) / 100,
        last_active: lastActivity?.created_at || now.toISOString(),
        uptime_percentage: uptimePercentage,
        errors_last_24h: errorsLast24h || 0
      }
    } catch (error) {
      console.error('Error fetching agent performance:', error)
      return {
        articles_generated: 0,
        articles_approved: 0,
        approval_rate: 0,
        average_quality_score: 0,
        last_active: new Date().toISOString(),
        uptime_percentage: 0,
        errors_last_24h: 0
      }
    }
  },

  // Update agent configuration
  async updateAgentConfig(
    agentId: string,
    config: Partial<AIAgent['configuration']>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({ 
          configuration: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating agent config:', error)
      throw error
    }
  },

  // Update agent status
  async updateAgentStatus(
    agentId: string,
    status: AIAgent['status']
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating agent status:', error)
      throw error
    }
  },

  // Get all content sources
  async getSources(): Promise<ContentSource[]> {
    try {
      const { data, error } = await supabase
        .from('content_sources')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sources:', error)
      throw error
    }
  },

  // Add new content source
  async addSource(source: Omit<ContentSource, 'id' | 'created_at' | 'updated_at'>): Promise<ContentSource> {
    try {
      const { data, error } = await supabase
        .from('content_sources')
        .insert({
          ...source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding source:', error)
      throw error
    }
  },

  // Update content source
  async updateSource(
    sourceId: string,
    updates: Partial<ContentSource>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_sources')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating source:', error)
      throw error
    }
  },

  // Delete content source
  async deleteSource(sourceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_sources')
        .delete()
        .eq('id', sourceId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting source:', error)
      throw error
    }
  },

  // Get agent metrics over time
  async getAgentMetrics(
    agentId: string,
    period: AgentMetrics['period'] = 'day'
  ): Promise<AgentMetrics> {
    try {
      const periodMap = {
        hour: 1,
        day: 24,
        week: 168,
        month: 720
      }
      
      const hours = periodMap[period]
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000)

      // Get content data
      const { data: content } = await supabase
        .from('ai_generated_content')
        .select('*')
        .eq('ai_agent_id', agentId)
        .gte('created_at', startDate.toISOString())

      // Calculate metrics
      const metrics = {
        articles_generated: content?.length || 0,
        articles_approved: content?.filter(c => c.status === 'approved').length || 0,
        articles_rejected: content?.filter(c => c.status === 'rejected').length || 0,
        average_processing_time: 0, // Would need actual timing data
        quality_scores: content?.map(c => c.metadata?.quality_score || 0).filter(s => s > 0) || [],
        error_rate: 0, // Would need error data
        source_utilization: {} as Record<string, number>
      }

      // Count source utilization
      content?.forEach(item => {
        const sourceId = item.source_id
        if (sourceId) {
          metrics.source_utilization[sourceId] = (metrics.source_utilization[sourceId] || 0) + 1
        }
      })

      // Generate timeline data
      const timeline = this.generateTimeline(content || [], period)

      return {
        agent_id: agentId,
        period,
        metrics,
        timeline
      }
    } catch (error) {
      console.error('Error fetching agent metrics:', error)
      throw error
    }
  },

  // Generate timeline data for metrics
  generateTimeline(
    content: any[],
    period: AgentMetrics['period']
  ): AgentMetrics['timeline'] {
    const intervals = period === 'hour' ? 12 : period === 'day' ? 24 : period === 'week' ? 7 : 30
    const timeline = []

    for (let i = 0; i < intervals; i++) {
      const intervalStart = new Date()
      const intervalEnd = new Date()

      if (period === 'hour') {
        intervalStart.setMinutes(intervalStart.getMinutes() - (i + 1) * 5)
        intervalEnd.setMinutes(intervalEnd.getMinutes() - i * 5)
      } else if (period === 'day') {
        intervalStart.setHours(intervalStart.getHours() - (i + 1))
        intervalEnd.setHours(intervalEnd.getHours() - i)
      } else if (period === 'week') {
        intervalStart.setDate(intervalStart.getDate() - (i + 1))
        intervalEnd.setDate(intervalEnd.getDate() - i)
      } else {
        intervalStart.setDate(intervalStart.getDate() - (i + 1))
        intervalEnd.setDate(intervalEnd.getDate() - i)
      }

      const intervalContent = content.filter(item => {
        const createdAt = new Date(item.created_at)
        return createdAt >= intervalStart && createdAt < intervalEnd
      })

      const qualityScores = intervalContent
        .map(c => c.metadata?.quality_score || 0)
        .filter(s => s > 0)

      timeline.unshift({
        timestamp: intervalEnd.toISOString(),
        articles: intervalContent.length,
        quality: qualityScores.length > 0 
          ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
          : 0,
        errors: 0 // Would need error data
      })
    }

    return timeline
  },

  // Get dashboard overview
  async getDashboard(): Promise<AIReporterDashboard> {
    try {
      const [agents, sources] = await Promise.all([
        this.getAgents(),
        this.getSources()
      ])

      const activeAgents = agents.filter(a => a.status === 'active').length
      const activeSources = sources.filter(s => s.status === 'active').length

      // Get today's articles
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: articlesToday } = await supabase
        .from('ai_generated_content')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      const { count: pendingReview } = await supabase
        .from('ai_generated_content')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('agent_activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10)

      // Determine system health
      const errorRate = agents.reduce((sum, agent) => 
        sum + agent.performance.errors_last_24h, 0
      ) / agents.length

      const systemHealth = errorRate > 10 ? 'critical' : 
                          errorRate > 5 ? 'warning' : 'good'

      return {
        agents,
        sources,
        overall_metrics: {
          total_agents: agents.length,
          active_agents: activeAgents,
          total_sources: sources.length,
          active_sources: activeSources,
          articles_today: articlesToday || 0,
          pending_review: pendingReview || 0,
          system_health: systemHealth
        },
        recent_activity: recentActivity || []
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      throw error
    }
  },

  // Test source connection
  async testSource(sourceId: string): Promise<{ success: boolean; message: string }> {
    // TODO: Implement actual source connection test
    // For now, return a mock response
    return {
      success: true,
      message: 'Source connection successful'
    }
  }
}