/**
 * API Middleware Exports
 * Central export point for all API middleware
 */

// Validation middleware
export {
  validateBody,
  validateQuery,
  validateParams,
  validate,
  asyncValidate,
  ApiValidationError,
  type ValidatedRequest,
  type ValidationError,
  type ValidationOptions,
} from './validation'

// Rate limiting middleware
export {
  rateLimit,
  rateLimiters,
  dynamicRateLimit,
  actionRateLimit,
  rateLimitDefaults,
  type RateLimitConfig,
} from './rate-limit'

// Security middleware
export {
  securityMiddleware,
  csrfProtection,
  requestSizeLimit,
  sqlInjectionProtection,
  xssProtection,
  ipWhitelist,
  type SecurityConfig,
} from './security'

// Error handling middleware
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  tryCatch,
  formatValidationError,
  createErrorLogger,
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from './error-handler'

// API validators
export * from '../validators'

/**
 * Example middleware stack for a secure API endpoint
 * 
 * ```typescript
 * import { Router } from 'express'
 * import { 
 *   securityMiddleware,
 *   rateLimiters,
 *   validateBody,
 *   errorHandler,
 *   apiValidators
 * } from '@/shared/lib/api/middleware'
 * 
 * const router = Router()
 * 
 * // Apply global middleware
 * router.use(securityMiddleware())
 * router.use(errorHandler())
 * 
 * // Protected endpoint with validation and rate limiting
 * router.post(
 *   '/api/content',
 *   rateLimiters.content,
 *   validateBody(apiValidators.content.create),
 *   async (req, res) => {
 *     const { validatedBody } = req
 *     // Handle request with validated data
 *   }
 * )
 * ```
 */

/**
 * Pre-configured middleware stacks
 */
export const middlewareStacks = {
  // Basic API protection
  basic: [
    securityMiddleware(),
    rateLimiters.api,
  ],
  
  // Authentication endpoints
  auth: [
    securityMiddleware({ maxBodySize: 1024 * 1024 }), // 1MB limit
    rateLimiters.auth,
    xssProtection(),
  ],
  
  // Content creation endpoints
  content: [
    securityMiddleware({ maxBodySize: 10 * 1024 * 1024 }), // 10MB limit
    rateLimiters.content,
    sqlInjectionProtection(),
    xssProtection(),
  ],
  
  // Search endpoints
  search: [
    securityMiddleware({ maxUrlLength: 4096 }), // Longer URLs for complex queries
    rateLimiters.search,
    sqlInjectionProtection(),
  ],
  
  // File upload endpoints
  upload: [
    securityMiddleware({ maxBodySize: 50 * 1024 * 1024 }), // 50MB limit
    requestSizeLimit(50 * 1024 * 1024),
    rateLimiters.content,
  ],
  
  // Admin endpoints
  admin: [
    securityMiddleware(),
    // IP whitelist could be added here
    sqlInjectionProtection(),
    xssProtection(),
  ],
}