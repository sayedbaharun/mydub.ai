// Comprehensive data validation and error handling layer
// Provides robust data processing with fallbacks and validation

import { supabase } from '@/shared/lib/supabase'

export interface ValidationRule {
  field: string
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'date' | 'array' | 'object'
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  customValidator?: (value: any) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: any
}

export interface DataSource {
  id: string
  name: string
  type: 'api' | 'rss' | 'database' | 'file'
  url?: string
  isActive: boolean
  lastUpdate?: string
  errorCount: number
  successRate: number
}

export class DataValidationService {
  // Data validation engine
  static validateData(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = []
    const sanitizedData: any = {}

    try {
      for (const rule of rules) {
        const value = data[rule.field]

        // Check required fields
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(`Field '${rule.field}' is required`)
          continue
        }

        // Skip validation for optional empty fields
        if (!rule.required && (value === undefined || value === null || value === '')) {
          continue
        }

        // Type validation
        const typeValidation = this.validateType(value, rule.type, rule.field)
        if (!typeValidation.isValid) {
          errors.push(...typeValidation.errors)
          continue
        }

        // Length validation for strings
        if (rule.type === 'string' && typeof value === 'string') {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`Field '${rule.field}' must be at least ${rule.minLength} characters`)
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`Field '${rule.field}' must be no more than ${rule.maxLength} characters`)
          }
        }

        // Numeric range validation
        if (rule.type === 'number' && typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`Field '${rule.field}' must be at least ${rule.min}`)
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`Field '${rule.field}' must be no more than ${rule.max}`)
          }
        }

        // Pattern validation
        if (rule.pattern && typeof value === 'string') {
          if (!rule.pattern.test(value)) {
            errors.push(`Field '${rule.field}' does not match required pattern`)
          }
        }

        // Custom validation
        if (rule.customValidator) {
          const customResult = rule.customValidator(value)
          if (customResult !== true) {
            errors.push(
              typeof customResult === 'string'
                ? customResult
                : `Field '${rule.field}' failed custom validation`
            )
          }
        }

        // Sanitize and store valid data
        sanitizedData[rule.field] = this.sanitizeValue(value, rule.type)
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizedData : undefined,
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      }
    }
  }

  // Type validation
  private static validateType(value: any, type: string, field: string): ValidationResult {
    const errors: string[] = []

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field '${field}' must be a string`)
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Field '${field}' must be a valid number`)
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Field '${field}' must be a boolean`)
        }
        break
      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          errors.push(`Field '${field}' must be a valid email address`)
        }
        break
      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          errors.push(`Field '${field}' must be a valid URL`)
        }
        break
      case 'date':
        if (!this.isValidDate(value)) {
          errors.push(`Field '${field}' must be a valid date`)
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Field '${field}' must be an array`)
        }
        break
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`Field '${field}' must be an object`)
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Value sanitization
  private static sanitizeValue(value: any, type: string): any {
    switch (type) {
      case 'string':
        return typeof value === 'string' ? value.trim() : String(value)
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value)
      case 'boolean':
        return typeof value === 'boolean' ? value : Boolean(value)
      case 'email':
        return typeof value === 'string' ? value.toLowerCase().trim() : value
      case 'url':
        return typeof value === 'string' ? value.trim() : value
      case 'date':
        return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
      case 'array':
        return Array.isArray(value) ? value : [value]
      default:
        return value
    }
  }

  // Validation helpers
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private static isValidDate(date: any): boolean {
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }

  // Data source monitoring
  static async monitorDataSources(): Promise<DataSource[]> {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .order('last_update', { ascending: false })

      if (error) throw error

      return (data || []).map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        url: source.url,
        isActive: source.is_active,
        lastUpdate: source.last_update,
        errorCount: source.error_count || 0,
        successRate: source.success_rate || 0,
      }))
    } catch (error) {
      console.error('Failed to monitor data sources:', error)
      return this.getDefaultDataSources()
    }
  }

  private static getDefaultDataSources(): DataSource[] {
    return [
      {
        id: 'newsapi',
        name: 'NewsAPI',
        type: 'api',
        url: 'https://newsapi.org',
        isActive: true,
        errorCount: 0,
        successRate: 95,
      },
      {
        id: 'rss-feeds',
        name: 'RSS Feeds',
        type: 'rss',
        isActive: true,
        errorCount: 2,
        successRate: 88,
      },
      {
        id: 'supabase',
        name: 'Supabase Database',
        type: 'database',
        isActive: true,
        errorCount: 0,
        successRate: 99,
      },
    ]
  }

  // Update data source status
  static async updateDataSourceStatus(
    sourceId: string,
    isSuccess: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updates: any = {
        last_update: new Date().toISOString(),
      }

      if (isSuccess) {
        // Increment success count and update success rate
        const { data: source } = await supabase
          .from('data_sources')
          .select('success_count, total_requests')
          .eq('id', sourceId)
          .single()

        if (source) {
          const newSuccessCount = (source.success_count || 0) + 1
          const newTotalRequests = (source.total_requests || 0) + 1
          updates.success_count = newSuccessCount
          updates.total_requests = newTotalRequests
          updates.success_rate = Math.round((newSuccessCount / newTotalRequests) * 100)
          updates.error_count = 0 // Reset error count on success
        }
      } else {
        // Increment error count
        const { data: source } = await supabase
          .from('data_sources')
          .select('error_count, total_requests')
          .eq('id', sourceId)
          .single()

        if (source) {
          updates.error_count = (source.error_count || 0) + 1
          updates.total_requests = (source.total_requests || 0) + 1
          updates.last_error = errorMessage
        }
      }

      await supabase.from('data_sources').upsert({ id: sourceId, ...updates })

      // Log the status update
      await this.logDataSourceEvent(sourceId, isSuccess ? 'success' : 'error', errorMessage)
    } catch (error) {
      console.error('Failed to update data source status:', error)
    }
  }

  // Log data source events
  private static async logDataSourceEvent(
    sourceId: string,
    type: 'success' | 'error' | 'warning',
    message?: string
  ): Promise<void> {
    try {
      await supabase.from('data_source_logs').insert({
        source_id: sourceId,
        event_type: type,
        message: message || '',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to log data source event:', error)
    }
  }

  // Data quality checks
  static async performDataQualityCheck(tableName: string): Promise<{
    totalRecords: number
    validRecords: number
    invalidRecords: number
    qualityScore: number
    issues: string[]
  }> {
    try {
      const { count: totalRecords } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      const issues: string[] = []
      let invalidCount = 0

      // Check for null/empty required fields
      const requiredFields = this.getRequiredFields(tableName)
      for (const field of requiredFields) {
        const { count: nullCount } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .or(`${field}.is.null,${field}.eq.`)

        if (nullCount && nullCount > 0) {
          issues.push(`${nullCount} records have empty '${field}' field`)
          invalidCount += nullCount
        }
      }

      // Check for duplicate records
      const { data: duplicates } = await supabase.rpc('find_duplicates', { table_name: tableName })

      if (duplicates && duplicates.length > 0) {
        issues.push(`${duplicates.length} duplicate records found`)
        invalidCount += duplicates.length
      }

      const validRecords = totalRecords ? totalRecords - invalidCount : 0
      const qualityScore = totalRecords ? Math.round((validRecords / totalRecords) * 100) : 0

      return {
        totalRecords: totalRecords || 0,
        validRecords,
        invalidRecords: invalidCount,
        qualityScore,
        issues,
      }
    } catch (error) {
      console.error('Data quality check failed:', error)
      return {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        qualityScore: 0,
        issues: [
          `Quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      }
    }
  }

  // Get required fields for different tables
  private static getRequiredFields(tableName: string): string[] {
    const requiredFieldsMap: Record<string, string[]> = {
      news_articles: ['title', 'content', 'published_at'],
      tourism_attractions: ['name', 'description', 'category'],
      tourism_events: ['title', 'start_date', 'venue'],
      government_services: ['title', 'description', 'category'],
    }

    return requiredFieldsMap[tableName] || []
  }

  // Data sanitization service
  static sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') return ''

    return (
      content
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Trim whitespace
        .trim()
        // Remove potentially dangerous characters
        .replace(/[<>"']/g, '')
        // Limit length
        .substring(0, 10000)
    )
  }

  // URL validation and sanitization
  static sanitizeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') return null

    try {
      const sanitized = url.trim()
      const urlObj = new URL(sanitized)

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null
      }

      return urlObj.toString()
    } catch {
      return null
    }
  }

  // Data transformation service
  static transformExternalData(data: any, mapping: Record<string, string>): any {
    if (!data || typeof data !== 'object') return {}

    const transformed: any = {}

    Object.entries(mapping).forEach(([targetField, sourceField]) => {
      const value = this.getNestedValue(data, sourceField)
      if (value !== undefined) {
        transformed[targetField] = value
      }
    })

    return transformed
  }

  // Get nested object value using dot notation
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  // Error handling with retry logic
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (attempt === maxRetries) {
          throw lastError
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    throw lastError!
  }

  // Circuit breaker pattern
  private static circuitBreakers = new Map<
    string,
    {
      failures: number
      lastFailure: number
      isOpen: boolean
    }
  >()

  static async withCircuitBreaker<T>(
    operationId: string,
    operation: () => Promise<T>,
    threshold: number = 5,
    timeout: number = 60000 // 1 minute
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(operationId) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    }

    // Check if circuit is open and timeout has passed
    if (breaker.isOpen && Date.now() - breaker.lastFailure > timeout) {
      breaker.isOpen = false
      breaker.failures = 0
    }

    // If circuit is open, throw error immediately
    if (breaker.isOpen) {
      throw new Error(`Circuit breaker is open for operation: ${operationId}`)
    }

    try {
      const result = await operation()

      // Reset on success
      breaker.failures = 0
      this.circuitBreakers.set(operationId, breaker)

      return result
    } catch (error) {
      // Increment failure count
      breaker.failures += 1
      breaker.lastFailure = Date.now()

      // Open circuit if threshold reached
      if (breaker.failures >= threshold) {
        breaker.isOpen = true
      }

      this.circuitBreakers.set(operationId, breaker)
      throw error
    }
  }

  // Health check for all data sources
  static async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy'
    sources: Array<{
      id: string
      name: string
      status: 'healthy' | 'degraded' | 'unhealthy'
      responseTime?: number
      lastError?: string
    }>
  }> {
    const sources = await this.monitorDataSources()
    const healthResults = []

    for (const source of sources) {
      const startTime = Date.now()
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      let responseTime: number | undefined
      let lastError: string | undefined

      try {
        if (source.type === 'api' && source.url) {
          const response = await fetch(source.url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000), // 5 second timeout
          })
          responseTime = Date.now() - startTime

          if (!response.ok) {
            status = 'degraded'
            lastError = `HTTP ${response.status}`
          }
        } else if (source.type === 'database') {
          // Test database connection
          await supabase.from('profiles').select('id').limit(1)
          responseTime = Date.now() - startTime
        }

        // Check success rate
        if (source.successRate < 90) {
          status = 'degraded'
        } else if (source.successRate < 70) {
          status = 'unhealthy'
        }

        // Check error count
        if (source.errorCount > 10) {
          status = 'unhealthy'
        } else if (source.errorCount > 5) {
          status = 'degraded'
        }
      } catch (error) {
        status = 'unhealthy'
        lastError = error instanceof Error ? error.message : 'Unknown error'
        responseTime = Date.now() - startTime
      }

      healthResults.push({
        id: source.id,
        name: source.name,
        status,
        responseTime,
        lastError,
      })
    }

    // Determine overall health
    const healthyCount = healthResults.filter((r) => r.status === 'healthy').length
    const degradedCount = healthResults.filter((r) => r.status === 'degraded').length
    const unhealthyCount = healthResults.filter((r) => r.status === 'unhealthy').length

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (unhealthyCount > 0 || degradedCount > healthResults.length / 2) {
      overall = 'unhealthy'
    } else if (degradedCount > 0) {
      overall = 'degraded'
    }

    return {
      overall,
      sources: healthResults,
    }
  }
}
