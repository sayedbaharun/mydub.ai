/**
 * Secure API client with built-in security features
 */

import { EnvSecurity } from './env-encryption'
import { isValidOrigin, sanitizeInput } from './headers'
import { rateLimitConfig } from './headers'

interface RequestOptions extends RequestInit {
  timeout?: number
  retry?: number
  sanitizeParams?: boolean
  rateLimit?: keyof typeof rateLimitConfig
}

interface RateLimitState {
  [key: string]: {
    count: number
    resetTime: number
  }
}

export class SecureAPIClient {
  private baseURL: string
  private rateLimits: RateLimitState = {}
  
  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || ''
  }

  /**
   * Make a secure API request
   */
  async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = 30000,
      retry = 1,
      sanitizeParams = true,
      rateLimit,
      ...fetchOptions
    } = options

    // Check rate limit
    if (rateLimit && !this.checkRateLimit(rateLimit)) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    // Sanitize URL
    const url = new URL(endpoint, this.baseURL)
    
    // Sanitize query parameters
    if (sanitizeParams && url.search) {
      const params = new URLSearchParams(url.search)
      const sanitized = new URLSearchParams()
      
      params.forEach((value, key) => {
        sanitized.set(key, sanitizeInput(value))
      })
      
      url.search = sanitized.toString()
    }

    // Add security headers
    const headers = new Headers(fetchOptions.headers)
    this.addSecurityHeaders(headers)

    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      let lastError: Error | null = null
      
      for (let attempt = 0; attempt <= retry; attempt++) {
        try {
          const response = await fetch(url.toString(), {
            ...fetchOptions,
            headers,
            signal: controller.signal,
            credentials: 'same-origin', // Prevent CSRF
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          // Update rate limit
          if (rateLimit) {
            this.updateRateLimit(rateLimit)
          }

          // Parse response
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            return await response.json()
          } else {
            return await response.text() as any
          }
        } catch (error) {
          lastError = error as Error
          
          // Don't retry on abort
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout')
          }
          
          // Wait before retry
          if (attempt < retry) {
            await this.delay(Math.pow(2, attempt) * 1000) // Exponential backoff
          }
        }
      }
      
      throw lastError || new Error('Request failed')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request with body sanitization
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<T> {
    const body = data ? JSON.stringify(this.sanitizeBody(data)) : undefined
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
  }

  /**
   * PUT request with body sanitization
   */
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<T> {
    const body = data ? JSON.stringify(this.sanitizeBody(data)) : undefined
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Add security headers to request
   */
  private addSecurityHeaders(headers: Headers): void {
    // Add request ID for tracking
    headers.set('X-Request-ID', this.generateRequestId())
    
    // Add timestamp
    headers.set('X-Timestamp', new Date().toISOString())
    
    // Add API version if available
    const apiVersion = import.meta.env.VITE_API_VERSION
    if (apiVersion) {
      headers.set('X-API-Version', apiVersion)
    }
  }

  /**
   * Sanitize request body
   */
  private sanitizeBody(data: any): any {
    if (typeof data === 'string') {
      return sanitizeInput(data)
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeBody(item))
    }
    
    if (data && typeof data === 'object') {
      const sanitized: any = {}
      
      for (const [key, value] of Object.entries(data)) {
        // Skip functions and undefined values
        if (typeof value === 'function' || value === undefined) {
          continue
        }
        
        sanitized[key] = this.sanitizeBody(value)
      }
      
      return sanitized
    }
    
    return data
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(limitType: keyof typeof rateLimitConfig): boolean {
    const config = rateLimitConfig[limitType]
    const now = Date.now()
    const key = `${limitType}:${this.baseURL}`
    
    const limit = this.rateLimits[key]
    
    if (!limit || now > limit.resetTime) {
      // Reset limit
      this.rateLimits[key] = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }
    
    return this.rateLimits[key].count < config.max
  }

  /**
   * Update rate limit counter
   */
  private updateRateLimit(limitType: keyof typeof rateLimitConfig): void {
    const key = `${limitType}:${this.baseURL}`
    
    if (this.rateLimits[key]) {
      this.rateLimits[key].count++
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const secureAPI = new SecureAPIClient()