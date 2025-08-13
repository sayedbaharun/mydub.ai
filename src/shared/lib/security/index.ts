/**
 * Security utilities and exports
 */

export { EnvSecurity, SecurityConfig, generateCSP } from './env-encryption'
export { 
  getSecurityHeaders, 
  corsConfig, 
  isValidOrigin, 
  applySecurityHeaders,
  rateLimitConfig,
  sanitizeInput,
  sanitizeUrl
} from './headers'
export { SecureSupabaseClient, rateLimitTableSQL } from './supabase-security'
export { SecureAPIClient, secureAPI } from './api-client'
export { securityHeadersPlugin } from './vite-security-plugin'

// Re-export types
export type { SecurityHeaders } from './headers'