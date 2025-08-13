/**
 * Security headers configuration for enhanced protection
 */

import { SecurityConfig, generateCSP } from './env-encryption'

export interface SecurityHeaders {
  [key: string]: string
}

/**
 * Generate security headers based on environment
 */
export function getSecurityHeaders(isDevelopment: boolean = false): SecurityHeaders {
  const headers: SecurityHeaders = {
    // Content Security Policy
    'Content-Security-Policy': generateCSP(isDevelopment ? 'development' : 'production'),
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy (formerly Feature-Policy)
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    
    // HSTS (only in production)
    ...(isDevelopment ? {} : {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    })
  }
  
  return headers
}

/**
 * CORS configuration for API endpoints
 */
export const corsConfig = {
  development: {
    origin: [
      'http://localhost:8001',
      'http://localhost:5173',
      'http://127.0.0.1:8001',
      'http://127.0.0.1:5173'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  production: {
    origin: [
      'https://mydub.ai',
      'https://www.mydub.ai',
      'https://*.mydub.ai'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400 // 24 hours
  }
}

/**
 * Validate origin for CORS
 */
export function isValidOrigin(origin: string | undefined, isDevelopment: boolean): boolean {
  if (!origin) return false
  
  const config = isDevelopment ? corsConfig.development : corsConfig.production
  const allowedOrigins = config.origin
  
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true
  }
  
  // Check wildcard patterns
  for (const pattern of allowedOrigins) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'))
      if (regex.test(origin)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: Response | Headers,
  isDevelopment: boolean = false
): void {
  const headers = getSecurityHeaders(isDevelopment)
  
  Object.entries(headers).forEach(([key, value]) => {
    if (response instanceof Response) {
      response.headers.set(key, value)
    } else {
      response.set(key, value)
    }
  })
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max auth attempts
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
  },
  content: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Max content submissions
    message: 'Content submission limit reached, please try again later',
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    
    // Remove any credentials from URL
    parsed.username = ''
    parsed.password = ''
    
    return parsed.toString()
  } catch {
    return null
  }
}