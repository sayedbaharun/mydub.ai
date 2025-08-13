#!/usr/bin/env node

/**
 * Validates production environment variables
 * Run this before deployment to ensure all required variables are set
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import chalk from 'chalk'

interface EnvVariable {
  name: string
  required: boolean
  sensitive?: boolean
  validate?: (value: string) => boolean | string
}

const ENV_VARIABLES: EnvVariable[] = [
  // Supabase
  {
    name: 'VITE_SUPABASE_URL',
    required: true,
    validate: (value) => value.startsWith('https://') || 'Must be a valid HTTPS URL',
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    sensitive: true,
  },
  
  // Site Configuration
  {
    name: 'VITE_PUBLIC_SITE_URL',
    required: true,
    validate: (value) => value.startsWith('https://') || 'Must be a valid HTTPS URL',
  },
  
  // AI Services
  {
    name: 'VITE_OPENROUTER_API_KEY',
    required: true,
    sensitive: true,
  },
  {
    name: 'VITE_AI_DAILY_BUDGET_USD',
    required: false,
    validate: (value) => !isNaN(Number(value)) || 'Must be a valid number',
  },
  
  // Government APIs (optional but recommended)
  {
    name: 'VITE_RTA_API_KEY',
    required: false,
    sensitive: true,
  },
  {
    name: 'VITE_DEWA_API_KEY',
    required: false,
    sensitive: true,
  },
  
  // Analytics
  {
    name: 'VITE_GA_MEASUREMENT_ID',
    required: true,
    validate: (value) => value.startsWith('G-') || 'Must be a valid GA4 measurement ID',
  },
  {
    name: 'VITE_SENTRY_DSN',
    required: true,
    validate: (value) => value.includes('sentry.io') || 'Must be a valid Sentry DSN',
  },
  
  // Feature Flags
  {
    name: 'VITE_ENABLE_PWA',
    required: false,
    validate: (value) => ['true', 'false'].includes(value) || 'Must be true or false',
  },
  {
    name: 'VITE_ENABLE_AI_CHAT',
    required: false,
    validate: (value) => ['true', 'false'].includes(value) || 'Must be true or false',
  },
]

function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {}
  }
  
  const content = readFileSync(filePath, 'utf-8')
  const env: Record<string, string> = {}
  
  content.split('\n').forEach((line) => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return
    
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  })
  
  return env
}

function validateEnvironment(): boolean {
  console.log(chalk.blue('\n🔍 Validating Production Environment Variables\n'))
  
  const envPath = resolve(process.cwd(), '.env.production')
  const envExamplePath = resolve(process.cwd(), '.env.production.example')
  
  if (!existsSync(envPath)) {
    console.error(chalk.red('❌ .env.production file not found!'))
    console.log(chalk.yellow(`   Please copy ${envExamplePath} to ${envPath} and fill in the values.\n`))
    return false
  }
  
  const env = loadEnvFile(envPath)
  const errors: string[] = []
  const warnings: string[] = []
  
  ENV_VARIABLES.forEach(({ name, required, sensitive, validate }) => {
    const value = env[name]
    
    // Check if required variable is missing
    if (required && !value) {
      errors.push(`${name} is required but not set`)
      return
    }
    
    // Skip validation for missing optional variables
    if (!value) return
    
    // Run custom validation
    if (validate) {
      const result = validate(value)
      if (result !== true) {
        errors.push(`${name}: ${result}`)
      }
    }
    
    // Warn about sensitive values that look like placeholders
    if (sensitive && (value.includes('your-') || value === 'xxx')) {
      warnings.push(`${name} appears to contain a placeholder value`)
    }
  })
  
  // Check for extra variables not in our list
  Object.keys(env).forEach((key) => {
    if (key.startsWith('VITE_') && !ENV_VARIABLES.find(v => v.name === key)) {
      warnings.push(`Unknown variable: ${key}`)
    }
  })
  
  // Display results
  if (errors.length > 0) {
    console.log(chalk.red('\n❌ Validation Errors:\n'))
    errors.forEach((error) => console.log(chalk.red(`   • ${error}`)))
  }
  
  if (warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warnings:\n'))
    warnings.forEach((warning) => console.log(chalk.yellow(`   • ${warning}`)))
  }
  
  if (errors.length === 0) {
    console.log(chalk.green('\n✅ All required environment variables are valid!\n'))
    
    // Additional checks
    console.log(chalk.blue('📋 Additional Checks:\n'))
    
    // Check API budget
    const dailyBudget = Number(env.VITE_AI_DAILY_BUDGET_USD || 100)
    const hourlyBudget = Number(env.VITE_AI_HOURLY_BUDGET_USD || 20)
    console.log(chalk.cyan(`   • AI Budget: $${dailyBudget}/day, $${hourlyBudget}/hour`))
    
    // Check feature flags
    const features = [
      'VITE_ENABLE_PWA',
      'VITE_ENABLE_AI_CHAT',
      'VITE_ENABLE_GOVERNMENT_APIS',
      'VITE_ENABLE_ACCESSIBILITY_MONITORING',
    ]
    const enabledFeatures = features.filter(f => env[f] === 'true')
    console.log(chalk.cyan(`   • Enabled Features: ${enabledFeatures.length}/${features.length}`))
    
    // Check government API integration
    const govApis = ['RTA', 'DEWA', 'DHA', 'DM', 'GDRFA']
    const configuredApis = govApis.filter(api => env[`VITE_${api}_API_KEY`])
    console.log(chalk.cyan(`   • Government APIs: ${configuredApis.length}/${govApis.length} configured`))
    
    return true
  }
  
  return false
}

// Run validation
const isValid = validateEnvironment()

if (!isValid) {
  console.log(chalk.red('\n❌ Environment validation failed!\n'))
  console.log(chalk.yellow('Please fix the errors above before deploying to production.\n'))
  process.exit(1)
} else {
  console.log(chalk.green('\n🚀 Environment is ready for production deployment!\n'))
  process.exit(0)
}