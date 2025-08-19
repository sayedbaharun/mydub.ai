import type { VercelRequest, VercelResponse } from '@vercel/node'

const handler = async (req: VercelRequest, res: VercelResponse) => {
  // Enable CORS (align with production origin)
  const origin = 'https://www.mydub.ai'
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Prefer HTTPS provider for reliability. If FIXER_API_KEY exists, try Fixer first.
    const apiKey = process.env.FIXER_API_KEY || process.env.VITE_FIXER_API_KEY

    // Set CDN cache for 30 minutes with SWR
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate')

    // Helper to respond in a normalized AED-based shape
    const respond = (rates: { EUR: number; GBP: number; INR: number; USD: number }, timestamp?: number) =>
      res.status(200).json({ ...rates, timestamp: timestamp ?? Math.floor(Date.now()/1000), loading: false })

    // Attempt Fixer (HTTP-only on free) if key is provided
    if (apiKey) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        const response = await fetch(
          `http://data.fixer.io/api/latest?access_key=${apiKey}&symbols=AED,USD,GBP,INR,EUR`,
          { signal: controller.signal, headers: { 'User-Agent': 'MyDub.AI/1.0' } }
        )
        clearTimeout(timeoutId)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.rates) {
            const aedPerEur = data.rates.AED
            return respond({
              EUR: aedPerEur,
              GBP: (data.rates.AED / data.rates.GBP),
              INR: (data.rates.AED / data.rates.INR),
              USD: (data.rates.AED / data.rates.USD)
            }, data.timestamp)
          }
        }
      } catch (_) {
        // fall through to HTTPS provider
      }
    }

    // HTTPS provider (no key required): exchangerate.host, base=AED
    const httpsResp = await fetch('https://api.exchangerate.host/latest?base=AED&symbols=USD,GBP,INR,EUR')
    if (!httpsResp.ok) throw new Error(`Exchange rate API error: ${httpsResp.status}`)
    const j = await httpsResp.json()
    return respond({ EUR: j.rates.EUR, GBP: j.rates.GBP, INR: j.rates.INR, USD: j.rates.USD }, j.timestamp)

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

export default handler;