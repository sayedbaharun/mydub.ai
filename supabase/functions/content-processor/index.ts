import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentSource {
  id: string
  name: string
  url: string
  type: 'rss' | 'api' | 'web'
  category: string
  priority: 'high' | 'medium' | 'low'
  check_frequency: number
  is_active: boolean
  last_checked: string | null
  metadata: Record<string, any>
}

interface ProcessingResult {
  processed: number
  published: number
  failed: number
  errors: string[]
  sources_checked: number
  new_content: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'process'

    console.log(`Content processor started with action: ${action}`)

    switch (action) {
      case 'process':
        return await processScheduledContent(supabaseClient)
      case 'fetch':
        return await fetchFromSources(supabaseClient)
      case 'generate':
        return await generateContentFromSources(supabaseClient)
      case 'health':
        return await healthCheck(supabaseClient)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Content processor error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function processScheduledContent(supabaseClient: any): Promise<Response> {
  const result: ProcessingResult = {
    processed: 0,
    published: 0,
    failed: 0,
    errors: [],
    sources_checked: 0,
    new_content: 0
  }

  try {
    // Get content scheduled for now or earlier
    const now = new Date().toISOString()
    const { data: scheduledContent, error } = await supabaseClient
      .from('content_schedule')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .limit(50) // Process max 50 items at a time

    if (error) throw error

    if (!scheduledContent || scheduledContent.length === 0) {
      console.log('No scheduled content to process')
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    result.processed = scheduledContent.length
    console.log(`Processing ${result.processed} scheduled content items`)

    for (const content of scheduledContent) {
      try {
        // Apply content rules before publishing
        const processedContent = await applyContentRules(supabaseClient, content)
        
        // Check if content needs approval
        const needsApproval = await requiresApproval(processedContent)
        
        if (needsApproval) {
          await createApprovalWorkflow(supabaseClient, processedContent)
          console.log(`Content ${content.id} sent for approval`)
          continue
        }

        // Publish content to the appropriate table
        await publishContent(supabaseClient, processedContent)
        
        // Update schedule status
        await supabaseClient
          .from('content_schedule')
          .update({
            status: 'published',
            updated_at: new Date().toISOString()
          })
          .eq('id', content.id)

        result.published++
        console.log(`Published content: ${content.title}`)
        
      } catch (error) {
        result.failed++
        result.errors.push(`Content ${content.id}: ${error.message}`)
        
        // Update schedule status to failed
        await supabaseClient
          .from('content_schedule')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', content.id)
        
        console.error(`Failed to process content ${content.id}:`, error)
      }
    }

    console.log(`Processing complete: ${result.published} published, ${result.failed} failed`)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Processing error:', error)
    result.errors.push(`Processing error: ${error.message}`)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function fetchFromSources(supabaseClient: any): Promise<Response> {
  const result: ProcessingResult = {
    processed: 0,
    published: 0,
    failed: 0,
    errors: [],
    sources_checked: 0,
    new_content: 0
  }

  try {
    // Get active content sources that need checking
    const checkTime = new Date()
    const { data: sources, error } = await supabaseClient
      .from('content_sources')
      .select('*')
      .eq('is_active', true)

    if (error) throw error

    if (!sources || sources.length === 0) {
      console.log('No active content sources configured')
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    result.sources_checked = sources.length
    console.log(`Checking ${result.sources_checked} content sources`)

    for (const source of sources) {
      try {
        // Check if source needs to be checked based on frequency
        if (source.last_checked) {
          const lastChecked = new Date(source.last_checked)
          const minutesSinceCheck = (checkTime.getTime() - lastChecked.getTime()) / (1000 * 60)
          
          if (minutesSinceCheck < source.check_frequency) {
            console.log(`Skipping ${source.name}, checked ${Math.round(minutesSinceCheck)} minutes ago`)
            continue
          }
        }

        console.log(`Fetching from source: ${source.name}`)
        const newContent = await fetchFromSource(source)
        
        if (newContent.length > 0) {
          // Schedule new content
          for (const content of newContent) {
            await scheduleContent(supabaseClient, content, source)
            result.new_content++
          }
          console.log(`Found ${newContent.length} new items from ${source.name}`)
        }

        // Update last checked timestamp
        await supabaseClient
          .from('content_sources')
          .update({
            last_checked: checkTime.toISOString(),
            last_error: null
          })
          .eq('id', source.id)

        result.processed++

      } catch (error) {
        result.failed++
        result.errors.push(`Source ${source.name}: ${error.message}`)
        
        // Update source with error
        await supabaseClient
          .from('content_sources')
          .update({
            last_checked: checkTime.toISOString(),
            last_error: error.message
          })
          .eq('id', source.id)
        
        console.error(`Failed to fetch from ${source.name}:`, error)
      }
    }

    console.log(`Source fetching complete: ${result.new_content} new content items found`)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Source fetching error:', error)
    result.errors.push(`Fetching error: ${error.message}`)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function generateContentFromSources(supabaseClient: any): Promise<Response> {
  const result: ProcessingResult = {
    processed: 0,
    published: 0,
    failed: 0,
    errors: [],
    sources_checked: 0,
    new_content: 0
  }

  try {
    // Generate some mock content for demonstration
    const mockContent = [
      {
        content_type: 'news',
        title: 'Dubai Weather Update - ' + new Date().toLocaleDateString(),
        content: 'Current weather conditions in Dubai show clear skies with temperatures reaching optimal levels for outdoor activities.',
        summary: 'Perfect weather conditions reported across Dubai today.',
        category: 'weather',
        tags: ['weather', 'dubai', 'conditions'],
        scheduled_at: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
        author_id: 'system',
        metadata: {
          source: 'automated_generation',
          generated_at: new Date().toISOString(),
          auto_generated: true
        }
      },
      {
        content_type: 'tourism',
        title: 'Weekend Activities in Dubai - ' + new Date().toLocaleDateString(),
        content: 'Discover exciting activities and attractions available this weekend in Dubai, perfect for families and tourists.',
        summary: 'Comprehensive guide to weekend entertainment in Dubai.',
        category: 'tourism',
        tags: ['tourism', 'weekend', 'activities', 'dubai'],
        scheduled_at: new Date(Date.now() + 600000).toISOString(), // 10 minutes from now
        author_id: 'system',
        metadata: {
          source: 'automated_generation',
          generated_at: new Date().toISOString(),
          auto_generated: true
        }
      }
    ]

    result.processed = mockContent.length

    for (const content of mockContent) {
      try {
        const { error } = await supabaseClient
          .from('content_schedule')
          .insert({
            ...content,
            status: 'scheduled',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error

        result.new_content++
        console.log(`Generated and scheduled: ${content.title}`)

      } catch (error) {
        result.failed++
        result.errors.push(`Failed to schedule generated content: ${error.message}`)
      }
    }

    console.log(`Content generation complete: ${result.new_content} items scheduled`)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Content generation error:', error)
    result.errors.push(`Generation error: ${error.message}`)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function healthCheck(supabaseClient: any): Promise<Response> {
  try {
    // Check database connectivity
    const { data, error } = await supabaseClient
      .from('content_sources')
      .select('count')
      .limit(1)

    if (error) throw error

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    }

    return new Response(
      JSON.stringify(status),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const status = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message,
      version: '1.0.0'
    }

    return new Response(
      JSON.stringify(status),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Helper functions
async function applyContentRules(supabaseClient: any, content: any): Promise<any> {
  // Simple rule application - in production this would be more sophisticated
  return content
}

async function requiresApproval(content: any): Promise<boolean> {
  // Check if content type requires approval
  const approvalRequiredTypes = ['news', 'government']
  return approvalRequiredTypes.includes(content.content_type)
}

async function createApprovalWorkflow(supabaseClient: any, content: any): Promise<void> {
  // Create approval workflow entry using the new table structure
  await supabaseClient
    .from('approval_workflows')
    .insert({
      content_id: content.id,
      content_type: content.content_type || 'article',
      workflow_step: 1,
      approver_id: null, // Will be assigned to specific approver later
      status: 'pending',
      created_at: new Date().toISOString()
    })
}

async function publishContent(supabaseClient: any, content: any): Promise<void> {
  // Determine target table based on content type
  const tableMap: Record<string, string> = {
    'news': 'news_articles',
    'tourism': 'tourism_attractions',
    'events': 'events',
    'dining': 'restaurants'
  }

  const tableName = tableMap[content.content_type] || 'content_items'
  
  // Prepare content for publication
  const publicationData = {
    title: content.title,
    title_ar: content.title_ar,
    summary: content.summary,
    summary_ar: content.summary_ar,
    content: content.content,
    content_ar: content.content_ar,
    category: content.category,
    tags: content.tags,
    author: content.author_id,
    published_at: new Date().toISOString(),
    is_active: true,
    metadata: content.metadata
  }

  await supabaseClient
    .from(tableName)
    .insert(publicationData)
}

async function fetchFromSource(source: ContentSource): Promise<any[]> {
  // Mock content fetching - in production this would fetch from actual sources
  return []
}

async function scheduleContent(supabaseClient: any, content: any, source: ContentSource): Promise<void> {
  // Schedule content for processing
  await supabaseClient
    .from('content_schedule')
    .insert({
      ...content,
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...content.metadata,
        source_id: source.id,
        source_name: source.name
      }
    })
}