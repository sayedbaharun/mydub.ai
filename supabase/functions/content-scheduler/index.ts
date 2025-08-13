import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CATEGORIES = [
  'Today in Dubai',
  'Eat & Drink', 
  'Events & Experiences',
  'Beach & Nightlife',
  'Living in Dubai',
  'Luxury Life',
  'Real Estate Watch'
]

const GENERATION_SCHEDULE = {
  'Today in Dubai': { frequency: 'daily', priority: 'high' },
  'Eat & Drink': { frequency: 'weekly', priority: 'medium' },
  'Events & Experiences': { frequency: 'weekly', priority: 'medium' },
  'Beach & Nightlife': { frequency: 'weekly', priority: 'medium' },
  'Living in Dubai': { frequency: 'weekly', priority: 'medium' },
  'Luxury Life': { frequency: 'weekly', priority: 'medium' },
  'Real Estate Watch': { frequency: 'weekly', priority: 'low' }
}

interface ContentGap {
  category: string
  lastArticleDate: string | null
  priority: 'low' | 'medium' | 'high'
  shouldGenerate: boolean
}

async function analyzeContentGaps(): Promise<ContentGap[]> {
  const gaps: ContentGap[] = []
  
  for (const category of CATEGORIES) {
    // Get the most recent article for this category
    const { data: recentArticle } = await supabase
      .from('news_articles')
      .select('published_at')
      .eq('category', category)
      .order('published_at', { ascending: false })
      .limit(1)
      .single()

    const lastArticleDate = recentArticle?.published_at || null
    const schedule = GENERATION_SCHEDULE[category as keyof typeof GENERATION_SCHEDULE]
    
    let shouldGenerate = false
    
    if (!lastArticleDate) {
      // No articles exist for this category
      shouldGenerate = true
    } else {
      const lastDate = new Date(lastArticleDate)
      const now = new Date()
      const daysSinceLastArticle = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Determine if we need new content based on frequency
      switch (schedule.frequency) {
        case 'daily':
          shouldGenerate = daysSinceLastArticle >= 1
          break
        case 'weekly':
          shouldGenerate = daysSinceLastArticle >= 7
          break
        case 'monthly':
          shouldGenerate = daysSinceLastArticle >= 30
          break
      }
    }
    
    gaps.push({
      category,
      lastArticleDate,
      priority: schedule.priority,
      shouldGenerate
    })
  }
  
  return gaps.filter(gap => gap.shouldGenerate)
}

async function generateContentForCategory(category: string, priority: 'low' | 'medium' | 'high') {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-content-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        category,
        priority,
        language: 'en',
        template_type: 'lifestyle'
      })
    })

    if (!response.ok) {
      throw new Error(`Content generation failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result
    
  } catch (error) {
    console.error(`Failed to generate content for ${category}:`, error)
    return null
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    console.log('🔍 Analyzing content gaps...')
    
    // Analyze what content needs to be generated
    const contentGaps = await analyzeContentGaps()
    
    if (contentGaps.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No content gaps detected. All categories are up to date.',
          gaps: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📝 Found ${contentGaps.length} content gaps to fill`)
    
    const generationResults = []
    
    // Generate content for each gap (with priority ordering)
    const sortedGaps = contentGaps.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    
    for (const gap of sortedGaps) {
      console.log(`🤖 Generating content for: ${gap.category} (Priority: ${gap.priority})`)
      
      const result = await generateContentForCategory(gap.category, gap.priority)
      
      if (result?.success) {
        generationResults.push({
          category: gap.category,
          status: 'success',
          article: result.article,
          url: result.url
        })
        console.log(`✅ Generated: ${result.article.title}`)
      } else {
        generationResults.push({
          category: gap.category,
          status: 'failed',
          error: result?.error || 'Unknown error'
        })
        console.log(`❌ Failed to generate content for ${gap.category}`)
      }
      
      // Small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    const successCount = generationResults.filter(r => r.status === 'success').length
    const failureCount = generationResults.filter(r => r.status === 'failed').length
    
    console.log(`\n🎉 Content generation complete!`)
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failureCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${successCount} new articles`,
        gaps_found: contentGaps.length,
        results: generationResults,
        summary: {
          success_count: successCount,
          failure_count: failureCount
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Content scheduling error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Content scheduling failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 