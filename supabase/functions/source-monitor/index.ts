import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createSupabaseClient,
  corsHeaders,
  withErrorHandler,
  errorResponse,
  successResponse,
  parseRSSFeed,
  isDuplicateContent,
  calculateRelevanceScore,
  normalizeContent,
  SourceType,
  logOperation
} from '../_shared/reporter-utils.ts'

// Import source monitoring utilities
interface SourceHealth {
  sourceId: string;
  sourceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  lastSuccess: Date | null;
  errorRate: number;
  avgResponseTime: number;
  consecutiveFailures: number;
  details?: any;
}

interface MonitorRequest {
  action?: 'monitor_all' | 'monitor_source' | 'check_source' | 'get_status'
  sourceId?: string
  agentId?: string
  force?: boolean
}

// Content signature for deduplication
function generateContentSignature(content: any): string {
  const text = `${content.title || ''} ${content.summary || ''} ${content.content || ''}`.toLowerCase()
  
  // Simple hash function for signature
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return hash.toString(36)
}

// Check if content already exists in pipeline
async function checkDuplicateContent(
  supabase: any,
  content: any,
  lookbackDays: number = 7
): Promise<boolean> {
  const signature = generateContentSignature(content)
  const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()
  
  // Check by title exact match
  const { data: titleMatch } = await supabase
    .from('content_pipeline')
    .select('id')
    .eq('raw_content->title', content.title)
    .gte('created_at', lookbackDate)
    .limit(1)
  
  if (titleMatch && titleMatch.length > 0) {
    return true
  }
  
  // Check by content similarity
  const { data: recentContent } = await supabase
    .from('content_pipeline')
    .select('id, raw_content')
    .gte('created_at', lookbackDate)
    .limit(100)
  
  if (recentContent) {
    for (const item of recentContent) {
      if (isDuplicateContent(
        JSON.stringify(content),
        JSON.stringify(item.raw_content),
        0.85
      )) {
        return true
      }
    }
  }
  
  return false
}

// Monitor a single source
async function monitorSource(supabase: any, sourceId: string, force: boolean = false): Promise<any> {
  // Get source details
  const { data: source, error: sourceError } = await supabase
    .from('agent_sources')
    .select('*, ai_reporter_agents(*)')
    .eq('id', sourceId)
    .single()
  
  if (sourceError || !source) {
    throw new Error('Source not found')
  }
  
  // Check if monitoring is needed
  if (!force && source.last_fetched) {
    const lastFetchTime = new Date(source.last_fetched).getTime()
    const intervalMs = parseInterval(source.fetch_interval)
    const nextFetchTime = lastFetchTime + intervalMs
    
    if (Date.now() < nextFetchTime) {
      return {
        source_id: sourceId,
        status: 'skipped',
        reason: 'not_due',
        next_fetch: new Date(nextFetchTime).toISOString()
      }
    }
  }
  
  const newContent = []
  const tasksCreated = []
  
  try {
    // Fetch content based on source type
    let items = []
    
    switch (source.type) {
      case SourceType.RSS:
        items = await parseRSSFeed(source.url)
        break
        
      case SourceType.API: {
        // For API sources, just check if endpoint is reachable
        const response = await fetch(source.url, { method: 'HEAD' })
        if (response.ok) {
          // Create a fetch task for actual content retrieval
          const { data: task } = await supabase
            .from('agent_tasks')
            .insert({
              agent_id: source.agent_id,
              type: 'fetch',
              priority: 'medium',
              source_url: source.url,
              metadata: {
                source_id: source.id,
                source_type: source.type,
                source_config: source.config
              }
            })
            .select()
            .single()
          
          if (task) {
            tasksCreated.push(task.id)
          }
        }
        break
      }
        
      default: {
        // For other types, create fetch task
        const { data: task } = await supabase
          .from('agent_tasks')
          .insert({
            agent_id: source.agent_id,
            type: 'fetch',
            priority: 'medium',
            source_url: source.url,
            metadata: {
              source_id: source.id,
              source_type: source.type,
              source_config: source.config
            }
          })
          .select()
          .single()
        
        if (task) {
          tasksCreated.push(task.id)
        }
      }
    }
    
    // Process RSS items
    for (const item of items) {
      const normalized = normalizeContent(item, SourceType.RSS)
      
      // Check if content is new
      const isDuplicate = await checkDuplicateContent(supabase, normalized)
      
      if (!isDuplicate) {
        // Calculate relevance based on agent's focus keywords
        const keywords = source.config?.keywords || []
        const relevanceScore = calculateRelevanceScore(
          JSON.stringify(normalized),
          keywords
        )
        
        // Only process if relevant enough
        if (relevanceScore >= (source.config?.min_relevance || 0.3)) {
          newContent.push({
            ...normalized,
            relevance_score: relevanceScore
          })
          
          // Create fetch task for detailed processing
          const priority = relevanceScore >= 0.7 ? 'high' : 
                          relevanceScore >= 0.5 ? 'medium' : 'low'
          
          const { data: task } = await supabase
            .from('agent_tasks')
            .insert({
              agent_id: source.agent_id,
              type: 'fetch',
              priority,
              source_url: normalized.sourceUrl,
              metadata: {
                source_id: source.id,
                source_type: source.type,
                title: normalized.title,
                relevance_score: relevanceScore,
                content_preview: normalized
              }
            })
            .select()
            .single()
          
          if (task) {
            tasksCreated.push(task.id)
          }
        }
      }
    }
    
    // Update source status
    await supabase
      .from('agent_sources')
      .update({
        last_fetched: new Date().toISOString(),
        error_count: 0,
        last_error: null
      })
      .eq('id', sourceId)
    
    // Log operation
    await logOperation(supabase, 'source_monitor', source.agent_id, {
      source_id: sourceId,
      items_found: items.length,
      new_content: newContent.length,
      tasks_created: tasksCreated.length
    })
    
    return {
      source_id: sourceId,
      source_name: source.name,
      status: 'success',
      items_found: items.length,
      new_content: newContent.length,
      tasks_created: tasksCreated.length,
      task_ids: tasksCreated
    }
    
  } catch (error) {
    // Update source with error
    await supabase
      .from('agent_sources')
      .update({
        error_count: source.error_count + 1,
        last_error: {
          message: error.message,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', sourceId)
    
    throw error
  }
}

// Monitor all active sources
async function monitorAllSources(supabase: any, agentId?: string, force: boolean = false): Promise<any> {
  // Get active sources
  const query = supabase
    .from('agent_sources')
    .select('id, name')
    .eq('is_active', true)
  
  if (agentId) {
    query.eq('agent_id', agentId)
  }
  
  const { data: sources, error } = await query
  
  if (error) throw error
  
  const results = []
  
  // Process sources in parallel with concurrency limit
  const concurrencyLimit = 5
  for (let i = 0; i < sources.length; i += concurrencyLimit) {
    const batch = sources.slice(i, i + concurrencyLimit)
    const batchResults = await Promise.allSettled(
      batch.map(source => monitorSource(supabase, source.id, force))
    )
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          source_id: batch[index].id,
          source_name: batch[index].name,
          status: 'error',
          error: result.reason.message
        })
      }
    })
  }
  
  return {
    sources_monitored: results.length,
    results,
    summary: {
      successful: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
      total_new_content: results.reduce((sum, r) => sum + (r.new_content || 0), 0),
      total_tasks_created: results.reduce((sum, r) => sum + (r.tasks_created || 0), 0)
    }
  }
}

// Enhanced source health check with comprehensive metrics
async function checkSourceHealth(supabase: any, sourceId: string): Promise<SourceHealth> {
  try {
    // Get source details
    const { data: source, error: sourceError } = await supabase
      .from('agent_sources')
      .select('*')
      .eq('id', sourceId)
      .single()
    
    if (sourceError || !source) {
      return {
        sourceId,
        sourceName: 'Unknown',
        status: 'unknown',
        lastCheck: new Date(),
        lastSuccess: null,
        errorRate: 1,
        avgResponseTime: 0,
        consecutiveFailures: 0,
        details: { error: 'Source not found' }
      }
    }
    
    // Get recent task history for comprehensive analysis
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: tasks, error: tasksError } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('source_url', source.url)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(100)
    
    let errorRate = 0
    let avgResponseTime = 0
    let consecutiveFailures = 0
    let lastSuccess = source.last_fetched ? new Date(source.last_fetched) : null
    let status: SourceHealth['status'] = 'unknown'
    
    if (tasks && tasks.length > 0) {
      // Calculate error rate
      const failedTasks = tasks.filter(t => t.status === 'failed')
      const completedTasks = tasks.filter(t => t.status === 'completed')
      errorRate = tasks.length > 0 ? failedTasks.length / tasks.length : 0
      
      // Calculate average response time
      const responseTimes = completedTasks
        .filter(t => t.completed_at)
        .map(t => {
          const start = new Date(t.created_at).getTime()
          const end = new Date(t.completed_at).getTime()
          return end - start
        })
      
      avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0
      
      // Count consecutive failures
      for (const task of tasks) {
        if (task.status === 'failed') {
          consecutiveFailures++
        } else if (task.status === 'completed') {
          if (!lastSuccess) {
            lastSuccess = new Date(task.completed_at)
          }
          break
        }
      }
    }
    
    // Perform live health check
    const startTime = Date.now()
    let liveCheck = { healthy: false, responseTime: 0, error: null }
    
    try {
      switch (source.type) {
        case SourceType.RSS: {
          const items = await parseRSSFeed(source.url)
          liveCheck.healthy = items.length > 0
          liveCheck.responseTime = Date.now() - startTime
          break
        }
          
        case SourceType.API: {
          // Add authentication headers if configured
          const headers: Record<string, string> = {
            'User-Agent': 'MyDub.ai Source Monitor/1.0',
            ...source.config?.headers
          }
          
          // Handle authentication
          if (source.credentials?.apiKey) {
            if (source.config?.authType === 'bearer') {
              headers['Authorization'] = `Bearer ${source.credentials.apiKey}`
            } else if (source.config?.authType === 'apiKey') {
              headers[source.config?.authHeader || 'X-API-Key'] = source.credentials.apiKey
            }
          }
          
          const response = await fetch(source.url, {
            method: source.config?.method || 'GET',
            headers,
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })
          
          liveCheck.healthy = response.ok
          liveCheck.responseTime = Date.now() - startTime
          
          if (!response.ok) {
            liveCheck.error = `HTTP ${response.status}: ${response.statusText}`
          }
          break
        }
          
        default: {
          const checkResponse = await fetch(source.url, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          })
          liveCheck.healthy = checkResponse.ok
          liveCheck.responseTime = Date.now() - startTime
          
          if (!checkResponse.ok) {
            liveCheck.error = `HTTP ${checkResponse.status}: ${checkResponse.statusText}`
          }
        }
      }
    } catch (error) {
      liveCheck.healthy = false
      liveCheck.responseTime = Date.now() - startTime
      liveCheck.error = error.message
    }
    
    // Determine overall status
    if (!liveCheck.healthy || errorRate > 0.5 || consecutiveFailures >= 5) {
      status = 'unhealthy'
    } else if (errorRate > 0.2 || consecutiveFailures >= 3 || liveCheck.responseTime > 10000) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }
    
    // Update the live response time into the average if we have historical data
    if (avgResponseTime > 0) {
      avgResponseTime = (avgResponseTime + liveCheck.responseTime) / 2
    } else {
      avgResponseTime = liveCheck.responseTime
    }
    
    return {
      sourceId,
      sourceName: source.name,
      status,
      lastCheck: new Date(),
      lastSuccess,
      errorRate,
      avgResponseTime,
      consecutiveFailures,
      details: {
        sourceUrl: source.url,
        sourceType: source.type,
        liveCheck,
        lastError: source.last_error,
        totalTasks: tasks?.length || 0,
        fetchInterval: source.fetch_interval,
        isActive: source.is_active
      }
    }
  } catch (error) {
    console.error('Error checking source health:', error)
    return {
      sourceId,
      sourceName: 'Unknown',
      status: 'unknown',
      lastCheck: new Date(),
      lastSuccess: null,
      errorRate: 1,
      avgResponseTime: 0,
      consecutiveFailures: 0,
      details: {
        error: error.message
      }
    }
  }
}

// Get monitoring status
async function getMonitoringStatus(supabase: any): Promise<any> {
  const { data: sources } = await supabase
    .from('agent_sources')
    .select('id, is_active, last_fetched, error_count, agent_id')
  
  const { data: recentTasks } = await supabase
    .from('agent_tasks')
    .select('status, created_at')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  
  const activeSources = sources?.filter(s => s.is_active).length || 0
  const healthySources = sources?.filter(s => s.is_active && s.error_count === 0).length || 0
  const recentlyFetched = sources?.filter(s => {
    if (!s.last_fetched) return false
    return new Date().getTime() - new Date(s.last_fetched).getTime() < 60 * 60 * 1000
  }).length || 0
  
  return {
    timestamp: new Date().toISOString(),
    sources: {
      total: sources?.length || 0,
      active: activeSources,
      healthy: healthySources,
      recently_fetched: recentlyFetched,
      error_rate: activeSources > 0 ? (activeSources - healthySources) / activeSources : 0
    },
    recent_activity: {
      tasks_created: recentTasks?.length || 0,
      by_status: recentTasks?.reduce((acc: any, task: any) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      }, {})
    }
  }
}

// Parse interval helper
function parseInterval(interval: string): number {
  const units: Record<string, number> = {
    minute: 60 * 1000,
    minutes: 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  }
  
  const match = interval.match(/(\d+)\s*(minute|minutes|hour|hours|day|days)/i)
  if (!match) return 60 * 60 * 1000 // Default to 1 hour
  
  const [, amount, unit] = match
  return parseInt(amount) * units[unit.toLowerCase()]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  
  try {
    const supabase = createSupabaseClient()
    
    // Parse request
    const { 
      action = 'monitor_all',
      sourceId,
      agentId,
      force = false
    }: MonitorRequest = await req.json()
    
    console.log('Source Monitor:', { action, sourceId, agentId, force })
    
    let result
    
    switch (action) {
      case 'monitor_all':
        result = await withErrorHandler(
          () => monitorAllSources(supabase, agentId, force),
          'monitor_all_sources'
        )
        break
        
      case 'monitor_source':
        if (!sourceId) {
          return errorResponse('sourceId is required for monitor_source action', 400)
        }
        result = await withErrorHandler(
          () => monitorSource(supabase, sourceId, force),
          'monitor_source'
        )
        break
        
      case 'check_source':
        if (!sourceId) {
          return errorResponse('sourceId is required for check_source action', 400)
        }
        result = await withErrorHandler(
          () => checkSourceHealth(supabase, sourceId),
          'check_source_health'
        )
        break
        
      case 'get_status':
        result = await withErrorHandler(
          () => getMonitoringStatus(supabase),
          'get_monitoring_status'
        )
        break
        
      default:
        return errorResponse('Invalid action', 400)
    }
    
    if (result.error) {
      return errorResponse(result.error.message, 500, result.error)
    }
    
    return successResponse(result.data, `Successfully executed ${action}`)
    
  } catch (error) {
    console.error('Source monitor error:', error)
    return errorResponse('Internal server error', 500, error)
  }
})