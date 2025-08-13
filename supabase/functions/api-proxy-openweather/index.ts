import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API key from environment variable
    const apiKey = Deno.env.get('OPENWEATHER_API_KEY')
    if (!apiKey) {
      throw new Error('OpenWeather API key not configured')
    }

    // Parse the request
    const { endpoint, params } = await req.json()
    
    // Validate the endpoint
    const allowedEndpoints = ['weather', 'forecast', 'air_pollution']
    if (!allowedEndpoints.includes(endpoint)) {
      throw new Error('Invalid endpoint')
    }

    // Build the OpenWeather API URL
    const baseUrl = 'https://api.openweathermap.org/data/2.5'
    const queryParams = new URLSearchParams({
      ...params,
      appid: apiKey
    })
    
    const url = `${baseUrl}/${endpoint}?${queryParams}`

    // Make the request to OpenWeather
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Return the response
    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('OpenWeather proxy error:', error)
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