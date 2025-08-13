import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API key from environment variable
    const apiKey = Deno.env.get('NEWS_API_KEY')
    if (!apiKey) {
      throw new Error('News API key not configured')
    }

    // Parse the request
    const { endpoint, params } = await req.json()
    
    // Validate the endpoint
    const allowedEndpoints = ['everything', 'top-headlines', 'sources']
    if (!allowedEndpoints.includes(endpoint)) {
      throw new Error('Invalid endpoint')
    }

    // Build the News API URL
    const baseUrl = 'https://newsapi.org/v2'
    const queryParams = new URLSearchParams({
      ...params,
      apiKey: apiKey
    })
    
    const url = `${baseUrl}/${endpoint}?${queryParams}`

    // Make the request to News API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyDub.AI/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`News API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Return the response
    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900', // Cache for 15 minutes
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('News API proxy error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message?.includes('not configured') ? 503 : 400,
      },
    )
  }
})