import type { VercelRequest, VercelResponse } from '@vercel/node'

const handler = async (req: VercelRequest, res: VercelResponse) => {
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
    const apiKey = process.env.VITE_NEWS_API_KEY || process.env.NEWS_API_KEY
    
    if (!apiKey) {
      console.warn('News API key not configured, returning fallback data')
      // Return realistic fallback news data
      return res.status(200).json({
        articles: [
          {
            title: "Dubai Announces New Smart City Initiative",
            description: "Dubai continues to lead in smart city innovation with new AI-powered services",
            content: "Dubai Municipality has announced a comprehensive smart city initiative...",
            publishedAt: new Date().toISOString(),
            source: { name: "Dubai News" },
            urlToImage: "/images/news-placeholder.jpg",
            url: "#"
          },
          {
            title: "UAE Economy Shows Strong Growth in 2025",
            description: "Non-oil sectors drive economic expansion across the Emirates",
            content: "The UAE economy continues to show robust growth...",
            publishedAt: new Date().toISOString(),
            source: { name: "UAE Business" },
            urlToImage: "/images/news-placeholder.jpg",
            url: "#"
          }
        ],
        fallback: true
      })
    }
    
    // Get query parameters
    const query = req.query.q || '(Dubai OR UAE OR "United Arab Emirates")'
    const category = req.query.category as string
    const pageSize = req.query.pageSize || '20'
    const language = req.query.language || 'en'
    
    // Build the appropriate query based on category
    let searchQuery = query
    if (category === 'business') {
      searchQuery = '(Dubai AND business) OR (UAE AND economy)'
    } else if (category === 'technology') {
      searchQuery = '(Dubai AND technology) OR (UAE AND innovation)'
    } else if (category === 'tourism') {
      searchQuery = '(Dubai AND tourism) OR (UAE AND travel)'
    }
    
    // Fetch from NewsAPI server-side
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery as string)}&language=${language}&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${apiKey}`
    )

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Add cache headers for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    
    return res.status(200).json(data)
  } catch (error) {
    console.error('Failed to fetch news:', error)
    
    // Return fallback news data
    return res.status(200).json({
      articles: [
        {
          title: "Dubai Announces New Smart City Initiative",
          description: "Dubai continues to lead in smart city innovation with new AI-powered services",
          content: "Dubai Municipality has announced a comprehensive smart city initiative...",
          publishedAt: new Date().toISOString(),
          source: { name: "Dubai News" },
          urlToImage: "/images/news-placeholder.jpg",
          url: "#"
        },
        {
          title: "UAE Economy Shows Strong Growth in 2025",
          description: "Non-oil sectors drive economic expansion across the Emirates",
          content: "The UAE economy continues to show robust growth...",
          publishedAt: new Date().toISOString(),
          source: { name: "UAE Business" },
          urlToImage: "/images/news-placeholder.jpg",
          url: "#"
        }
      ],
      error: true,
      fallback: true
    })
  }
}

export default handler;