/**
 * Error Handling Middleware
 * Provides consistent error responses and logging
 */

import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiValidationError } from './validation'
import { EnvSecurity } from '@/shared/lib/security/env-encryption'

// Error types
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_REQUIRED')
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(403, message, 'ACCESS_DENIED')
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(409, message, 'CONFLICT')
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED', { retryAfter })
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string
    code?: string
    statusCode: number
    details?: any
    timestamp: string
    path?: string
    method?: string
    requestId?: string
  }
}

// Error logging interface
interface ErrorLog {
  timestamp: string
  level: 'error' | 'warning' | 'info'
  message: string
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
    statusCode?: number
  }
  request?: {
    method: string
    path: string
    ip: string
    userAgent?: string
    userId?: string
  }
  details?: any
}

/**
 * Main error handling middleware
 */
export function errorHandler(
  logger?: (log: ErrorLog) => void
) {
  return (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // If response already sent, delegate to default Express error handler
    if (res.headersSent) {
      return next(err)
    }
    
    const timestamp = new Date().toISOString()
    const requestId = req.headers['x-request-id'] as string || generateRequestId()
    
    // Determine error details
    let statusCode = 500
    let code = 'INTERNAL_ERROR'
    let message = 'An error occurred'
    let details: any = undefined
    
    // Handle different error types
    if (err instanceof ApiError) {
      statusCode = err.statusCode
      code = err.code || code
      message = err.message
      details = err.details
    } else if (err instanceof ZodError) {
      statusCode = 400
      code = 'VALIDATION_ERROR'
      message = 'Validation failed'
      details = {
        errors: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }))
      }
    } else if (err instanceof ApiValidationError) {
      statusCode = err.statusCode
      code = 'VALIDATION_ERROR'
      message = err.message
      details = { errors: err.errors }
    } else if (err.name === 'UnauthorizedError') {
      // JWT errors
      statusCode = 401
      code = 'UNAUTHORIZED'
      message = 'Invalid or expired token'
    } else if (err.name === 'CastError' || err.name === 'ValidationError') {
      // MongoDB errors
      statusCode = 400
      code = 'INVALID_INPUT'
      message = 'Invalid input data'
    }
    
    // Create error response
    const errorResponse: ErrorResponse = {
      error: {
        message: sanitizeErrorMessage(message),
        code,
        statusCode,
        timestamp,
        path: req.path,
        method: req.method,
        requestId,
      }
    }
    
    // Add details in non-production environments
    if (!isProduction() && details) {
      errorResponse.error.details = details
    }
    
    // Log error
    const errorLog: ErrorLog = {
      timestamp,
      level: statusCode >= 500 ? 'error' : 'warning',
      message: `${req.method} ${req.path} - ${statusCode} ${message}`,
      error: {
        name: err.name,
        message: err.message,
        stack: !isProduction() ? err.stack : undefined,
        code,
        statusCode,
      },
      request: {
        method: req.method,
        path: req.path,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        userId: (req as any).user?.id,
      },
      details,
    }
    
    if (logger) {
      logger(errorLog)
    } else {
      console.error(JSON.stringify(errorLog, null, 2))
    }
    
    // Send response
    res.status(statusCode).json(errorResponse)
  }
}

/**
 * Not found handler
 */
export function notFoundHandler() {
  return (req: Request, res: Response) => {
    const errorResponse: ErrorResponse = {
      error: {
        message: 'Endpoint not found',
        code: 'ENDPOINT_NOT_FOUND',
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      }
    }
    
    res.status(404).json(errorResponse)
  }
}

/**
 * Async error wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Try-catch wrapper for route handlers
 */
export function tryCatch(
  fn: (req: Request, res: Response) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res)
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Validation error formatter
 */
export function formatValidationError(error: ZodError): ErrorResponse {
  return {
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      details: {
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? (err as any).received : undefined,
          expected: err.code === 'invalid_type' ? (err as any).expected : undefined,
        }))
      }
    }
  }
}

/**
 * Sanitize error message to prevent information leakage
 */
function sanitizeErrorMessage(message: string): string {
  if (isProduction()) {
    // Replace sensitive patterns
    message = message
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_ADDRESS]') // IP addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Emails
      .replace(/\/\w+\/\w+\/[\w-]+/g, '[PATH]') // File paths
      .replace(/sk-[A-Za-z0-9]+/g, '[API_KEY]') // API keys
  }
  
  return message
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
 * Generate request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Check if production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || import.meta.env.PROD
}

/**
 * Create error logger that sends to external service
 */
export function createErrorLogger(config: {
  service?: 'sentry' | 'console' | 'custom'
  customLogger?: (log: ErrorLog) => void
}) {
  return (log: ErrorLog) => {
    switch (config.service) {
      case 'sentry':
        // In production, integrate with Sentry
        if (isProduction() && log.level === 'error') {
          // Sentry integration would go here
          console.error('[Sentry]', log)
        }
        break
      
      case 'custom':
        if (config.customLogger) {
          config.customLogger(log)
        }
        break
      
      default: {
        // Console logging with colors
        const color = log.level === 'error' ? '\x1b[31m' : '\x1b[33m' // Red or Yellow
        const reset = '\x1b[0m'
                if (log.error?.stack && !isProduction()) {
          console.error(log.error.stack)
        }
      }
    }
  }
}