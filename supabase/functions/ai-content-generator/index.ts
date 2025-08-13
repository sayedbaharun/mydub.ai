import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ContentGenerationRequest {
  category: string
  priority: 'low' | 'medium' | 'high'
  language?: 'en' | 'ar' | 'both'
  template_type?: 'news' | 'lifestyle' | 'events' | 'dining' | 'luxury'
}

const CONTENT_TEMPLATES = {
  'Today in Dubai': {
    topics: ['traffic updates', 'weather highlights', 'government announcements', 'business news', 'UAE developments'],
    style: 'informative and authoritative',
    tone: 'professional and trustworthy'
  },
  'Eat & Drink': {
    topics: ['new restaurant openings', 'chef interviews', 'dining deals', 'food festivals', 'culinary trends'],
    style: 'vibrant and appetizing',
    tone: 'enthusiastic and sophisticated'
  },
  'Events & Experiences': {
    topics: ['concerts', 'festivals', 'exhibitions', 'workshops', 'cultural events'],
    style: 'exciting and engaging',
    tone: 'energetic and inspiring'
  },
  'Beach & Nightlife': {
    topics: ['beach club openings', 'nightlife reviews', 'VIP experiences', 'rooftop venues', 'party events'],
    style: 'luxurious and exciting',
    tone: 'sophisticated and alluring'
  },
  'Living in Dubai': {
    topics: ['area guides', 'expat tips', 'community updates', 'lifestyle advice', 'local insights'],
    style: 'helpful and personal',
    tone: 'friendly and knowledgeable'
  },
  'Luxury Life': {
    topics: ['luxury shopping', 'high-end experiences', 'yacht charters', 'premium services', 'exclusive events'],
    style: 'opulent and aspirational',
    tone: 'refined and exclusive'
  },
  'Real Estate Watch': {
    topics: ['market trends', 'new developments', 'investment opportunities', 'area spotlights', 'price analysis'],
    style: 'analytical and insightful',
    tone: 'professional and data-driven'
  }
}

async function generateContent(category: string, template_type: string, language: 'en' | 'ar' = 'en') {
  const template = CONTENT_TEMPLATES[category as keyof typeof CONTENT_TEMPLATES]
  if (!template) {
    throw new Error(`No template found for category: ${category}`)
  }

  const randomTopic = template.topics[Math.floor(Math.random() * template.topics.length)]
  
  const prompt = `You are a luxury lifestyle writer for MyDub.AI, Dubai's premier AI-powered information platform.

TASK: Write a high-quality, engaging article about "${randomTopic}" for the "${category}" section.

BRAND VOICE: MyDub.AI is sophisticated, luxurious, and AI-powered. We cater to affluent residents and visitors of Dubai.

REQUIREMENTS:
- Style: ${template.style}
- Tone: ${template.tone}
- Length: 800-1200 words
- Language: ${language === 'ar' ? 'Arabic' : 'English'}
- Include specific Dubai locations and venues when relevant
- Focus on luxury and premium experiences
- Be informative yet aspirational

STRUCTURE:
1. Compelling headline (50-70 characters)
2. Engaging introduction (2-3 sentences)
3. Main content with 3-4 key sections
4. Strong conclusion with call-to-action

OUTPUT FORMAT:
{
  "headline": "[Compelling headline]",
  "summary": "[2-3 sentence summary]",
  "content": "[Full article content in HTML format]",
  "tags": ["tag1", "tag2", "tag3"],
  "read_time": [estimated minutes],
  "meta_description": "[SEO meta description 150-160 chars]"
}

Please generate this content now, ensuring it's factual, engaging, and maintains MyDub.AI's luxury brand positioning.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mydub.ai',
      'X-Title': 'MyDub.AI Content Generator'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-sonnet',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.8
    })
  })

  if (!response.ok) {
    throw new Error(`AI API request failed: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content generated from AI')
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    // If JSON parsing fails, create a structured response
    return {
      headline: `AI-Generated: ${randomTopic} in Dubai`,
      summary: content.substring(0, 300) + '...',
      content: `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
      tags: [randomTopic.replace(/\s+/g, '-'), 'dubai', 'ai-generated'],
      read_time: Math.ceil(content.split(/\s+/).length / 200),
      meta_description: content.substring(0, 155) + '...'
    }
  }
}

async function getOrCreateNewsSource() {
  const { data: existingSource } = await supabase
    .from('news_sources')
    .select('id')
    .eq('name', 'MyDub.AI')
    .single()

  if (existingSource) {
    return existingSource.id
  }

  const { data: newSource, error } = await supabase
    .from('news_sources')
    .insert({
      name: 'MyDub.AI',
      name_ar: 'ماي دبي.ای',
      website: 'https://mydub.ai',
      is_active: true,
      credibility_score: 10
    })
    .select('id')
    .single()

  if (error) throw error
  return newSource.id
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
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
    const { category, priority = 'medium', language = 'en', template_type = 'news' }: ContentGenerationRequest = await req.json()

    if (!category) {
      return new Response(
        JSON.stringify({ error: 'Category is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Generating content for category: ${category}`)

    // Generate content using AI
    const generatedContent = await generateContent(category, template_type, language)
    
    // Get news source ID
    const sourceId = await getOrCreateNewsSource()
    
    // Prepare article for database
    const slug = generateSlug(generatedContent.headline)
    const now = new Date().toISOString()
    
    const article = {
      title: generatedContent.headline,
      summary: generatedContent.summary,
      content: generatedContent.content,
      category: category,
      author: 'MyDub.AI Editorial Team',
      published_at: now,
      image_url: `https://images.unsplash.com/800x600/?dubai,${category.toLowerCase().replace(/\s+/g, ',')}`,
      tags: generatedContent.tags || [category.toLowerCase().replace(/\s+/g, '-'), 'dubai', 'ai-generated'],
      read_time: generatedContent.read_time || 3,
      is_featured: priority === 'high',
      is_breaking: false,
      has_video: false,
      source_id: sourceId,
      url: `https://mydub.ai/articles/${slug}`,
      view_count: 0,
      sentiment: 'positive',
      ai_summary: generatedContent.summary,
      ai_summary_ar: language === 'both' ? 'Generated Arabic summary would go here' : ''
    }

    // Insert into database
    const { data, error } = await supabase
      .from('news_articles')
      .insert(article)
      .select('id, title, category')
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save article', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Generated article: "${data.title}" (ID: ${data.id})`)

    return new Response(
      JSON.stringify({
        success: true,
        article: data,
        message: `Successfully generated article for ${category}`,
        url: `https://mydub.ai/articles/${slug}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Content generation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Content generation failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 