/**
 * Security Middleware
 * Implements various security checks for API requests
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { sanitizers } from '@/shared/lib/validation/schemas'

// Security configuration
export interface SecurityConfig {
  maxUrlLength?: number
  maxBodySize?: number
  maxHeaderSize?: number
  maxParameterLength?: number
  allowedContentTypes?: string[]
  allowedMethods?: string[]
  csrfSecret?: string
  csrfHeader?: string
  enableSqlInjectionCheck?: boolean
  enableXssCheck?: boolean
  logSecurityEvents?: boolean
}

const defaultConfig: SecurityConfig = {
  maxUrlLength: 2048,
  maxBodySize: 10 * 1024 * 1024, // 10MB
  maxHeaderSize: 8192, // 8KB
  maxParameterLength: 1024,
  allowedContentTypes: [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  csrfHeader: 'x-csrf-token',
  enableSqlInjectionCheck: true,
  enableXssCheck: true,
  logSecurityEvents: true,
}

/**
 * Main security middleware
 */
export function securityMiddleware(config: SecurityConfig = {}) {
  const settings = { ...defaultConfig, ...config }
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check request method
      if (!settings.allowedMethods?.includes(req.method)) {
        return sendSecurityError(res, 'Method not allowed', 405, settings)
      }
      
      // Check URL length
      if (req.originalUrl.length > settings.maxUrlLength!) {
        return sendSecurityError(res, 'URL too long', 414, settings)
      }
      
      // Check header size
      const headerSize = JSON.stringify(req.headers).length
      if (headerSize > settings.maxHeaderSize!) {
        return sendSecurityError(res, 'Headers too large', 431, settings)
      }
      
      // Check content type for body requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const contentType = req.headers['content-type']?.split(';')[0]
        if (contentType && !settings.allowedContentTypes?.includes(contentType)) {
          return sendSecurityError(res, 'Invalid content type', 415, settings)
        }
      }
      
      // Apply security checks to query parameters
      if (req.query && Object.keys(req.query).length > 0) {
        const sanitized = sanitizeQueryParams(req.query, settings)
        if (!sanitized.safe) {
          return sendSecurityError(res, sanitized.reason || 'Invalid query parameters', 400, settings)
        }
        req.query = sanitized.data
      }
      
      // Apply security checks to body
      if (req.body && typeof req.body === 'object') {
        const sanitized = sanitizeRequestBody(req.body, settings)
        if (!sanitized.safe) {
          return sendSecurityError(res, sanitized.reason || 'Invalid request body', 400, settings)
        }
        req.body = sanitized.data
      }
      
      next()
    } catch (error) {
      console.error('Security middleware error:', error)
      next(error)
    }
  }
}

/**
 * CSRF Protection middleware
 */
export function csrfProtection(secret: string = crypto.randomBytes(32).toString('hex')) {
  const tokens = new Map<string, { token: string; expires: number }>()
  
  // Cleanup expired tokens
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of tokens.entries()) {
      if (value.expires < now) {
        tokens.delete(key)
      }
    }
  }, 60 * 60 * 1000) // Every hour
  
  return {
    // Generate CSRF token
    generateToken: (req: Request, res: Response, next: NextFunction) => {
      const sessionId = (req as any).session?.id || crypto.randomBytes(16).toString('hex')
      const token = crypto
        .createHmac('sha256', secret)
        .update(sessionId + Date.now())
        .digest('hex')
      
      tokens.set(sessionId, {
        token,
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })
      
      res.locals.csrfToken = token
      next()
    },
    
    // Verify CSRF token
    verifyToken: (req: Request, res: Response, next: NextFunction) => {
      // Skip for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next()
      }
      
      const sessionId = (req as any).session?.id
      if (!sessionId) {
        return sendSecurityError(res, 'No session', 403)
      }
      
      const storedToken = tokens.get(sessionId)
      if (!storedToken || storedToken.expires < Date.now()) {
        return sendSecurityError(res, 'Invalid or expired CSRF token', 403)
      }
      
      const providedToken = 
        req.headers['x-csrf-token'] as string ||
        req.body?._csrf ||
        req.query?._csrf
      
      if (!providedToken || providedToken !== storedToken.token) {
        return sendSecurityError(res, 'Invalid CSRF token', 403)
      }
      
      next()
    },
  }
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimit(maxSize: number = 10 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    let size = 0
    
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > maxSize) {
        res.status(413).json({
          error: 'Payload too large',
          message: `Request body exceeds ${maxSize} bytes`,
        })
        req.connection.destroy()
      }
    })
    
    next()
  }
}

/**
 * SQL Injection prevention middleware
 */
export function sqlInjectionProtection() {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(\b(script|javascript|vbscript|onload|onerror|onclick)\b)/i,
    /(--|\/\*|\*\/|xp_|sp_)/i,
    /(\bor\b\s*\d+\s*=\s*\d+)/i,
    /(\band\b\s*\d+\s*=\s*\d+)/i,
  ]
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Check all string values in query, params, and body
    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return !sqlPatterns.some(pattern => pattern.test(value))
      }
      if (Array.isArray(value)) {
        return value.every(checkValue)
      }
      if (value && typeof value === 'object') {
        return Object.values(value).every(checkValue)
      }
      return true
    }
    
    if (!checkValue(req.query) || !checkValue(req.params) || !checkValue(req.body)) {
      return sendSecurityError(res, 'Potential SQL injection detected', 400)
    }
    
    next()
  }
}

/**
 * XSS Prevention middleware
 */
export function xssProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set security headers
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    
    // Sanitize string values
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        return sanitizers.escapeHtml(value)
      }
      if (Array.isArray(value)) {
        return value.map(sanitizeValue)
      }
      if (value && typeof value === 'object') {
        const sanitized: any = {}
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val)
        }
        return sanitized
      }
      return value
    }
    
    if (req.body) {
      req.body = sanitizeValue(req.body)
    }
    
    next()
  }
}

/**
 * IP-based access control
 */
export function ipWhitelist(allowedIps: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req)
    
    if (!allowedIps.includes(clientIp)) {
      return sendSecurityError(res, 'Access denied', 403)
    }
    
    next()
  }
}

/**
 * Sanitize query parameters
 */
function sanitizeQueryParams(
  query: any,
  config: SecurityConfig
): { safe: boolean; data: any; reason?: string } {
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(query)) {
    // Check parameter length
    if (key.length > config.maxParameterLength!) {
      return { safe: false, data: query, reason: 'Parameter name too long' }
    }
    
    if (typeof value === 'string') {
      if (value.length > config.maxParameterLength!) {
        return { safe: false, data: query, reason: 'Parameter value too long' }
      }
      
      // Check for SQL injection
      if (config.enableSqlInjectionCheck && /(\b(union|select|insert|update|delete|drop)\b)/i.test(value)) {
        return { safe: false, data: query, reason: 'Potential SQL injection' }
      }
      
      // Check for XSS
      if (config.enableXssCheck && /<[^>]*>/i.test(value)) {
        return { safe: false, data: query, reason: 'Potential XSS attack' }
      }
      
      sanitized[key] = sanitizers.normalizeWhitespace(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return { safe: true, data: sanitized }
}

/**
 * Sanitize request body
 */
function sanitizeRequestBody(
  body: any,
  config: SecurityConfig
): { safe: boolean; data: any; reason?: string } {
  const bodySize = JSON.stringify(body).length
  if (bodySize > config.maxBodySize!) {
    return { safe: false, data: body, reason: 'Request body too large' }
  }
  
  const checkAndSanitize = (obj: any, path: string = ''): any => {
    if (typeof obj === 'string') {
      if (config.enableSqlInjectionCheck && /(\b(union|select|insert|update|delete|drop)\b)/i.test(obj)) {
        throw new Error(`SQL injection detected at ${path}`)
      }
      
      if (config.enableXssCheck) {
        return sanitizers.escapeHtml(obj)
      }
      
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => checkAndSanitize(item, `${path}[${index}]`))
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = checkAndSanitize(value, path ? `${path}.${key}` : key)
      }
      return sanitized
    }
    
    return obj
  }
  
  try {
    const sanitized = checkAndSanitize(body)
    return { safe: true, data: sanitized }
  } catch (error) {
    return { 
      safe: false, 
      data: body, 
      reason: error instanceof Error ? error.message : 'Security check failed'
    }
  }
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
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
 * Send security error response
 */
function sendSecurityError(
  res: Response,
  message: string,
  statusCode: number = 400,
  config?: SecurityConfig
) {
  if (config?.logSecurityEvents) {
    console.error(`Security violation: ${message}`)
  }
  
  res.status(statusCode).json({
    error: 'Security violation',
    message,
  })
}