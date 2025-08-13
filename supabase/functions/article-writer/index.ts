import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createSupabaseClient,
  corsHeaders,
  withErrorHandler,
  errorResponse,
  successResponse,
  callOpenRouter,
  generateSlug,
  calculateRelevanceScore,
  TaskStatus,
  PipelineStage,
  AgentType,
  logOperation
} from '../_shared/reporter-utils.ts'

interface WriterRequest {
  taskId?: string
  pipelineId?: string
  content?: any
  style?: string
  language?: 'en' | 'ar' | 'both'
  model?: string
}

// Writing style templates for different agent types
const WRITING_STYLES = {
  [AgentType.NEWS]: {
    tone: 'professional, authoritative, and trustworthy',
    style: 'journalistic with clear facts and balanced reporting',
    structure: 'inverted pyramid - most important information first',
    voice: 'third person, objective',
    guidelines: [
      'Lead with the most newsworthy element',
      'Include who, what, when, where, why, and how',
      'Use credible sources and attribution',
      'Maintain objectivity and balance',
      'Keep paragraphs short and punchy'
    ]
  },
  [AgentType.LIFESTYLE]: {
    tone: 'engaging, aspirational, and sophisticated',
    style: 'conversational yet refined, with vivid descriptions',
    structure: 'narrative flow with personal appeal',
    voice: 'second person to create connection',
    guidelines: [
      'Create an emotional connection with readers',
      'Paint vivid pictures with descriptive language',
      'Include practical tips and recommendations',
      'Highlight luxury and exclusivity',
      'Use storytelling to engage readers'
    ]
  },
  [AgentType.BUSINESS]: {
    tone: 'analytical, insightful, and data-driven',
    style: 'clear and concise with focus on value',
    structure: 'problem-solution or trend analysis',
    voice: 'authoritative third person',
    guidelines: [
      'Lead with key business insights',
      'Support claims with data and statistics',
      'Provide actionable takeaways',
      'Focus on ROI and business impact',
      'Include expert quotes when relevant'
    ]
  },
  [AgentType.TOURISM]: {
    tone: 'enthusiastic, inviting, and informative',
    style: 'descriptive and experiential',
    structure: 'journey-based narrative',
    voice: 'friendly second person',
    guidelines: [
      'Create wanderlust through vivid descriptions',
      'Include practical travel information',
      'Highlight unique experiences',
      'Provide insider tips',
      'Focus on sensory details'
    ]
  },
  [AgentType.WEATHER]: {
    tone: 'clear, informative, and practical',
    style: 'straightforward with emphasis on clarity',
    structure: 'current conditions, forecast, impact',
    voice: 'direct and factual',
    guidelines: [
      'Lead with current conditions',
      'Provide accurate forecast information',
      'Explain weather impacts on daily life',
      'Include relevant warnings or advisories',
      'Add seasonal context'
    ]
  }
}

// Generate article based on content and style
async function generateArticle(
  content: any,
  agentType: AgentType,
  language: 'en' | 'ar' = 'en',
  customStyle?: string,
  model: string = 'anthropic/claude-3-sonnet'
): Promise<any> {
  const style = WRITING_STYLES[agentType] || WRITING_STYLES[AgentType.NEWS]
  
  const prompt = `You are an expert content writer for MyDub.AI, Dubai's premier AI-powered information platform.

TASK: Transform the following raw content into a high-quality, engaging article.

RAW CONTENT:
${JSON.stringify(content, null, 2)}

WRITING STYLE:
- Tone: ${customStyle || style.tone}
- Style: ${style.style}
- Structure: ${style.structure}
- Voice: ${style.voice}

GUIDELINES:
${style.guidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}

REQUIREMENTS:
- Language: ${language === 'ar' ? 'Arabic' : 'English'}
- Length: 800-1200 words
- SEO optimized with natural keyword usage
- Include specific Dubai/UAE context where relevant
- Maintain MyDub.AI's luxury brand positioning

OUTPUT FORMAT (JSON):
{
  "headline": "Compelling headline (60-80 characters)",
  "subheadline": "Supporting subheadline (100-150 characters)",
  "summary": "Executive summary (150-200 words)",
  "content": "Full article in HTML format with proper tags",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content"
    }
  ],
  "key_points": ["Key point 1", "Key point 2", "..."],
  "tags": ["relevant", "tags", "for", "seo"],
  "meta_description": "SEO meta description (150-160 characters)",
  "read_time": estimated reading time in minutes,
  "related_topics": ["topic1", "topic2"],
  "call_to_action": "Relevant CTA for readers"
}

Generate the article now, ensuring it's factual, engaging, and maintains high editorial standards.`

  const response = await callOpenRouter(prompt, model, 3000)
  
  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    // Fallback structure if JSON parsing fails
    return {
      headline: content.title || 'Dubai Update',
      summary: content.summary || response.substring(0, 200),
      content: `<article>${response}</article>`,
      tags: ['dubai', 'news'],
      read_time: Math.ceil(response.split(/\s+/).length / 200),
      meta_description: content.summary || response.substring(0, 160)
    }
  }
}

// Generate Arabic version of article
async function generateArabicVersion(
  englishArticle: any,
  model: string = 'anthropic/claude-3-sonnet'
): Promise<any> {
  const prompt = `You are an expert Arabic translator and content adapter for MyDub.AI.

TASK: Create a culturally adapted Arabic version of this English article.

ENGLISH ARTICLE:
${JSON.stringify(englishArticle, null, 2)}

REQUIREMENTS:
1. Translate to Modern Standard Arabic (MSA)
2. Adapt cultural references for Arab readers
3. Maintain the same structure and key points
4. Ensure right-to-left (RTL) formatting
5. Preserve SEO value with Arabic keywords
6. Keep the same professional tone

OUTPUT FORMAT (JSON):
{
  "headline_ar": "العنوان الرئيسي بالعربية",
  "subheadline_ar": "العنوان الفرعي بالعربية",
  "summary_ar": "الملخص التنفيذي بالعربية",
  "content_ar": "المحتوى الكامل بتنسيق HTML مع اتجاه RTL",
  "sections_ar": [
    {
      "title": "عنوان القسم",
      "content": "محتوى القسم"
    }
  ],
  "key_points_ar": ["النقطة الأولى", "النقطة الثانية"],
  "tags_ar": ["كلمات", "مفتاحية", "بالعربية"],
  "meta_description_ar": "وصف ميتا بالعربية"
}

Create the Arabic version now, ensuring cultural sensitivity and linguistic accuracy.`

  const response = await callOpenRouter(prompt, model, 3000)
  
  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse Arabic translation:', error)
    return null
  }
}

// Calculate article quality score
function calculateArticleQuality(article: any): number {
  let score = 0
  
  // Headline quality (0.15)
  if (article.headline && article.headline.length >= 30 && article.headline.length <= 100) {
    score += 0.15
  }
  
  // Content length and structure (0.25)
  const wordCount = article.content.split(/\s+/).length
  if (wordCount >= 600) score += 0.1
  if (wordCount >= 800 && wordCount <= 1500) score += 0.15
  
  // Sections and organization (0.2)
  if (article.sections && article.sections.length >= 3) score += 0.1
  if (article.sections && article.sections.length >= 5) score += 0.1
  
  // SEO elements (0.2)
  if (article.meta_description && article.meta_description.length >= 120) score += 0.1
  if (article.tags && article.tags.length >= 3) score += 0.1
  
  // Key points and summary (0.2)
  if (article.summary && article.summary.length >= 100) score += 0.1
  if (article.key_points && article.key_points.length >= 3) score += 0.1
  
  return Math.min(score, 1)
}

// Process a write task
async function processWriteTask(supabase: any, taskId: string): Promise<any> {
  // Get task and pipeline details
  const { data: task, error: taskError } = await supabase
    .from('agent_tasks')
    .select('*, ai_reporter_agents(*)')
    .eq('id', taskId)
    .single()
  
  if (taskError || !task) {
    throw new Error('Task not found')
  }
  
  const pipelineId = task.metadata?.pipeline_id
  if (!pipelineId) {
    throw new Error('No pipeline ID in task metadata')
  }
  
  // Get pipeline data
  const { data: pipeline, error: pipelineError } = await supabase
    .from('content_pipeline')
    .select('*')
    .eq('id', pipelineId)
    .single()
  
  if (pipelineError || !pipeline) {
    throw new Error('Pipeline entry not found')
  }
  
  // Update task status
  await supabase
    .from('agent_tasks')
    .update({ status: TaskStatus.PROCESSING })
    .eq('id', taskId)
  
  try {
    const agentType = task.ai_reporter_agents.type as AgentType
    const content = pipeline.processed_content.enhanced || pipeline.processed_content || pipeline.raw_content
    
    // Generate main article
    const article = await generateArticle(
      content,
      agentType,
      'en',
      task.metadata?.custom_style
    )
    
    // Calculate quality score
    const qualityScore = calculateArticleQuality(article)
    
    // Generate Arabic version if needed
    let arabicArticle = null
    if (task.metadata?.language === 'both' || task.metadata?.language === 'ar') {
      arabicArticle = await generateArabicVersion(article)
    }
    
    // Combine articles
    const fullArticle = {
      ...article,
      ...(arabicArticle || {}),
      quality_score: qualityScore,
      agent_type: agentType,
      generated_at: new Date().toISOString(),
      model_used: task.metadata?.model || 'anthropic/claude-3-sonnet'
    }
    
    // Update pipeline with article draft
    await supabase
      .from('content_pipeline')
      .update({
        article_draft: fullArticle,
        stage: PipelineStage.WRITTEN,
        quality_score: qualityScore,
        processed_at: new Date().toISOString()
      })
      .eq('id', pipelineId)
    
    // Create review task if quality is good
    if (qualityScore >= 0.6) {
      await supabase
        .from('agent_tasks')
        .insert({
          agent_id: task.agent_id,
          type: 'review',
          priority: qualityScore >= 0.8 ? 'high' : 'medium',
          metadata: {
            pipeline_id: pipelineId,
            quality_score: qualityScore,
            has_arabic: !!arabicArticle
          }
        })
    }
    
    // Update task status
    await supabase
      .from('agent_tasks')
      .update({ 
        status: TaskStatus.COMPLETED,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
    
    // Log operation
    await logOperation(supabase, 'article_write', task.agent_id, {
      task_id: taskId,
      pipeline_id: pipelineId,
      quality_score: qualityScore,
      word_count: article.content.split(/\s+/).length,
      has_arabic: !!arabicArticle
    })
    
    return {
      task_id: taskId,
      pipeline_id: pipelineId,
      quality_score: qualityScore,
      headline: article.headline,
      word_count: article.content.split(/\s+/).length,
      has_arabic: !!arabicArticle
    }
    
  } catch (error) {
    // Update task with error
    await supabase
      .from('agent_tasks')
      .update({ 
        status: TaskStatus.FAILED,
        error_details: {
          message: error.message,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', taskId)
    
    throw error
  }
}

// Process a direct write request
async function processDirectWrite(
  supabase: any,
  content: any,
  style: string,
  language: 'en' | 'ar' | 'both',
  model: string
): Promise<any> {
  // Determine agent type from style
  const agentType = style === 'business' ? AgentType.BUSINESS :
                   style === 'lifestyle' ? AgentType.LIFESTYLE :
                   style === 'tourism' ? AgentType.TOURISM :
                   AgentType.NEWS
  
  // Generate article
  const article = await generateArticle(content, agentType, language, undefined, model)
  
  // Generate Arabic if needed
  let arabicArticle = null
  if (language === 'both' || language === 'ar') {
    arabicArticle = await generateArabicVersion(article, model)
  }
  
  const qualityScore = calculateArticleQuality(article)
  
  return {
    article: {
      ...article,
      ...(arabicArticle || {})
    },
    quality_score: qualityScore,
    style_used: style,
    language: language,
    model_used: model
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
      pipelineId, 
      content, 
      style = 'news',
      language = 'en',
      model = 'anthropic/claude-3-sonnet'
    }: WriterRequest = await req.json()
    
    console.log('Article Writer:', { taskId, pipelineId, style, language })
    
    let result
    
    if (taskId) {
      // Process existing task
      result = await withErrorHandler(
        () => processWriteTask(supabase, taskId),
        'process_write_task'
      )
    } else if (content) {
      // Direct write request
      result = await withErrorHandler(
        () => processDirectWrite(supabase, content, style, language as any, model),
        'direct_write'
      )
    } else {
      return errorResponse('Either taskId or content must be provided', 400)
    }
    
    if (result.error) {
      return errorResponse(result.error.message, 500, result.error)
    }
    
    return successResponse(result.data, 'Article generated successfully')
    
  } catch (error) {
    console.error('Article writer error:', error)
    return errorResponse('Internal server error', 500, error)
  }
})