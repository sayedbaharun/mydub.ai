import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const apiKey = process.env.FIXER_API_KEY || process.env.VITE_FIXER_API_KEY
    
    if (!apiKey) {
      console.warn('Using fallback exchange rates - API key not configured')
      throw new Error('API key not configured')
    }
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    // Try fixer.io API first (free tier only supports http)
    const response = await fetch(
      `http://data.fixer.io/api/latest?access_key=${apiKey}&symbols=AED,USD,GBP,INR,EUR`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'MyDub.AI/1.0'
        }
      }
    )
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success && data.rates) {
      // Convert from EUR base to AED base
      const aedPerEur = data.rates.AED
      
      // Calculate how many AED per foreign currency
      const rates = {
        EUR: aedPerEur,
        GBP: (data.rates.AED / data.rates.GBP),
        INR: (data.rates.AED / data.rates.INR),
        USD: (data.rates.AED / data.rates.USD),
        timestamp: data.timestamp,
        loading: false
      }
      
      return res.status(200).json(rates)
    } else {
      throw new Error(data.error?.info || 'Failed to fetch exchange rates')
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout'
      } else {
        errorMessage = error.message
      }
    }
    
    // Return fallback rates with error info
    return res.status(200).json({
      EUR: 4.20,
      GBP: 4.86,
      INR: 0.0419,
      USD: 3.67,
      loading: false,
      error: true,
      fallback: true,
      errorMessage,
      timestamp: Math.floor(Date.now() / 1000)
    })
  }
}