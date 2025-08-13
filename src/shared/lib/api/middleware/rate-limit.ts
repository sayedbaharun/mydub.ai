/**
 * Rate Limiting Middleware
 * Implements rate limiting for API endpoints with different strategies
 */

import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import { EnvSecurity } from '@/shared/lib/security/env-encryption'

// Rate limiter store interface
interface RateLimiterStore {
  increment(key: string): Promise<{ count: number; resetTime: number }>
  reset(key: string): Promise<void>
  cleanup(): Promise<void>
}

// Memory store for development
class MemoryStore implements RateLimiterStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  
  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const existing = this.store.get(key)
    
    if (!existing || now > existing.resetTime) {
      const resetTime = now + (15 * 60 * 1000) // 15 minutes
      this.store.set(key, { count: 1, resetTime })
      return { count: 1, resetTime }
    }
    
    existing.count++
    return existing
  }
  
  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }
  
  async cleanup(): Promise<void> {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Supabase store for production
class SupabaseStore implements RateLimiterStore {
  private supabase: ReturnType<typeof createClient>
  
  constructor() {
    const keys = EnvSecurity.getAPIKeys()
    this.supabase = createClient(keys.supabase.url, keys.supabase.anonKey)
  }
  
  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const windowStart = now - (15 * 60 * 1000) // 15 minutes ago
    
    // Check existing rate limit
    const { data: existing } = await this.supabase
      .from('rate_limits')
      .select('*')
      .eq('key', key)
      .single()
    
    if (!existing || existing.window_start < windowStart) {
      // Create or reset
      const resetTime = now + (15 * 60 * 1000)
      await this.supabase
        .from('rate_limits')
        .upsert({
          key,
          attempt_count: 1,
          window_start: now,
          action: 'api_request'
        })
      
      return { count: 1, resetTime }
    }
    
    // Increment counter
    const { data: updated } = await this.supabase
      .from('rate_limits')
      .update({ attempt_count: existing.attempt_count + 1 })
      .eq('key', key)
      .select()
      .single()
    
    return {
      count: updated?.attempt_count || existing.attempt_count + 1,
      resetTime: existing.window_start + (15 * 60 * 1000)
    }
  }
  
  async reset(key: string): Promise<void> {
    await this.supabase
      .from('rate_limits')
      .delete()
      .eq('key', key)
  }
  
  async cleanup(): Promise<void> {
    const windowStart = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    await this.supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStart)
  }
}

// Rate limit configuration
export interface RateLimitConfig {
  windowMs?: number // Time window in milliseconds
  max?: number // Max requests per window
  message?: string // Error message
  statusCode?: number // HTTP status code
  headers?: boolean // Send rate limit headers
  keyGenerator?: (req: Request) => string // Generate rate limit key
  skip?: (req: Request) => boolean | Promise<boolean> // Skip rate limiting
  handler?: (req: Request, res: Response) => void // Custom handler
  store?: RateLimiterStore // Storage backend
}

// Default configurations
export const rateLimitDefaults = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please try again later',
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later',
  },
  content: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: 'Content submission limit reached, please try again later',
  },
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many search requests, please try again later',
  },
}

/**
 * Create rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig = {}) {
  const {
    windowMs = rateLimitDefaults.api.windowMs,
    max = rateLimitDefaults.api.max,
    message = rateLimitDefaults.api.message,
    statusCode = 429,
    headers = true,
    keyGenerator = defaultKeyGenerator,
    skip,
    handler,
    store = new MemoryStore(),
  } = config
  
  // Cleanup old entries periodically
  setInterval(() => {
    store.cleanup().catch(console.error)
  }, 60 * 60 * 1000) // Every hour
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if should skip
      if (skip && await skip(req)) {
        return next()
      }
      
      // Generate key
      const key = keyGenerator(req)
      
      // Increment counter
      const { count, resetTime } = await store.increment(key)
      
      // Add headers
      if (headers) {
        res.setHeader('X-RateLimit-Limit', max.toString())
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count).toString())
        res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString())
      }
      
      // Check if limit exceeded
      if (count > max) {
        res.setHeader('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString())
        
        if (handler) {
          handler(req, res)
        } else {
          res.status(statusCode).json({
            error: 'Rate limit exceeded',
            message,
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
          })
        }
        return
      }
      
      next()
    } catch (error) {
      console.error('Rate limit error:', error)
      // Fail open - allow request on error
      next()
    }
  }
}

/**
 * Create rate limiter for specific endpoints
 */
export const rateLimiters = {
  // General API rate limit
  api: rateLimit(rateLimitDefaults.api),
  
  // Strict auth rate limit
  auth: rateLimit({
    ...rateLimitDefaults.auth,
    keyGenerator: (req) => {
      // Rate limit by IP + email/username
      const identifier = req.body?.email || req.body?.username || ''
      return `auth:${getClientIp(req)}:${identifier}`
    },
  }),
  
  // Content submission rate limit
  content: rateLimit({
    ...rateLimitDefaults.content,
    keyGenerator: (req) => {
      // Rate limit by user ID if authenticated, otherwise by IP
      const userId = (req as any).user?.id
      return userId ? `content:user:${userId}` : `content:ip:${getClientIp(req)}`
    },
  }),
  
  // Search rate limit
  search: rateLimit({
    ...rateLimitDefaults.search,
    skip: (req) => {
      // Skip rate limiting for authenticated users
      return !!(req as any).user?.id
    },
  }),
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(req: Request): string {
  return `${req.method}:${req.path}:${getClientIp(req)}`
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  // Check various headers for IP
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded
    return ips[0].trim()
  }
  
  return (
    (req.headers['x-real-ip'] as string) ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

/**
 * Create dynamic rate limiter based on user role
 */
export function dynamicRateLimit(
  configs: Record<string, RateLimitConfig>,
  defaultConfig: RateLimitConfig = rateLimitDefaults.api
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user
    const role = user?.role || 'anonymous'
    
    const config = configs[role] || defaultConfig
    const limiter = rateLimit(config)
    
    return limiter(req, res, next)
  }
}

/**
 * Rate limit by user action
 */
export function actionRateLimit(
  action: string,
  config: Partial<RateLimitConfig> = {}
) {
  return rateLimit({
    ...rateLimitDefaults.api,
    ...config,
    keyGenerator: (req) => {
      const userId = (req as any).user?.id || getClientIp(req)
      return `action:${action}:${userId}`
    },
  })
}