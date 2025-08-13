import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API key from environment variable
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    // Parse the request
    const { service, params } = await req.json()
    
    // Validate the service
    const allowedServices = ['geocode', 'directions', 'places', 'distancematrix']
    if (!allowedServices.includes(service)) {
      throw new Error('Invalid service')
    }

    // Build the Google Maps API URL
    const baseUrl = `https://maps.googleapis.com/maps/api/${service}/json`
    const queryParams = new URLSearchParams({
      ...params,
      key: apiKey
    })
    
    const url = `${baseUrl}?${queryParams}`

    // Make the request to Google Maps
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Check for API-specific errors
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Maps API error: ${data.status}`)
    }

    // Return the response
    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Google Maps proxy error:', error)
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