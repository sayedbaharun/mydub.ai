export interface AIAgent {
  id: string
  name: string
  type: 'news_reporter' | 'tourism_curator' | 'government_monitor' | 'event_tracker' | 'content_optimizer'
  status: 'active' | 'paused' | 'error' | 'maintenance'
  description: string
  avatar?: string
  capabilities: string[]
  performance: {
    articles_generated: number
    articles_approved: number
    approval_rate: number
    average_quality_score: number
    last_active: string
    uptime_percentage: number
    errors_last_24h: number
  }
  configuration: {
    sources: string[]
    update_frequency: number // in minutes
    languages: string[]
    quality_threshold: number
    auto_publish: boolean
    max_articles_per_day: number
  }
  created_at: string
  updated_at: string
}

export interface ContentSource {
  id: string
  name: string
  url: string
  type: 'rss' | 'api' | 'scraper' | 'social' | 'official'
  status: 'active' | 'inactive' | 'error'
  category: string
  language: string
  reliability_score: number
  last_fetched?: string
  fetch_frequency: number // in minutes
  error_count: number
  metadata?: {
    requires_auth?: boolean
    api_key_configured?: boolean
    rate_limit?: number
    custom_parser?: boolean
  }
  created_at: string
  updated_at: string
}

export interface AgentMetrics {
  agent_id: string
  period: 'hour' | 'day' | 'week' | 'month'
  metrics: {
    articles_generated: number
    articles_approved: number
    articles_rejected: number
    average_processing_time: number
    quality_scores: number[]
    error_rate: number
    source_utilization: Record<string, number>
  }
  timeline: Array<{
    timestamp: string
    articles: number
    quality: number
    errors: number
  }>
}

export interface AIReporterDashboard {
  agents: AIAgent[]
  sources: ContentSource[]
  overall_metrics: {
    total_agents: number
    active_agents: number
    total_sources: number
    active_sources: number
    articles_today: number
    pending_review: number
    system_health: 'good' | 'warning' | 'critical'
  }
  recent_activity: Array<{
    id: string
    type: 'article_generated' | 'source_added' | 'agent_error' | 'configuration_change'
    agent?: string
    source?: string
    message: string
    timestamp: string
  }>
}