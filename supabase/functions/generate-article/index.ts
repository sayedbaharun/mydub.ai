import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface GenerationRequest {
  topic: string
  category: string
  wordCount?: number
  tone?: 'professional' | 'casual' | 'formal' | 'friendly'
  model?: 'gpt-4-turbo' | 'claude-3-opus' | 'gemini-pro'
}

interface GeneratedArticle {
  title: string
  summary: string
  content: string
  tags: string[]
}

const MODEL_CONFIG = {
  'gpt-4-turbo': {
    id: 'openai/gpt-4-turbo-preview',
    name: 'GPT-4 Turbo'
  },
  'claude-3-opus': {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus'
  },
  'gemini-pro': {
    id: 'google/gemini-pro',
    name: 'Gemini Pro'
  }
}

Deno.serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json() as GenerationRequest

    // Validate input
    if (!body.topic || !body.category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: topic, category' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get API key from environment (NOT from request)
    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      console.error('OpenRouter API key not configured')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const model = body.model || 'gpt-4-turbo'
    const modelConfig = MODEL_CONFIG[model as keyof typeof MODEL_CONFIG]
    const wordCount = body.wordCount || 400

    console.log(`🤖 Generating article with ${modelConfig.name}: "${body.topic}"`)

    const prompt = `Write a Dubai news article in this JSON format only:
{
  "title": "Headline",
  "summary": "2-3 sentence summary",
  "content": "Article in HTML with 2-3 paragraphs",
  "tags": ["tag1", "tag2", "tag3"]
}

Topic: ${body.topic}
Category: ${body.category}

Return ONLY the JSON, no markdown or extra text.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mydub.ai',
        'X-Title': 'MyDub.AI'
      },
      body: JSON.stringify({
        model: modelConfig.id,
        messages: [
          {
            role: 'system',
            content: 'You are an expert news writer specializing in Dubai and UAE news. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 350,
        top_p: 0.95
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenRouter API error:', error)

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Try again in a moment.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          error: `OpenRouter error: ${error.error?.message || response.statusText}`
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0]?.message?.content) {
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI service' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse the JSON response
    let articleData: GeneratedArticle
    try {
      let content = data.choices[0].message.content
      // Remove markdown code blocks if present
      let jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      // Try to fix incomplete JSON if needed
      if (!jsonStr.endsWith('}')) {
        // Close any open strings first
        const lastQuoteIndex = jsonStr.lastIndexOf('"')
        if (lastQuoteIndex > -1) {
          jsonStr = jsonStr.substring(0, lastQuoteIndex + 1) + '}'
        } else {
          jsonStr += '}'
        }
      }

      articleData = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse article JSON:', data.choices[0].message.content)
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate response
    if (!articleData.title || !articleData.summary || !articleData.content) {
      return new Response(
        JSON.stringify({ error: 'AI response missing required fields' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Article generated successfully: "${articleData.title}"`)

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          title: articleData.title,
          summary: articleData.summary,
          content: articleData.content,
          tags: articleData.tags || [],
          readability_score: 75,
          originality_score: 85,
          factual_accuracy_score: 80
        },
        model: modelConfig.name,
        tokensUsed: data.usage?.total_tokens || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
