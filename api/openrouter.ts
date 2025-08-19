import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cost tracking (in production, use a database)
const costTracking = new Map<string, number>();

// Model pricing per 1K tokens (example rates)
const MODEL_COSTS = {
  'gpt-4-turbo': 0.01,
  'gpt-4': 0.03,
  'gpt-3.5-turbo': 0.0005,
  'claude-3-opus': 0.015,
  'claude-3.5-sonnet': 0.003,
  'claude-3-sonnet': 0.003,
  'claude-3-haiku': 0.00025,
  'gemini-pro': 0.00025,
  'ft:gpt-4.1-2025-04-14:personal:basic-training:BlBWGGHF': 0.03, // Fine-tuned model
};

// Daily spending limit per user
const DAILY_SPENDING_LIMIT = 10; // $10 per day
const MONTHLY_SPENDING_LIMIT = 100; // $100 per month

function getRateLimitKey(identifier: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${identifier}:${date}`;
}

function checkRateLimit(identifier: string, limit: number = 100): boolean {
  const key = getRateLimitKey(identifier);
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hour window
  
  const record = rateLimitStore.get(key) || { count: 0, resetTime: now + window };
  
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + window;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  rateLimitStore.set(key, record);
  return true;
}

function trackCost(userId: string, model: string, tokens: number): boolean {
  const costPer1K = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || 0.01;
  const cost = (tokens / 1000) * costPer1K;
  
  // Daily tracking
  const dailyKey = `daily:${userId}:${new Date().toISOString().split('T')[0]}`;
  const dailySpent = (costTracking.get(dailyKey) || 0) + cost;
  
  if (dailySpent > DAILY_SPENDING_LIMIT) {
    return false; // Daily limit exceeded
  }
  
  // Monthly tracking
  const monthlyKey = `monthly:${userId}:${new Date().toISOString().slice(0, 7)}`;
  const monthlySpent = (costTracking.get(monthlyKey) || 0) + cost;
  
  if (monthlySpent > MONTHLY_SPENDING_LIMIT) {
    return false; // Monthly limit exceeded
  }
  
  // Update tracking
  costTracking.set(dailyKey, dailySpent);
  costTracking.set(monthlyKey, monthlySpent);
  
  return true;
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

const handler = async (req: VercelRequest, res: VercelResponse) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get user identifier (from auth token or IP for anonymous users)
    const authHeader = req.headers.authorization;
    const userId = authHeader ? authHeader.replace('Bearer ', '') : req.headers['x-forwarded-for'] as string || 'anonymous';
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3600 // 1 hour in seconds
      });
    }
    
    const { model, messages, temperature, max_tokens = 1000, stream = false } = req.body;
    
    // Validate request
    if (!model || !messages) {
      return res.status(400).json({ error: 'Missing required parameters: model and messages' });
    }
    
    // Estimate tokens for cost tracking
    const estimatedPromptTokens = messages.reduce((acc: number, msg: any) => {
      return acc + estimateTokens(msg.content || '');
    }, 0);
    
    const estimatedTotalTokens = estimatedPromptTokens + max_tokens;
    
    // Check if user can afford this request
    if (!trackCost(userId, model, estimatedTotalTokens)) {
      return res.status(402).json({ 
        error: 'Daily or monthly spending limit exceeded. Please upgrade your plan or wait until tomorrow.',
        limits: {
          daily: DAILY_SPENDING_LIMIT,
          monthly: MONTHLY_SPENDING_LIMIT
        }
      });
    }
    
    // Make request to OpenRouter
    const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error('OpenRouter API key not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'https://mydub.ai',
        'X-Title': 'MyDub.AI'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature || 0.7,
        max_tokens,
        stream
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return res.status(response.status).json({ 
        error: 'AI service error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
    
    const data = await response.json();
    
    // Track actual tokens used
    if (data.usage) {
      const actualTokens = data.usage.total_tokens || estimatedTotalTokens;
      trackCost(userId, model, actualTokens);
    }
    
    // Log usage for monitoring
    console.log('AI API usage:', {
      userId,
      model,
      tokens: data.usage?.total_tokens || estimatedTotalTokens,
      cost: (data.usage?.total_tokens || estimatedTotalTokens) / 1000 * (MODEL_COSTS[model as keyof typeof MODEL_COSTS] || 0.01)
    });
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your request'
    });
  }
}

export default handler;