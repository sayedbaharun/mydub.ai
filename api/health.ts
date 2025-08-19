import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Access-Control-Allow-Origin', 'https://www.mydub.ai')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  return res.status(200).json({ status: 'ok', timestamp: Date.now() })
}

