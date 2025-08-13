/**
 * API Validation Middleware
 * Provides request validation, sanitization, and security checks
 */

import { z, ZodError, ZodSchema } from 'zod'
import { NextFunction, Request, Response } from 'express'
import { sanitizers } from '@/shared/lib/validation/schemas'

// Extended Request type with validated data
export interface ValidatedRequest<TBody = any, TQuery = any, TParams = any>
  extends Request {
  validatedBody?: TBody
  validatedQuery?: TQuery
  validatedParams?: TParams
  validationErrors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationOptions {
  // Validation mode
  mode?: 'strict' | 'strip' | 'passthrough'
  // Custom error handler
  errorHandler?: (errors: ValidationError[], req: Request, res: Response) => void
  // Sanitize strings
  sanitize?: boolean
  // Log validation errors
  logErrors?: boolean
  // Custom error messages
  messages?: Record<string, string>
}

/**
 * Create validation middleware for request body
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
) {
  const {
    mode = 'strip',
    errorHandler,
    sanitize = true,
    logErrors = true,
    messages = {},
  } = options

  return async (
    req: ValidatedRequest<T>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Parse based on mode
      let parsed: T
      if (mode === 'strict') {
        parsed = await schema.parseAsync(req.body)
      } else if (mode === 'passthrough') {
        parsed = await schema.passthrough().parseAsync(req.body)
      } else {
        parsed = await schema.parseAsync(req.body)
      }

      // Apply additional sanitization if enabled
      if (sanitize && parsed) {
        parsed = sanitizeObject(parsed as any) as T
      }

      // Attach validated data to request
      req.validatedBody = parsed
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error, messages)
        
        if (logErrors) {
          console.error('Validation error:', {
            path: req.path,
            method: req.method,
            errors,
          })
        }

        if (errorHandler) {
          errorHandler(errors, req, res)
        } else {
          res.status(400).json({
            error: 'Validation failed',
            errors,
          })
        }
      } else {
        next(error)
      }
    }
  }
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
) {
  const {
    mode = 'strip',
    errorHandler,
    sanitize = true,
    logErrors = true,
    messages = {},
  } = options

  return async (
    req: ValidatedRequest<any, T>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Parse query parameters
      let parsed: T
      if (mode === 'strict') {
        parsed = await schema.parseAsync(req.query)
      } else if (mode === 'passthrough') {
        parsed = await schema.passthrough().parseAsync(req.query)
      } else {
        parsed = await schema.parseAsync(req.query)
      }

      // Apply sanitization
      if (sanitize && parsed) {
        parsed = sanitizeObject(parsed as any) as T
      }

      req.validatedQuery = parsed
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error, messages)
        
        if (logErrors) {
          console.error('Query validation error:', {
            path: req.path,
            errors,
          })
        }

        if (errorHandler) {
          errorHandler(errors, req, res)
        } else {
          res.status(400).json({
            error: 'Invalid query parameters',
            errors,
          })
        }
      } else {
        next(error)
      }
    }
  }
}

/**
 * Create validation middleware for route parameters
 */
export function validateParams<T>(
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
) {
  const {
    errorHandler,
    sanitize = true,
    logErrors = true,
    messages = {},
  } = options

  return async (
    req: ValidatedRequest<any, any, T>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let parsed = await schema.parseAsync(req.params)

      // Apply sanitization
      if (sanitize && parsed) {
        parsed = sanitizeObject(parsed as any) as T
      }

      req.validatedParams = parsed
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error, messages)
        
        if (logErrors) {
          console.error('Params validation error:', {
            path: req.path,
            errors,
          })
        }

        if (errorHandler) {
          errorHandler(errors, req, res)
        } else {
          res.status(400).json({
            error: 'Invalid route parameters',
            errors,
          })
        }
      } else {
        next(error)
      }
    }
  }
}

/**
 * Combined validation middleware for all request parts
 */
export function validate<
  TBody = any,
  TQuery = any,
  TParams = any
>(schemas: {
  body?: ZodSchema<TBody>
  query?: ZodSchema<TQuery>
  params?: ZodSchema<TParams>
}, options: ValidationOptions = {}) {
  return async (
    req: ValidatedRequest<TBody, TQuery, TParams>,
    res: Response,
    next: NextFunction
  ) => {
    const errors: ValidationError[] = []
    
    try {
      // Validate body
      if (schemas.body && req.body) {
        try {
          const parsed = await schemas.body.parseAsync(req.body)
          req.validatedBody = options.sanitize ? sanitizeObject(parsed as any) as TBody : parsed
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, options.messages, 'body'))
          }
        }
      }

      // Validate query
      if (schemas.query && req.query) {
        try {
          const parsed = await schemas.query.parseAsync(req.query)
          req.validatedQuery = options.sanitize ? sanitizeObject(parsed as any) as TQuery : parsed
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, options.messages, 'query'))
          }
        }
      }

      // Validate params
      if (schemas.params && req.params) {
        try {
          const parsed = await schemas.params.parseAsync(req.params)
          req.validatedParams = options.sanitize ? sanitizeObject(parsed as any) as TParams : parsed
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, options.messages, 'params'))
          }
        }
      }

      if (errors.length > 0) {
        if (options.logErrors) {
          console.error('Validation errors:', {
            path: req.path,
            method: req.method,
            errors,
          })
        }

        if (options.errorHandler) {
          options.errorHandler(errors, req, res)
        } else {
          res.status(400).json({
            error: 'Validation failed',
            errors,
          })
        }
      } else {
        next()
      }
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Format Zod errors to consistent format
 */
function formatZodErrors(
  error: ZodError,
  customMessages: Record<string, string> = {},
  prefix?: string
): ValidationError[] {
  return error.errors.map((err) => {
    const field = prefix 
      ? `${prefix}.${err.path.join('.')}`
      : err.path.join('.')
    
    const customMessage = customMessages[field] || customMessages[err.code || '']
    
    return {
      field,
      message: customMessage || err.message,
      code: err.code,
    }
  })
}

/**
 * Recursively sanitize object values
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizers.normalizeWhitespace(sanitizers.escapeHtml(obj))
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Create async validation middleware wrapper
 */
export function asyncValidate(
  validationFn: (req: Request) => Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await validationFn(req)
      next()
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: 'Validation failed',
          message: error.message,
        })
      } else {
        next(error)
      }
    }
  }
}

/**
 * Validation error class
 */
export class ApiValidationError extends Error {
  constructor(
    message: string,
    public errors: ValidationError[] = [],
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'ApiValidationError'
  }
}