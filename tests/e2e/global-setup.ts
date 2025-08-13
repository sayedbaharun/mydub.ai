import { chromium, FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global setup for E2E tests...')
  
  // Create test results directory
  const resultsDir = path.join(process.cwd(), 'test-results')
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true })
  }

  // Set up test environment variables
  process.env.PLAYWRIGHT_TEST_BASE_URL = config.projects[0]?.use?.baseURL || 'http://localhost:5173'
  
  // Optionally create test user accounts
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('📧 Setting up test user accounts...')
    // This would create test users via Supabase Admin API
    // Implement as needed
  }

  // Pre-warm browser for faster first test
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Visit home page to warm up the server
    await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL!)
    await page.waitForLoadState('networkidle')
    console.log('✅ Server is ready')
  } catch (error) {
    console.error('❌ Failed to connect to server:', error)
    throw error
  } finally {
    await browser.close()
  }

  console.log('✅ Global setup complete')
}

export default globalSetup