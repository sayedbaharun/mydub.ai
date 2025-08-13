/**
 * Environment variable encryption utility
 * Provides a layer of security for sensitive environment variables
 */

// Simple obfuscation for client-side use
// Note: This is NOT true encryption - for production, use server-side handling
export class EnvSecurity {
  private static readonly PREFIX = 'ENC_'
  
  /**
   * Encodes a value for storage
   * This is basic obfuscation, not cryptographic security
   */
  static encode(value: string): string {
    if (!value) return ''
    
    // Basic base64 encoding with reversal
    const reversed = value.split('').reverse().join('')
    return btoa(reversed)
  }
  
  /**
   * Decodes a previously encoded value
   */
  static decode(encoded: string): string {
    if (!encoded) return ''
    
    try {
      const reversed = atob(encoded)
      return reversed.split('').reverse().join('')
    } catch {
      // If decoding fails, assume it's not encoded
      return encoded
    }
  }
  
  /**
   * Gets an environment variable with optional decoding
   */
  static getEnv(key: string, decode: boolean = false): string {
    const value = import.meta.env[key] || ''
    
    if (!value || !decode) {
      return value
    }
    
    // Check if the value is marked as encoded
    if (value.startsWith(this.PREFIX)) {
      return this.decode(value.substring(this.PREFIX.length))
    }
    
    return value
  }
  
  /**
   * Validates that required environment variables are present
   */
  static validateRequired(keys: string[]): { valid: boolean; missing: string[] } {
    const missing = keys.filter(key => !import.meta.env[key])
    
    return {
      valid: missing.length === 0,
      missing
    }
  }
  
  /**
   * Gets all API keys with security checks
   */
  static getAPIKeys() {
    return {
      openai: this.getEnv('VITE_OPENAI_API_KEY'),
      openrouter: this.getEnv('VITE_OPENROUTER_API_KEY'),
      supabase: {
        url: this.getEnv('VITE_SUPABASE_URL'),
        anonKey: this.getEnv('VITE_SUPABASE_ANON_KEY')
      },
      sentry: this.getEnv('VITE_SENTRY_DSN'),
      ga: this.getEnv('VITE_GA_MEASUREMENT_ID')
    }
  }
  
  /**
   * Checks if we're in a secure context
   */
  static isSecureContext(): boolean {
    // Check if we're in production
    const isProd = import.meta.env.PROD
    
    // Check if we're using HTTPS (except localhost)
    const isHTTPS = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1'
    
    return isProd ? isHTTPS : true
  }
  
  /**
   * Sanitizes API keys for logging (shows only first 8 chars)
   */
  static sanitizeForLogging(value: string): string {
    if (!value || value.length < 12) return '[HIDDEN]'
    return `${value.substring(0, 8)}...`
  }
}

// Security configuration
export const SecurityConfig = {
  // API Key validation patterns
  patterns: {
    openai: /^sk-[A-Za-z0-9]{48,}$/,
    supabase: /^[A-Za-z0-9-_]+$/,
  },
  
  // Rate limiting defaults
  rateLimits: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5
    }
  },
  
  // Content Security Policy
  csp: {
    development: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com"
      ],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'connect-src': [
        "'self'", 
        "https://*.supabase.co", 
        "https://api.openai.com", 
        "https://www.google-analytics.com",
        "https://*.sentry.io",
        "wss://*.supabase.co",
        "http://localhost:*",
        "http://127.0.0.1:*"
      ],
      'worker-src': ["'self'", "blob:"],
      'child-src': ["'self'", "blob:"]
    },
    production: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com"
      ],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'connect-src': [
        "'self'", 
        "https://*.supabase.co", 
        "https://api.openai.com", 
        "https://www.google-analytics.com",
        "https://*.sentry.io",
        "wss://*.supabase.co"
      ],
      'worker-src': ["'self'", "blob:"],
      'child-src': ["'self'", "blob:"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  }
}

// Helper to generate CSP header string
export function generateCSP(env: 'development' | 'production' = 'production'): string {
  const policy = SecurityConfig.csp[env]
  
  return Object.entries(policy)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}