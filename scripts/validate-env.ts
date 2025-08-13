#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are present
 * and properly configured before deployment or starting the application.
 */

import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

// Define required environment variables
const REQUIRED_ENV_VARS = [
  // Supabase
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  
  // AI Services (at least one required)
  ['VITE_OPENAI_API_KEY', 'VITE_ANTHROPIC_API_KEY', 'VITE_GEMINI_API_KEY'],
  
  // Monitoring (optional but recommended for production)
  'VITE_SENTRY_DSN',
  'VITE_GA_MEASUREMENT_ID',
]

// Environment-specific requirements
const ENV_SPECIFIC_VARS: Record<string, string[]> = {
  production: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SENTRY_DSN',
    'VITE_GA_MEASUREMENT_ID',
  ],
  development: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ],
}

// Validation patterns
const VALIDATION_PATTERNS: Record<string, RegExp> = {
  VITE_SUPABASE_URL: /^https:\/\/[a-zA-Z0-9]+\.supabase\.co$/,
  VITE_SUPABASE_ANON_KEY: /^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/,
  VITE_OPENAI_API_KEY: /^sk-[a-zA-Z0-9]{48,}$/,
  VITE_ANTHROPIC_API_KEY: /^sk-ant-[a-zA-Z0-9\-_]{90,}$/,
  VITE_GEMINI_API_KEY: /^[a-zA-Z0-9\-_]{39,}$/,
  VITE_SENTRY_DSN: /^https:\/\/[a-f0-9]+@[a-zA-Z0-9\-]+\.ingest\.sentry\.io\/\d+$/,
  VITE_GA_MEASUREMENT_ID: /^G-[A-Z0-9]{10}$/,
}

// Warning patterns for potentially exposed keys
const WARNING_PATTERNS: Record<string, RegExp[]> = {
  exposed_keys: [
    /sk-[a-zA-Z0-9]{48,}/, // OpenAI
    /sk-ant-[a-zA-Z0-9\-_]{90,}/, // Anthropic
    /AIza[a-zA-Z0-9\-_]{35}/, // Google API
  ],
  placeholder_values: [
    /your[-_]?api[-_]?key/i,
    /placeholder/i,
    /example/i,
    /demo/i,
    /test[-_]?key/i,
  ],
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function loadEnvironment(): void {
  // Try to load .env file from various locations
  const envPaths = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
  ]
  
  for (const envPath of envPaths) {
    const fullPath = join(process.cwd(), envPath)
    if (existsSync(fullPath)) {
      config({ path: fullPath })
      console.log(`📁 Loaded environment from: ${envPath}`)
      break
    }
  }
}

function validateEnvironmentVariable(
  key: string,
  value: string | undefined
): { valid: boolean; error?: string; warning?: string } {
  if (!value) {
    return { valid: false, error: `Missing required environment variable: ${key}` }
  }
  
  // Check for placeholder values
  for (const pattern of WARNING_PATTERNS.placeholder_values) {
    if (pattern.test(value)) {
      return {
        valid: true,
        warning: `${key} appears to contain a placeholder value: "${value}"`,
      }
    }
  }
  
  // Validate format if pattern exists
  const validationPattern = VALIDATION_PATTERNS[key]
  if (validationPattern && !validationPattern.test(value)) {
    return {
      valid: false,
      error: `${key} has invalid format. Expected format: ${validationPattern.toString()}`,
    }
  }
  
  // Check for exposed keys in non-key variables
  if (!key.includes('KEY') && !key.includes('TOKEN')) {
    for (const pattern of WARNING_PATTERNS.exposed_keys) {
      if (pattern.test(value)) {
        return {
          valid: true,
          warning: `${key} may contain an exposed API key`,
        }
      }
    }
  }
  
  return { valid: true }
}

function validateEnvironment(environment: string = 'development'): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  console.log(`\n🔍 Validating environment variables for: ${environment}\n`)
  
  // Check general required variables
  for (const varOrGroup of REQUIRED_ENV_VARS) {
    if (Array.isArray(varOrGroup)) {
      // At least one of the group must be present
      const hasOne = varOrGroup.some(v => process.env[v])
      if (!hasOne) {
        errors.push(`At least one of these must be set: ${varOrGroup.join(', ')}`)
      } else {
        // Validate the ones that are present
        for (const varName of varOrGroup) {
          if (process.env[varName]) {
            const result = validateEnvironmentVariable(varName, process.env[varName])
            if (!result.valid && result.error) {
              errors.push(result.error)
            }
            if (result.warning) {
              warnings.push(result.warning)
            }
          }
        }
      }
    } else {
      const result = validateEnvironmentVariable(varOrGroup, process.env[varOrGroup])
      if (!result.valid && result.error) {
        errors.push(result.error)
      }
      if (result.warning) {
        warnings.push(result.warning)
      }
    }
  }
  
  // Check environment-specific variables
  const envSpecific = ENV_SPECIFIC_VARS[environment] || []
  for (const varName of envSpecific) {
    const result = validateEnvironmentVariable(varName, process.env[varName])
    if (!result.valid && result.error) {
      errors.push(result.error)
    }
    if (result.warning) {
      warnings.push(result.warning)
    }
  }
  
  // Additional security checks
  if (environment === 'production') {
    // Check for debug flags
    if (process.env.DEBUG === 'true' || process.env.VITE_DEBUG === 'true') {
      warnings.push('DEBUG mode is enabled in production')
    }
    
    // Check for localhost URLs
    const localhostVars = Object.entries(process.env)
      .filter(([key, value]) => value?.includes('localhost') || value?.includes('127.0.0.1'))
      .map(([key]) => key)
    
    if (localhostVars.length > 0) {
      warnings.push(`Localhost URLs found in production: ${localhostVars.join(', ')}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function printResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.log('❌ Validation Errors:\n')
    result.errors.forEach(error => console.log(`   • ${error}`))
    console.log()
  }
  
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:\n')
    result.warnings.forEach(warning => console.log(`   • ${warning}`))
    console.log()
  }
  
  if (result.valid) {
    console.log('✅ Environment validation passed!\n')
  } else {
    console.log('❌ Environment validation failed!\n')
  }
}

// Main execution
function main(): void {
  const environment = process.env.NODE_ENV || 'development'
  
  console.log('🚀 MyDub.AI Environment Validator\n')
  
  // Load environment variables
  loadEnvironment()
  
  // Validate environment
  const result = validateEnvironment(environment)
  
  // Print results
  printResults(result)
  
  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1)
}

// Run if executed directly
import { fileURLToPath } from 'url'
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}

export { validateEnvironment, ValidationResult }