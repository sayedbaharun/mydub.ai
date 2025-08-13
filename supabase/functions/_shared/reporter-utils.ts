import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Export reusable CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Initialize Supabase client with service role
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Task status enum
export enum TaskStatus {
  PENDING = 'pending',
  CLAIMED = 'claimed',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Pipeline stage enum
export enum PipelineStage {
  FETCHED = 'fetched',
  ANALYZED = 'analyzed',
  WRITTEN = 'written',
  REVIEWED = 'reviewed',
  QUEUED = 'queued'
}

// Agent type enum
export enum AgentType {
  NEWS = 'news',
  LIFESTYLE = 'lifestyle',
  BUSINESS = 'business',
  TOURISM = 'tourism',
  WEATHER = 'weather'
}

// Source type enum
export enum SourceType {
  RSS = 'rss',
  API = 'api',
  SCRAPER = 'scraper',
  MANUAL = 'manual'
}

// Error handling wrapper
export async function withErrorHandler<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await operation()
    return { data }
  } catch (error) {
    console.error(`Error in ${context}:`, error)
    return { error: error as Error }
  }
}

// Retry logic for external requests
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${i + 1} failed:`, error)
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)))
      }
    }
  }
  
  throw lastError!
}

// Rate limiting helper
const rateLimitMap = new Map<string, number>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean up old entries
  for (const [k, timestamp] of rateLimitMap.entries()) {
    if (timestamp < windowStart) {
      rateLimitMap.delete(k)
    }
  }
  
  // Count requests in current window
  let count = 0
  for (const [k, timestamp] of rateLimitMap.entries()) {
    if (k.startsWith(key) && timestamp >= windowStart) {
      count++
    }
  }
  
  if (count >= maxRequests) {
    return false
  }
  
  rateLimitMap.set(`${key}-${now}`, now)
  return true
}

// Normalize content from different sources
export interface NormalizedContent {
  title: string
  summary?: string
  content: string
  sourceUrl: string
  publishedAt?: Date
  author?: string
  tags?: string[]
  imageUrl?: string
  metadata?: Record<string, any>
}

export function normalizeContent(
  rawContent: any,
  sourceType: SourceType
): NormalizedContent {
  switch (sourceType) {
    case SourceType.RSS:
      return {
        title: rawContent.title || 'Untitled',
        summary: rawContent.description || rawContent.summary,
        content: rawContent.content || rawContent.description || '',
        sourceUrl: rawContent.link || rawContent.url,
        publishedAt: rawContent.pubDate ? new Date(rawContent.pubDate) : undefined,
        author: rawContent.author || rawContent.creator,
        tags: rawContent.categories || [],
        imageUrl: rawContent.enclosure?.url || rawContent.image,
        metadata: {
          guid: rawContent.guid,
          source: rawContent.source
        }
      }
      
    case SourceType.API:
      return {
        title: rawContent.headline || rawContent.title || 'Untitled',
        summary: rawContent.abstract || rawContent.summary,
        content: rawContent.body || rawContent.content || '',
        sourceUrl: rawContent.url || rawContent.link,
        publishedAt: rawContent.published_date ? new Date(rawContent.published_date) : undefined,
        author: rawContent.byline || rawContent.author,
        tags: rawContent.tags || rawContent.keywords || [],
        imageUrl: rawContent.multimedia?.[0]?.url || rawContent.image_url,
        metadata: rawContent
      }
      
    default:
      return {
        title: rawContent.title || 'Untitled',
        content: rawContent.content || '',
        sourceUrl: rawContent.url || '',
        metadata: rawContent
      }
  }
}

// Calculate content quality score
export function calculateQualityScore(content: NormalizedContent): number {
  let score = 0
  
  // Title quality (0.2)
  if (content.title && content.title.length > 10) score += 0.1
  if (content.title && content.title.length < 100) score += 0.1
  
  // Content length (0.3)
  const wordCount = content.content.split(/\s+/).length
  if (wordCount > 100) score += 0.1
  if (wordCount > 300) score += 0.1
  if (wordCount > 500 && wordCount < 2000) score += 0.1
  
  // Summary presence (0.1)
  if (content.summary && content.summary.length > 50) score += 0.1
  
  // Metadata completeness (0.2)
  if (content.author) score += 0.05
  if (content.publishedAt) score += 0.05
  if (content.imageUrl) score += 0.05
  if (content.tags && content.tags.length > 0) score += 0.05
  
  // Source URL validity (0.2)
  if (content.sourceUrl && isValidUrl(content.sourceUrl)) score += 0.2
  
  return Math.min(score, 1)
}

// Validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Generate article slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100)
}

// Calculate relevance score based on keywords
export function calculateRelevanceScore(
  content: string,
  keywords: string[]
): number {
  if (!content || keywords.length === 0) return 0
  
  const lowerContent = content.toLowerCase()
  let matchCount = 0
  let totalWeight = 0
  
  keywords.forEach((keyword, index) => {
    const weight = 1 / (index + 1) // Higher weight for earlier keywords
    totalWeight += weight
    
    const keywordLower = keyword.toLowerCase()
    const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi')
    const matches = (lowerContent.match(regex) || []).length
    
    if (matches > 0) {
      matchCount += weight * Math.min(matches / 10, 1) // Cap at 10 matches
    }
  })
  
  return totalWeight > 0 ? matchCount / totalWeight : 0
}

// OpenRouter API helper
export async function callOpenRouter(
  prompt: string,
  model: string = 'anthropic/claude-3-sonnet',
  maxTokens: number = 2000
): Promise<any> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mydub.ai',
      'X-Title': 'MyDub.AI Reporter System'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  })
  
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.choices[0]?.message?.content
}

// Deduplicate content based on similarity
export function isDuplicateContent(
  content1: string,
  content2: string,
  threshold: number = 0.8
): boolean {
  // Simple similarity check based on shared words
  const words1 = new Set(content1.toLowerCase().split(/\s+/))
  const words2 = new Set(content2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  const similarity = intersection.size / union.size
  return similarity >= threshold
}

// Format error response
export function errorResponse(
  message: string,
  status: number = 500,
  details?: any
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      details,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Format success response
export function successResponse(
  data: any,
  message?: string,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Log operation for monitoring
export async function logOperation(
  supabase: any,
  operation: string,
  agentId: string,
  details: any
): Promise<void> {
  try {
    await supabase.from('agent_logs').insert({
      agent_id: agentId,
      operation,
      details,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log operation:', error)
  }
}

// Parse RSS feed
export async function parseRSSFeed(url: string): Promise<any[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.statusText}`)
  }
  
  const text = await response.text()
  
  // Basic RSS parsing (you might want to use a proper XML parser in production)
  const items: any[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  
  while ((match = itemRegex.exec(text)) !== null) {
    const itemXml = match[1]
    const item: any = {}
    
    // Extract common RSS fields
    const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i.exec(itemXml)
    item.title = titleMatch ? (titleMatch[1] || titleMatch[2]) : ''
    
    const linkMatch = /<link>(.*?)<\/link>/i.exec(itemXml)
    item.link = linkMatch ? linkMatch[1] : ''
    
    const descMatch = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i.exec(itemXml)
    item.description = descMatch ? (descMatch[1] || descMatch[2]) : ''
    
    const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemXml)
    item.pubDate = pubDateMatch ? pubDateMatch[1] : ''
    
    const authorMatch = /<author>(.*?)<\/author>|<dc:creator>(.*?)<\/dc:creator>/i.exec(itemXml)
    item.author = authorMatch ? (authorMatch[1] || authorMatch[2]) : ''
    
    items.push(item)
  }
  
  return items
}