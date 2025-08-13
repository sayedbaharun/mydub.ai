import { test as base, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test user credentials
export const TEST_USERS = {
  regular: {
    email: 'test.user@mydub.ai',
    password: 'TestPass123!',
    role: 'user'
  },
  curator: {
    email: 'test.curator@mydub.ai',
    password: 'CuratorPass123!',
    role: 'curator'
  },
  editor: {
    email: 'test.editor@mydub.ai',
    password: 'EditorPass123!',
    role: 'editor'
  },
  admin: {
    email: 'test.admin@mydub.ai',
    password: 'AdminPass123!',
    role: 'admin'
  }
}

type AuthFixtures = {
  authenticatedPage: any
  userRole: string
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email)
    await page.fill('[data-testid="password-input"]', TEST_USERS.regular.password)
    await page.click('[data-testid="login-button"]')
    
    // Wait for redirect to home
    await page.waitForURL('/')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Use the authenticated page
    await use(page)
    
    // Logout after test
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
  },
  
  userRole: 'user'
})

export { expect }