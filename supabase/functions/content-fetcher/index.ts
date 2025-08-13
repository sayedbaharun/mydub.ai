import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createSupabaseClient,
  corsHeaders,
  withErrorHandler,
  errorResponse,
  successResponse,
  retryOperation,
  checkRateLimit,
  normalizeContent,
  calculateQualityScore,
  parseRSSFeed,
  SourceType,
  TaskStatus,
  PipelineStage,
  NormalizedContent,
  logOperation,
} from '../_shared/reporter-utils.ts'

interface FetchRequest {
  taskId?: string
  sourceId?: string
  url?: string
  sourceType?: SourceType
  config?: any
}

// Enhanced RSS content fetching with proxy support
async function fetchRSSContent(url: string, config: any = {}): Promise<NormalizedContent[]> {
  // Add custom headers if configured
  const headers = {
    'User-Agent': 'MyDub.ai News Aggregator/1.0',
    Accept: 'application/rss+xml, application/xml, text/xml',
    ...config.headers,
  }

  // Use proxy if configured for certain domains
  let fetchUrl = url
  if (config.useProxy && Deno.env.get('PROXY_URL')) {
    fetchUrl = `${Deno.env.get('PROXY_URL')}?url=${encodeURIComponent(url)}`
  }

  const items = await parseRSSFeed(fetchUrl, { headers })

  return items.map((item) => normalizeContent(item, SourceType.RSS))
}

// Enhanced API content fetching with better authentication handling
async function fetchAPIContent(url: string, config: any = {}): Promise<NormalizedContent[]> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'MyDub.ai/1.0 (AI News Reporter)',
    ...config.headers,
  }

  // Handle different authentication types
  if (config.authType) {
    switch (config.authType) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${config.apiKey || config.token}`
        break
      case 'apiKey':
        if (config.authLocation === 'header') {
          headers[config.authHeader || 'X-API-Key'] = config.apiKey
        }
        break
      case 'basic': {
        const encoded = btoa(`${config.username}:${config.password}`)
        headers['Authorization'] = `Basic ${encoded}`
        break
      }
    }
  }

  // Add query parameters for API key if specified
  let fetchUrl = url
  if (config.authType === 'apiKey' && config.authLocation === 'query') {
    const urlObj = new URL(url)
    urlObj.searchParams.set(config.authParam || 'apikey', config.apiKey)
    fetchUrl = urlObj.toString()
  }

  // Add configured parameters
  if (config.parameters) {
    const urlObj = new URL(fetchUrl)
    Object.entries(config.parameters).forEach(([key, value]) => {
      urlObj.searchParams.set(key, String(value))
    })
    fetchUrl = urlObj.toString()
  }

  const response = await fetch(fetchUrl, {
    method: config.method || 'GET',
    headers,
    signal: AbortSignal.timeout(config.timeout || 15000),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Extract items based on configured data path
  let items = data
  if (config.dataPath) {
    const pathParts = config.dataPath.split('.')
    items = pathParts.reduce((obj: any, key: string) => obj?.[key], data)
  }

  if (!Array.isArray(items)) {
    items = [items]
  }

  return items.map((item: any) => normalizeContent(item, SourceType.API))
}

// Enhanced web scraping with better content extraction
async function fetchScraperContent(url: string, config: any = {}): Promise<NormalizedContent[]> {
  // Use a scraping service if configured
  if (Deno.env.get('SCRAPING_SERVICE_URL')) {
    const scraperUrl = `${Deno.env.get('SCRAPING_SERVICE_URL')}/scrape`
    const response = await fetch(scraperUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SCRAPING_SERVICE_KEY')}`,
      },
      body: JSON.stringify({ url, selectors: config.selectors }),
    })

    if (response.ok) {
      const data = await response.json()
      return [normalizeContent(data, SourceType.SCRAPER)]
    }
  }

  // Fallback to basic scraping
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MyDub.ai/1.0 (compatible; News Bot)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()

  // Enhanced metadata extraction
  const getMetaContent = (name: string): string => {
    const regex = new RegExp(
      `<meta\\s+(?:name|property)=["']${name}["']\\s+content=["']([^"']+)["']`,
      'i'
    )
    const match = html.match(regex)
    return match ? match[1] : ''
  }

  const title =
    html.match(/<title>(.*?)<\/title>/i)?.[1] || getMetaContent('og:title') || 'Untitled'

  const description = getMetaContent('description') || getMetaContent('og:description') || ''

  const image = getMetaContent('og:image') || ''
  const author = getMetaContent('author') || getMetaContent('article:author') || ''

  const publishedTime =
    getMetaContent('article:published_time') || getMetaContent('datePublished') || ''

  // Extract main content with better selectors
  const contentSelectors = [
    '<main[^>]*>([\\s\\S]*?)</main>',
    '<article[^>]*>([\\s\\S]*?)</article>',
    '<div[^>]*class=["\'][^"\']*content[^"\']*["\'][^>]*>([\\s\\S]*?)</div>',
    '<div[^>]*id=["\']content["\'][^>]*>([\\s\\S]*?)</div>',
  ]

  let content = ''
  for (const selector of contentSelectors) {
    const match = html.match(new RegExp(selector, 'i'))
    if (match) {
      content = match[1].replace(/<[^>]*>/g, ' ').trim()
      break
    }
  }

  return [
    {
      title,
      summary: description,
      content,
      sourceUrl: url,
      publishedAt: publishedTime ? new Date(publishedTime) : new Date(),
      author,
      imageUrl: image,
      metadata: { scraped: true },
    },
  ]
}

// Main content fetching function with enhanced rate limiting
async function fetchContent(
  url: string,
  sourceType: SourceType,
  config: any = {}
): Promise<NormalizedContent[]> {
  // Enhanced rate limiting with per-source configuration
  const rateLimitKey = config.rateLimitKey || new URL(url).hostname
  const maxRequests = config.rateLimit?.requestsPerMinute || 10
  const windowMs = 60000 // 1 minute

  if (!checkRateLimit(rateLimitKey, maxRequests, windowMs)) {
    throw new Error(
      `Rate limit exceeded for ${rateLimitKey}. Max ${maxRequests} requests per minute.`
    )
  }

  // Apply retry configuration
  const retryConfig = {
    maxAttempts: config.retryConfig?.maxAttempts || 3,
    backoffMultiplier: config.retryConfig?.backoffMultiplier || 2,
    maxDelay: config.retryConfig?.maxDelay || 10000,
  }

  // Fetch based on source type
  switch (sourceType) {
    case SourceType.RSS:
      return await retryOperation(() => fetchRSSContent(url, config), retryConfig)

    case SourceType.API:
      return await retryOperation(() => fetchAPIContent(url, config), retryConfig)

    case SourceType.SCRAPER:
      return await retryOperation(() => fetchScraperContent(url, config), retryConfig)

    default:
      throw new Error(`Unsupported source type: ${sourceType}`)
  }
}

// Enhanced task processing with better error handling
async function processFetchTask(supabase: any, taskId: string): Promise<any> {
  // Get task details with source configuration
  const { data: task, error: taskError } = await supabase
    .from('agent_tasks')
    .select(
      `
      *,
      ai_reporter_agents(*),
      agent_sources(*)
    `
    )
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    throw new Error('Task not found')
  }

  // Update task status to processing
  await supabase
    .from('agent_tasks')
    .update({
      status: TaskStatus.PROCESSING,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  try {
    const sourceUrl = task.source_url
    const source = task.agent_sources?.[0]
    const sourceType = source?.type || task.metadata?.source_type || SourceType.RSS
    const sourceConfig = {
      ...source?.config,
      ...task.metadata?.source_config,
      credentials: source?.credentials,
    }

    // Fetch content with source-specific configuration
    const contents = await fetchContent(sourceUrl, sourceType, sourceConfig)

    // Process each content item with deduplication
    const pipelineEntries = []
    const skippedDuplicates = []

    for (const content of contents) {
      // Calculate quality score
      const qualityScore = calculateQualityScore(content)

      // Skip low quality content
      if (qualityScore < 0.3) {
        console.log(`Skipping low quality content: ${content.title} (score: ${qualityScore})`)
        continue
      }

      // Enhanced duplicate checking with content hash
      const contentHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(content.title + content.summary)
      )
      const hashHex = Array.from(new Uint8Array(contentHash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const { data: existing } = await supabase
        .from('content_pipeline')
        .select('id, created_at')
        .or(`raw_content->title.eq.${content.title},metadata->content_hash.eq.${hashHex}`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1)

      if (existing && existing.length > 0) {
        skippedDuplicates.push({
          title: content.title,
          existing_id: existing[0].id,
          created_at: existing[0].created_at,
        })
        continue
      }

      // Calculate relevance score based on agent type
      const relevanceScore = calculateRelevanceScore(content, task.ai_reporter_agents?.type)

      // Create pipeline entry with enhanced metadata
      const { data: pipelineEntry, error: pipelineError } = await supabase
        .from('content_pipeline')
        .insert({
          task_id: taskId,
          agent_id: task.agent_id,
          stage: PipelineStage.FETCHED,
          raw_content: content,
          processed_content: {},
          article_draft: {},
          quality_score: qualityScore,
          relevance_score: relevanceScore,
          metadata: {
            source_url: sourceUrl,
            source_type: sourceType,
            source_name: source?.name,
            fetched_at: new Date().toISOString(),
            content_hash: hashHex,
            language: detectLanguage(content.title + ' ' + content.summary),
          },
        })
        .select()
        .single()

      if (!pipelineError && pipelineEntry) {
        pipelineEntries.push(pipelineEntry)

        // Create analyze task with appropriate priority
        const priority =
          qualityScore > 0.7 && relevanceScore > 0.7
            ? 'high'
            : qualityScore > 0.5 || relevanceScore > 0.5
              ? 'medium'
              : 'low'

        await supabase.from('agent_tasks').insert({
          agent_id: task.agent_id,
          type: 'analyze',
          priority,
          metadata: {
            pipeline_id: pipelineEntry.id,
            content_type: sourceType,
            quality_score: qualityScore,
            relevance_score: relevanceScore,
            source_name: source?.name,
          },
        })
      }
    }

    // Update source last fetched time and reset error count
    if (source?.id) {
      await supabase
        .from('agent_sources')
        .update({
          last_fetched: new Date().toISOString(),
          error_count: 0,
          last_error: null,
        })
        .eq('id', source.id)
    }

    // Update task status
    await supabase
      .from('agent_tasks')
      .update({
        status: TaskStatus.COMPLETED,
        completed_at: new Date().toISOString(),
        metadata: {
          ...task.metadata,
          items_fetched: contents.length,
          items_processed: pipelineEntries.length,
          duplicates_skipped: skippedDuplicates.length,
        },
      })
      .eq('id', taskId)

    // Log operation with detailed metrics
    await logOperation(supabase, 'content_fetch', task.agent_id, {
      task_id: taskId,
      source_name: source?.name,
      items_fetched: contents.length,
      items_processed: pipelineEntries.length,
      duplicates_skipped: skippedDuplicates.length,
      source_url: sourceUrl,
      avg_quality_score:
        pipelineEntries.length > 0
          ? pipelineEntries.reduce((sum, p) => sum + p.quality_score, 0) / pipelineEntries.length
          : 0,
    })

    return {
      task_id: taskId,
      items_fetched: contents.length,
      items_processed: pipelineEntries.length,
      duplicates_skipped: skippedDuplicates.length,
      pipeline_entries: pipelineEntries.map((p) => p.id),
    }
  } catch (error) {
    // Enhanced error handling with categorization
    const errorCategory = categorizeError(error)

    // Update task with detailed error information
    await supabase
      .from('agent_tasks')
      .update({
        status: TaskStatus.FAILED,
        error_details: {
          message: error.message,
          category: errorCategory,
          timestamp: new Date().toISOString(),
          stack: error.stack,
        },
        retry_count: task.retry_count + 1,
      })
      .eq('id', taskId)

    // Update source error count with exponential backoff
    if (task.metadata?.source_id || task.agent_sources?.[0]?.id) {
      const sourceId = task.metadata?.source_id || task.agent_sources[0].id
      const { data: currentSource } = await supabase
        .from('agent_sources')
        .select('error_count')
        .eq('id', sourceId)
        .single()

      await supabase
        .from('agent_sources')
        .update({
          error_count: (currentSource?.error_count || 0) + 1,
          last_error: {
            message: error.message,
            category: errorCategory,
            timestamp: new Date().toISOString(),
          },
        })
        .eq('id', sourceId)
    }

    throw error
  }
}

// Helper function to calculate relevance score
function calculateRelevanceScore(content: NormalizedContent, agentType?: string): number {
  if (!agentType) return 0.5

  const keywords = {
    news: ['breaking', 'update', 'announce', 'report', 'official'],
    business: ['business', 'economy', 'market', 'trade', 'investment', 'startup'],
    lifestyle: ['lifestyle', 'culture', 'food', 'fashion', 'entertainment', 'events'],
    tourism: ['tourism', 'travel', 'attraction', 'hotel', 'destination', 'visitor'],
    weather: ['weather', 'temperature', 'forecast', 'rain', 'storm', 'traffic'],
  }

  const agentKeywords = keywords[agentType] || []
  const text = (content.title + ' ' + content.summary + ' ' + content.content).toLowerCase()

  let score = 0.5 // Base score
  for (const keyword of agentKeywords) {
    if (text.includes(keyword)) {
      score += 0.1
    }
  }

  return Math.min(score, 1.0)
}

// Helper function to detect language
function detectLanguage(text: string): string {
  // Simple Arabic detection
  const arabicPattern = /[\u0600-\u06FF]/
  if (arabicPattern.test(text)) {
    return 'ar'
  }
  return 'en'
}

// Helper function to categorize errors
function categorizeError(error: any): string {
  const message = error.message.toLowerCase()

  if (message.includes('rate limit')) return 'rate_limit'
  if (message.includes('timeout')) return 'timeout'
  if (message.includes('401') || message.includes('403')) return 'authentication'
  if (message.includes('404')) return 'not_found'
  if (message.includes('500') || message.includes('502') || message.includes('503'))
    return 'server_error'
  if (message.includes('parse') || message.includes('invalid')) return 'parse_error'

  return 'unknown'
}

// Process a direct fetch request
async function processDirectFetch(
  supabase: any,
  url: string,
  sourceType: SourceType,
  config: any
): Promise<any> {
  const contents = await fetchContent(url, sourceType, config)

  return {
    url,
    source_type: sourceType,
    items_fetched: contents.length,
    contents: contents.map((c) => ({
      title: c.title,
      summary: c.summary,
      quality_score: calculateQualityScore(c),
      published_at: c.publishedAt,
      author: c.author,
      tags: c.tags,
      image_url: c.imageUrl,
    })),
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
    const {
      taskId,
      sourceId,
      url,
      sourceType = 'rss',
      config = {},
    }: FetchRequest = await req.json()

    console.log('Content Fetcher:', { taskId, sourceId, url, sourceType })

    let result

    if (taskId) {
      // Process existing task
      result = await withErrorHandler(
        () => processFetchTask(supabase, taskId),
        'process_fetch_task'
      )
    } else if (url) {
      // Direct fetch request
      result = await withErrorHandler(
        () => processDirectFetch(supabase, url, sourceType as SourceType, config),
        'direct_fetch'
      )
    } else {
      return errorResponse('Either taskId or url must be provided', 400)
    }

    if (result.error) {
      return errorResponse(result.error.message, 500, result.error)
    }

    return successResponse(result.data, 'Content fetched successfully')
  } catch (error) {
    console.error('Content fetcher error:', error)
    return errorResponse('Internal server error', 500, error)
  }
})
