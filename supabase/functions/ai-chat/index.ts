import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  message: string
  systemPrompt: string
  provider: 'anthropic' | 'openai' | 'google'
  context?: {
    includeWeather?: boolean
    includeNews?: boolean
    includeSearch?: boolean
    location?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('AI Chat request received')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasAuthHeader: !!req.headers.get('Authorization')
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return new Response(
        JSON.stringify({ 
          error: 'Missing authorization header',
          fallback: getMockResponse('authentication required')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          fallback: getMockResponse('authentication failed')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    console.log('User authenticated:', user.email)

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('Request body parse error:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          fallback: getMockResponse('invalid request')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const { message, systemPrompt, provider }: AIRequest = requestBody

    if (!message || !systemPrompt || !provider) {
      console.log('Missing required fields:', { message: !!message, systemPrompt: !!systemPrompt, provider: !!provider })
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: message, systemPrompt, provider',
          fallback: getMockResponse('missing fields')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Calling AI provider:', provider)

    // Gather contextual data if requested
    let contextualData = ''
    if (requestBody.context) {
      contextualData = await gatherContextualData(requestBody.context)
    }

    // Enhanced system prompt with context
    const enhancedSystemPrompt = contextualData 
      ? `${systemPrompt}\n\nAdditional Context:\n${contextualData}`
      : systemPrompt

    let response: string

    switch (provider) {
      case 'anthropic':
        response = await callAnthropicAPI(message, enhancedSystemPrompt)
        break
      case 'openai':
        response = await callOpenAIAPI(message, enhancedSystemPrompt)
        break
      case 'google':
        response = await callGoogleAPI(message, enhancedSystemPrompt)
        break
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }

    console.log('AI response received, length:', response.length)

    return new Response(
      JSON.stringify({ response }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('AI Chat Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        fallback: getMockResponse(error.message || '')
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function callAnthropicAPI(message: string, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic API Error:', response.status, errorText)
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callOpenAIAPI(message: string, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI API Error:', response.status, errorText)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callGoogleAPI(message: string, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
  if (!apiKey) {
    throw new Error('Google API key not configured')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Google API Error:', response.status, errorText)
    throw new Error(`Google API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

// Gather contextual data from various sources
async function gatherContextualData(context: any): Promise<string> {
  const contextParts: string[] = []
  
  try {
    // Get weather data for Dubai
    if (context.includeWeather) {
      const weatherData = await getWeatherData(context.location || 'Dubai')
      if (weatherData) {
        contextParts.push(`Current Weather in ${context.location || 'Dubai'}: ${weatherData}`)
      }
    }

    // Get recent news about Dubai
    if (context.includeNews) {
      const newsData = await getRecentNews()
      if (newsData) {
        contextParts.push(`Recent Dubai News: ${newsData}`)
      }
    }

    // Get web search results if needed
    if (context.includeSearch) {
      const searchData = await getWebSearchData(context.searchQuery || 'Dubai current events')
      if (searchData) {
        contextParts.push(`Current Information: ${searchData}`)
      }
    }
  } catch (error) {
    console.error('Error gathering contextual data:', error)
  }

  return contextParts.join('\n\n')
}

// Get weather data from WeatherStack API
async function getWeatherData(location: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('WEATHERSTACK_API_KEY')
    if (!apiKey) {
      console.warn('WeatherStack API key not configured')
      return 'Weather data unavailable - API key not configured'
    }

    const response = await fetch(
      `http://api.weatherstack.com/current?access_key=${apiKey}&query=${encodeURIComponent(location)}&units=m`
    )

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`WeatherStack API error: ${data.error.info}`)
    }
    
    const current = data.current
    const location_info = data.location
    
    return `📍 ${location_info.name}, ${location_info.country}
🌡️ Temperature: ${current.temperature}°C (feels like ${current.feelslike}°C)
☁️ Conditions: ${current.weather_descriptions[0]}
💧 Humidity: ${current.humidity}%
💨 Wind: ${current.wind_speed} km/h ${current.wind_dir}
👁️ Visibility: ${current.visibility} km
🕐 Local time: ${location_info.localtime}`
  } catch (error) {
    console.error('Weather data error:', error)
    return `Unable to fetch current weather data for ${location}. Please try again later.`
  }
}

// Get recent news from NewsData.io API and database
async function getRecentNews(): Promise<string | null> {
  try {
    // First try to get live news from NewsData.io
    const liveNews = await getLiveNewsData()
    if (liveNews) {
      return `📰 **Latest Dubai News** (Live):\n${liveNews}`
    }

    // Fallback to database news
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return null
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/news_articles?select=title,summary&order=published_at.desc&limit=3`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Database news error: ${response.status}`)
    }

    const articles = await response.json()
    
    if (articles && articles.length > 0) {
      return `📰 **Recent Dubai News** (Database):\n${articles.map((article: any) => `• ${article.title}: ${article.summary}`).join('\n')}`
    }
    
    return null
  } catch (error) {
    console.error('News data error:', error)
    return null
  }
}

// Get live news from NewsData.io API
async function getLiveNewsData(): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('NEWSDATA_API_KEY')
    if (!apiKey) {
      console.warn('NewsData.io API key not configured')
      return null
    }

    // Search for Dubai-specific news
    const response = await fetch(
      `https://newsdata.io/api/1/news?apikey=${apiKey}&country=ae&q=Dubai&language=en&size=5`
    )

    if (!response.ok) {
      throw new Error(`NewsData API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status === 'success' && data.results && data.results.length > 0) {
      return data.results.slice(0, 3).map((article: any) => {
        const timeAgo = getTimeAgo(article.pubDate)
        return `• **${article.title}** (${timeAgo})\n  ${article.description || 'No description available'}`
      }).join('\n\n')
    }
    
    return null
  } catch (error) {
    console.error('NewsData API error:', error)
    return null
  }
}

// Helper function to get time ago from date string
function getTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${Math.max(1, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''} ago`
    }
  } catch (error) {
    return 'recently'
  }
}

// Get web search results from Brave Search API
async function getWebSearchData(query: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('BRAVE_SEARCH_API_KEY')
    if (!apiKey) {
      console.warn('Brave Search API key not configured')
      return null
    }

    // Enhance query with Dubai context if not already present
    const enhancedQuery = query.toLowerCase().includes('dubai') ? query : `${query} Dubai UAE`

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(enhancedQuery)}&count=5&search_lang=en&country=ALL`,
      {
        headers: {
          'X-Subscription-Token': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.web && data.web.results && data.web.results.length > 0) {
      return `🔍 **Current Information** (Live Search):\n${data.web.results.slice(0, 3).map((result: any) => {
        const url = new URL(result.url)
        return `• **${result.title}**\n  ${result.description}\n  📰 Source: ${url.hostname}`
      }).join('\n\n')}`
    }
    
    return null
  } catch (error) {
    console.error('Search data error:', error)
    return null
  }
}

function getMockResponse(query: string): string {
  const q = query.toLowerCase()
  
  if (q.includes('hello') || q.includes('hi')) {
    return "Hello! I'm your AI assistant for Dubai. How can I help you explore this amazing city today?"
  }
  
  if (q.includes('weather')) {
    return "Today's weather in Dubai is typically warm and sunny with temperatures around 25-30°C. Perfect for outdoor activities! For real-time weather updates, I recommend checking the Dubai Municipality weather services."
  }
  
  if (q.includes('restaurant') || q.includes('food')) {
    return "Dubai has an incredible dining scene! I recommend trying Al Hadheerah for traditional Emirati cuisine, or visit Dubai Mall for international options. What type of cuisine are you interested in?"
  }
  
  if (q.includes('attraction') || q.includes('tourist')) {
    return "Dubai offers amazing attractions like the Burj Khalifa, Dubai Mall, Palm Jumeirah, and the traditional Gold and Spice Souks. What type of experience are you looking for?"
  }
  
  return "Thank you for your question! I'm here to help you with information about Dubai - from attractions and restaurants to transportation and local culture. What would you like to know?"
}