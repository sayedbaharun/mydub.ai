import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createSupabaseClient,
  corsHeaders,
  withErrorHandler,
  errorResponse,
  successResponse,
  logOperation,
  TaskStatus,
  AgentType
} from '../_shared/reporter-utils.ts'

interface OrchestratorRequest {
  action?: 'run_scheduled' | 'check_health' | 'distribute_tasks' | 'get_status'
  agentId?: string
  force?: boolean
}

// Check if agent should run based on schedule
function shouldAgentRun(schedule: any, lastRun: string | null): boolean {
  if (!schedule || !schedule.enabled) return false
  
  const now = new Date()
  const lastRunDate = lastRun ? new Date(lastRun) : null
  
  // Check if enough time has passed based on interval
  if (schedule.interval && lastRunDate) {
    const intervalMs = parseInterval(schedule.interval)
    const nextRun = new Date(lastRunDate.getTime() + intervalMs)
    if (now < nextRun) return false
  }
  
  // Check specific times
  if (schedule.times && Array.isArray(schedule.times)) {
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    for (const time of schedule.times) {
      const [hour, minute] = time.split(':').map(Number)
      if (currentHour === hour && Math.abs(currentMinute - minute) < 5) {
        // Only run if we haven't run in the last hour
        if (!lastRunDate || now.getTime() - lastRunDate.getTime() > 3600000) {
          return true
        }
      }
    }
  }
  
  // Check days of week
  if (schedule.daysOfWeek && Array.isArray(schedule.daysOfWeek)) {
    const currentDay = now.getDay()
    if (!schedule.daysOfWeek.includes(currentDay)) return false
  }
  
  return true
}

// Parse interval string to milliseconds
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

// Distribute tasks to agents based on capabilities and load
async function distributeTasks(supabase: any): Promise<any> {
  // Get all active agents
  const { data: agents, error: agentsError } = await supabase
    .from('ai_reporter_agents')
    .select('*')
    .eq('is_active', true)
  
  if (agentsError) throw agentsError
  
  // Get pending tasks
  const { data: pendingTasks, error: tasksError } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('status', TaskStatus.PENDING)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(50)
  
  if (tasksError) throw tasksError
  
  const assignments: any[] = []
  
  // Calculate agent load
  const agentLoad = new Map<string, number>()
  
  const { data: activeTasks } = await supabase
    .from('agent_tasks')
    .select('agent_id')
    .in('status', [TaskStatus.CLAIMED, TaskStatus.PROCESSING])
  
  activeTasks?.forEach((task: any) => {
    const count = agentLoad.get(task.agent_id) || 0
    agentLoad.set(task.agent_id, count + 1)
  })
  
  // Assign tasks to agents
  for (const task of pendingTasks) {
    // Find suitable agent with lowest load
    let bestAgent = null
    let lowestLoad = Infinity
    
    for (const agent of agents) {
      // Check if agent can handle this task type
      if (task.metadata?.requiredCapabilities) {
        const hasCapabilities = task.metadata.requiredCapabilities.every(
          (cap: string) => agent.capabilities.includes(cap)
        )
        if (!hasCapabilities) continue
      }
      
      // Check agent type matches task category
      if (task.metadata?.category && agent.type !== task.metadata.category) {
        continue
      }
      
      const currentLoad = agentLoad.get(agent.id) || 0
      if (currentLoad < lowestLoad) {
        lowestLoad = currentLoad
        bestAgent = agent
      }
    }
    
    if (bestAgent) {
      // Update task assignment
      const { error: updateError } = await supabase
        .from('agent_tasks')
        .update({ 
          agent_id: bestAgent.id,
          status: TaskStatus.CLAIMED,
          claimed_at: new Date().toISOString()
        })
        .eq('id', task.id)
      
      if (!updateError) {
        assignments.push({
          task_id: task.id,
          agent_id: bestAgent.id,
          agent_name: bestAgent.name
        })
        
        // Update load tracking
        const newLoad = (agentLoad.get(bestAgent.id) || 0) + 1
        agentLoad.set(bestAgent.id, newLoad)
      }
    }
  }
  
  return {
    assigned: assignments.length,
    assignments,
    pending_tasks: pendingTasks.length,
    active_agents: agents.length
  }
}

// Check agent health and performance
async function checkAgentHealth(supabase: any, agentId?: string): Promise<any> {
  const query = supabase
    .from('ai_reporter_agents')
    .select('*')
  
  if (agentId) {
    query.eq('id', agentId)
  }
  
  const { data: agents, error } = await query
  
  if (error) throw error
  
  const healthReports = []
  
  for (const agent of agents) {
    // Get recent task statistics
    const { data: taskStats } = await supabase
      .from('agent_tasks')
      .select('status')
      .eq('agent_id', agent.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    
    const completed = taskStats?.filter(t => t.status === TaskStatus.COMPLETED).length || 0
    const failed = taskStats?.filter(t => t.status === TaskStatus.FAILED).length || 0
    const total = taskStats?.length || 0
    
    // Get average processing time
    const { data: processingTimes } = await supabase
      .from('content_pipeline')
      .select('processing_duration')
      .eq('agent_id', agent.id)
      .not('processing_duration', 'is', null)
      .limit(10)
      .order('created_at', { ascending: false })
    
    const avgProcessingTime = processingTimes?.length
      ? processingTimes.reduce((sum, pt) => sum + parseInterval(pt.processing_duration), 0) / processingTimes.length
      : 0
    
    // Calculate health score
    const successRate = total > 0 ? completed / total : 0
    const healthScore = successRate * 0.7 + (1 - (failed / Math.max(total, 1))) * 0.3
    
    healthReports.push({
      agent_id: agent.id,
      agent_name: agent.name,
      agent_type: agent.type,
      is_active: agent.is_active,
      health_score: healthScore,
      last_run: agent.last_run,
      stats_24h: {
        total_tasks: total,
        completed: completed,
        failed: failed,
        success_rate: successRate
      },
      avg_processing_time_ms: avgProcessingTime,
      performance_metrics: agent.performance_metrics
    })
  }
  
  return healthReports
}

// Run scheduled agents
async function runScheduledAgents(supabase: any, force: boolean = false): Promise<any> {
  const { data: agents, error } = await supabase
    .from('ai_reporter_agents')
    .select('*')
    .eq('is_active', true)
  
  if (error) throw error
  
  const results = []
  
  for (const agent of agents) {
    const shouldRun = force || shouldAgentRun(agent.schedule, agent.last_run)
    
    if (shouldRun) {
      // Create tasks for this agent based on its sources
      const { data: sources } = await supabase
        .from('agent_sources')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('is_active', true)
      
      const tasksCreated = []
      
      for (const source of sources || []) {
        // Check if source needs fetching
        const needsFetch = !source.last_fetched || 
          new Date().getTime() - new Date(source.last_fetched).getTime() > parseInterval(source.fetch_interval)
        
        if (needsFetch || force) {
          // Create fetch task
          const { data: task, error: taskError } = await supabase
            .from('agent_tasks')
            .insert({
              agent_id: agent.id,
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
          
          if (!taskError && task) {
            tasksCreated.push(task.id)
          }
        }
      }
      
      // Update agent last run time
      await supabase
        .from('ai_reporter_agents')
        .update({ last_run: new Date().toISOString() })
        .eq('id', agent.id)
      
      results.push({
        agent_id: agent.id,
        agent_name: agent.name,
        tasks_created: tasksCreated.length,
        task_ids: tasksCreated
      })
      
      // Log the operation
      await logOperation(supabase, 'scheduled_run', agent.id, {
        tasks_created: tasksCreated.length,
        forced: force
      })
    }
  }
  
  return {
    agents_run: results.length,
    results
  }
}

// Get orchestrator status
async function getOrchestratorStatus(supabase: any): Promise<any> {
  // Get overall system statistics
  const [agents, tasks, pipeline, queue] = await Promise.all([
    supabase.from('ai_reporter_agents').select('id, is_active'),
    supabase.from('agent_tasks').select('status'),
    supabase.from('content_pipeline').select('stage'),
    supabase.from('content_approval_queue').select('status')
  ])
  
  const activeAgents = agents.data?.filter(a => a.is_active).length || 0
  const totalAgents = agents.data?.length || 0
  
  const tasksByStatus = tasks.data?.reduce((acc: any, task: any) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {}) || {}
  
  const pipelineByStage = pipeline.data?.reduce((acc: any, item: any) => {
    acc[item.stage] = (acc[item.stage] || 0) + 1
    return acc
  }, {}) || {}
  
  const queueByStatus = queue.data?.reduce((acc: any, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {}) || {}
  
  return {
    timestamp: new Date().toISOString(),
    agents: {
      total: totalAgents,
      active: activeAgents,
      inactive: totalAgents - activeAgents
    },
    tasks: {
      total: tasks.data?.length || 0,
      by_status: tasksByStatus
    },
    pipeline: {
      total: pipeline.data?.length || 0,
      by_stage: pipelineByStage
    },
    approval_queue: {
      total: queue.data?.length || 0,
      by_status: queueByStatus
    },
    system_health: {
      status: activeAgents > 0 ? 'operational' : 'degraded',
      active_agent_ratio: totalAgents > 0 ? activeAgents / totalAgents : 0
    }
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  
  try {
    const supabase = createSupabaseClient()
    
    // Parse request
    const { action = 'run_scheduled', agentId, force = false }: OrchestratorRequest = 
      req.method === 'POST' ? await req.json() : {}
    
    console.log(`Agent Orchestrator: ${action}`, { agentId, force })
    
    let result
    
    switch (action) {
      case 'run_scheduled':
        result = await withErrorHandler(
          () => runScheduledAgents(supabase, force),
          'run_scheduled_agents'
        )
        break
        
      case 'check_health':
        result = await withErrorHandler(
          () => checkAgentHealth(supabase, agentId),
          'check_agent_health'
        )
        break
        
      case 'distribute_tasks':
        result = await withErrorHandler(
          () => distributeTasks(supabase),
          'distribute_tasks'
        )
        break
        
      case 'get_status':
        result = await withErrorHandler(
          () => getOrchestratorStatus(supabase),
          'get_orchestrator_status'
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
    console.error('Agent orchestrator error:', error)
    return errorResponse('Internal server error', 500, error)
  }
})