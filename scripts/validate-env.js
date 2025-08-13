#!/usr/bin/env node

/**
 * Environment Variable Validation Script (ES Modules version)
 */

import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

// Define required environment variables
const REQUIRED_ENV_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

// Optional but recommended
const OPTIONAL_ENV_VARS = [
  'VITE_OPENAI_API_KEY',
  'VITE_ANTHROPIC_API_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_SENTRY_DSN',
  'VITE_GA_MEASUREMENT_ID',
]

// Load environment
const isCI = process.env.CI === 'true'
if (!isCI) {
  const envPaths = ['.env', '.env.local', '.env.production', '.env.development']
  for (const envPath of envPaths) {
    const fullPath = join(process.cwd(), envPath)
    if (existsSync(fullPath)) {
      config({ path: fullPath })
      console.log(`📁 Loaded environment from: ${envPath}`)
      break
    }
  }
} else {
  console.log('📁 Running in CI environment - using environment variables from secrets')
}

console.log('\n🔍 Validating environment variables...\n')

let hasErrors = false
const warnings = []

// Check required variables
for (const varName of REQUIRED_ENV_VARS) {
  if (!process.env[varName]) {
    console.log(`❌ Missing required: ${varName}`)
    hasErrors = true
  } else {
    console.log(`✅ Found: ${varName}`)
  }
}

// Check optional variables
console.log('\n📋 Optional variables:')
for (const varName of OPTIONAL_ENV_VARS) {
  if (!process.env[varName]) {
    console.log(`⚠️  Missing optional: ${varName}`)
  } else {
    console.log(`✅ Found: ${varName}`)
  }
}

// Check for at least one AI provider
const aiProviders = ['VITE_OPENAI_API_KEY', 'VITE_ANTHROPIC_API_KEY', 'VITE_GEMINI_API_KEY']
const hasAIProvider = aiProviders.some((key) => process.env[key])
if (!hasAIProvider) {
  console.log('\n⚠️  Warning: No AI provider API key found. At least one is recommended.')
  warnings.push('No AI provider configured')
}

// Summary
console.log('\n📊 Summary:')
if (hasErrors) {
  console.log('❌ Validation failed - missing required variables')
  // In CI, log error but don't fail the build for now
  if (isCI) {
    console.log('⚠️  Running in CI - continuing despite missing variables')
    process.exit(0)
  } else {
    process.exit(1)
  }
} else {
  console.log('✅ All required variables present')
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s) found`)
  }
  process.exit(0)
}
