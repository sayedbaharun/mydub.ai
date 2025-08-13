import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { action } = req.query

    switch (action) {
      case 'stats':
        return await getAutomationStats(req, res)
      case 'process':
        return await processScheduledContent(req, res)
      case 'generate':
        return await generateContent(req, res)
      case 'scheduled':
        return await getScheduledContent(req, res)
      case 'templates':
        return await getTemplates(req, res)
      default:
        return res.status(400).json({ error: 'Invalid action parameter' })
    }
  } catch (error) {
    console.error('Content automation API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function getAutomationStats(req: VercelRequest, res: VercelResponse) {
  const today = new Date().toISOString().split('T')[0]

  const [
    scheduledResult,
    approvalsResult,
    publishedResult,
    rulesResult,
    templatesResult
  ] = await Promise.all([
    supabase.from('content_schedule').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('approval_workflows').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('content_schedule').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('updated_at', today),
    supabase.from('content_rules').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('content_templates').select('id', { count: 'exact', head: true }).eq('is_active', true)
  ])

  const stats = {
    scheduledContent: scheduledResult.count || 0,
    pendingApprovals: approvalsResult.count || 0,
    publishedToday: publishedResult.count || 0,
    activeRules: rulesResult.count || 0,
    templateCount: templatesResult.count || 0
  }

  return res.status(200).json(stats)
}

async function processScheduledContent(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = {
    processed: 0,
    published: 0,
    failed: 0,
    errors: [] as string[]
  }

  try {
    // Get content scheduled for now or earlier
    const now = new Date().toISOString()
    const { data: scheduledContent, error } = await supabase
      .from('content_schedule')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)

    if (error) throw error

    if (!scheduledContent || scheduledContent.length === 0) {
      return res.status(200).json(result)
    }

    result.processed = scheduledContent.length

    for (const content of scheduledContent) {
      try {
        // Simple processing - just mark as published for now
        // In a real implementation, this would apply rules and publish to the correct table
        
        const { error: updateError } = await supabase
          .from('content_schedule')
          .update({
            status: 'published',
            updated_at: new Date().toISOString()
          })
          .eq('id', content.id)

        if (updateError) throw updateError

        result.published++
      } catch (error) {
        result.failed++
        result.errors.push(`Content ${content.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return res.status(200).json(result)
  } catch (error) {
    result.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return res.status(500).json(result)
  }
}

async function generateContent(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = {
    generated: 0,
    scheduled: 0,
    errors: [] as string[]
  }

  try {
    // Mock content generation for now
    // In a real implementation, this would fetch from external APIs and generate content
    
    const mockContent = [
      {
        content_type: 'news',
        title: 'Dubai Weather Update',
        title_ar: null,
        content: 'Current weather conditions in Dubai show clear skies with temperatures reaching 28°C.',
        content_ar: null,
        summary: 'Clear weather in Dubai with pleasant temperatures.',
        summary_ar: null,
        category: 'weather',
        tags: ['weather', 'dubai', 'temperature'],
        scheduled_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        author_id: 'system',
        image_url: null,
        metadata: {
          source: 'mock_generation',
          auto_generated: true,
          generated_at: new Date().toISOString()
        }
      },
      {
        content_type: 'events',
        title: 'Upcoming Dubai Events This Weekend',
        title_ar: null,
        content: 'Discover the exciting events happening in Dubai this weekend, from cultural festivals to entertainment shows.',
        content_ar: null,
        summary: 'Weekend events guide for Dubai residents and visitors.',
        summary_ar: null,
        category: 'events',
        tags: ['events', 'dubai', 'weekend', 'entertainment'],
        scheduled_at: new Date(Date.now() + 120000).toISOString(), // 2 minutes from now
        author_id: 'system',
        image_url: null,
        metadata: {
          source: 'mock_generation',
          auto_generated: true,
          generated_at: new Date().toISOString()
        }
      }
    ]

    result.generated = mockContent.length

    for (const content of mockContent) {
      try {
        const { error } = await supabase
          .from('content_schedule')
          .insert({
            ...content,
            status: 'scheduled',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error

        result.scheduled++
      } catch (error) {
        result.errors.push(`Failed to schedule content: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return res.status(200).json(result)
  } catch (error) {
    result.errors.push(`Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return res.status(500).json(result)
  }
}

async function getScheduledContent(req: VercelRequest, res: VercelResponse) {
  const { status = 'scheduled', limit = '50' } = req.query

  const { data, error } = await supabase
    .from('content_schedule')
    .select('*')
    .eq('status', status)
    .order('scheduled_at', { ascending: true })
    .limit(parseInt(limit as string))

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data || [])
}

async function getTemplates(req: VercelRequest, res: VercelResponse) {
  const { content_type } = req.query

  let query = supabase
    .from('content_templates')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (content_type) {
    query = query.eq('content_type', content_type)
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data || [])
}