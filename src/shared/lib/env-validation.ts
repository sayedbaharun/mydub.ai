/**
 * Environment Variable Validation
 * Ensures all required environment variables are set for production
 */

interface EnvironmentConfig {
  // Required in all environments
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
  
  // Required in production
  VITE_OPENAI_API_KEY?: string
  VITE_OPENAI_MODEL?: string
  VITE_SENTRY_DSN?: string
  VITE_GA_MEASUREMENT_ID?: string
  
  // Optional API keys
  VITE_WEATHERAPI_KEY?: string
  VITE_OPENWEATHER_API_KEY?: string
  VITE_FIXER_API_KEY?: string
  VITE_NEWS_API_KEY?: string
  VITE_OPENROUTER_API_KEY?: string
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator
  private config: EnvironmentConfig | null = null
  private isProduction = import.meta.env.PROD

  private constructor() {}

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator()
    }
    return EnvironmentValidator.instance
  }

  /**
   * Validates environment variables on app initialization
   */
  validate(): EnvironmentConfig {
    if (this.config) {
      return this.config
    }

    const errors: string[] = []

    // Required variables
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ]

    // Additional required variables in production
    if (this.isProduction) {
      requiredVars.push(
        'VITE_SENTRY_DSN',
        'VITE_GA_MEASUREMENT_ID'
      )
    }

    // Check required variables
    requiredVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`)
      }
    })

    // Validate Supabase URL format
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (supabaseUrl && !this.isValidUrl(supabaseUrl)) {
      errors.push('Invalid VITE_SUPABASE_URL format')
    }

    // Validate JWT token format for Supabase anon key
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (anonKey && !this.isValidJWT(anonKey)) {
      errors.push('Invalid VITE_SUPABASE_ANON_KEY format (must be valid JWT)')
    }

    // Warn about missing optional variables in production
    if (this.isProduction) {
      const warnings: string[] = []
      
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        warnings.push('OpenAI API key not configured - AI features will be limited')
      }
      
      if (!import.meta.env.VITE_WEATHERAPI_KEY && !import.meta.env.VITE_OPENWEATHER_API_KEY) {
        warnings.push('Weather API not configured - weather features will use fallback data')
      }

      if (!import.meta.env.VITE_NEWS_API_KEY) {
        warnings.push('News API not configured - news features will use fallback data')
      }

      warnings.forEach(warning => {
        console.warn(`⚠️ ${warning}`)
      })
    }

    // Throw error if required variables are missing
    if (errors.length > 0) {
      const errorMessage = `
🚨 Environment Configuration Error

The following required environment variables are missing or invalid:
${errors.map(e => `  • ${e}`).join('\n')}

Please ensure all required environment variables are set in your .env file.

For development:
  cp .env.example .env.local
  # Then edit .env.local with your values

For production:
  Set these variables in your hosting provider's environment configuration.
      `.trim()

      if (this.isProduction) {
        // In production, throw error to prevent app from starting
        throw new Error(errorMessage)
      } else {
        // In development, warn (not error) to avoid red console noise
        console.warn(errorMessage)
      }
    }

    // Store validated config
    this.config = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
      VITE_OPENAI_MODEL: import.meta.env.VITE_OPENAI_MODEL,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
      VITE_WEATHERAPI_KEY: import.meta.env.VITE_WEATHERAPI_KEY,
      VITE_OPENWEATHER_API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY,
      VITE_FIXER_API_KEY: import.meta.env.VITE_FIXER_API_KEY,
      VITE_NEWS_API_KEY: import.meta.env.VITE_NEWS_API_KEY,
      VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
    }

    return this.config
  }

  /**
   * Get validated environment config
   */
  getConfig(): EnvironmentConfig {
    if (!this.config) {
      return this.validate()
    }
    return this.config
  }

  /**
   * Check if a string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if a string looks like a valid JWT token
   */
  private isValidJWT(token: string): boolean {
    const parts = token.split('.')
    return parts.length === 3 && parts.every(part => part.length > 0)
  }

  /**
   * Check if OpenAI is configured
   */
  isOpenAIConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY
  }

  /**
   * Check if weather API is configured
   */
  isWeatherConfigured(): boolean {
    return !!(import.meta.env.VITE_WEATHERAPI_KEY || import.meta.env.VITE_OPENWEATHER_API_KEY)
  }

  /**
   * Check if news API is configured
   */
  isNewsConfigured(): boolean {
    return !!import.meta.env.VITE_NEWS_API_KEY
  }

  /**
   * Check if monitoring is configured
   */
  isMonitoringConfigured(): boolean {
    return !!(import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_GA_MEASUREMENT_ID)
  }
}

export const envValidator = EnvironmentValidator.getInstance()

// Export convenience functions
export const validateEnvironment = () => envValidator.validate()
export const getEnvConfig = () => envValidator.getConfig()
export const isOpenAIConfigured = () => envValidator.isOpenAIConfigured()
export const isWeatherConfigured = () => envValidator.isWeatherConfigured()
export const isNewsConfigured = () => envValidator.isNewsConfigured()
export const isMonitoringConfigured = () => envValidator.isMonitoringConfigured()